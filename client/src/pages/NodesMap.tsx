import Navbar from "@/components/Navbar";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Landmark, Users, Wrench, Phone, Mail, Globe, Clock, X } from "lucide-react";

const nodeTypeConfig = {
  institutional: { label: "Istituzionale", icon: Building2, color: "#22d3ee" },
  commercial: { label: "Commerciale", icon: Store, color: "#4ade80" },
  tourism: { label: "Turismo", icon: Landmark, color: "#f59e0b" },
  association: { label: "Associazione", icon: Users, color: "#a78bfa" },
  services: { label: "Servizi", icon: Wrench, color: "#f472b6" },
};

export default function NodesMap() {
  const { data: nodes } = trpc.nodes.list.useQuery({});
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const filteredNodes = nodes?.filter(n => !filter || n.type === filter) ?? [];

  const handleMapReady = (map: google.maps.Map) => {
    if (!filteredNodes.length) return;

    filteredNodes.forEach(node => {
      if (!node.lat || !node.lng) return;
      const config = nodeTypeConfig[node.type as keyof typeof nodeTypeConfig];
      
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(node.lat), lng: parseFloat(node.lng) },
        map,
        title: node.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: config?.color ?? "#22d3ee",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 10,
        },
      });

      marker.addListener("click", () => setSelectedNode(node));
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* Filters */}
        <div className="container py-3 flex items-center gap-2 flex-wrap">
          <Button
            variant={filter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(null)}
            className="text-xs"
          >
            Tutti ({nodes?.length ?? 0})
          </Button>
          {Object.entries(nodeTypeConfig).map(([key, cfg]) => {
            const count = nodes?.filter(n => n.type === key).length ?? 0;
            return (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key)}
                className="text-xs gap-1"
              >
                <cfg.icon className="h-3 w-3" />
                {cfg.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            initialCenter={{ lat: 44.6747, lng: 8.4696 }}
            initialZoom={14}
            onMapReady={handleMapReady}
          />

          {/* Node detail panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 w-80 z-10">
              <Card className="bg-card/95 backdrop-blur border-border">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{selectedNode.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {nodeTypeConfig[selectedNode.type as keyof typeof nodeTypeConfig]?.label}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {selectedNode.description && (
                    <p className="text-muted-foreground">{selectedNode.description}</p>
                  )}
                  {selectedNode.address && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span>{selectedNode.address}</span>
                    </div>
                  )}
                  {selectedNode.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{selectedNode.phone}</span>
                    </div>
                  )}
                  {selectedNode.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{selectedNode.email}</span>
                    </div>
                  )}
                  {selectedNode.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <a href={selectedNode.website} target="_blank" className="text-primary hover:underline">
                        Sito web
                      </a>
                    </div>
                  )}
                  {selectedNode.hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <span>{typeof selectedNode.hours === "string" ? selectedNode.hours : JSON.stringify(selectedNode.hours)}</span>
                    </div>
                  )}
                  <div className="pt-1">
                    <Badge variant={selectedNode.trustLevel === "verified" ? "default" : "outline"} className="text-xs">
                      {selectedNode.trustLevel === "verified" ? "✓ Verificato" : selectedNode.trustLevel === "pending" ? "In attesa" : "Sospeso"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
