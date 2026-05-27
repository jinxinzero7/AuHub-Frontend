import api from "@/lib/api";
import type { Lot } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default async function sitemap() {
  const staticRoutes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  let lots: Lot[] = [];
  try {
    const response = await fetch(`${API_URL}/api/lots`, {
      next: { revalidate: 3600 },
    });
    const data = await response.json();
    if (data.success) {
      lots = data.lots || [];
    }
  } catch {
  }

  const lotRoutes = lots.map((lot) => ({
    url: `${BASE_URL}/lots/${lot.id}`,
    lastModified: new Date(lot.updatedAt || lot.createdAt || new Date()),
    changeFrequency: lot.status === "Active" ? ("hourly" as const) : ("weekly" as const),
    priority: lot.status === "Active" ? 0.8 : 0.5,
  }));

  return [...staticRoutes, ...lotRoutes];
}
