import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, Loader2, User } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Escalations() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: escalations, refetch } = trpc.escalations.list.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "operator" || user?.role === "admin"),
  });

  const updateMutation = trpc.escalations.update.useMutation({
    onSuccess: () => {
      toast.success("Escalation aggiornata");
      refetch();
    },
  });

  if (loading) return <div className="min-h-screen bg-background"><Navbar /></div>;

  if (!isAuthenticated || (user?.role !== "operator" && user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Accesso riservato</h1>
          <p className="text-muted-foreground">Solo operatori e admin possono gestire le escalation.</p>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button className="mt-4">Accedi</Button>
            </a>
          )}
        </main>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: "In attesa", icon: Clock, className: "bg-[oklch(0.80_0.16_85)] text-black" },
    in_progress: { label: "In gestione", icon: Loader2, className: "bg-[oklch(0.75_0.15_195)] text-black" },
    resolved: { label: "Risolto", icon: CheckCircle, className: "bg-[oklch(0.72_0.18_150)] text-black" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        <h1 className="text-2xl font-bold mb-6">
          <span className="text-primary">Pannello</span> Escalation
        </h1>

        {escalations?.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-[oklch(0.72_0.18_150)] mb-4" />
            <p className="text-muted-foreground">Nessuna escalation in coda. Tutto sotto controllo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalations?.map(esc => {
              const sc = statusConfig[esc.status as keyof typeof statusConfig];
              return (
                <Card key={esc.id} className="border-l-4 border-l-[oklch(0.60_0.20_25)]">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={sc?.className}>{sc?.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            #{esc.id} — Conv. #{esc.conversationId}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{esc.reason}</p>
                        {esc.context && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground">Contesto conversazione</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {esc.context}
                            </pre>
                          </details>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(esc.createdAt).toLocaleDateString("it-IT", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {esc.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMutation.mutate({ id: esc.id, status: "in_progress" })}
                            disabled={updateMutation.isPending}
                          >
                            Prendi in carico
                          </Button>
                        )}
                        {esc.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: esc.id, status: "resolved" })}
                            disabled={updateMutation.isPending}
                          >
                            Risolvi
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
