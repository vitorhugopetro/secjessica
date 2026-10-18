"use client";

import { useAuth } from "@/contexts/auth-context";
import { BrandLogo } from "@/components/brand-logo";
import { Bell, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { MobileMenuToggle } from "@/components/layout/sidebar";

interface TopbarProps {
  onOpenMobileDrawer: () => void;
}

export function Topbar({ onOpenMobileDrawer }: TopbarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <MobileMenuToggle onClick={onOpenMobileDrawer} />
          <BrandLogo size="sm" showText={false} href="/dashboard" />
          <span className="font-playfair font-semibold text-secjessica-900 tracking-tight hidden sm:block">Jéssica Secretaria Remota</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative">
              <input
                type="search"
                placeholder="Buscar clientes, contatos, compromissos…"
                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 text-muted-foreground hover:text-secjessica-900" aria-label="Notificações">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-secjessica-600 border-2 border-background" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Novas solicitações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
