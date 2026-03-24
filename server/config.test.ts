import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as gptmakerClient from "./gptmaker-client";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("config.discoverWorkspace", () => {
  it("should discover workspace ID from valid token", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the discoverWorkspaceId function
    const mockDiscoverWorkspaceId = vi.spyOn(gptmakerClient, "discoverWorkspaceId");
    mockDiscoverWorkspaceId.mockResolvedValue("test-workspace-id-123");

    const result = await caller.config.discoverWorkspace({
      apiToken: "valid-token",
    });

    expect(result).toEqual({ workspaceId: "test-workspace-id-123" });
    expect(mockDiscoverWorkspaceId).toHaveBeenCalledWith("valid-token");

    mockDiscoverWorkspaceId.mockRestore();
  });

  it("should throw error when workspace cannot be discovered", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the discoverWorkspaceId function to return null
    const mockDiscoverWorkspaceId = vi.spyOn(gptmakerClient, "discoverWorkspaceId");
    mockDiscoverWorkspaceId.mockResolvedValue(null);

    await expect(
      caller.config.discoverWorkspace({
        apiToken: "invalid-token",
      })
    ).rejects.toThrow("Não foi possível encontrar nenhum workspace com este token");

    mockDiscoverWorkspaceId.mockRestore();
  });
});

describe("config.save", () => {
  it("should save config with auto-discovered workspace ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the discoverWorkspaceId function
    const mockDiscoverWorkspaceId = vi.spyOn(gptmakerClient, "discoverWorkspaceId");
    mockDiscoverWorkspaceId.mockResolvedValue("auto-discovered-workspace");

    const result = await caller.config.save({
      apiToken: "test-token",
    });

    expect(result.success).toBe(true);
    expect(result.workspaceId).toBe("auto-discovered-workspace");

    mockDiscoverWorkspaceId.mockRestore();
  });

  it("should save config with provided workspace ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.config.save({
      apiToken: "test-token",
      workspaceId: "provided-workspace-id",
    });

    expect(result.success).toBe(true);
    expect(result.workspaceId).toBe("provided-workspace-id");
  });

  it("should throw error when auto-discovery fails", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the discoverWorkspaceId function to return null
    const mockDiscoverWorkspaceId = vi.spyOn(gptmakerClient, "discoverWorkspaceId");
    mockDiscoverWorkspaceId.mockResolvedValue(null);

    await expect(
      caller.config.save({
        apiToken: "invalid-token",
      })
    ).rejects.toThrow("Não foi possível descobrir o Workspace ID automaticamente");

    mockDiscoverWorkspaceId.mockRestore();
  });
});
