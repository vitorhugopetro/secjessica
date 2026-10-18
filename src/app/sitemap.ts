import { MetadataRoute } from "next";

export const dynamic = "force-static";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secjessica.web.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${APP_URL}`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/entrar`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/cadastro`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/ajuda`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
