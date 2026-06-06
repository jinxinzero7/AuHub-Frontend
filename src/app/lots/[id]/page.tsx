import { cache } from "react";
import Header from "@/components/Header";
import LotDetailClient from "@/components/LotDetailClient";
import api from "@/lib/api";
import type { Lot, Bid } from "@/types";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { formatPrice } from "@/lib/utils";

interface LotImage {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

const getLotData = cache(async (id: string) => {
  const [lotRes, imagesRes, bidsRes] = await Promise.all([
    api.get(`/api/lots/${id}`),
    api.get(`/api/lots/${id}/images`),
    api.get(`/api/lots/${id}/bids`),
  ]);
  return {
    lot: (lotRes.data || null) as Lot | null,
    images: (imagesRes.data || []) as LotImage[],
    bids: ((bidsRes.data as { bids?: Bid[] })?.bids || []) as Bid[],
  };
});

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const { lot, images } = await getLotData(id);

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
    lot.status === "PendingModeration" ? "Лот на модерации" :
    lot.status === "Draft" ? "Черновик" : lot.status;

  const title = `${lot.title} — Текущая ставка: ₽${formatPrice(lot.currentPrice)} | AuHub`;
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
  const { lot, bids, images } = await getLotData(id);

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
            supportedDeliveryProviders={lot.supportedDeliveryProviders ?? []}
            initialBids={bids}
            initialImages={images}
          />
        </div>
      </main>
    </>
  );
}
