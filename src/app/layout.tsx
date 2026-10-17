import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/components/ui/use-toast";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecJessica - Gestão de Secretária Remota",
  description: "Sistema multi-empresa para secretária remota integrado ao Google Agenda",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} ${playfairDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
