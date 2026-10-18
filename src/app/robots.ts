import { MetadataRoute } from "next";

export const dynamic = "force-static";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secjessica.web.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/entrar", "/cadastro", "/ajuda"],
        disallow: [
          "/dashboard",
          "/agenda",
          "/whatsapp",
          "/clientes",
          "/contatos",
          "/empresas",
          "/usuarios",
          "/configuracoes",
          "/relatorios",
          "/api/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
