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
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, Building2, User } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export default function ConfiguracoesPage() {
  const { profile, currentCompany, updateProfile, companies, setCurrentCompany } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "" },
  });

  async function onSubmit(data: z.infer<typeof profileSchema>) {
    const res = await updateProfile(data);
    if (!res.error) {
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
    } else {
      toast({ title: "Erro", description: res.error?.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências da conta.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-input pb-2">
        {["perfil", "empresa"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-secjessica-600 text-secjessica-600"
                : "border-transparent text-muted-foreground hover:text-secjessica-900"
            }`}
          >
            {tab === "perfil" ? <User className="h-4 w-4 mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}{tab === "perfil" ? "Meu perfil" : "Minha empresa"}
          </button>
        ))}
      </div>

      {activeTab === "perfil" ? (
        <Card>
          <CardHeader>
            <CardTitle>Meu perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input {...form.register("full_name")} placeholder="Vitor Hugo" required className="bg-transparent" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input {...form.register("email")} type="email" placeholder="seu@email.com" className="bg-transparent" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input {...form.register("phone")} placeholder="(11) 99999-9999" className="bg-transparent" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-secjessica-600 hover:bg-secjessica-500">Salvar alterações</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Minha empresa</CardTitle>
          </CardHeader>
          <CardContent className="max-w-md">
            <p className="text-sm text-muted-foreground mb-4">Empresa atualmente selecionada:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-input bg-background">
                <Building2 className="h-5 w-5 text-secjessica-600" />
                <div>
                  <div className="font-medium">{currentCompany?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{currentCompany?.slug ?? "—"}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {companies.map((c) => (
                  <Button
                    key={c.id}
                    onClick={() => setCurrentCompany(c)}
                    variant={currentCompany?.id === c.id ? "default" : "outline"}
                    size="sm"
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
