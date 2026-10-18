import Link from "next/link";
import { Mail, Phone, Calendar, ShieldCheck, MessageSquare, ArrowRight } from "lucide-react";
import { InspirationalBanner } from "@/components/inspirational-banner";

function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/assets/logos/logo_principal.svg"
        alt="Jéssica Secretaria Remota"
        className="h-10 w-auto"
      />
      <div className="flex flex-col">
        <span className="font-playfair font-bold text-secjessica-900 tracking-tight text-xl leading-none">
          SecJessica
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Secretariado Remoto
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Sec Jessica",
        "operatingSystem": "Web, iOS, Android, Windows, macOS",
        "applicationCategory": "BusinessApplication",
        "description": "Plataforma completa de secretariado remoto com WhatsApp inteligente, gestão de agenda médica e multi-tenant.",
        "url": "https://secjessica.web.app",
        "author": {
          "@type": "Person",
          "name": "Vitor Hugo Abreu de Sousa",
          "email": "vitorhugo1@gmail.com"
        }
      },
      {
        "@type": "ProfessionalService",
        "name": "Sec Jessica - Secretariado Remoto & Gestão de Clínicas",
        "description": "Serviços especializados de secretária remota, triagem de pacientes, confirmação de agendamentos e recepção virtual.",
        "telephone": "+55-24-98821-2712",
        "email": "vitorhugo1@gmail.com",
        "areaServed": "BR",
        "url": "https://secjessica.web.app"
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-secjessica-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navbar Superior */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BrandLogo />
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/ajuda"
                className="text-sm font-medium text-muted-foreground hover:text-secjessica-600 transition-colors hidden sm:inline-block"
              >
                Central de Ajuda
              </Link>
              <Link
                href="/entrar"
                className="text-sm font-medium text-muted-foreground hover:text-secjessica-600 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-xs sm:text-sm font-semibold text-white bg-secjessica-600 hover:bg-secjessica-500 px-4 py-2 rounded-full transition-colors shadow-sm"
              >
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-secjessica-600/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 sm:py-16 space-y-12">
          {/* BANNER EM DESTAQUE: VERSÍCULO BÍBLICO E MENSAGEM MOTIVACIONAL DO DIA */}
          <section aria-label="Inspiração e Versículo do Dia" className="w-full">
            <InspirationalBanner className="shadow-md border-secjessica-300/80" />
          </section>

          {/* Seção Principal de Apresentação & Acesso ao Sistema */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-800 text-xs font-semibold mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Plataforma Completa para Secretariado Remoto & WhatsApp
              </div>

              <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-secjessica-900 leading-tight mb-6">
                Gestão de secretária remota<br />
                <span className="text-secjessica-600 italic">com excelência e acolhimento.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Organize compromissos, confirme consultas via WhatsApp, gerencie múltiplos consultórios e empresas com segurança, sigilo profissional e sincronização com Google Agenda em tempo real.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/entrar"
                  className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-secjessica-600 px-6 text-white font-medium transition-all hover:bg-secjessica-500 shadow-md hover:shadow-lg active:scale-95"
                >
                  Acessar Painel <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/cadastro"
                  className="flex h-12 w-full sm:w-auto items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium shadow-sm hover:bg-secondary transition-colors"
                >
                  Cadastrar Nova Empresa
                </Link>
              </div>
            </div>

            {/* Grid de Recursos e Funcionalidades */}
            <div className="flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                <Card className="p-4 hover:border-secjessica-400 transition-all">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="font-playfair font-semibold text-secjessica-950">WhatsApp Integrado</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Disparos em 1 clique, lembretes 24h e auto-confirmação.
                  </p>
                </Card>

                <Card className="p-4 hover:border-secjessica-400 transition-all">
                  <div className="h-9 w-9 rounded-lg bg-secjessica-50 text-secjessica-700 flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-playfair font-semibold text-secjessica-950">Agenda Inteligente</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sincronização bidirecional com Google Agenda.
                  </p>
                </Card>

                <Card className="p-4 hover:border-secjessica-400 transition-all">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="font-playfair font-semibold text-secjessica-950">Clientes & Contatos</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Histórico detalhado de pacientes e contatos das empresas.
                  </p>
                </Card>

                <Card className="p-4 hover:border-secjessica-400 transition-all">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-playfair font-semibold text-secjessica-950">Isolamento Multi-Tenant</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dados 100% isolados por empresa com segurança e LGPD.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Institucional com Créditos do Vitor Hugo */}
      <footer className="border-t border-border bg-background pt-10 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-sm font-medium text-secjessica-900">
            Jéssica Secretaria Remota &middot; Sistema Desenvolvido com Amor e Dedicação por Vitor Hugo Abreu de Sousa
          </p>
          <p className="text-xs text-muted-foreground">
            Suporte e Contato:{" "}
            <a href="mailto:vitorhugo1@gmail.com" className="text-secjessica-600 hover:underline">
              vitorhugo1@gmail.com
            </a>{" "}
            &middot;{" "}
            <a href="tel:+5524988212712" className="text-secjessica-600 hover:underline">
              (24) 98821-2712
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl border border-border bg-background shadow-2xs p-5 " + (className ?? "")}>
      {children}
    </div>
  );
}
