import React from "react";
import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle, MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useDateFilter } from "@/contexts/DateFilterContext";

export default function Operators() {
  const { dateRange } = useDateFilter();
  const { data: interactions, isLoading, error } = trpc.interactions.list.useQuery({
    pageSize: 200,
  });
  
  // Filtrar interactions por data
  const filteredInteractions = React.useMemo(() => {
    if (!interactions || !Array.isArray(interactions)) return [];
    
    return interactions.filter((interaction: any) => {
      // startAt está em formato ISO string
      const interactionDate = new Date(interaction.startAt);
      return interactionDate >= dateRange.startDate && interactionDate <= dateRange.endDate;
    });
  }, [interactions, dateRange]);

  // Calculate overall statistics from interactions
  const stats = React.useMemo(() => {
    if (!filteredInteractions || !Array.isArray(filteredInteractions)) {
      return {
        total: 0,
        running: 0,
        waiting: 0,
        resolved: 0,
      };
    }

    return {
      total: filteredInteractions.length,
      running: filteredInteractions.filter((i: any) => i.status === 'RUNNING').length,
      waiting: filteredInteractions.filter((i: any) => i.status === 'WAITING').length,
      resolved: filteredInteractions.filter((i: any) => i.status === 'RESOLVED').length,
    };
  }, [filteredInteractions]);

  // Extract unique operators from interactions
  const operators = React.useMemo(() => {
    if (!filteredInteractions || !Array.isArray(filteredInteractions)) return [];

    const operatorMap = new Map<string, {
      userId: string;
      userLogin?: string;
      runningCount: number;
      waitingCount: number;
      resolvedCount: number;
      totalCount: number;
      interactions: any[];
    }>();
    
    filteredInteractions.forEach((interaction: any) => {
      // Use userLogin como fallback se userId não estiver disponível
      const identifier = interaction.userId || interaction.userLogin;
      if (!identifier) return;

      const existing = operatorMap.get(identifier);
      if (existing) {
        existing.totalCount++;
        if (interaction.status === 'RUNNING') existing.runningCount++;
        if (interaction.status === 'WAITING') existing.waitingCount++;
        if (interaction.status === 'RESOLVED') existing.resolvedCount++;
        existing.interactions.push(interaction);
      } else {
        operatorMap.set(identifier, {
          userId: interaction.userId || identifier,
          userLogin: interaction.userLogin,
          runningCount: interaction.status === 'RUNNING' ? 1 : 0,
          waitingCount: interaction.status === 'WAITING' ? 1 : 0,
          resolvedCount: interaction.status === 'RESOLVED' ? 1 : 0,
          totalCount: 1,
          interactions: [interaction],
        });
      }
    });

    return Array.from(operatorMap.values());
  }, [filteredInteractions]);

  return (
    <OperatorLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Atendentes Humanos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e monitore todos os operadores ativos
            </p>
          </div>
          <DateRangeFilter />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Atendentes</p>
                  <p className="text-3xl font-bold mt-2">{operators.length > 0 ? operators.length : stats.total > 0 ? '—' : '0'}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <UserCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Atendimentos Ativos</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.running}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aguardando</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.waiting}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.resolved}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <CheckCircle2 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operators List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Lista de Atendentes</h2>
          
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="shadow-elegant border-destructive">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <p>Erro ao carregar atendentes: {error.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && operators.length === 0 && stats.total > 0 && (
            <Card className="shadow-elegant border-blue-200 bg-blue-50/50">
              <CardContent className="p-12 text-center">
                <UserCircle className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Estatísticas Gerais Disponíveis</h3>
                <p className="text-muted-foreground mb-4">
                  Existem {stats.total} atendimentos registrados, mas a API não retornou informações sobre atendentes individuais.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="p-4 rounded-lg bg-white border">
                    <p className="text-xs text-muted-foreground mb-1">Aguardando</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.waiting}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border">
                    <p className="text-xs text-muted-foreground mb-1">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.running}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border">
                    <p className="text-xs text-muted-foreground mb-1">Finalizados</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && operators.length === 0 && stats.total === 0 && (
            <Card className="shadow-elegant">
              <CardContent className="p-12 text-center">
                <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum atendimento encontrado</h3>
                <p className="text-muted-foreground">
                  Ainda não há atendimentos registrados no sistema
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && operators.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map((operator) => (
                <Card key={operator.userId} className="shadow-elegant hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white font-semibold">
                            {operator.userId.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">Atendente</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            ID: {operator.userId.substring(0, 8)}...
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <p className="text-xs text-muted-foreground">Ativos</p>
                        <p className="text-2xl font-bold text-green-600">{operator.runningCount}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10">
                        <p className="text-xs text-muted-foreground">Aguardando</p>
                        <p className="text-2xl font-bold text-orange-600">{operator.waitingCount}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-500/10">
                        <p className="text-xs text-muted-foreground">Finalizados</p>
                        <p className="text-2xl font-bold text-purple-600">{operator.resolvedCount}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-blue-600">{operator.totalCount}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/?operator=${operator.userId}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2" size="sm">
                          <MessageSquare className="w-4 h-4" />
                          Ver Chats
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
}
