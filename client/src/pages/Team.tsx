import { useAuth } from "@/_core/hooks/useAuth";
import OperatorLayout from "@/components/OperatorLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import type { GptmakerInteraction } from "../../../server/gptmaker-client";
import { Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";

export default function Team() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar todos os interactions para extrair membros da equipe
  const { data: interactionsData, isLoading } = trpc.interactions.list.useQuery(
    { pageSize: 200 },
    { enabled: !!user, refetchInterval: 30000 }
  );

  if (authLoading || !user) {
    return (
      <OperatorLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </OperatorLayout>
    );
  }

  // Extrair membros únicos dos interactions
  type TeamMember = {
    userId: string;
    name: string;
    activeCount: number;
    totalCount: number;
  };

  const interactions = interactionsData || [];
  const teamMembers: TeamMember[] = interactions.length > 0
    ? Array.from(
        new Map(
          interactions
            .filter((interaction: GptmakerInteraction) => interaction.userId)
            .map((interaction: GptmakerInteraction) => {
              const userId = interaction.userId!;
              return [
                userId,
                {
                  userId,
                  name: userId,
                  // Contar atendimentos ativos deste membro
                  activeCount: interactions.filter(
                    (i: GptmakerInteraction) => i.userId === userId && i.status === "RUNNING"
                  ).length,
                  // Contar total de atendimentos
                  totalCount: interactions.filter(
                    (i: GptmakerInteraction) => i.userId === userId
                  ).length,
                } as TeamMember,
              ];
            })
        ).values()
      )
    : [];

  // Filtrar membros baseado na busca
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <OperatorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="w-8 h-8 text-purple-600" />
              Equipe
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os membros da equipe e atendentes
            </p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Membro
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Membros</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-pink-200 dark:border-pink-900">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atendentes Ativos</p>
                <p className="text-2xl font-bold">
                  {teamMembers.filter((m) => m.activeCount > 0).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Atendimentos</p>
                <p className="text-2xl font-bold">
                  {teamMembers.reduce((acc, m) => acc + m.totalCount, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Team Members List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Membros da Equipe</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Convide membros para começar a colaborar"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card
                  key={member.userId}
                  className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {member.userId.substring(0, 8)}...
                      </p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ativos:</span>
                          <span className="font-semibold text-purple-600">
                            {member.activeCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-semibold">{member.totalCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Perfil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        window.location.href = `/?userId=${member.userId}`;
                      }}
                    >
                      Ver Chats
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
}
