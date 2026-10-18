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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createMessageTemplate, listMessageTemplates } from "@/features/integrations/actions";
import { Mail, MessageSquare, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const KINDS = [
  { value: "confirmation", label: "Confirmação de agendamento" },
  { value: "reminder", label: "Lembrete prévio" },
  { value: "reschedule", label: "Reagendamento" },
  { value: "cancellation", label: "Aviso de cancelamento" },
  { value: "welcome", label: "Boas-vindas" },
  { value: "thank_you", label: "Agradecimento pós-atendimento" },
];

const templateSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  kind: z.string().min(1, "Tipo é obrigatório"),
  subject: z.string().optional(),
  body: z.string().min(5, "Corpo é obrigatório"),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function ComunicacaoPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", kind: "confirmation", subject: "", body: "" },
  });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadTemplates = useCallback(async () => {
    if (!currentCompany?.id) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await listMessageTemplates(currentCompany.id);
    if (!res.error && res.data) {
      setTemplates(res.data);
    }
    setLoading(false);
  }, [currentCompany?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplates();
  }, [loadTemplates]);

  async function onSubmit(data: TemplateFormData) {
    if (!currentCompany?.id) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("kind", data.kind);
    formData.append("subject", data.subject || "");
    formData.append("body", data.body);

    const res = await createMessageTemplate(currentCompany.id, {}, formData);
    setSaving(false);
    if (!res.error) {
      form.reset({ name: "", kind: "confirmation", subject: "", body: "" });
      setOpen(false);
      await loadTemplates();
      toast({ title: "Modelo salvo", description: "O modelo de mensagem foi cadastrado." });
    } else {
      toast({
        title: "Erro",
        description: typeof res.error === "string" ? res.error : "Verifique os dados",
        variant: "destructive",
      });
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando modelos…</div>;
  }

  if (!currentCompany) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-input">
        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Nenhuma empresa selecionada</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione uma empresa para gerenciar seus modelos de mensagem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Comunicação</h1>
          <p className="text-muted-foreground">
            Modelos de mensagem prontos para WhatsApp e e-mail da empresa <span className="font-semibold text-secjessica-700">{currentCompany.name}</span>.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
              <Mail className="h-4 w-4 mr-1" /> Novo modelo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CardHeader className="px-0 pt-0">
              <CardTitle>Novo modelo de mensagem</CardTitle>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Nome do modelo</Label>
                <Input {...form.register("name")} placeholder="Ex: Confirmação de consulta pelo WhatsApp" required />
              </div>
              <div>
                <Label>Tipo de mensagem</Label>
                <select
                  {...form.register("kind")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Assunto (opcional para e-mail)</Label>
                <Input {...form.register("subject")} placeholder="Ex: Confirmação do seu agendamento" />
              </div>
              <div>
                <Label>Corpo da mensagem</Label>
                <Textarea
                  {...form.register("body")}
                  rows={4}
                  placeholder="Olá {{nome}}, confirmamos seu agendamento para o dia {{data}} às {{hora}}. Local: {{empresa}}."
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                Variáveis que serão substituídas: <code className="text-secjessica-700">{"{{nome}}"}</code>, <code className="text-secjessica-700">{"{{data}}"}</code>, <code className="text-secjessica-700">{"{{hora}}"}</code>, <code className="text-secjessica-700">{"{{empresa}}"}</code>
              </p>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
                  {saving ? "Salvando…" : "Salvar modelo"}
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
                <th className="p-4">Tipo</th>
                <th className="p-4">Mensagem prévia</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-input/50 hover:bg-secondary/40 transition-colors">
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4 text-muted-foreground">
                    {KINDS.find((k) => k.value === t.kind)?.label ?? t.kind}
                  </td>
                  <td className="p-4 text-muted-foreground max-w-md truncate">{t.body}</td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(t.body)}
                      className="h-8 px-2 text-secjessica-600 hover:text-secjessica-700 hover:bg-secjessica-50"
                      title="Copiar texto"
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum modelo de mensagem cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {KINDS.map((k) => (
          <Card key={k.value} className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-secjessica-600" />
                <span className="text-sm font-semibold">{k.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Padronize os comunicados com seus clientes e pacientes.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
