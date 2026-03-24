import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalChats: number;
  finishedChats: number;
  activeChats: number;
  unreadChats: number;
  finishRate: number;
  avgTimeMinutes: number;
}

export default function AgentComparison() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const { data: agents, isLoading: loadingAgents } = trpc.agents.list.useQuery({
    pageSize: 100,
  });

  const { data: allChats, isLoading: loadingChats } = trpc.chats.list.useQuery({
    pageSize: 200,
  });

  // Calcular métricas por agente
  const agentMetrics = useMemo<AgentMetrics[]>(() => {
    if (!agents || !allChats) return [];

    return agents.map((agent) => {
      const agentChats = allChats.filter((chat) => chat.agentId === agent.id);
      const total = agentChats.length;
      const finished = agentChats.filter((c) => c.finished).length;
      const active = agentChats.filter((c) => c.humanTalk && !c.finished).length;
      const unread = agentChats.filter((c) => !c.read).length;
      const finishRate = total > 0 ? (finished / total) * 100 : 0;

      const times = agentChats
        .filter((c) => c.finished)
        .map((c) => c.time - c.createdAt)
        .filter((t) => t > 0);
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const avgTimeMinutes = Math.round(avgTime / 1000 / 60);

      return {
        agentId: agent.id,
        agentName: agent.name,
        totalChats: total,
        finishedChats: finished,
        activeChats: active,
        unreadChats: unread,
        finishRate,
        avgTimeMinutes,
      };
    });
  }, [agents, allChats]);

  // Filtrar métricas dos agentes selecionados
  const selectedMetrics = useMemo(() => {
    return agentMetrics.filter((m) => selectedAgents.includes(m.agentId));
  }, [agentMetrics, selectedAgents]);

  // Dados para gráfico de barras comparativo
  const barChartData = useMemo(() => {
    return selectedMetrics.map((m) => ({
      agente: m.agentName.length > 15 ? m.agentName.substring(0, 15) + "..." : m.agentName,
      "Total de Chats": m.totalChats,
      "Finalizados": m.finishedChats,
      "Ativos": m.activeChats,
    }));
  }, [selectedMetrics]);

  // Dados para gráfico de linha (evolução diária comparativa)
  const lineChartData = useMemo(() => {
    if (!allChats || selectedAgents.length === 0) return [];

    const now = Date.now();
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const date = new Date(dayStart);
      const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

      const dayData: Record<string, string | number> = { date: label };

      selectedMetrics.forEach((metric) => {
        const agentChats = allChats.filter(
          (c) =>
            c.agentId === metric.agentId &&
            c.createdAt >= dayStart &&
            c.createdAt < dayEnd
        );
        dayData[metric.agentName] = agentChats.length;
      });

      data.push(dayData);
    }

    return data;
  }, [allChats, selectedMetrics, selectedAgents]);

  // Cores para os gráficos
  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectAll = () => {
    setSelectedAgents(agentMetrics.map((m) => m.agentId));
  };

  const clearAll = () => {
    setSelectedAgents([]);
  };

  if (loadingAgents || loadingChats) {
    return (
      <OperatorLayout>
        <div className="container py-8 space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Comparação de Agentes
            </h1>
            <p className="text-muted-foreground mt-2">
              Compare o desempenho de múltiplos agentes lado a lado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seletor de Agentes */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Selecionar Agentes
              </CardTitle>
              <CardDescription>
                Escolha os agentes para comparar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  className="flex-1"
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="flex-1"
                >
                  Limpar
                </Button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {agentMetrics.map((metric) => (
                  <div
                    key={metric.agentId}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => toggleAgent(metric.agentId)}
                  >
                    <Checkbox
                      checked={selectedAgents.includes(metric.agentId)}
                      onCheckedChange={() => toggleAgent(metric.agentId)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{metric.agentName}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {metric.totalChats} chats
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-500 border-green-500/20">
                          {metric.finishRate.toFixed(0)}% finalização
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedAgents.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    {selectedAgents.length} agente{selectedAgents.length !== 1 ? "s" : ""} selecionado{selectedAgents.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Área de Comparação */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAgents.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum agente selecionado</h3>
                  <p className="text-muted-foreground">
                    Selecione pelo menos um agente à esquerda para visualizar a comparação
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Gráfico de Barras */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Comparação de Métricas
                    </CardTitle>
                    <CardDescription>
                      Total de chats, finalizados e ativos por agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="agente" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Total de Chats" fill="#8b5cf6" />
                        <Bar dataKey="Finalizados" fill="#10b981" />
                        <Bar dataKey="Ativos" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico de Linha */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Evolução nos Últimos 7 Dias
                    </CardTitle>
                    <CardDescription>
                      Comparação da evolução diária de chats
                    </CardDescription>
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
                        {selectedMetrics.map((metric, index) => (
                          <Line
                            key={metric.agentId}
                            type="monotone"
                            dataKey={metric.agentName}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tabela Comparativa */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Tabela Comparativa</CardTitle>
                    <CardDescription>
                      Todas as métricas lado a lado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agente</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Finalizados</TableHead>
                            <TableHead className="text-right">Ativos</TableHead>
                            <TableHead className="text-right">Não Lidos</TableHead>
                            <TableHead className="text-right">Taxa Finalização</TableHead>
                            <TableHead className="text-right">Tempo Médio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedMetrics.map((metric) => (
                            <TableRow key={metric.agentId}>
                              <TableCell className="font-medium">{metric.agentName}</TableCell>
                              <TableCell className="text-right">{metric.totalChats}</TableCell>
                              <TableCell className="text-right text-green-500">
                                {metric.finishedChats}
                              </TableCell>
                              <TableCell className="text-right text-blue-500">
                                {metric.activeChats}
                              </TableCell>
                              <TableCell className="text-right text-orange-500">
                                {metric.unreadChats}
                              </TableCell>
                              <TableCell className="text-right">
                                {metric.finishRate.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right">
                                {metric.avgTimeMinutes}min
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </OperatorLayout>
  );
}
