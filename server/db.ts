import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { InsertUser, users, gptmakerConfig, InsertGptmakerConfig, chatCache, InsertChatCache, subscribedChats, InsertSubscribedChat } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const client = createClient({
        url: process.env.DATABASE_URL || "file:./local.db",
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // First try to find existing user
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      const updateData: Partial<InsertUser> = {};
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.lastSignedIn !== undefined) updateData.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateData.role = user.role;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.openId, user.openId));
      }
    } else {
      // Insert new user
      const insertData: InsertUser = {
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        lastSignedIn: user.lastSignedIn ?? new Date(),
        role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      };
      await db.insert(users).values(insertData);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// GPTMaker Config helpers
export async function getGptmakerConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(gptmakerConfig)
    .where(eq(gptmakerConfig.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertGptmakerConfig(config: InsertGptmakerConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(gptmakerConfig).where(eq(gptmakerConfig.userId, config.userId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(gptmakerConfig).set({
      apiToken: config.apiToken,
      workspaceId: config.workspaceId,
      isActive: config.isActive ?? true,
      updatedAt: new Date(),
    }).where(eq(gptmakerConfig.userId, config.userId));
  } else {
    await db.insert(gptmakerConfig).values(config);
  }
}

// Chat Cache helpers
export async function getChatFromCache(chatId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(chatCache)
    .where(eq(chatCache.chatId, chatId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertChatCache(cache: InsertChatCache) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(chatCache).where(eq(chatCache.chatId, cache.chatId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(chatCache).set({
      agentId: cache.agentId,
      agentName: cache.agentName,
      userName: cache.userName,
      humanTalk: cache.humanTalk,
      finished: cache.finished,
      unReadCount: cache.unReadCount,
      lastMessageTime: cache.lastMessageTime,
      data: cache.data,
      updatedAt: new Date(),
    }).where(eq(chatCache.chatId, cache.chatId));
  } else {
    await db.insert(chatCache).values(cache);
  }
}

// Subscribed Chats helpers
export async function subscribeToChat(userId: number, chatId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(subscribedChats).values({ userId, chatId });
}

export async function unsubscribeFromChat(userId: number, chatId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(subscribedChats)
    .where(
      and(eq(subscribedChats.userId, userId), eq(subscribedChats.chatId, chatId))
    );
}

export async function getSubscribedChats(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(subscribedChats)
    .where(eq(subscribedChats.userId, userId));

  return result;
}

export async function isSubscribedToChat(userId: number, chatId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(subscribedChats)
    .where(
      and(eq(subscribedChats.userId, userId), eq(subscribedChats.chatId, chatId))
    )
    .limit(1);

  return result.length > 0;
}
