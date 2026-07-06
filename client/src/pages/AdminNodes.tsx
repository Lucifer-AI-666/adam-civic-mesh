import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2, Store, Landmark, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const nodeTypeConfig = {
  institutional: { label: "Istituzionale", icon: Building2 },
  commercial: { label: "Commerciale", icon: Store },
  tourism: { label: "Turismo", icon: Landmark },
  association: { label: "Associazione", icon: Users },
  services: { label: "Servizi", icon: Wrench },
};

const emptyForm = {
  name: "", type: "institutional" as string, category: "", description: "",
  address: "", lat: "", lng: "", phone: "", email: "", website: "",
};

export default function AdminNodes() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: nodes, refetch } = trpc.nodes.list.useQuery({}, { enabled: user?.role === "admin" });
  const createMutation = trpc.nodes.create.useMutation({ onSuccess: () => { toast.success("Nodo creato"); refetch(); setDialogOpen(false); resetForm(); } });
  const updateMutation = trpc.nodes.update.useMutation({ onSuccess: () => { toast.success("Nodo aggiornato"); refetch(); setEditDialogOpen(false); } });
  const deleteMutation = trpc.nodes.delete.useMutation({ onSuccess: () => { toast.success("Nodo eliminato"); refetch(); } });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const resetForm = () => setForm(emptyForm);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /></div>;

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Accesso riservato</h1>
          <p className="text-muted-foreground">Solo gli admin possono gestire i nodi civici.</p>
          {!isAuthenticated && <a href={getLoginUrl()}><Button className="mt-4">Accedi</Button></a>}
        </main>
      </div>
    );
  }

  const handleCreate = () => {
    if (!form.name) { toast.error("Il nome è obbligatorio"); return; }
    createMutation.mutate(form as any);
  };

  const handleEdit = (node: any) => {
    setEditingId(node.id);
    setEditForm({
      name: node.name || "",
      type: node.type || "institutional",
      category: node.category || "",
      description: node.description || "",
      address: node.address || "",
      lat: node.lat || "",
      lng: node.lng || "",
      phone: node.phone || "",
      email: node.email || "",
      website: node.website || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId || !editForm.name) { toast.error("Il nome è obbligatorio"); return; }
    updateMutation.mutate({ id: editingId, data: editForm as any });
  };

  const NodeFormFields = ({ f, setF }: { f: typeof emptyForm; setF: (v: typeof emptyForm) => void }) => (
    <div className="space-y-3">
      <div>
        <Label>Nome *</Label>
        <Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Nome del nodo" />
      </div>
      <div>
        <Label>Tipo</Label>
        <Select value={f.type} onValueChange={v => setF({ ...f, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(nodeTypeConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Categoria</Label>
        <Input value={f.category} onChange={e => setF({ ...f, category: e.target.value })} placeholder="es. Uffici, Ristoranti..." />
      </div>
      <div>
        <Label>Descrizione</Label>
        <Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      </div>
      <div>
        <Label>Indirizzo</Label>
        <Input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Latitudine</Label>
          <Input value={f.lat} onChange={e => setF({ ...f, lat: e.target.value })} placeholder="44.6747" />
        </div>
        <div>
          <Label>Longitudine</Label>
          <Input value={f.lng} onChange={e => setF({ ...f, lng: e.target.value })} placeholder="8.4696" />
        </div>
      </div>
      <div>
        <Label>Telefono</Label>
        <Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
      </div>
      <div>
        <Label>Sito Web</Label>
        <Input value={f.website} onChange={e => setF({ ...f, website: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Gestione</span> Nodi Civici
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Nuovo Nodo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Nodo</DialogTitle>
              </DialogHeader>
              <NodeFormFields f={form} setF={setForm} />
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full mt-3">
                {createMutation.isPending ? "Creazione..." : "Crea Nodo"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Nodo</DialogTitle>
            </DialogHeader>
            <NodeFormFields f={editForm} setF={setEditForm} />
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full mt-3">
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          {nodes?.map(node => {
            const cfg = nodeTypeConfig[node.type as keyof typeof nodeTypeConfig];
            const Icon = cfg?.icon ?? Building2;
            return (
              <Card key={node.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{node.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{cfg?.label}</Badge>
                        {node.address && <span>{node.address}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={node.trustLevel === "verified" ? "default" : "outline"} className="text-xs">
                      {node.trustLevel === "verified" ? "Verificato" : node.trustLevel === "pending" ? "In attesa" : "Sospeso"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(node)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm("Eliminare questo nodo?")) deleteMutation.mutate({ id: node.id }); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {nodes?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nessun nodo civico registrato. Crea il primo!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
