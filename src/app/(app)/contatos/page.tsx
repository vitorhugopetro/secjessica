"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, UserPlus, Download, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createContact, listContacts, deleteContact, exportContactsCSV } from "./actions";
import { listClientsByCompany } from "../clientes/actions";
import { useToast } from "@/components/ui/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  client_id: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company_name: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContatosPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", client_id: "", role: "", email: "", phone: "", whatsapp: "", company_name: "", notes: "" },
  });

  const loadData = useCallback(async () => {
    if (!currentCompany?.id) {
      setContacts([]);
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [csRes, clsRes] = await Promise.all([
      listContacts(currentCompany.id),
      listClientsByCompany(currentCompany.id),
    ]);
    if (!csRes.error && csRes.data) setContacts(csRes.data);
    if (!clsRes.error && clsRes.data) setClients(clsRes.data);
    setLoading(false);
  }, [currentCompany?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function onSubmit(data: ContactFormData) {
    if (!currentCompany?.id) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("client_id", data.client_id || "");
    formData.append("role", data.role || "");
    formData.append("email", data.email || "");
    formData.append("phone", data.phone || "");
    formData.append("whatsapp", data.whatsapp || "");
    formData.append("company_name", data.company_name || "");
    formData.append("notes", data.notes || "");

    const res = await createContact(currentCompany.id, {}, formData);
    setSaving(false);
    if (!res.error) {
      form.reset();
      setOpen(false);
      await loadData();
      toast({ title: "Contato salvo", description: "O contato foi registrado com sucesso." });
    } else {
      toast({
        title: "Erro",
        description: typeof res.error === "string" ? res.error : "Verifique os dados informados",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!currentCompany?.id) return;
    if (!confirm("Tem certeza que deseja excluir este contato?")) return;
    const res = await deleteContact(currentCompany.id, id);
    if (!res.error) {
      await loadData();
      toast({ title: "Excluído", description: "Contato removido com sucesso." });
    } else {
      toast({ title: "Erro ao excluir", description: res.error, variant: "destructive" });
    }
  }

  async function handleExport() {
    if (!currentCompany?.id) return;
    const res = await exportContactsCSV(currentCompany.id);
    if (!res.error && res.data) {
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contatos-${currentCompany.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      toast({ title: "Exportado", description: "Arquivo CSV de contatos gerado com sucesso." });
    }
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando contatos…</div>;
  }

  if (!currentCompany) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-input">
        <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Nenhuma empresa selecionada</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione uma empresa para visualizar e gerenciar seus contatos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Contatos</h1>
          <p className="text-muted-foreground">
            Pessoas-chave e contatos vinculados à empresa <span className="font-semibold text-secjessica-700">{currentCompany.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
                <Plus className="h-4 w-4 mr-1" /> Novo contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Novo contato</CardTitle>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Nome completo</Label>
                  <Input {...form.register("name")} placeholder="Ex: Carlos Oliveira" required />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente vinculado</Label>
                    <Select
                      onValueChange={(val) => form.setValue("client_id", val === "none" ? "" : val)}
                      defaultValue={form.getValues("client_id") || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (avulso)</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Função / Cargo</Label>
                    <Input {...form.register("role")} placeholder="Ex: Secretária, Gerente" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>E-mail</Label>
                    <Input {...form.register("email")} type="email" placeholder="carlos@empresa.com" />
                  </div>
                  <div>
                    <Label>Telefone / WhatsApp</Label>
                    <Input {...form.register("phone")} placeholder="(11) 98888-8888" />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input {...form.register("notes")} placeholder="Observações do contato" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
                    {saving ? "Salvando…" : "Salvar contato"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-input bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-secondary text-left text-xs font-semibold text-muted-foreground">
                <th className="p-4">Nome</th>
                <th className="p-4">Cliente vinculado</th>
                <th className="p-4">Função</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Telefone</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-input/50 hover:bg-secondary/40 transition-colors">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-muted-foreground">{c.client?.name ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{c.role ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">
                    {c.phone || c.whatsapp ? (
                      <div className="flex items-center gap-1.5">
                        <span>{c.whatsapp || c.phone}</span>
                        <a
                          href={`https://wa.me/55${(c.whatsapp || c.phone).replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                          title="Conversar no WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(c.whatsapp || c.phone) && (
                        <a
                          href={`https://wa.me/55${(c.whatsapp || c.phone).replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 inline-flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir contato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum contato cadastrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
