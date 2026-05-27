import Header from "@/components/Header";
import LotDetailClient from "@/components/LotDetailClient";
import api from "@/lib/api";
import type { Lot, Bid } from "@/types";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";

interface LotImage {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

async function getLot(id: string): Promise<Lot | null> {
  try {
    const response = await api.get(`/api/lots/${id}`);
    return response.data || null;
  } catch (err) {
    console.error(`Failed to fetch lot ${id}:`, err);
    return null;
  }
}

async function getBids(id: string): Promise<Bid[]> {
  try {
    const response = await api.get(`/api/lots/${id}/bids`);
    return response.data?.bids || [];
  } catch (err) {
    console.error(`Failed to fetch bids for lot ${id}:`, err);
    return [];
  }
}

async function getImages(id: string): Promise<LotImage[]> {
  try {
    const response = await api.get(`/api/lots/${id}/images`);
    return response.data || [];
  } catch (err) {
    console.error(`Failed to fetch images for lot ${id}:`, err);
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const lot = await getLot(id);
  const images = await getImages(id);

  if (!lot) {
    return {
      title: "Лот не найден | AuHub",
      description: "Запрашиваемый лот не найден",
    };
  }

  const coverImage = images.length > 0 ? images[0].url : undefined;
  const statusLabel =
    lot.status === "Active" ? "Аукцион активен" :
    lot.status === "Completed" ? "Аукцион завершён" :
    lot.status === "Draft" ? "Черновик" : lot.status;

  const title = `${lot.title} — Текущая ставка: ₽${lot.currentPrice.toLocaleString("ru-RU")} | AuHub`;
  const description = `${statusLabel}. ${lot.description.slice(0, 150)}${lot.description.length > 150 ? "..." : ""}`;

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: coverImage ? [{ url: coverImage, width: 1200, height: 630, alt: lot.title }, ...previousImages] : previousImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: coverImage ? [coverImage] : undefined,
    },
  };
}

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lot, bids, images] = await Promise.all([
    getLot(id),
    getBids(id),
    getImages(id),
  ]);

  if (!lot) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Лот не найден</h1>
            <Link href="/" className="text-gold hover:text-gold-hover transition-colors">
              Вернуться на главную
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-10">
          <LotDetailClient
            lotId={lot.id}
            title={lot.title}
            description={lot.description}
            startingPrice={lot.startingPrice}
            initialCurrentPrice={lot.currentPrice}
            sellerId={lot.sellerId}
            status={lot.status}
            startTime={lot.startTime}
            endTime={lot.endTime}
            initialBids={bids}
            initialImages={images}
          />
        </div>
      </main>
    </>
  );
}
