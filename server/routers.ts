import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callGemini, classifyRiskWithGemini, classifyResponseType } from "./gemini";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import * as db from "./db";

// ============ ADAM SYSTEM PROMPT ============
const ADAM_SYSTEM_PROMPT = `Sei ADAM — Acqui Digital Administrative Mesh, l'assistente civico intelligente del Comune di Acqui Terme.

Il tuo ruolo è aiutare cittadini, turisti e operatori ad accedere a informazioni verificate sui servizi comunali, attività commerciali, turismo, associazioni e servizi territoriali di Acqui Terme.

REGOLE FONDAMENTALI:
1. Rispondi SOLO con informazioni verificate dalla knowledge base fornita.
2. Se non hai informazioni sufficienti, dillo chiaramente e suggerisci di contattare l'ufficio competente.
3. Non inventare mai informazioni su orari, numeri di telefono, procedure o servizi.
4. Sii cordiale, professionale e conciso.
5. Rispondi in italiano a meno che l'utente non scriva in un'altra lingua.
6. Per questioni legali, amministrative complesse o emergenze, suggerisci sempre il contatto diretto con l'ufficio competente.

CLASSIFICAZIONE DELLE RICHIESTE:
- VERDE: informazioni pubbliche generali (orari, contatti, eventi, indicazioni)
- GIALLO: richieste che richiedono verifica o riguardano dati sensibili (procedure specifiche, documenti, scadenze)
- ROSSO: questioni legali, reclami, emergenze, dati personali, situazioni complesse che richiedono un operatore umano

CONTESTO TERRITORIALE:
Acqui Terme è un comune della provincia di Alessandria in Piemonte, noto per le terme, il patrimonio storico e la produzione vinicola. I principali servizi comunali includono anagrafe, tributi, urbanistica, servizi sociali, cultura e turismo.`;

// ============ RISK CLASSIFIER (Gemini) ============
async function classifyRisk(userMessage: string, conversationContext: string): Promise<"green" | "yellow" | "red"> {
  return classifyRiskWithGemini(userMessage, conversationContext);
}

