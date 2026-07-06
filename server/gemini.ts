/**
 * Gemini API integration for ADAM chat.
 * Uses Google's Generative Language API (v1beta) with gemini-2.0-flash model.
 */
import { ENV } from "./_core/env";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
}

/**
 * Call Gemini API for chat completion.
 * Maps our internal message format to Gemini's format.
 */
export async function callGemini(opts: {
  systemPrompt: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  jsonMode?: boolean;
}): Promise<string> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Convert messages to Gemini format
  const geminiMessages: GeminiMessage[] = [];
  for (const msg of opts.messages) {
    if (msg.role === "system") continue; // system goes in systemInstruction
    geminiMessages.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Ensure conversation starts with user message
  if (geminiMessages.length === 0 || geminiMessages[0].role !== "user") {
    geminiMessages.unshift({ role: "user", parts: [{ text: "Ciao" }] });
  }

  const model = "gemini-2.0-flash";
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: geminiMessages,
    systemInstruction: {
      parts: [{ text: opts.systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  if (opts.jsonMode) {
    body.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Gemini] API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Gemini returned no candidates");
  }

  return data.candidates[0].content.parts.map(p => p.text).join("");
}

/**
 * Classify risk level using Gemini.
 */
export async function classifyRiskWithGemini(
  userMessage: string,
  conversationContext: string
): Promise<"green" | "yellow" | "red"> {
  try {
    const response = await callGemini({
      systemPrompt: `Sei un classificatore di rischio per richieste civiche. Analizza il messaggio dell'utente e classifica il livello di rischio.

Rispondi SOLO con un JSON valido: {"level": "green"} oppure {"level": "yellow"} oppure {"level": "red"}

CRITERI:
- GREEN: informazioni pubbliche, orari, contatti, eventi, indicazioni stradali, informazioni turistiche generali
- YELLOW: procedure burocratiche specifiche, documenti da presentare, scadenze, informazioni che richiedono verifica
- RED: questioni legali, reclami formali, emergenze, richieste di dati personali, situazioni che richiedono intervento umano, problemi con multe/sanzioni, questioni sanitarie urgenti`,
      messages: [
        { role: "user", content: `Contesto conversazione: ${conversationContext}\n\nMessaggio da classificare: ${userMessage}` }
      ],
      jsonMode: true,
    });

    const parsed = JSON.parse(response);
    if (parsed.level === "green" || parsed.level === "yellow" || parsed.level === "red") {
      return parsed.level;
    }
    return "green";
  } catch (error) {
    console.warn("[Gemini] Risk classification failed, defaulting to green:", error);
    return "green";
  }
}

/**
 * Classify the response type for the nebula color spectrum.
 * Returns a semantic type that maps to a nebula color state.
 */
export type ResponseType = "informative" | "empathetic" | "creative" | "navigational" | "important" | "neutral";

export async function classifyResponseType(
  assistantResponse: string,
  userMessage: string
): Promise<ResponseType> {
  try {
    const response = await callGemini({
      systemPrompt: `Sei un classificatore semantico di risposte. Analizza la risposta dell'assistente e il messaggio dell'utente per determinare il TIPO di risposta.

Rispondi SOLO con un JSON valido: {"type": "..."}

TIPI POSSIBILI:
- "informative": risposta con dati, orari, contatti, fatti concreti, spiegazioni tecniche
- "empathetic": risposta che esprime comprensione, supporto emotivo, rassicurazione
- "creative": risposta che propone idee, suggerimenti originali, soluzioni creative
- "navigational": risposta che guida verso un luogo, un ufficio, un percorso, una mappa
- "important": risposta su scadenze urgenti, documenti obbligatori, avvisi critici
- "neutral": saluti, conferme brevi, risposte generiche`,
      messages: [
        { role: "user", content: `Messaggio utente: ${userMessage}\n\nRisposta assistente: ${assistantResponse.slice(0, 500)}` }
      ],
      jsonMode: true,
    });

    const parsed = JSON.parse(response);
    const validTypes: ResponseType[] = ["informative", "empathetic", "creative", "navigational", "important", "neutral"];
    if (validTypes.includes(parsed.type)) {
      return parsed.type;
    }
    return "informative";
  } catch (error) {
    console.warn("[Gemini] Response type classification failed:", error);
    return "informative";
  }
}
