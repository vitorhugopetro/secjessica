import type { Metadata, Viewport } from "next";
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secjessica.web.app";

export const viewport: Viewport = {
  themeColor: "#6B3A4C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Sec Jessica | Secretariado Remoto, Gestão de Clínicas & WhatsApp",
    template: "%s | Sec Jessica",
  },
  description:
    "Plataforma completa de secretariado remoto e gestão inteligente para clínicas, consultórios e escritórios. Central WhatsApp integrada, confirmação de consultas, Google Agenda e conformidade com LGPD.",
  applicationName: "Sec Jessica",
  authors: [{ name: "Vitor Hugo Abreu de Sousa", url: "https://github.com/vitorhugopetro" }],
  generator: "Next.js",
  keywords: [
    "sec jessica",
    "secretariado remoto",
    "secretária remota",
    "gestão de clínicas",
    "agendamento whatsapp",
    "confirmação de consultas",
    "google agenda sincronizada",
    "crm para consultórios",
    "atendimento ao paciente",
    "multi-empresa",
    "secjessica",
  ],
  creator: "Vitor Hugo Abreu de Sousa",
  publisher: "Sec Jessica",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    title: "SecJessica | Secretariado Remoto & Gestão Inteligente",
    description:
      "A solução definitiva para secretárias remotas e consultórios: WhatsApp integrado, agendamento com auto-confirmação, Google Agenda e painel multi-empresas.",
    siteName: "SecJessica",
    images: [
      {
        url: "/assets/logos/logo_principal.svg",
        width: 800,
        height: 600,
        alt: "Logo Oficial Jéssica Secretariado Remoto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SecJessica | Secretariado Remoto & Gestão de Clínicas",
    description:
      "Gestão de secretária remota com excelência, confirmação por WhatsApp e sincronização em tempo real com Google Agenda.",
    images: ["/assets/logos/logo_principal.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} ${playfairDisplay.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
