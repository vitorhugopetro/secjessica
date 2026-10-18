/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Mail, Clock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createFirstOrganization } from "@/features/organizations/actions";

const SEGMENTS = [
  { value: "psicologia", label: "Psicologia / Psicanálise" },
  { value: "odontologia", label: "Odontologia / Clínica Dental" },
  { value: "medicina", label: "Clínica Médica / Consultório" },
  { value: "advocacia", label: "Escritório de Advocacia" },
  { value: "educacao", label: "Escola / Treinamentos" },
  { value: "servicos", label: "Prestadores de Serviços / Autônomo" },
];

const schema = z.object({
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  slug: z.string().min(3, "Slug é obrigatório").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().min(1, "Fuso horário é obrigatório"),
  segment: z.string().min(1, "Escolha um segmento"),
});

type OnboardingFormData = z.infer<typeof schema>;

const STEPS = [
  { id: "identificacao", label: "Identificação", icon: Building2 },
  { id: "segmento", label: "Segmento", icon: Users },
  { id: "contato", label: "Contato", icon: Mail },
  { id: "revisao", label: "Revisão e Criação", icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const { setCurrentCompany } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<any>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      timezone: "America/Sao_Paulo",
      segment: "psicologia",
    },
  });

  const values = form.watch();
  const currentStep = STEPS[stepIndex];

  async function handleFinalSubmit() {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({ title: "Atenção", description: "Preencha todos os campos obrigatórios antes de continuar.", variant: "destructive" });
      return;
    }

    const data = form.getValues();
    setLoading(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("slug", data.slug);
    formData.append("email", data.email || "");
    formData.append("phone", data.phone || "");
    formData.append("address", data.address || "");
    formData.append("timezone", data.timezone);
    formData.append("segment", data.segment);

    const res = await createFirstOrganization({}, formData);
    setLoading(false);
    if (!res.error && res.data) {
      setCreatedOrg(res.data);
      setCurrentCompany(res.data);
      toast({ title: "Empresa criada com sucesso!", description: `${data.name} agora está ativa no painel.` });
    } else {
      toast({
        title: "Erro ao criar empresa",
        description: typeof res.error === "string" ? res.error : "Verifique os dados informados.",
        variant: "destructive",
      });
    }
  }

  if (createdOrg) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-10">
        <Card className="text-center p-8 bg-card border-secjessica-200 shadow-md">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-secjessica-900">Empresa Configurada!</CardTitle>
          <CardDescription className="mt-2 text-base">
            A empresa <span className="font-semibold text-secjessica-800">{createdOrg.name}</span> foi cadastrada com sucesso.
          </CardDescription>
          <div className="flex justify-center gap-3 mt-8">
            <Button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="bg-secjessica-600 hover:bg-secjessica-500 text-white px-6"
            >
              Ir para o Painel da Empresa <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Nova Empresa Contratante</h1>
          <p className="text-muted-foreground">Assistente de integração de clientes da secretária remota.</p>
        </div>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              disabled={i > stepIndex}
              onClick={() => setStepIndex(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === stepIndex
                  ? "bg-secjessica-600 text-white shadow-sm"
                  : i < stepIndex
                  ? "bg-secjessica-100 text-secjessica-800"
                  : "bg-secondary text-muted-foreground opacity-60"
              }`}
            >
              <s.icon className="h-3.5 w-3.5" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-card shadow-sm border-input">
        <CardHeader>
          <CardTitle className="text-lg">{currentStep.label}</CardTitle>
          <CardDescription>Etapa {stepIndex + 1} de {STEPS.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {stepIndex === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Nome da empresa / consultório</Label>
                <Input
                  {...form.register("name")}
                  placeholder="Ex: Consultório de Psicologia Dra. Paula"
                  onChange={(e) => {
                    form.setValue("name", e.target.value);
                    if (!form.getValues("slug")) {
                      const autoSlug = e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "");
                      form.setValue("slug", autoSlug);
                    }
                  }}
                  required
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label>Identificador único (slug)</Label>
                <Input {...form.register("slug")} placeholder="ex: consultorio-dra-paula" required />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Usado para identificar os registros no sistema.</p>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={async () => {
                    const valid = await form.trigger(["name", "slug"]);
                    if (valid) setStepIndex(1);
                  }}
                  className="bg-secjessica-600 hover:bg-secjessica-500 text-white"
                >
                  Avançar para segmento <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {stepIndex === 1 && (
            <div className="space-y-4">
              <Label>Segmento de atuação da empresa</Label>
              <Select
                defaultValue={values.segment || "psicologia"}
                onValueChange={(val) => form.setValue("segment", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um segmento" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O segmento personaliza os modelos de atendimento, agenda e termos utilizados.
              </p>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStepIndex(0)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => setStepIndex(2)}
                  className="bg-secjessica-600 hover:bg-secjessica-500 text-white"
                >
                  Avançar para contato <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail comercial</Label>
                  <Input {...form.register("email")} type="email" placeholder="contato@empresa.com.br" />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input {...form.register("phone")} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div>
                <Label>Endereço físico</Label>
                <Input {...form.register("address")} placeholder="Av. Paulista, 1000, Bela Vista, São Paulo - SP" />
              </div>
              <div>
                <Label>Fuso horário padrão</Label>
                <Select
                  defaultValue={values.timezone || "America/Sao_Paulo"}
                  onValueChange={(val) => form.setValue("timezone", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fuso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                    <SelectItem value="America/Fernando_de_Noronha">Fernando de Noronha (UTC-2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStepIndex(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => setStepIndex(3)}
                  className="bg-secjessica-600 hover:bg-secjessica-500 text-white"
                >
                  Avançar para revisão <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Revise os dados abaixo antes de confirmar o cadastro da empresa:
              </p>
              <div className="grid gap-2.5 p-4 rounded-xl border border-input bg-secondary/40 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome da empresa:</span>
                  <span className="font-semibold">{values.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug único:</span>
                  <span className="font-mono text-secjessica-800">{values.slug || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segmento:</span>
                  <span className="font-medium">
                    {SEGMENTS.find((s) => s.value === values.segment)?.label ?? values.segment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-mail:</span>
                  <span>{values.email || "Não informado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span>{values.phone || "Não informado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuso horário:</span>
                  <span>{values.timezone}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStepIndex(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSubmit}
                  className="bg-secjessica-600 hover:bg-secjessica-500 text-white font-medium px-6"
                >
                  {loading ? "Cadastrando empresa…" : "Confirmar e Criar Empresa"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
