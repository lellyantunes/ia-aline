import { useMemo } from "react";
import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useDateFilter } from "@/contexts/DateFilterContext";

export default function Stats() {
  const { dateRange } = useDateFilter();
  const { data: stats, isLoading } = trpc.stats.dashboard.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const { data: chats, isLoading: chatsLoading } = trpc.chats.list.useQuery({ pageSize: 200 });
  
  // Filtrar chats por data e calcular estatísticas consistentes
  const filteredStats = useMemo(() => {
    if (!chats) return null;
    
    const filteredChats = chats.filter((chat) => {
      const chatDate = new Date(chat.time);
      return chatDate >= dateRange.startDate && chatDate <= dateRange.endDate;
    });

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    return {
      totalChats: filteredChats.length,
      unreadChats: filteredChats.filter(c => !c.read).length,
      activeAttendances: filteredChats.filter(c => c.humanTalk && !c.finished).length,
      finishedToday: filteredChats.filter(c => c.finished && c.time >= oneDayAgo).length,
    };
  }, [chats, dateRange]);

  const isLoadingAny = isLoading || chatsLoading;

  const kpis = [
    {
      title: "Total de Chats",
      value: filteredStats?.totalChats || 0,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Todos os chats no período",
    },
    {
      title: "Não Lidos",
      value: filteredStats?.unreadChats || 0,
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "Chats aguardando leitura",
    },
    {
      title: "Em Atendimento Humano",
      value: filteredStats?.activeAttendances || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Atendimentos ativos com operadores",
    },
    {
      title: "Finalizados Hoje",
      value: filteredStats?.finishedToday || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "Atendimentos concluídos nas últimas 24h",
    },
  ];

  // Calculate additional metrics from filtered data
  const totalMessages = chats?.filter((chat) => {
    const chatDate = new Date(chat.time);
    return chatDate >= dateRange.startDate && chatDate <= dateRange.endDate;
  }).reduce((acc, chat) => acc + (chat.unReadCount || 0), 0) || 0;
  const averageResponseTime = "< 2 min"; // Placeholder
  const satisfactionRate = "95%"; // Placeholder

  const additionalMetrics = [
    {
      title: "Total de Mensagens Pendentes",
      value: totalMessages,
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Tempo Médio de Resposta",
      value: averageResponseTime,
      icon: Clock,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Taxa de Satisfação",
      value: satisfactionRate,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <OperatorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Estatísticas</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe as métricas de atendimento em tempo real
            </p>
          </div>
          <DateRangeFilter />
        </div>

        {/* Main KPIs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Métricas Principais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingAny
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))
              : kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <Card key={kpi.title} className="shadow-elegant">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("p-3 rounded-xl", kpi.bgColor)}>
                            <Icon className={cn("w-6 h-6", kpi.color)} />
                          </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{kpi.value}</p>
                        <p className="text-sm font-medium text-foreground mb-1">
                          {kpi.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {kpi.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </div>

        {/* Additional Metrics */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Métricas Adicionais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title} className="shadow-elegant">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </CardTitle>
                      <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                        <Icon className={cn("w-4 h-4", metric.color)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Performance Overview */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Visão Geral de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Taxa de Conversão para Atendimento Humano</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentual de chats que necessitaram intervenção humana
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {filteredStats?.totalChats
                    ? Math.round(
                        ((filteredStats.activeAttendances + filteredStats.finishedToday) /
                          filteredStats.totalChats) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Taxa de Finalização</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentual de atendimentos concluídos no período
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {filteredStats?.activeAttendances || filteredStats?.finishedToday
                    ? Math.round(
                        (filteredStats.finishedToday /
                          (filteredStats.activeAttendances + filteredStats.finishedToday)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Chats Aguardando Atenção</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chats não lidos que precisam de revisão
                  </p>
                </div>
                <div className="text-2xl font-bold text-orange-500">
                  {filteredStats?.unreadChats || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OperatorLayout>
  );
}
