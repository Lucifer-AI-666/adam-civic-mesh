import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { MessageSquare, Map, Shield, BarChart3, BookOpen, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const handleInstantLogin = () => {
    window.location.href = getLoginUrl();
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Chat AI Civica",
      description: "Risposte immediate basate su fonti verificate del Comune di Acqui Terme. Classificazione automatica verde/giallo/rosso.",
    },
    {
      icon: Map,
      title: "Mappa Nodi Civici",
      description: "Uffici, attività commerciali, punti turistici e associazioni geolocalizzati con filtri e dettagli in tempo reale.",
    },
    {
      icon: Shield,
      title: "Escalation Intelligente",
      description: "Le richieste complesse vengono automaticamente instradate a operatori umani con contesto completo della conversazione.",
    },
    {
      icon: BarChart3,
      title: "Analytics Predittive",
      description: "Dashboard con trend, distribuzione rischio e metriche per ottimizzare i servizi territoriali.",
    },
    {
      icon: BookOpen,
      title: "Knowledge Base Verificata",
      description: "Alimentata esclusivamente da fonti ufficiali del Comune, aggiornata automaticamente tramite crawling.",
    },
    {
      icon: Zap,
      title: "Mesh Distribuita",
      description: "Architettura a nodi civici replicabile. Il Modello Acqui come standard per la digitalizzazione dei servizi pubblici.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8">
          <Zap className="h-3.5 w-3.5" />
          Infrastruttura Civica Agentica
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary mb-4">
          ADAM
        </h1>
        <p className="text-xl text-muted-foreground mb-2">Acqui Digital Administrative Mesh</p>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
          L'assistente civico intelligente che collega Comune, cittadini, turismo e attività economiche di Acqui Terme attraverso una rete digitale distribuita.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/chat">
            <Button size="lg" className="gap-2 font-semibold px-8">
              <MessageSquare className="h-4 w-4" />
              Parla con ADAM
            </Button>
          </Link>
          <Link href="/map">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              <Map className="h-4 w-4" />
              Esplora la Mappa
            </Button>
          </Link>
        </div>

        {/* One-click login CTA */}
        {!isAuthenticated && (
          <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              Accedi in un click per sbloccare storico, analytics e gestione nodi
            </p>
            <Button
              size="lg"
              variant="default"
              className="gap-2 font-bold w-full text-base"
              onClick={handleInstantLogin}
            >
              <Zap className="h-5 w-5" />
              Entra Subito — 1 Click
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
              Zero form, zero attesa. Accesso istantaneo con il tuo account.
            </p>
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-8 text-sm text-muted-foreground">
            Ciao <span className="text-primary font-medium">{user?.name || "Utente"}</span> — sei dentro!
          </div>
        )}
      </section>

      {/* Features */}
      <section className="container pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <feature.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-xs text-muted-foreground">
          <p>ADAM — Acqui Digital Administrative Mesh</p>
          <p className="mt-1 opacity-70">Infrastruttura civica agentica per Acqui Terme — Modulo di Diboraculum Hub</p>
        </div>
      </footer>
    </div>
  );
}
