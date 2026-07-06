import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import CosmicNebula, { type NebulaState } from "@/components/CosmicNebula";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  MessageSquare, Map, Shield, BarChart3, Clock, Zap,
  Send, Mic, MicOff, Volume2, ArrowRight, Activity,
  Users, FileText, Globe
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [nebulaState, setNebulaState] = useState<NebulaState>("idle");
  const [inputText, setInputText] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const recognitionRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Stats query
  const { data: stats } = trpc.analytics.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Gemini TTS mutation
  const speakMutation = trpc.chat.speak.useMutation({
    onSuccess: (data) => {
      if (data.audio) {
        playGeminiAudio(data.audio);
      } else {
        console.warn("[Gemini TTS] Audio non disponibile");
      }
    },
    onError: (err) => {
      console.warn("[Gemini TTS] Errore:", err.message);
    },
  });

  // Audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playGeminiAudio = (base64Audio: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) float32Array[i] = int16Array[i] / 32768.0;

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      if (currentSourceRef.current) try { currentSourceRef.current.stop(); } catch {}
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      source.start();
    } catch (e) {
      console.warn("[Gemini TTS] Playback error:", e);
    }
  };

  // Chat mutation
  const sendMutation = trpc.chat.send.useMutation({
    onMutate: () => {
      setNebulaState("thinking");
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setLastResponse(data.message);
      // Map response type + risk level to nebula color
      const responseTypeToColor: Record<string, NebulaState> = {
        informative: "blue",
        empathetic: "pink",
        creative: "indigo",
        navigational: "teal",
        important: "gold",
        neutral: "white",
      };
      const riskToColor: Record<string, NebulaState> = {
        green: "green",
        yellow: "yellow",
        red: "red",
      };
      // Priority: red/yellow risk overrides response type
      let nebulaColor: NebulaState;
      if (data.riskLevel === "red") {
        nebulaColor = "red";
      } else if (data.riskLevel === "yellow") {
        nebulaColor = "yellow";
      } else if (data.responseType && responseTypeToColor[data.responseType]) {
        nebulaColor = responseTypeToColor[data.responseType];
      } else {
        nebulaColor = "green";
      }
      setNebulaState(nebulaColor);
      // Auto-speak with Gemini TTS
      if (data.message) {
        const cleanText = data.message.replace(/\*\*(.*?)\*\*/g, "$1").replace(/#{1,6}\s/g, "").replace(/\[.*?\]\(.*?\)/g, "").slice(0, 2000);
        speakMutation.mutate({ text: cleanText });
      }
      // Reset to idle after 10 seconds
      setTimeout(() => setNebulaState("idle"), 10000);
    },
    onError: () => {
      setNebulaState("orange");
      setTimeout(() => setNebulaState("idle"), 4000);
    },
  });

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice input
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => { setIsListening(true); setNebulaState("purple"); };
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setInputText(transcript);
    };
    recognition.onend = () => { setIsListening(false); if (!sendMutation.isPending) setNebulaState("idle"); };
    recognition.onerror = () => { setIsListening(false); setNebulaState("idle"); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    sendMutation.mutate({ conversationId, message: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInstantLogin = () => { window.location.href = getLoginUrl(); };

  const timeStr = currentTime.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = currentTime.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();

  return (
    <div className="min-h-screen bg-[#030310] text-white overflow-hidden relative">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(0,220,220,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,220,0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-[0.15em] text-primary font-mono">A.D.A.M.</h1>
          <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
            Acqui Digital Administrative Mesh
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Status indicators */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              CORE
            </span>
            <span>·</span>
            <span>ONLINE</span>
            <span>·</span>
            <span>ALIVE</span>
          </div>
          {/* Clock */}
          <div className="text-right font-mono">
            <div className="text-xl text-white/90 tracking-wider">{timeStr}</div>
            <div className="text-[9px] text-white/30 tracking-widest">{dateStr}</div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-65px)]">
        {/* Left Panel - Stats */}
        <aside className="w-64 border-r border-white/5 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">
            System Vitals
          </div>

          {isAuthenticated && stats ? (
            <>
              <StatCard icon={<MessageSquare className="h-3 w-3" />} label="Conversazioni" value={stats.totalConversations?.toString() || "0"} />
              <StatCard icon={<Users className="h-3 w-3" />} label="Nodi Attivi" value={stats.totalNodes?.toString() || "0"} />
              <StatCard icon={<Shield className="h-3 w-3" />} label="Escalation" value={stats.pendingEscalations?.toString() || "0"} trend={(stats.pendingEscalations ?? 0) > 0 ? "alert" : "ok"} />
              <StatCard icon={<FileText className="h-3 w-3" />} label="Knowledge Base" value={stats.knowledgeEntries?.toString() || "0"} />
              <StatCard icon={<Activity className="h-3 w-3" />} label="Messaggi Oggi" value={stats.todayMessages?.toString() || "0"} />
              <StatCard icon={<Globe className="h-3 w-3" />} label="Ultimo Crawl" value={stats.lastCrawl || "Mai"} />
            </>
          ) : (
            <>
              <StatCard icon={<Activity className="h-3 w-3" />} label="Stato" value="ATTIVO" trend="ok" />
              <StatCard icon={<Globe className="h-3 w-3" />} label="Copertura" value="Acqui Terme" />
              <StatCard icon={<Users className="h-3 w-3" />} label="Servizi" value="2300+" />
            </>
          )}

          {/* Quick nav */}
          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">
              Navigazione
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <NavBtn href="/chat" icon={<MessageSquare className="h-3 w-3" />} label="Chat" />
              <NavBtn href="/map" icon={<Map className="h-3 w-3" />} label="Mappa" />
              <NavBtn href="/history" icon={<Clock className="h-3 w-3" />} label="Storico" />
              <NavBtn href="/dashboard" icon={<BarChart3 className="h-3 w-3" />} label="Analytics" />
            </div>
          </div>
        </aside>

        {/* Center - Nebula */}
        <main className="flex-1 flex flex-col items-center justify-center relative">
          <CosmicNebula state={nebulaState} size={420} />

          {/* Response text below nebula */}
          {lastResponse && (
            <div className="absolute bottom-44 left-1/2 -translate-x-1/2 max-w-lg text-center px-6">
              <p className="text-sm text-white/60 font-mono line-clamp-3 leading-relaxed">
                {lastResponse.slice(0, 200)}{lastResponse.length > 200 ? "..." : ""}
              </p>
            </div>
          )}

          {/* Suggested questions */}
          {!lastResponse && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Cos'è La Bollente?",
                  "Dove mangio stasera?",
                  "Parlami in dialetto acquese",
                  "Cosa visitare ad Acqui?",
                  "Orari ufficio anagrafe",
                  "Raccontami la storia romana",
                  "Che vino mi consigli?",
                  "Eventi di questo mese",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                      setInputText(q); setTimeout(() => { sendMutation.mutate({ conversationId, message: q }); }, 100);
                    }}
                    disabled={sendMutation.isPending}
                    className="px-3 py-1.5 text-[11px] font-mono text-white/50 border border-white/10 rounded-full hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {lastResponse && isAuthenticated && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <button
                onClick={() => setLastResponse("")}
                className="px-3 py-1.5 text-[10px] font-mono text-white/30 border border-white/5 rounded-full hover:border-primary/30 hover:text-primary/60 transition-all"
              >
                ↺ Altre domande
              </button>
            </div>
          )}

          {/* Input bar at bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-full transition-all ${isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-white/40 hover:text-primary"}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Sto ascoltando..." : "Parla con ADAM..."}
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 focus:outline-none font-mono"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="p-2 rounded-full text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleInstantLogin}
                className="w-full flex items-center justify-center gap-3 bg-primary/10 border border-primary/30 rounded-full px-6 py-3 text-primary hover:bg-primary/20 transition-all font-mono text-sm"
              >
                <Zap className="h-4 w-4" />
                Entra in ADAM — 1 Click
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </main>

        {/* Right Panel - Commands & Info */}
        <aside className="w-64 border-l border-white/5 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">
            Command Deck
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <CmdBtn label="Chat" onClick={() => window.location.href = "/chat"} />
            <CmdBtn label="Mappa" onClick={() => window.location.href = "/map"} />
            <CmdBtn label="Nodi" onClick={() => window.location.href = "/admin/nodes"} />
            <CmdBtn label="Escalation" onClick={() => window.location.href = "/escalations"} />
            <CmdBtn label="Analytics" onClick={() => window.location.href = "/dashboard"} />
            <CmdBtn label="Knowledge" onClick={() => window.location.href = "/admin/knowledge"} />
            <CmdBtn label="Settings" onClick={() => window.location.href = "/admin/settings"} />
          </div>

          {/* Color legend */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">
              Spettro Risposte
            </div>
            <div className="space-y-1.5">
              <ColorLegend color="rgb(0, 220, 220)" label="In Ascolto" />
              <ColorLegend color="rgb(160, 100, 255)" label="Elaborazione" />
              <ColorLegend color="rgb(60, 140, 255)" label="Informativo" />
              <ColorLegend color="rgb(0, 255, 120)" label="Risposta Sicura" />
              <ColorLegend color="rgb(255, 210, 0)" label="Verifica Necessaria" />
              <ColorLegend color="rgb(255, 140, 30)" label="Attenzione" />
              <ColorLegend color="rgb(255, 50, 50)" label="Escalation" />
              <ColorLegend color="rgb(255, 100, 180)" label="Empatico" />
              <ColorLegend color="rgb(100, 60, 220)" label="Creativo" />
              <ColorLegend color="rgb(255, 200, 50)" label="Importante" />
            </div>
          </div>

          {/* User info */}
          {isAuthenticated && user && (
            <div className="mt-auto pt-4 border-t border-white/5">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">
                Operatore
              </div>
              <p className="text-xs font-mono text-primary">{user.name}</p>
              <p className="text-[10px] font-mono text-white/30">{user.email}</p>
              <p className="text-[10px] font-mono text-white/20 mt-1">Ruolo: {user.role?.toUpperCase()}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend?: "ok" | "alert" }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white/30">{icon}</span>
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{label}</span>
        {trend === "alert" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
        {trend === "ok" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
      </div>
      <p className="text-lg font-bold font-mono text-white/90">{value}</p>
    </div>
  );
}

function NavBtn({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href}>
      <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-mono text-white/50 hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20">
        {icon}
        {label}
      </button>
    </Link>
  );
}

function CmdBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1.5 rounded text-[10px] font-mono text-white/50 hover:text-primary hover:bg-primary/5 transition-all border border-white/5 hover:border-primary/30"
    >
      › {label}
    </button>
  );
}

function ColorLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-[10px] font-mono text-white/40">{label}</span>
    </div>
  );
}
