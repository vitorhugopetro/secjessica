"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { submitPreAnamnese } from "@/features/whatsapp/actions/anamnese";
import { CheckCircle2, ShieldCheck, HeartPulse, Send, AlertCircle } from "lucide-react";

export default function PreAtendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams?.id || "demo";

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [complaint, setComplaint] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronic, setChronic] = useState("");
  const [meds, setMeds] = useState("");
  const [emergency, setEmergency] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) {
      setError("Por favor, preencha seu nome e telefone para contato.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await submitPreAnamnese({
      appointment_id: appointmentId,
      patient_name: name,
      phone,
      birth_date: birthDate,
      cpf,
      chief_complaint: complaint,
      allergies,
      chronic_diseases: chronic,
      current_medications: meds,
      emergency_contact: emergency,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-secjessica-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-secjessica-200 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-secjessica-900 font-playfair">
              Ficha Enviada com Sucesso!
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Muito obrigado, <strong className="text-foreground">{name}</strong>. Seus dados de pré-atendimento foram recebidos com segurança e já estão no prontuário da nossa equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 text-left space-y-1">
              <p className="font-semibold">✓ Dados criptografados e protegidos (LGPD)</p>
              <p>✓ Chegue com 10 minutos de antecedência ao local da consulta</p>
              <p>✓ Traga documento oficial com foto e exames anteriores se houver</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Sec Jessica — Secretariado Remoto &amp; Gestão Inteligente de Atendimento
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secjessica-50 py-10 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secjessica-100 text-secjessica-800 text-xs font-semibold">
            <HeartPulse className="w-4 h-4 text-secjessica-600" />
            Ficha de Pré-Atendimento e Anamnese
          </div>
          <h1 className="text-3xl font-bold text-secjessica-900 font-playfair tracking-tight">
            Sec Jessica Atendimento
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha seus dados com antecedência para agilizar sua consulta e garantir um atendimento seguro e personalizado.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Card className="border-secjessica-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-secjessica-900">
              Informações Cadastrais e de Saúde
            </CardTitle>
            <CardDescription className="text-xs">
              Tempo estimado de preenchimento: menos de 2 minutos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria dos Santos"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Celular / WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(24) 99999-9999"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-xs font-semibold">
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cpf" className="text-xs font-semibold">
                    CPF (Opcional)
                  </Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="complaint" className="text-xs font-semibold">
                  Motivo da Consulta ou Principais Sintomas
                </Label>
                <Textarea
                  id="complaint"
                  rows={2}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Ex: Consulta de rotina, dores de cabeça frequentes, retorno..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="allergies" className="text-xs font-semibold">
                    Alergias a Medicamentos / Alimentos
                  </Label>
                  <Input
                    id="allergies"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Ex: Penicilina, Dipirona, Nenhuma"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chronic" className="text-xs font-semibold">
                    Comorbidades ou Condições Crônicas
                  </Label>
                  <Input
                    id="chronic"
                    value={chronic}
                    onChange={(e) => setChronic(e.target.value)}
                    placeholder="Ex: Hipertensão, Diabetes, Nenhuma"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meds" className="text-xs font-semibold">
                  Medicamentos de Uso Contínuo
                </Label>
                <Input
                  id="meds"
                  value={meds}
                  onChange={(e) => setMeds(e.target.value)}
                  placeholder="Ex: Losartana 50mg, Insulina, etc."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergency" className="text-xs font-semibold">
                  Contato de Emergência (Nome e Telefone)
                </Label>
                <Input
                  id="emergency"
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  placeholder="Ex: João (Esposo) - (24) 98888-8888"
                />
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secjessica-600 hover:bg-secjessica-500 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Enviando dados com segurança..." : "Enviar Ficha de Pré-Atendimento"}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Seus dados são protegidos conforme a LGPD e usados exclusivamente para seu cuidado médico.</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
