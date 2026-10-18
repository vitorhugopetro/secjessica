/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Users, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createClient, listClients, deleteClient } from "./actions";
import { useToast } from "@/components/ui/use-toast";

const clientSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientesPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phone: "", cpf_cnpj: "", notes: "" },
  });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadClients = useCallback(async () => {
    if (!currentCompany?.id) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await listClients(currentCompany.id);
    if (!res.error && res.data) {
      setClients(res.data);
    } else {
      toast({ title: "Aviso", description: res.error || "Erro ao carregar clientes", variant: "destructive" });
    }
    setLoading(false);
  }, [currentCompany?.id, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClients();
  }, [loadClients]);

  async function onSubmit(data: ClientFormData) {
    if (!currentCompany?.id) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email || "");
    formData.append("phone", data.phone || "");
    formData.append("cpf_cnpj", data.cpf_cnpj || "");
    formData.append("notes", data.notes || "");

    const res = await createClient(currentCompany.id, {}, formData);
    setSaving(false);
    if (!res.error) {
      form.reset();
      setOpen(false);
      await loadClients();
      toast({ title: "Cliente salvo", description: "O cliente foi cadastrado com sucesso." });
    } else {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!currentCompany?.id) return;
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    const res = await deleteClient(id, currentCompany.id);
    if (!res.error) {
      await loadClients();
      toast({ title: "Excluído", description: "Cliente removido com sucesso." });
    } else {
      toast({ title: "Erro ao excluir", description: res.error, variant: "destructive" });
    }
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando clientes…</div>;
  }

  if (!currentCompany) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-input">
        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Nenhuma empresa selecionada</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione uma empresa no topo ou na barra lateral para gerenciar os clientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Clientes</h1>
          <p className="text-muted-foreground">
            Clientes e pacientes atendidos pela empresa <span className="font-semibold text-secjessica-700">{currentCompany.name}</span>.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
              <Plus className="h-4 w-4 mr-1" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CardHeader className="px-0 pt-0">
              <CardTitle>Cadastrar novo cliente</CardTitle>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input {...form.register("name")} placeholder="Ex: Maria da Silva" required />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input {...form.register("email")} type="email" placeholder="maria@email.com" />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input {...form.register("phone")} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div>
                <Label>CPF / CNPJ</Label>
                <Input {...form.register("cpf_cnpj")} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label>Observações</Label>
                <Input {...form.register("notes")} placeholder="Informações adicionais do cliente" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
                  {saving ? "Salvando…" : "Salvar cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-input bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-secondary text-left text-xs font-semibold text-muted-foreground">
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Telefone</th>
                <th className="p-4">CPF / CNPJ</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-input/50 hover:bg-secondary/40 transition-colors">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-muted-foreground">{c.email || "—"}</td>
                  <td className="p-4 text-muted-foreground">
                    {c.phone ? (
                      <div className="flex items-center gap-1.5">
                        <span>{c.phone}</span>
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
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
                  <td className="p-4 text-muted-foreground">{c.cpf_cnpj || "—"}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.phone && (
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
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
                        title="Excluir cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum cliente cadastrado para esta empresa. Clique em &quot;Novo cliente&quot; para começar.
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
