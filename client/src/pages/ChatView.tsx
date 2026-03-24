import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import OperatorLayout from "@/components/OperatorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  UserCircle,
  Bot,
  CheckCircle2,
  Users,
  Loader2,
  AlertCircle,
  Bell,
  BellOff,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChatView() {
  const [, params] = useRoute("/chat/:chatId");
  const [, setLocation] = useLocation();
  const chatId = params?.chatId;
  const [message, setMessage] = useState("");
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Fetch chat details from list
  const { data: chats } = trpc.chats.list.useQuery({ pageSize: 200 });
  const chat = chats?.find((c) => c.id === chatId);

  // Fetch messages
  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = trpc.chats.messages.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId, refetchInterval: 3000 }
  );

  // Mutations
  const takeOver = trpc.chats.takeOver.useMutation({
    onSuccess: () => {
      toast.success("Atendimento assumido com sucesso!");
      utils.chats.list.invalidate();
      refetchMessages();
    },
    onError: (error) => {
      toast.error(`Erro ao assumir atendimento: ${error.message}`);
    },
  });

  const finish = trpc.chats.finish.useMutation({
    onSuccess: () => {
      toast.success("Atendimento finalizado com sucesso!");
      utils.chats.list.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Erro ao finalizar atendimento: ${error.message}`);
    },
  });

  const sendMessage = trpc.chats.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      utils.chats.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    },
  });

  // Check subscription status
  const { data: subscriptionData } = trpc.subscriptions.isSubscribed.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId }
  );
  const isSubscribed = subscriptionData?.subscribed || false;

  const subscribe = trpc.subscriptions.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Chat assinado com sucesso!");
      utils.subscriptions.isSubscribed.invalidate({ chatId });
    },
    onError: (error) => {
      toast.error(`Erro ao assinar chat: ${error.message}`);
    },
  });

  const unsubscribe = trpc.subscriptions.unsubscribe.useMutation({
    onSuccess: () => {
      toast.success("Assinatura removida!");
      utils.subscriptions.isSubscribed.invalidate({ chatId });
    },
    onError: (error) => {
      toast.error(`Erro ao remover assinatura: ${error.message}`);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chatId) {
    return null;
  }

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    sendMessage.mutate({ chatId, content: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <OperatorLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              {chat ? (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold truncate">
                      {chat.userName || chat.name}
                    </h2>
                    {chat.humanTalk && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Atendimento Humano
                      </Badge>
                    )}
                    {chat.finished && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Finalizado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Agente: {chat.agentName}
                  </p>
                </div>
              ) : (
                <Skeleton className="h-12 flex-1" />
              )}
            </div>

            <div className="flex items-center gap-2">
              {chat && (
                <Button
                  onClick={() =>
                    isSubscribed
                      ? unsubscribe.mutate({ chatId })
                      : subscribe.mutate({ chatId })
                  }
                  disabled={subscribe.isPending || unsubscribe.isPending}
                  variant="ghost"
                  size="icon"
                  title={isSubscribed ? "Remover assinatura" : "Assinar chat"}
                >
                  {isSubscribed ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                </Button>
              )}

              {chat && !chat.humanTalk && !chat.finished && (
                <Button
                  onClick={() => takeOver.mutate({ chatId })}
                  disabled={takeOver.isPending}
                  variant="default"
                >
                  {takeOver.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  Assumir Atendimento
                </Button>
              )}
              
              {chat && chat.humanTalk && !chat.finished && (
                <Button
                  onClick={() => setShowFinishDialog(true)}
                  variant="outline"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto elegant-scrollbar p-4 space-y-4 bg-muted/20">
          {messagesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-3/4" />
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const isAssistant = msg.role === "assistant";

                // Verificar se há mídia
                const hasImage = msg.imageUrl;
                const hasAudio = msg.audioUrl;
                const hasVideo = msg.videoUrl;
                const hasDocument = msg.documentUrl;
                const hasMedia = hasImage || hasAudio || hasVideo || hasDocument;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      !isUser && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback
                        className={cn(
                          isUser && "bg-primary text-primary-foreground",
                          isAssistant && "bg-accent text-accent-foreground"
                        )}
                      >
                        {isUser ? (
                          <UserCircle className="w-5 h-5" />
                        ) : (
                          <Bot className="w-5 h-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        "flex flex-col gap-1 max-w-[70%]",
                        !isUser && "items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 shadow-elegant",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                        )}
                      >
                        {/* Renderizar imagem */}
                        {hasImage && (
                          <div className="mb-2">
                            <img
                              src={msg.imageUrl!}
                              alt="Imagem"
                              className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.imageUrl!, "_blank")}
                            />
                          </div>
                        )}

                        {/* Renderizar vídeo */}
                        {hasVideo && (
                          <div className="mb-2">
                            <video
                              src={msg.videoUrl!}
                              controls
                              className="max-w-full rounded-lg max-h-64"
                            />
                          </div>
                        )}

                        {/* Renderizar áudio */}
                        {hasAudio && (
                          <div className="mb-2">
                            <audio src={msg.audioUrl!} controls className="w-full" />
                          </div>
                        )}

                        {/* Renderizar documento */}
                        {hasDocument && (
                          <div className="mb-2">
                            <a
                              href={msg.documentUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                                isUser
                                  ? "border-primary-foreground/30 hover:bg-primary-foreground/10"
                                  : "border-border hover:bg-muted"
                              )}
                            >
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm truncate">
                                {msg.fileName || "Documento"}
                              </span>
                            </a>
                          </div>
                        )}

                        {/* Renderizar texto */}
                        {msg.text && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        )}

                        {/* Caso não tenha texto nem mídia */}
                        {!msg.text && !hasMedia && (
                          <p className="text-sm italic opacity-60">
                            Mensagem sem conteúdo
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground px-2">
                        {formatDistanceToNow(new Date(msg.time), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma mensagem neste chat ainda
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {chat && !chat.finished && (
          <div className="border-t border-border bg-card p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder={
                  chat.humanTalk
                    ? "Digite sua mensagem..."
                    : "Assuma o atendimento para enviar mensagens"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!chat.humanTalk || sendMessage.isPending}
                className="min-h-[60px] max-h-[200px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chat.humanTalk || !message.trim() || sendMessage.isPending}
                size="icon"
                className="h-[60px] w-[60px] flex-shrink-0"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            {!chat.humanTalk && (
              <p className="text-xs text-muted-foreground mt-2">
                Você precisa assumir o atendimento para enviar mensagens
              </p>
            )}
          </div>
        )}

        {chat && chat.finished && (
          <div className="border-t border-border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Este atendimento foi finalizado
            </p>
          </div>
        )}
      </div>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar este atendimento? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                finish.mutate({ chatId });
                setShowFinishDialog(false);
              }}
              disabled={finish.isPending}
            >
              {finish.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Finalizando...
                </>
              ) : (
                "Finalizar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OperatorLayout>
  );
}
