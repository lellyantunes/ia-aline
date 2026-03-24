import { useState } from "react";
import { trpc } from "@/lib/trpc";
import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bot, Loader2, AlertCircle, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: agents, isLoading, error } = trpc.agents.list.useQuery({
    pageSize: 100,
    query: searchQuery || undefined,
  });

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

  return (
    <OperatorLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Agentes
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e monitore todos os agentes do workspace
            </p>
          </div>
          <Link href="/agents/compare">
            <Button className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Comparar Agentes
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar agente por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p>Erro ao carregar agentes: {error.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && agents && agents.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum agente encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Não há agentes disponíveis no momento"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Agents Grid */}
        {!isLoading && !error && agents && agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg font-bold">
                        {agent.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate">{agent.name}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-2">
                        <Badge className={getTypeColor(agent.type)} variant="outline">
                          {getTypeLabel(agent.type)}
                        </Badge>
                        <Badge variant="outline" className="border-border/50">
                          {getCommunicationLabel(agent.communicationType)}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.jobName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                      <p className="text-sm">{agent.jobName}</p>
                    </div>
                  )}
                  {agent.jobDescription && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-sm line-clamp-2">{agent.jobDescription}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/agents/${agent.id}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        Ver Detalhes
                      </Button>
                    </Link>
                    <Link href={`/?agentId=${agent.id}`} className="flex-1">
                      <Button className="w-full" variant="outline">
                        Ver Chats
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && !error && agents && agents.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {agents.length} {agents.length === 1 ? "agente encontrado" : "agentes encontrados"}
          </div>
        )}
      </div>
    </OperatorLayout>
  );
}
