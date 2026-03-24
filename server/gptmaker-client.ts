import axios, { AxiosInstance } from 'axios';

const GPTMAKER_API_BASE = 'https://api.gptmaker.ai';

export interface GptmakerChat {
  id: string;
  humanTalk: boolean;
  userPicture?: string | null;
  messageUserName?: string | null;
  read: boolean;
  role: string;
  agentName: string;
  agentId: string;
  whatsappPhone?: string;
  finished: boolean;
  avatar: string;
  title?: string | null;
  type: string;
  userName?: string | null;
  userId?: string | null;
  picture: string;
  conversationType: string;
  createdAt: number;
  name: string;
  recipient: string;
  time: number;
  unReadCount: number;
  conversation: string;
}

export interface GptmakerAgent {
  id: string;
  name: string;
  behavior: string;
  avatar?: string;
  communicationType: 'FORMAL' | 'NORMAL' | 'RELAXED';
  type: 'SUPPORT' | 'SALE' | 'PERSONAL';
  jobName?: string;
  jobSite?: string;
  jobDescription?: string;
}

export interface GptmakerInteraction {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  chatId: string;
  chatName: string;
  status: 'RUNNING' | 'WAITING' | 'RESOLVED';
  startAt: string;
  transferAt: string;
  resolvedAt?: string;
  userId?: string;
}

export interface GptmakerMessage {
  id: string;
  text: string;
  role: string;
  time: number;
  userName?: string | null;
  userPicture?: string | null;
  type: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  documentUrl?: string | null;
  fileName?: string | null;
  metadata?: {
    senderName?: string;
    participantPhone?: string;
  };
}

export interface ListChatsParams {
  agentId?: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface ListMessagesParams {
  page?: number;
  pageSize?: number;
}

export interface GptmakerWorkspace {
  id: string;
  name: string;
  createdAt: number;
}

export class GptmakerClient {
  private client: AxiosInstance;
  private workspaceId: string;

  constructor(apiToken: string, workspaceId: string) {
    this.workspaceId = workspaceId;
    this.client = axios.create({
      baseURL: GPTMAKER_API_BASE,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async listWorkspaces(): Promise<GptmakerWorkspace[]> {
    const response = await this.client.get<GptmakerWorkspace[]>('/v2/workspaces');
    return response.data;
  }

  async listChats(params?: ListChatsParams): Promise<GptmakerChat[]> {
    const response = await this.client.get<GptmakerChat[]>(
      `/v2/workspace/${this.workspaceId}/chats`,
      { params }
    );
    return response.data;
  }

  async listAgents(params?: { page?: number; pageSize?: number; query?: string }): Promise<GptmakerAgent[]> {
    const response = await this.client.get<GptmakerAgent[]>(
      `/v2/workspace/${this.workspaceId}/agents`,
      { params }
    );
    return response.data;
  }

  async listMessages(chatId: string, params?: ListMessagesParams): Promise<GptmakerMessage[]> {
    const response = await this.client.get<GptmakerMessage[]>(
      `/v2/chat/${chatId}/messages`,
      { params }
    );
    return response.data;
  }

  async takeOverChat(chatId: string): Promise<void> {
    await this.client.put(
      `/v2/workspace/${this.workspaceId}/chats/${chatId}/take-over`
    );
  }

  async finishChat(chatId: string): Promise<void> {
    await this.client.put(
      `/v2/workspace/${this.workspaceId}/chats/${chatId}/finish`
    );
  }

  async sendMessage(chatId: string, content: string): Promise<GptmakerMessage> {
    const response = await this.client.post<GptmakerMessage>(
      `/v2/workspace/${this.workspaceId}/chats/${chatId}/message`,
      { content }
    );
    return response.data;
  }

  async editMessage(chatId: string, messageId: string, content: string): Promise<void> {
    await this.client.put(
      `/v2/workspace/${this.workspaceId}/chats/${chatId}/message/${messageId}`,
      { content }
    );
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await this.client.delete(
      `/v2/workspace/${this.workspaceId}/chats/${chatId}/message/${messageId}`
    );
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.client.delete(
      `/v2/workspace/${this.workspaceId}/chats/${chatId}`
    );
  }

  async listAttendances(): Promise<any[]> {
    const response = await this.client.get(
      `/v2/workspace/${this.workspaceId}/attendances`
    );
    return response.data;
  }

  async getAttendanceMessages(attendanceId: string): Promise<GptmakerMessage[]> {
    const response = await this.client.get<GptmakerMessage[]>(
      `/v2/workspace/${this.workspaceId}/attendances/${attendanceId}/messages`
    );
    return response.data;
  }

  async listInteractions(params?: { agentId?: string; page?: number; pageSize?: number }): Promise<GptmakerInteraction[]> {
    const response = await this.client.get<{ data: GptmakerInteraction[]; count: number; page: number; pageSize: number }>(
      `/v2/workspace/${this.workspaceId}/interactions`,
      { params }
    );
    // API retorna um objeto com { data, count, page, pageSize }, extrair apenas o array
    return response.data.data;
  }
}

export function createGptmakerClient(apiToken: string, workspaceId: string): GptmakerClient {
  return new GptmakerClient(apiToken, workspaceId);
}

export async function discoverWorkspaceId(apiToken: string): Promise<string | null> {
  try {
    const tempClient = axios.create({
      baseURL: GPTMAKER_API_BASE,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[GPTMaker] Discovering workspace ID...');
    const response = await tempClient.get<GptmakerWorkspace[]>('/v2/workspaces');
    const workspaces = response.data;
    
    console.log('[GPTMaker] Workspaces found:', workspaces);
    
    if (workspaces && workspaces.length > 0) {
      console.log('[GPTMaker] Using workspace ID:', workspaces[0].id);
      return workspaces[0].id;
    }
    
    console.warn('[GPTMaker] No workspaces found');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[GPTMaker] Error discovering workspace ID:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[GPTMaker] Error discovering workspace ID:', error);
    }
    return null;
  }
}