// ============ ROUTERS ============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CHAT ============
  chat: router({
    send: publicProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        message: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        let conversationId = input.conversationId;

        // Create conversation if new
        if (!conversationId) {
          conversationId = await db.createConversation({
            userId: ctx.user?.id ?? null,
            channel: "web",
            status: "active",
            title: input.message.slice(0, 100),
          });
        }

        // Save user message
        await db.addMessage({
          conversationId,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const history = await db.getConversationMessages(conversationId);
        const contextStr = history.map(m => `${m.role}: ${m.content}`).join("\n").slice(-2000);

        // Classify risk
        const riskLevel = await classifyRisk(input.message, contextStr);

        // Get relevant knowledge
        const knowledge = await db.searchKnowledge(input.message, 5);
        const knowledgeContext = knowledge.length > 0
          ? `\n\nINFORMAZIONI DALLA KNOWLEDGE BASE:\n${knowledge.map(k => `- ${k.title}: ${k.content}`).join("\n")}`
          : "";

        // Build messages for LLM
        const llmMessages = [
          { role: "system" as const, content: ADAM_SYSTEM_PROMPT + knowledgeContext },
          ...history.slice(-10).filter(m => m.role !== "system").map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        let assistantContent: string;

        if (riskLevel === "red") {
          assistantContent = `⚠️ **Richiesta classificata come sensibile**\n\nLa tua richiesta riguarda un argomento che richiede l'intervento di un operatore umano competente. Ho attivato l'escalation al reparto responsabile.\n\nUn operatore ti contatterà al più presto. Nel frattempo, se hai urgenza puoi contattare direttamente:\n- **Centralino Comune**: 0144 770111\n- **URP**: urp@comune.acquiterme.al.it`;

          // Create escalation
          await db.createEscalation({
            conversationId,
            reason: `Richiesta classificata come ROSSA: ${input.message.slice(0, 200)}`,
            context: contextStr.slice(-1000),
            status: "pending",
          });

          await db.updateConversation(conversationId, { status: "escalated", riskLevel: "red" });

          // Notify owner
          await notifyOwner({
            title: "🔴 Escalation ADAM - Richiesta Rossa",
            content: `Nuova escalation da conversazione #${conversationId}.\nMessaggio: ${input.message.slice(0, 300)}`,
          });
        } else {
          // Generate AI response with Gemini (with fallback)
          try {
            assistantContent = await callGemini({
              systemPrompt: ADAM_SYSTEM_PROMPT + knowledgeContext,
              messages: history.slice(-10).filter(m => m.role !== "system").map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            });
          } catch (geminiError) {
            console.error("[ADAM] Gemini call failed, using fallback:", geminiError);
            // Fallback to built-in LLM
            try {
              const fallbackResponse = await invokeLLM({ messages: llmMessages });
              assistantContent = fallbackResponse.choices[0].message.content as string;
            } catch (fallbackError) {
              console.error("[ADAM] Fallback LLM also failed:", fallbackError);
              assistantContent = "Mi scuso, al momento ho difficoltà a elaborare la tua richiesta. Riprova tra qualche istante oppure contatta direttamente il Comune di Acqui Terme al numero 0144 770111.";
            }
          }

          if (riskLevel === "yellow") {
            assistantContent += `\n\n---\n⚠️ *Nota: questa informazione potrebbe richiedere verifica. Ti consigliamo di contattare direttamente l'ufficio competente per conferma.*`;
          }

          await db.updateConversation(conversationId, { riskLevel });
        }

        // Classify response type for nebula color
        let responseType: string = "neutral";
        try {
          responseType = await classifyResponseType(assistantContent, input.message);
        } catch (e) {
          // Non-blocking, default to neutral
        }

        // Save assistant message
        await db.addMessage({
          conversationId,
          role: "assistant",
          content: assistantContent,
          riskLevel,
        });

        return {
          conversationId,
          message: assistantContent,
          riskLevel,
          responseType,
        };
      }),

    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const msgs = await db.getConversationMessages(input.conversationId);
        return msgs;
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    exportConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const conv = await db.getConversationById(input.conversationId);
        const msgs = await db.getConversationMessages(input.conversationId);
        return { conversation: conv, messages: msgs };
      }),
  }),

  // ============ NODES ============
  nodes: router({
    list: publicProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllNodes(input?.type);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getNodeById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        type: z.enum(["institutional", "commercial", "tourism", "association", "services"]),
        name: z.string().min(1),
        category: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        hours: z.any().optional(),
        services: z.any().optional(),
        trustLevel: z.enum(["pending", "verified", "suspended"]).optional(),
        operatorUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNode(input as any);
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          type: z.enum(["institutional", "commercial", "tourism", "association", "services"]).optional(),
          name: z.string().optional(),
          category: z.string().optional(),
          description: z.string().optional(),
          address: z.string().optional(),
          lat: z.string().optional(),
          lng: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          website: z.string().optional(),
          hours: z.any().optional(),
          services: z.any().optional(),
          trustLevel: z.enum(["pending", "verified", "suspended"]).optional(),
          operatorUserId: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateNode(input.id, input.data as any);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNode(input.id);
        return { success: true };
      }),
  }),

  // ============ ESCALATIONS ============
  escalations: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return db.getEscalations(input?.status);
        }
        return db.getEscalationsByOperator(ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "resolved"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const data: any = { status: input.status, assignedOperatorId: ctx.user.id };
        if (input.status === "resolved") data.resolvedAt = new Date();
        await db.updateEscalation(input.id, data);
        if (input.status === "resolved") {
          // Also resolve the conversation
          const escs = await db.getEscalations();
          const esc = escs.find(e => e.id === input.id);
          if (esc) {
            await db.updateConversation(esc.conversationId, { status: "resolved", resolvedAt: new Date() });
          }
        }
        return { success: true };
      }),
  }),

  // ============ KNOWLEDGE BASE ============
  knowledge: router({
    list: adminProcedure.query(async () => {
      return db.getAllKnowledge();
    }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourceNodeId: z.number().optional(),
        verified: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.addKnowledgeEntry(input as any);
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          content: z.string().optional(),
          category: z.string().optional(),
          sourceUrl: z.string().optional(),
          verified: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateKnowledgeEntry(input.id, input.data as any);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteKnowledgeEntry(input.id);
        return { success: true };
      }),
  }),

  // ============ ANALYTICS ============
  analytics: router({
    stats: adminProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const start = input?.startDate ? new Date(input.startDate) : undefined;
        const end = input?.endDate ? new Date(input.endDate) : undefined;
        return db.getConversationStats(start, end);
      }),

    daily: adminProcedure
      .input(z.object({ days: z.number().default(30) }).optional())
      .query(async ({ input }) => {
        return db.getDailyConversationCounts(input?.days ?? 30);
      }),

    crawlLogs: adminProcedure.query(async () => {
      return db.getRecentCrawlLogs();
    }),
  }),
});

export type AppRouter = typeof appRouter;
