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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createTask, listTasks, listOverdueTasks } from "@/features/tasks/actions";
import { useToast } from "@/components/ui/use-toast";

const taskSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["baixa", "normal", "alta", "urgente"]),
  status: z.enum(["todo", "in_progress", "waiting", "done", "cancelled"]),
  due_at: z.string().optional(),
});

export default function TarefasPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "", category: "", priority: "normal", status: "todo", due_at: "" },
  });

  useEffect(() => {
    loadData();
  }, [currentCompany?.id]);

  async function loadData() {
    if (!currentCompany?.id) return;
    setLoading(true);
    const [ts, od] = await Promise.all([listTasks(currentCompany.id), listOverdueTasks(currentCompany.id)]);
    if (!ts.error) setTasks(ts.data);
    if (!od.error) setOverdue(od.data);
    setLoading(false);
  }

  async function onSubmit(data: z.infer<typeof taskSchema>) {
    if (!currentCompany?.id) return;
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("category", data.category || "");
    formData.append("priority", data.priority);
    formData.append("status", data.status);
    formData.append("due_at", data.due_at || "");
    const res = await createTask(currentCompany.id, {}, formData);
    if (!res.error) {
      form.reset();
      setOpen(false);
      await loadData();
      toast({ title: "Tarefa criada", description: "Sua tarefa foi cadastrada com sucesso." });
    } else {
      toast({
        title: "Erro",
        description: typeof res.error === "string" ? res.error : "Verifique os dados preenchidos",
        variant: "destructive",
      });
    }
  }

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = { baixa: "secondary", normal: "default", alta: "warning", urgente: "destructive" };
    return <Badge variant={(map[p] ?? "outline") as any}>{p}</Badge>;
  };
  const statusBadge = (s: string) => {
    const map: Record<string, string> = { todo: "secondary", in_progress: "default", waiting: "warning", done: "success", cancelled: "destructive" };
    return <Badge variant={(map[s] ?? "outline") as any}>{s}</Badge>;
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Carregando…</div>;
  if (!currentCompany) return <div className="p-4">Selecione uma empresa primeiro.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Tarefas</h1>
          <p className="text-muted-foreground">Gerencie as rotinas administrativas da empresa {currentCompany.name}.</p>
        </div>
        <div className="flex items-center gap-2">
          {overdue.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 text-sm font-medium border border-red-100">
              <Clock className="h-4 w-4" /> {overdue.length} tarefa(s) atrasada(s)
            </div>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Nova tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Nova tarefa</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label>Título</Label>
                      <Input {...form.register("title")} placeholder="Ligar para cliente" required />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea {...form.register("description")} placeholder="Detalhes da tarefa" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Categoria</Label>
                        <Input {...form.register("category")} placeholder="Ex: Financeiro" />
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <Select defaultValue="normal" {...form.register("priority")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Vencimento</Label>
                        <Input {...form.register("due_at")} type="datetime-local" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Salvar tarefa</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Todas as tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-input/50 bg-background/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{t.title}</div>
                    {priorityBadge(t.priority)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.description ?? ""}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {statusBadge(t.status)}
                    {t.due_at && <span className="text-xs text-muted-foreground">{new Date(t.due_at).toLocaleString("pt-BR")}</span>}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div className="text-center text-muted-foreground py-4">Nenhuma tarefa cadastrada.</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdue.map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-red-100 bg-red-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-red-800">{t.title}</div>
                    <Badge variant="destructive">Atrasada</Badge>
                  </div>
                  <div className="text-xs text-red-700">{t.description ?? ""}</div>
                </div>
              ))}
              {overdue.length === 0 && <div className="text-center text-muted-foreground py-4">Sem tarefas atrasadas.</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Concluídas</span>
                <span className="font-medium text-green-600">{tasks.filter((t) => t.status === "done").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pendentes</span>
                <span className="font-medium text-secjessica-600">{tasks.filter((t) => t.status === "todo").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
