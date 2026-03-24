import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useDateFilter } from "@/contexts/DateFilterContext";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { dateRange } = useDateFilter();

  // Parse URL query params using window.location.search
  const urlParams = useMemo(() => {
    if (typeof window === "undefined") {
      return { agentId: null, operator: null, userId: null };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      agentId: params.get("agentId"),
      operator: params.get("operator"),
      userId: params.get("userId"),
    };
  }, [typeof window !== "undefined" ? window.location.search : ""]);

  // Check if config exists
  const { data: config, isLoading: configLoading } = trpc.config.get.useQuery();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.stats.dashboard.useQuery(
    undefined,
    { enabled: !!config, refetchInterval: 10000 }
  );

  // Fetch chats with agentId filter if present
  const {
    data: chats,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = trpc.chats.list.useQuery(
    { 
      pageSize: 200,
      agentId: urlParams.agentId || undefined,
    },
    { enabled: !!config, refetchInterval: 5000 }
  );

  // Fetch agents for showing agent name when filtering
  const { data: agents } = trpc.agents.list.useQuery(
    { pageSize: 100 },
    { enabled: !!config && !!urlParams.agentId }
  );

  // Get current agent name for filter display
  const currentAgentName = useMemo(() => {
    if (!urlParams.agentId || !agents) return null;
    const agent = agents.find(a => a.id === urlParams.agentId);
    return agent?.name || null;
  }, [urlParams.agentId, agents]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (!configLoading && !config) {
      setLocation("/setup");
    }
  }, [config, configLoading, setLocation]);

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return null;
  }

  // Filter chats
  const filteredChats = chats?.filter((chat) => {
    const matchesSearch =
      searchQuery === "" ||
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.agentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && !chat.read) ||
      (statusFilter === "human" && chat.humanTalk) ||
      (statusFilter === "finished" && chat.finished);

    // Filtro de data - chat.time está em milissegundos
    const chatDate = new Date(chat.time);
    const matchesDateRange = chatDate >= dateRange.startDate && chatDate <= dateRange.endDate;

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const kpis = [
    {
      title: "Total de Chats",
      value: stats?.totalChats || 0,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Não Lidos",
      value: stats?.unreadChats || 0,
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Em Atendimento",
      value: stats?.activeAttendances || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Finalizados Hoje",
      value: stats?.finishedToday || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <OperatorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Atendimento</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os chats e atendimentos em tempo real
          </p>
        </div>

        {/* Active Agent Filter Banner */}
        {urlParams.agentId && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Filtrando por agente: <span className="text-primary">{currentAgentName || urlParams.agentId}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Remover filtro
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            : kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card key={kpi.title} className="shadow-elegant">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {kpi.title}
                          </p>
                          <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                        </div>
                        <div className={cn("p-3 rounded-xl", kpi.bgColor)}>
                          <Icon className={cn("w-6 h-6", kpi.color)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Filters */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Chats Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, usuário ou agente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DateRangeFilter />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">Não Lidos</SelectItem>
                  <SelectItem value="human">Em Atendimento</SelectItem>
                  <SelectItem value="finished">Finalizados</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => refetchChats()}
                disabled={chatsLoading}
              >
                {chatsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Atualizar"
                )}
              </Button>
            </div>

            {/* Chat List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto elegant-scrollbar">
              {chatsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : filteredChats && filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setLocation(`/chat/${chat.id}`)}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-all duration-200 text-left",
                      "hover:shadow-elegant hover:border-primary/50",
                      !chat.read && "bg-accent/20 border-accent",
                      selectedChat === chat.id && "border-primary shadow-elegant"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {chat.userName || chat.name}
                          </h3>
                          {!chat.read && (
                            <Badge variant="default" className="text-xs">
                              {chat.unReadCount} nova{chat.unReadCount !== 1 && "s"}
                            </Badge>
                          )}
                          {chat.humanTalk && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Humano
                            </Badge>
                          )}
                          {chat.finished && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Finalizado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Agente: {chat.agentName}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(chat.time), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? "Nenhum chat encontrado com os filtros aplicados"
                      : "Nenhum chat disponível no momento"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </OperatorLayout>
  );
}
