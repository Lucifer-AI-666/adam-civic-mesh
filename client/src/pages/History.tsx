import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ExternalLink, Download } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

function RiskBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const config = {
    green: { label: "Verde", className: "bg-[oklch(0.72_0.18_150)] text-black" },
    yellow: { label: "Giallo", className: "bg-[oklch(0.80_0.16_85)] text-black" },
    red: { label: "Rosso", className: "bg-[oklch(0.60_0.20_25)] text-white" },
  };
  const c = config[level as keyof typeof config];
  if (!c) return null;
  return <Badge className={c.className}>{c.label}</Badge>;
}

export default function History() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: conversations, isLoading } = trpc.chat.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const exportConversation = trpc.chat.exportConversation.useQuery(
    { conversationId: 0 },
    { enabled: false }
  );

  const handleExport = async (convId: number, title: string) => {
    try {
      const response = await fetch(`/api/trpc/chat.exportConversation?input=${encodeURIComponent(JSON.stringify({ conversationId: convId }))}`);
      const data = await response.json();
      const result = data.result?.data;
      
      if (!result) { toast.error("Errore nell'export"); return; }

      const text = result.messages
        .filter((m: any) => m.role !== "system")
        .map((m: any) => `[${new Date(m.createdAt).toLocaleString("it-IT")}] ${m.role === "user" ? "Tu" : "ADAM"}: ${m.content}`)
        .join("\n\n---\n\n");

      const blob = new Blob([`# Conversazione: ${title || "ADAM Chat"}\n\n${text}`], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adam-conversazione-${convId}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Conversazione esportata");
    } catch {
      toast.error("Errore nell'export");
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Accedi per vedere lo storico</h1>
          <p className="text-muted-foreground mb-4">Devi effettuare l'accesso per visualizzare le tue conversazioni.</p>
          <a href={getLoginUrl()}>
            <Button>Accedi</Button>
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        <h1 className="text-2xl font-bold mb-6">
          <span className="text-primary">Storico</span> Conversazioni
        </h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna conversazione ancora. Inizia una chat con ADAM!</p>
            <Link href="/chat">
              <Button className="mt-4">Nuova Chat</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations?.map(conv => (
              <Card key={conv.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <Link href={`/chat/${conv.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{conv.title || "Conversazione"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.createdAt).toLocaleDateString("it-IT", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={conv.riskLevel} />
                    <Badge variant="outline" className="text-xs">
                      {conv.status === "active" ? "Attiva" : conv.status === "escalated" ? "Escalation" : conv.status === "resolved" ? "Risolta" : "Chiusa"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleExport(conv.id, conv.title || ""); }}
                      title="Esporta conversazione"
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Link href={`/chat/${conv.id}`}>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
