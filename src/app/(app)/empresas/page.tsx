"use client";

import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { createCompany } from "./actions";

const companySchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  slug: z.string().min(3, "Slug é obrigatório").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export default function EmpresasPage() {
  const { companies, currentCompany, setCurrentCompany } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", slug: "", email: "", phone: "" },
  });

  async function onSubmit(data: z.infer<typeof companySchema>) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("slug", data.slug);
    formData.append("email", data.email || "");
    formData.append("phone", data.phone || "");
    const res = await createCompany({}, formData);
    if (!res.error) {
      form.reset();
      setIsCreating(false);
    } else {
      // eslint-disable-next-line no-console
      console.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie as empresas (clientes) para as quais você atua como secretária remota.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4" /> Nova empresa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.length > 0 ? (
          companies.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer group border-secjessica-100/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-secjessica-600" />
                  <CardTitle className="flex items-center gap-2">
                    {c.name}
                    {currentCompany?.id === c.id && (
                      <span className="text-xs bg-secjessica-100 text-secjessica-700 rounded-full px-2 py-0.5">Ativa</span>
                    )}
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">{c.slug}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">E-mail:</span> {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Telefone:</span> {c.phone}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Link
                    href={`/empresas/${c.id}`}
                    className="flex-1 py-2 text-center text-sm font-medium text-secjessica-600 hover:bg-secjessica-50 rounded-md"
                  >
                    Abrir painel
                  </Link>
                  <button
                    onClick={() => setCurrentCompany(c)}
                    className="flex-1 py-2 text-center text-sm font-medium text-muted-foreground hover:bg-secondary rounded-md"
                  >
                    Selecionar
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
              <Button onClick={() => setIsCreating(true)} className="mt-4">
                Criar primeira empresa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {isCreating && (
        <Card className="max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>Nova empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-full">
                  <Label>Nome da empresa</Label>
                  <Input {...form.register("name")} placeholder="Ex: Clínica de Psicologia" required />
                </div>
                <div className="col-span-full">
                  <Label>Slug (identificador único)</Label>
                  <Input {...form.register("slug")} placeholder="ex: clinica-psicologia" required />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input {...form.register("email")} type="email" placeholder="contato@empresa.com.br" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input {...form.register("phone")} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar empresa</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
