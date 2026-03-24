import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Loader2, Settings, CheckCircle2 } from "lucide-react";

export default function Setup() {
  const [, setLocation] = useLocation();
  const [apiToken, setApiToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveredWorkspace, setDiscoveredWorkspace] = useState<string | null>(null);

  const saveConfig = trpc.config.save.useMutation({
    onSuccess: (data) => {
      toast.success(`Configuração salva com sucesso! Workspace: ${data.workspaceId}`);
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const discoverWorkspace = trpc.config.discoverWorkspace.useMutation({
    onSuccess: (data) => {
      setDiscoveredWorkspace(data.workspaceId);
      toast.success(`Workspace descoberto: ${data.workspaceId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao descobrir workspace: ${error.message}`);
    },
  });

  const handleTestToken = async () => {
    if (!apiToken.trim()) {
      toast.error("Por favor, insira o token de API");
      return;
    }

    discoverWorkspace.mutate({ apiToken: apiToken.trim() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiToken.trim()) {
      toast.error("Por favor, preencha o token de API");
      return;
    }

    setIsSubmitting(true);
    saveConfig.mutate({ 
      apiToken: apiToken.trim(),
      workspaceId: discoveredWorkspace || undefined
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-background p-4">
      <Card className="w-full max-w-lg shadow-elegant-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Settings className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Configuração Inicial</CardTitle>
            <CardDescription className="text-base mt-2">
              Configure seu token de API para começar
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiToken" className="text-sm font-medium">
                Token de API
              </Label>
              <Input
                id="apiToken"
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={apiToken}
                onChange={(e) => {
                  setApiToken(e.target.value);
                  setDiscoveredWorkspace(null);
                }}
                className="h-11 font-mono text-sm"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Token Bearer de autenticação. O Workspace ID será descoberto automaticamente.
              </p>
            </div>

            {/* Test Token Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleTestToken}
              disabled={!apiToken.trim() || discoverWorkspace.isPending || isSubmitting}
            >
              {discoverWorkspace.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando token...
                </>
              ) : (
                "Testar Token e Descobrir Workspace"
              )}
            </Button>

            {/* Discovered Workspace Display */}
            {discoveredWorkspace && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Workspace descoberto com sucesso!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                      ID: {discoveredWorkspace}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar e Continuar"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              A aplicação irá buscar automaticamente o workspace associado ao seu token
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
