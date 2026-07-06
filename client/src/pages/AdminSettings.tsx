import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, RotateCcw, Plus, Trash2, Brain, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminSettings() {
  const { user, isAuthenticated } = useAuth();
  const [promptText, setPromptText] = useState("");
  const [isModified, setIsModified] = useState(false);

  // Knowledge base form
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbCategory, setKbCategory] = useState("");
  const [kbSourceUrl, setKbSourceUrl] = useState("");

  // Fetch current prompt
  const { data: promptData, refetch: refetchPrompt } = trpc.settings.getPrompt.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch knowledge base
  const { data: knowledgeList, refetch: refetchKnowledge } = trpc.knowledge.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Mutations
  const savePromptMutation = trpc.settings.savePrompt.useMutation({
    onSuccess: () => {
      toast.success("Prompt salvato con successo!");
      setIsModified(false);
      refetchPrompt();
    },
    onError: (err) => toast.error(`Errore: ${err.message}`),
  });

  const resetPromptMutation = trpc.settings.resetPrompt.useMutation({
    onSuccess: (data) => {
      setPromptText(data.defaultPrompt);
      setIsModified(false);
      toast.success("Prompt ripristinato al default");
      refetchPrompt();
    },
    onError: (err) => toast.error(`Errore: ${err.message}`),
  });

  const createKnowledgeMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      toast.success("Conoscenza aggiunta!");
      setKbTitle("");
      setKbContent("");
      setKbCategory("");
      setKbSourceUrl("");
      refetchKnowledge();
    },
    onError: (err) => toast.error(`Errore: ${err.message}`),
  });

  const deleteKnowledgeMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("Conoscenza eliminata");
      refetchKnowledge();
    },
  });

  useEffect(() => {
    if (promptData?.prompt) {
      setPromptText(promptData.prompt);
    }
  }, [promptData]);

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#030310] flex items-center justify-center">
        <Card className="p-6 bg-white/5 border-white/10 text-center">
          <p className="text-white/60">Accesso riservato agli amministratori</p>
          <Link href="/" className="text-primary mt-2 inline-block">Torna alla Home</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030310] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-mono font-bold tracking-wide">Configurazione ADAM</h1>
        </div>
        <Link href="/" className="text-xs text-white/40 hover:text-primary font-mono">← Dashboard</Link>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="prompt" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono text-xs">
              <Brain className="h-3 w-3 mr-1.5" /> Prompt di Sistema
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono text-xs">
              <BookOpen className="h-3 w-3 mr-1.5" /> Knowledge Base
            </TabsTrigger>
          </TabsList>

          {/* === PROMPT TAB === */}
          <TabsContent value="prompt" className="mt-6">
            <Card className="bg-white/[0.02] border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-mono font-bold text-white/90">Prompt di Sistema</h2>
                  <p className="text-xs text-white/40 mt-1">
                    Questo è il prompt che definisce il comportamento di ADAM. Modificalo per personalizzare le risposte.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {promptData?.isCustom && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Personalizzato</Badge>
                  )}
                  {isModified && (
                    <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">Non salvato</Badge>
                  )}
                </div>
              </div>

              <Textarea
                value={promptText}
                onChange={(e) => { setPromptText(e.target.value); setIsModified(true); }}
                className="min-h-[400px] bg-black/30 border-white/10 text-white/90 font-mono text-xs leading-relaxed resize-y"
                placeholder="Inserisci il prompt di sistema..."
              />

              <div className="flex items-center justify-between mt-4">
                <div className="text-[10px] text-white/30 font-mono">
                  {promptText.length} caratteri
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetPromptMutation.mutate()}
                    disabled={resetPromptMutation.isPending}
                    className="text-xs font-mono border-white/10 text-white/60 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3 mr-1.5" />
                    Ripristina Default
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => savePromptMutation.mutate({ prompt: promptText })}
                    disabled={!isModified || savePromptMutation.isPending}
                    className="text-xs font-mono bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                  >
                    {savePromptMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1.5" />
                    )}
                    Salva Prompt
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="bg-white/[0.02] border-white/10 p-4 mt-4">
              <h3 className="text-xs font-mono font-bold text-white/70 mb-2">Suggerimenti per il prompt:</h3>
              <ul className="text-[11px] text-white/40 space-y-1 font-mono">
                <li>• Definisci il ruolo e il tono di ADAM (formale, amichevole, tecnico)</li>
                <li>• Specifica le regole di classificazione verde/giallo/rosso</li>
                <li>• Aggiungi contesto territoriale specifico</li>
                <li>• Indica i limiti: cosa ADAM non deve fare o rispondere</li>
                <li>• Inserisci numeri di telefono e contatti importanti</li>
              </ul>
            </Card>
          </TabsContent>

          {/* === KNOWLEDGE BASE TAB === */}
          <TabsContent value="knowledge" className="mt-6">
            {/* Add knowledge form */}
            <Card className="bg-white/[0.02] border-white/10 p-6 mb-6">
              <h2 className="text-sm font-mono font-bold text-white/90 mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Aggiungi Conoscenza
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                  placeholder="Titolo (es: Orari Anagrafe)"
                  className="bg-black/30 border-white/10 text-white/90 text-xs font-mono"
                />
                <Input
                  value={kbCategory}
                  onChange={(e) => setKbCategory(e.target.value)}
                  placeholder="Categoria (es: servizi, turismo, orari)"
                  className="bg-black/30 border-white/10 text-white/90 text-xs font-mono"
                />
              </div>
              <Textarea
                value={kbContent}
                onChange={(e) => setKbContent(e.target.value)}
                placeholder="Contenuto della conoscenza... (es: L'ufficio anagrafe è aperto dal lunedì al venerdì dalle 8:30 alle 12:30)"
                className="min-h-[120px] bg-black/30 border-white/10 text-white/90 text-xs font-mono mb-3"
              />
              <div className="flex items-center gap-3">
                <Input
                  value={kbSourceUrl}
                  onChange={(e) => setKbSourceUrl(e.target.value)}
                  placeholder="URL fonte (opzionale)"
                  className="flex-1 bg-black/30 border-white/10 text-white/90 text-xs font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!kbTitle.trim() || !kbContent.trim()) {
                      toast.error("Titolo e contenuto sono obbligatori");
                      return;
                    }
                    createKnowledgeMutation.mutate({
                      title: kbTitle,
                      content: kbContent,
                      category: kbCategory || undefined,
                      sourceUrl: kbSourceUrl || undefined,
                      verified: true,
                    });
                  }}
                  disabled={createKnowledgeMutation.isPending}
                  className="text-xs font-mono bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                >
                  {createKnowledgeMutation.isPending ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1.5" />
                  )}
                  Aggiungi
                </Button>
              </div>
            </Card>

            {/* Knowledge list */}
            <Card className="bg-white/[0.02] border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono font-bold text-white/90">
                  Conoscenze ({knowledgeList?.length || 0})
                </h2>
              </div>

              {!knowledgeList || knowledgeList.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/30 font-mono">Nessuna conoscenza inserita</p>
                  <p className="text-[10px] text-white/20 font-mono mt-1">Aggiungi FAQ, orari, contatti e informazioni sui servizi</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {knowledgeList.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${entry.verified ? "text-green-400" : "text-white/20"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white/80 truncate">{entry.title}</span>
                          {entry.category && (
                            <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">{entry.category}</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 font-mono mt-1 line-clamp-2">{entry.content}</p>
                        {entry.sourceUrl && (
                          <a href={entry.sourceUrl} target="_blank" rel="noopener" className="text-[9px] text-primary/60 hover:text-primary font-mono mt-1 inline-block">
                            {entry.sourceUrl}
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKnowledgeMutation.mutate({ id: entry.id })}
                        className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
