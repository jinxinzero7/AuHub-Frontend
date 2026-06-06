"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSignalR } from "@/hooks/useSignalR";
import BidForm from "@/components/BidForm";
import ImageUpload from "@/components/ImageUpload";
import { formatPrice, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import type { Bid } from "@/types";

interface LotImage {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

interface LotDetailClientProps {
  lotId: string;
  title: string;
  description: string;
  startingPrice: number;
  initialCurrentPrice: number;
  sellerId: string;
  status: string;
  startTime: string;
  endTime: string;
  initialBids: Bid[];
  initialImages: LotImage[];
}

export default function LotDetailClient({
  lotId,
  title,
  description,
  startingPrice,
  initialCurrentPrice,
  sellerId,
  status,
  startTime,
  endTime,
  initialBids,
  initialImages,
}: LotDetailClientProps) {
  const { user } = useAuth();
  const isSeller = user?.id === sellerId;
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [images, setImages] = useState<LotImage[]>(initialImages);
  const [newBidNotification, setNewBidNotification] = useState<string | null>(null);

  const handleNewBid = useCallback((message: { lotId: string; currentPrice: number; bidderName: string }) => {
    setCurrentPrice(message.currentPrice);
    setBids((prev) => [
      {
        id: `signalr-${Date.now()}`,
        lotId: message.lotId,
        userId: "",
        amount: message.currentPrice,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewBidNotification(`Новая ставка от ${message.bidderName}: ₽ ${formatPrice(message.currentPrice)}`);
    setTimeout(() => setNewBidNotification(null), 3000);
  }, []);

  const handleLotCompleted = useCallback(() => {
    setNewBidNotification("Аукцион завершён!");
    setTimeout(() => setNewBidNotification(null), 5000);
  }, []);

  useSignalR({
    lotId,
    onNewBid: handleNewBid,
    onLotCompleted: handleLotCompleted,
  });

  const handleBidPlaced = useCallback((newPrice: number) => {
    setCurrentPrice(newPrice);
  }, []);

  const handleSubmitForModeration = useCallback(async () => {
    try {
      await api.post(`/api/lots/${lotId}/submit-for-moderation`);
      window.location.reload();
    } catch (err) {
      console.error("Failed to submit lot for moderation:", err);
      setNewBidNotification("Ошибка отправки лота на модерацию");
      setTimeout(() => setNewBidNotification(null), 3000);
    }
  }, [lotId]);

  const coverImage = images.length > 0 ? images[0].url : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="w-full aspect-[4/3] bg-bg2 border border-border rounded-[10px] overflow-hidden mb-4">
          {coverImage ? (
            <div className="relative w-full h-full">
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-text3 text-[14px] font-light">Изображение лота</span>
            </div>
          )}
        </div>

        {newBidNotification && (
          <div className="mb-4 bg-gold/10 border border-gold/30 rounded-[8px] px-4 py-3 text-[13px] text-gold text-center animate-pulse">
            {newBidNotification}
          </div>
        )}

        <div className="bg-surface border border-border rounded-[10px] p-6">
          <h1 className="font-heading text-[24px] font-semibold text-text mb-2">
            {title}
          </h1>
          <p className="text-[14px] text-text2 font-light mb-4 leading-relaxed">
            {description}
          </p>

          <div className="flex items-baseline gap-4 mb-4">
            <div>
              <div className="text-[10px] text-text2 font-light mb-0.5">Текущая ставка</div>
              <div className="text-[28px] font-medium text-gold font-mono tracking-[-0.5px]">
                ₽ {formatPrice(currentPrice)}
              </div>
            </div>
            <div className="text-[12px] text-text3">
              {bids.length} ставок
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="text-text2 font-light">Статус:</span>
              <span className="ml-2 text-text font-medium">{status}</span>
            </div>
            <div>
              <span className="text-text2 font-light">Стартовая цена:</span>
              <span className="ml-2 text-text font-medium">₽ {formatPrice(startingPrice)}</span>
            </div>
            <div>
              <span className="text-text2 font-light">Начало:</span>
              <span className="ml-2 text-text font-medium">{formatDate(startTime)}</span>
            </div>
            <div>
              <span className="text-text2 font-light">Окончание:</span>
              <span className="ml-2 text-text font-medium">{formatDate(endTime)}</span>
            </div>
          </div>

          {isSeller && status === "Draft" && (
            <button
              onClick={handleSubmitForModeration}
              className="mt-4 w-full bg-gold hover:bg-gold-hover text-bg font-medium py-3 rounded-[8px] transition-colors"
            >
              Отправить на модерацию
            </button>
          )}
        </div>

        {isSeller && (
          <div className="bg-surface border border-border rounded-[10px] p-6 mt-6">
            <h2 className="font-heading text-[18px] font-medium text-text mb-4">
              Изображения лота
            </h2>
            <ImageUpload
              lotId={lotId}
              existingImages={images}
              onImagesChange={setImages}
            />
          </div>
        )}
      </div>

      <div>
        <div className="bg-surface border border-border rounded-[10px] p-6 mb-6">
          <h2 className="font-heading text-[18px] font-medium text-text mb-4">
            История ставок
          </h2>

          {bids.length === 0 ? (
            <p className="text-[13px] text-text2 font-light text-center py-4">
              Пока нет ставок
            </p>
          ) : (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="text-[13px] text-text2">
                    {formatDate(bid.createdAt)}
                  </div>
                  <div className="text-[14px] font-medium text-gold font-mono">
                    ₽ {formatPrice(bid.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {status === "Active" && (
          <BidForm
            lotId={lotId}
            currentPrice={currentPrice}
            sellerId={sellerId}
            onBidPlaced={handleBidPlaced}
          />
        )}
      </div>
    </div>
  );
}
