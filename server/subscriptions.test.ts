import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("subscriptions", () => {
  it("should subscribe to a chat", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscriptions.subscribe({ chatId: "test-chat-123" });

    expect(result).toEqual({ success: true });
  });

  it("should check subscription status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Subscribe first
    await caller.subscriptions.subscribe({ chatId: "test-chat-456" });

    // Check if subscribed
    const result = await caller.subscriptions.isSubscribed({ chatId: "test-chat-456" });

    expect(result.subscribed).toBe(true);
  });

  it("should unsubscribe from a chat", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Subscribe first
    await caller.subscriptions.subscribe({ chatId: "test-chat-789" });

    // Unsubscribe
    const result = await caller.subscriptions.unsubscribe({ chatId: "test-chat-789" });

    expect(result).toEqual({ success: true });

    // Verify unsubscribed
    const checkResult = await caller.subscriptions.isSubscribed({ chatId: "test-chat-789" });
    expect(checkResult.subscribed).toBe(false);
  });

  it("should list all subscribed chats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Subscribe to multiple chats
    await caller.subscriptions.subscribe({ chatId: "chat-1" });
    await caller.subscriptions.subscribe({ chatId: "chat-2" });

    // List subscriptions
    const result = await caller.subscriptions.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
