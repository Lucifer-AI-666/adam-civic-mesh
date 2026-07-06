import Navbar from "@/components/Navbar";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useParams } from "wouter";

function RiskBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const config = {
    green: { label: "Verde", className: "bg-[oklch(0.72_0.18_150)] text-black" },
    yellow: { label: "Giallo", className: "bg-[oklch(0.80_0.16_85)] text-black" },
    red: { label: "Rosso", className: "bg-[oklch(0.60_0.20_25)] text-white" },
  };
  const c = config[level as keyof typeof config];
  if (!c) return null;
  return <Badge className={cn("text-xs", c.className)}>{c.label}</Badge>;
}

export default function Chat() {
  const params = useParams<{ id?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>(
    params.id ? parseInt(params.id) : undefined
  );
  const [currentRisk, setCurrentRisk] = useState<string | null>(null);

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setCurrentRisk(data.riskLevel);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    },
  });

  // Load existing conversation messages
  const { data: existingMessages } = trpc.chat.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId && messages.length === 0 }
  );

  if (existingMessages && messages.length === 0 && existingMessages.length > 0) {
    setMessages(existingMessages.filter(m => m.role !== "system").map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })));
  }

  const handleSend = (content: string) => {
    setMessages(prev => [...prev, { role: "user", content }]);
    sendMutation.mutate({ conversationId, message: content });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">ADAM</span> Chat
            </h1>
            <p className="text-sm text-muted-foreground">Assistente civico di Acqui Terme</p>
          </div>
          {currentRisk && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Livello:</span>
              <RiskBadge level={currentRisk} />
            </div>
          )}
        </div>

        <AIChatBox
          messages={messages}
          onSendMessage={handleSend}
          isLoading={sendMutation.isPending}
          placeholder="Chiedi ad ADAM informazioni su Acqui Terme..."
          height="calc(100vh - 200px)"
          emptyStateMessage="Ciao! Sono ADAM, l'assistente civico di Acqui Terme. Come posso aiutarti?"
          suggestedPrompts={[
            "Quali sono gli orari dell'anagrafe?",
            "Come arrivo alle terme?",
            "Dove posso parcheggiare in centro?",
            "Quali eventi ci sono questo mese?",
          ]}
        />
      </main>
    </div>
  );
}
