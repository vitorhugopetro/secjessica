/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { listMembers, inviteMember } from "./actions";

const inviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.string().min(1, "Função é obrigatória"),
});

export default function UsuariosPage() {
  const { currentCompany } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "secretary" },
  });

  useEffect(() => {
    loadMembers();
  }, [currentCompany?.id]);

  async function loadMembers() {
    if (!currentCompany?.id) return;
    setLoading(true);
    const data = await listMembers(currentCompany.id);
    setMembers(data);
    setLoading(false);
  }

  async function onSubmit(data: z.infer<typeof inviteSchema>) {
    if (!currentCompany?.id) return;
    const formData = new FormData();
    formData.append("company_id", currentCompany.id);
    formData.append("email", data.email);
    formData.append("role", data.role);
    const res = await inviteMember({}, formData);
    if (!res.error) {
      form.reset();
      setOpen(false);
      await loadMembers();
    }
  }

  if (loading) return <div className="h-64 flex items-center justify-center">Carregando…</div>;
  if (!currentCompany) return <div className="p-4">Selecione uma empresa primeiro.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Usuários</h1>
          <p className="text-muted-foreground">Equipe da empresa {currentCompany.name}.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Convidar usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Convidar usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label>E-mail</Label>
                    <Input {...form.register("email")} type="email" placeholder="secretaria@empresa.com.br" required />
                  </div>
                  <div>
                    <Label>Função</Label>
                    <SelectRole {...form.register("role")} />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Enviar convite</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-input bg-background shadow-sm">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-secondary text-left text-xs font-semibold text-muted-foreground">
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Função</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-input/50">
                  <td className="p-4 font-medium">{m.profile?.full_name ?? "Usuário"}</td>
                  <td className="p-4 text-muted-foreground">{m.profile?.email ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{m.role}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nenhum usuário convidado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SelectRole({ ...props }: any) {
  return (
    <select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <option value="admin">Administrador</option>
      <option value="secretary">Secretária</option>
    </select>
  );
}
