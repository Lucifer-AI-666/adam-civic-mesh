import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getConversationById: vi.fn(),
  getConversationMessages: vi.fn(),
  getUserConversations: vi.fn(),
  createConversation: vi.fn(),
  addMessage: vi.fn(),
  searchKnowledge: vi.fn(),
  createEscalation: vi.fn(),
  updateConversation: vi.fn(),
  // unused stubs for router import side effects
  getAllNodes: vi.fn(),
  getNodeById: vi.fn(),
  createNode: vi.fn(),
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  getEscalations: vi.fn(),
  getEscalationsByOperator: vi.fn(),
  updateEscalation: vi.fn(),
  getAllKnowledge: vi.fn(),
  addKnowledgeEntry: vi.fn(),
  updateKnowledgeEntry: vi.fn(),
  deleteKnowledgeEntry: vi.fn(),
  getSetting: vi.fn(),
  getAllSettings: vi.fn(),
  upsertSetting: vi.fn(),
  deleteSetting: vi.fn(),
  getConversationStats: vi.fn(),
  getDailyConversationCounts: vi.fn(),
  getRecentCrawlLogs: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  addCrawlLog: vi.fn(),
}));

vi.mock("./gemini", () => ({
  callGemini: vi.fn(),
  classifyRiskWithGemini: vi.fn(),
  classifyResponseType: vi.fn(async () => "neutral"),
  generateSpeech: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function authCtx(
  id: number,
  role: "user" | "operator" | "admin" = "user"
): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `user-${id}`,
    email: `user${id}@example.com`,
    name: `User ${id}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

const ownedConv = {
  id: 100,
  userId: 10,
  channel: "web",
  status: "active",
  title: "Owner chat",
  riskLevel: "green",
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
};

const messages = [
  {
    id: 1,
    conversationId: 100,
    role: "user",
    content: "ciao",
    riskLevel: null,
    createdAt: new Date(),
  },
];

describe("ADAM - Conversation ownership (IDOR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getConversationById).mockResolvedValue(ownedConv as any);
    vi.mocked(db.getConversationMessages).mockResolvedValue(messages as any);
  });

  describe("chat.getConversation", () => {
    it("allows the owner (positive)", async () => {
      const caller = appRouter.createCaller(authCtx(10, "user"));
      const result = await caller.chat.getConversation({ conversationId: 100 });
      expect(result).toEqual(messages);
      expect(db.getConversationById).toHaveBeenCalledWith(100);
    });

    it("rejects another user (negative IDOR)", async () => {
      const caller = appRouter.createCaller(authCtx(99, "user"));
      await expect(
        caller.chat.getConversation({ conversationId: 100 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      } satisfies Partial<TRPCError>);
      expect(db.getConversationMessages).not.toHaveBeenCalled();
    });

    it("allows admin staff (positive)", async () => {
      const caller = appRouter.createCaller(authCtx(1, "admin"));
      const result = await caller.chat.getConversation({ conversationId: 100 });
      expect(result).toEqual(messages);
    });

    it("allows operator staff (positive)", async () => {
      const caller = appRouter.createCaller(authCtx(2, "operator"));
      const result = await caller.chat.getConversation({ conversationId: 100 });
      expect(result).toEqual(messages);
    });

    it("rejects unauthenticated (negative)", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
      });
      await expect(
        caller.chat.getConversation({ conversationId: 100 })
      ).rejects.toThrow();
    });

    it("returns NOT_FOUND when missing (negative)", async () => {
      vi.mocked(db.getConversationById).mockResolvedValue(undefined);
      const caller = appRouter.createCaller(authCtx(10, "user"));
      await expect(
        caller.chat.getConversation({ conversationId: 999 })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("chat.exportConversation", () => {
    it("allows the owner (positive)", async () => {
      const caller = appRouter.createCaller(authCtx(10, "user"));
      const result = await caller.chat.exportConversation({
        conversationId: 100,
      });
      expect(result.conversation).toEqual(ownedConv);
      expect(result.messages).toEqual(messages);
    });

    it("rejects another user (negative IDOR)", async () => {
      const caller = appRouter.createCaller(authCtx(99, "user"));
      await expect(
        caller.chat.exportConversation({ conversationId: 100 })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.getConversationMessages).not.toHaveBeenCalled();
    });

    it("allows admin (positive)", async () => {
      const caller = appRouter.createCaller(authCtx(1, "admin"));
      const result = await caller.chat.exportConversation({
        conversationId: 100,
      });
      expect(result.conversation).toEqual(ownedConv);
    });
  });
});
