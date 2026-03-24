import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

// Default guest user for open access mode
const GUEST_USER: User = {
  id: 1,
  openId: "guest-user",
  name: "Operador",
  email: null,
  loginMethod: "guest",
  role: "admin", // Give admin access for full functionality
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication failed - use guest user for open access
    user = null;
  }

  // If no authenticated user, use guest user (open access mode)
  if (!user) {
    // Try to get or create guest user in database
    try {
      let guestUser = await db.getUserByOpenId("guest-user");
      if (!guestUser) {
        await db.upsertUser({
          openId: "guest-user",
          name: "Operador",
          email: null,
          loginMethod: "guest",
          role: "admin",
          lastSignedIn: new Date(),
        });
        guestUser = await db.getUserByOpenId("guest-user");
      }
      user = guestUser ?? GUEST_USER;
    } catch (dbError) {
      // If database fails, use in-memory guest user
      console.warn("[Context] Database unavailable, using in-memory guest user");
      user = GUEST_USER;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
