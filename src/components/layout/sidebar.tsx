"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BrandLogo } from "@/components/brand-logo";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  Calendar,
  Settings,
  LogOut,
  Clock,
  Mail as MailIcon,
  FileText,
  Bell,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/onboarding", label: "Nova Empresa", icon: CheckCircle2 },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/contatos", label: "Contatos", icon: UserPlus },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/agenda/google", label: "Google Agenda", icon: MailIcon },
  { href: "/tarefas", label: "Tarefas", icon: Clock },
  { href: "/comunicacao", label: "Comunicação", icon: MailIcon },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/ajuda", label: "Central de Ajuda", icon: HelpCircle },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const { currentCompany, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-card flex flex-col shadow-sm">
      <div className="flex items-center px-6 py-4 border-b border-border/50">
        <BrandLogo size="sm" showText={true} href="/dashboard" />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-secjessica-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-secjessica-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-secjessica-600"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border bg-secondary/30">
        <div className="px-2 py-2 mb-2 rounded-lg bg-card border border-input/60">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Empresa Ativa</p>
          <p className="text-sm font-semibold text-secjessica-900 truncate">
            {currentCompany?.name ?? "Nenhuma empresa"}
          </p>
          <p className="text-xs text-muted-foreground truncate">{currentCompany?.slug ?? "—"}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut className="h-4 w-4" /> Desconectar
        </button>
      </div>
    </aside>
  );
}
