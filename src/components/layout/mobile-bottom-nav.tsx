"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings } from "lucide-react";

const bottomNavItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-3 pb-4 pt-3">
      <div className="flex justify-around items-center">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium rounded-md transition-colors"
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-secjessica-600" : "text-muted-foreground hover:text-secjessica-600"
                }`}
              />
              <span className={`${isActive ? "text-secjessica-600" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
