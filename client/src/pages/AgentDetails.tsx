import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Users,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

export default function AgentDetails() {
  const { agentId } = useParams<{ agentId: string }>();

  const { data: agents, isLoading: loadingAgents } = trpc.agents.list.useQuery({
    pageSize: 100,
  });

  const { data: chats, isLoading: loadingChats } = trpc.chats.list.useQuery({
    pageSize: 200,
    agentId,
  });

  const agent = agents?.find((a) => a.id === agentId);

  // Calcular métricas
  const metrics = useMemo(() => {
    if (!chats) return null;

    const total = chats.length;
    const finished = chats.filter((c) => c.finished).length;
    const active = chats.filter((c) => c.humanTalk && !c.finished).length;
    const unread = chats.filter((c) => !c.read).length;
    const finishRate = total > 0 ? ((finished / total) * 100).toFixed(1) : "0";

    // Calcular tempo médio (diferença entre criação e última mensagem)
    const times = chats
      .filter((c) => c.finished)
      .map((c) => c.time - c.createdAt)
      .filter((t) => t > 0);
    const avgTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
    const avgTimeMinutes = Math.round(avgTime / 1000 / 60);

    return {
      total,
      finished,
      active,
      unread,
      finishRate,
      avgTimeMinutes,
    };
  }, [chats]);

  // Dados para gráfico de linha (últimos 7 dias)
  const lineChartData = useMemo(() => {
    if (!chats) return [];

    const now = Date.now();
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayChats = chats.filter((c) => c.createdAt >= dayStart && c.createdAt < dayEnd);

      const date = new Date(dayStart);
      const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

      data.push({
        date: label,
        chats: dayChats.length,
        finalizados: dayChats.filter((c) => c.finished).length,
      });
    }

    return data;
  }, [chats]);

  // Dados para gráfico de pizza (distribuição de status)
  const pieChartData = useMemo(() => {
    if (!metrics) return [];

    return [
      { name: "Finalizados", value: metrics.finished, color: "#10b981" },
      { name: "Ativos", value: metrics.active, color: "#3b82f6" },
      { name: "Não Lidos", value: metrics.unread, color: "#f59e0b" },
      { name: "Outros", value: metrics.total - metrics.finished - metrics.active - metrics.unread, color: "#6b7280" },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SUPPORT: "Suporte",
      SALE: "Vendas",
      PERSONAL: "Pessoal",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SUPPORT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      SALE: "bg-green-500/10 text-green-500 border-green-500/20",
      PERSONAL: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getCommunicationLabel = (type: string) => {
    const labels: Record<string, string> = {
      FORMAL: "Formal",
      NORMAL: "Normal",
      RELAXED: "Descontraído",
    };
    return labels[type] || type;
  };

  if (loadingAgents || loadingChats) {
    return (
      <OperatorLayout>
        <div className="container py-8 space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </OperatorLayout>
    );
  }

  if (!agent) {
    return (
      <OperatorLayout>
        <div className="container py-8">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Agente não encontrado</h3>
              <p className="text-muted-foreground mb-6">
                O agente solicitado não existe ou não está disponível.
              </p>
              <Link href="/agents">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Agentes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-6">
          <Link href="/agents">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-bold">
                  {agent.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {agent.name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getTypeColor(agent.type)} variant="outline">
                    {getTypeLabel(agent.type)}
                  </Badge>
                  <Badge variant="outline" className="border-border/50">
                    {getCommunicationLabel(agent.communicationType)}
                  </Badge>
                </div>
                {agent.jobName && (
                  <p className="text-muted-foreground mt-2">
                    <span className="font-medium">Empresa:</span> {agent.jobName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Total de Chats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.total}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Taxa de Finalização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">{metrics.finishRate}%</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Atendimentos Ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">{metrics.active}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Tempo Médio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500">{metrics.avgTimeMinutes}min</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Chats nos Últimos 7 Dias
              </CardTitle>
              <CardDescription>Evolução diária de chats e finalizações</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="chats" stroke="#8b5cf6" strokeWidth={2} name="Total de Chats" />
                  <Line type="monotone" dataKey="finalizados" stroke="#10b981" strokeWidth={2} name="Finalizados" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Distribuição de Status
              </CardTitle>
              <CardDescription>Proporção de chats por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Informações Detalhadas */}
        {agent.behavior && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Comportamento do Agente</CardTitle>
              <CardDescription>Instruções e personalidade configuradas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{agent.behavior}</p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Chats Recentes */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Chats Recentes</CardTitle>
            <CardDescription>Últimos atendimentos deste agente</CardDescription>
          </CardHeader>
          <CardContent>
            {chats && chats.length > 0 ? (
              <div className="space-y-3">
                {chats.slice(0, 10).map((chat) => (
                  <Link key={chat.id} href={`/chat/${chat.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={chat.picture} alt={chat.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                          {chat.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{chat.name}</p>
                          {!chat.read && (
                            <Badge variant="default" className="text-xs">
                              {chat.unReadCount} nova{chat.unReadCount !== 1 ? "s" : ""}
                            </Badge>
                          )}
                          {chat.humanTalk && (
                            <Badge variant="outline" className="text-xs">
                              Humano
                            </Badge>
                          )}
                          {chat.finished && (
                            <Badge variant="secondary" className="text-xs">
                              Finalizado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{chat.conversation}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.time), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum chat encontrado para este agente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OperatorLayout>
  );
}
