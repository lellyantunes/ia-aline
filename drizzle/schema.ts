import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * GPTMaker API configuration table
 * Stores API tokens and workspace settings per user
 */
export const gptmakerConfig = sqliteTable("gptmaker_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  apiToken: text("apiToken").notNull(),
  workspaceId: text("workspaceId").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type GptmakerConfig = typeof gptmakerConfig.$inferSelect;
export type InsertGptmakerConfig = typeof gptmakerConfig.$inferInsert;

/**
 * Chat cache table for performance optimization
 * Stores recent chat data to reduce API calls
 */
export const chatCache = sqliteTable("chat_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: text("chatId").notNull().unique(),
  workspaceId: text("workspaceId").notNull(),
  agentId: text("agentId"),
  agentName: text("agentName"),
  userName: text("userName"),
  humanTalk: integer("humanTalk", { mode: "boolean" }).default(false).notNull(),
  finished: integer("finished", { mode: "boolean" }).default(false).notNull(),
  unReadCount: integer("unReadCount").default(0).notNull(),
  lastMessageTime: integer("lastMessageTime", { mode: "timestamp" }),
  data: text("data").notNull(), // JSON string of full chat object
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type ChatCache = typeof chatCache.$inferSelect;
export type InsertChatCache = typeof chatCache.$inferInsert;

/**
 * Subscribed chats table
 * Stores chats that users have subscribed to (favorited)
 */
export const subscribedChats = sqliteTable("subscribed_chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  chatId: text("chatId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type SubscribedChat = typeof subscribedChats.$inferSelect;
export type InsertSubscribedChat = typeof subscribedChats.$inferInsert;
