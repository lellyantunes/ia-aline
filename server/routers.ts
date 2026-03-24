import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getGptmakerConfig, upsertGptmakerConfig, subscribeToChat, unsubscribeFromChat, getSubscribedChats, isSubscribedToChat } from "./db";
import { createGptmakerClient, discoverWorkspaceId } from "./gptmaker-client";
import { TRPCError } from "@trpc/server";
import axios from "axios";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  config: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const config = await getGptmakerConfig(ctx.user.id);
      return config;
    }),

    save: protectedProcedure
      .input(z.object({
        apiToken: z.string().min(1),
        workspaceId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let workspaceId: string | undefined = input.workspaceId;
        
        // Auto-discover workspace ID if not provided
        if (!workspaceId) {
          const discoveredId = await discoverWorkspaceId(input.apiToken);
          if (!discoveredId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Não foi possível descobrir o Workspace ID automaticamente. Verifique se o token é válido.',
            });
          }
          workspaceId = discoveredId;
        }
        
        await upsertGptmakerConfig({
          userId: ctx.user.id,
          apiToken: input.apiToken,
          workspaceId,
          isActive: true,
        });
        return { success: true, workspaceId };
      }),

    discoverWorkspace: protectedProcedure
      .input(z.object({
        apiToken: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const workspaceId = await discoverWorkspaceId(input.apiToken);
        if (!workspaceId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não foi possível encontrar nenhum workspace com este token.',
          });
        }
        return { workspaceId };
      }),
  }),

  chats: router({
    list: protectedProcedure
      .input(z.object({
        pageSize: z.number().optional(),
        page: z.number().optional(),
        agentId: z.string().optional(),
        query: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Configuração do GPTMaker não encontrada' });
        }

        console.log('[GPTMaker] Listing chats with config:', {
          workspaceId: config.workspaceId,
          hasToken: !!config.apiToken,
          tokenPrefix: config.apiToken.substring(0, 20) + '...',
        });

        try {
          const client = createGptmakerClient(config.apiToken, config.workspaceId);
          const chats = await client.listChats(input);
          console.log('[GPTMaker] Chats retrieved successfully:', chats.length);
          return chats;
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            console.error('[GPTMaker] Error listing chats:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              url: error.config?.url,
            });
          }
          throw error;
        }
      }),

    messages: protectedProcedure
      .input(z.object({
        chatId: z.string(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        console.log('[GPTMaker] Fetching messages for chat:', input.chatId);
        const messages = await client.listMessages(input.chatId, {
          page: input.page,
          pageSize: input.pageSize,
        });
        console.log('[GPTMaker] Messages retrieved:', messages.length, 'messages');
        if (messages.length > 0) {
          console.log('[GPTMaker] Sample message:', JSON.stringify(messages[0]));
        }
        return messages;
      }),

    takeOver: protectedProcedure
      .input(z.object({
        chatId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        await client.takeOverChat(input.chatId);
        return { success: true };
      }),

    finish: protectedProcedure
      .input(z.object({
        chatId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        await client.finishChat(input.chatId);
        return { success: true };
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        chatId: z.string(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        const message = await client.sendMessage(input.chatId, input.content);
        return message;
      }),

    deleteChat: protectedProcedure
      .input(z.object({
        chatId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        await client.deleteChat(input.chatId);
        return { success: true };
      }),
  }),

  agents: router({
    list: protectedProcedure
      .input(z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        query: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        const agents = await client.listAgents(input);
        return agents;
      }),
  }),

  interactions: router({
    list: protectedProcedure
      .input(z.object({
        agentId: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const config = await getGptmakerConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'GPTMaker API não configurada.',
          });
        }

        const client = createGptmakerClient(config.apiToken, config.workspaceId);
        const interactions = await client.listInteractions(input);
        return interactions;
      }),
  }),

  stats: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const config = await getGptmakerConfig(ctx.user.id);
      if (!config) {
        return {
          totalChats: 0,
          unreadChats: 0,
          activeAttendances: 0,
          finishedToday: 0,
        };
      }

      const client = createGptmakerClient(config.apiToken, config.workspaceId);
      const chats = await client.listChats({ pageSize: 200 });

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      return {
        totalChats: chats.length,
        unreadChats: chats.filter(c => !c.read).length,
        activeAttendances: chats.filter(c => c.humanTalk && !c.finished).length,
        finishedToday: chats.filter(c => c.finished && c.time >= oneDayAgo).length,
      };
    }),
  }),

  subscriptions: router({
    subscribe: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await subscribeToChat(ctx.user.id, input.chatId);
        return { success: true };
      }),

    unsubscribe: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await unsubscribeFromChat(ctx.user.id, input.chatId);
        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const subscriptions = await getSubscribedChats(ctx.user.id);
      return subscriptions;
    }),

    isSubscribed: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .query(async ({ ctx, input }) => {
        const subscribed = await isSubscribedToChat(ctx.user.id, input.chatId);
        return { subscribed };
      }),
  }),
});

export type AppRouter = typeof appRouter;
