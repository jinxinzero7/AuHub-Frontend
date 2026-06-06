"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPrice, getTimeRemaining, formatTime } from "@/lib/utils";

interface LotCardProps {
  lot: {
    id: string;
    title: string;
    description: string;
    currentPrice: number;
    startTime: string;
    endTime: string;
    status: string;
    bidsCount: number;
    coverImageUrl?: string;
    supportedDeliveryProviders?: string[];
  };
}

const deliveryProviderLabels: Record<string, string> = {
  Cdek: "СДЭК",
  YandexDelivery: "Яндекс",
  RussianPost: "Почта",
};

const gradients = [
  "linear-gradient(135deg, #1C2535 0%, #2A3545 100%)",
  "linear-gradient(135deg, #251535 0%, #321A45 100%)",
  "linear-gradient(135deg, #251C0D 0%, #352808 100%)",
  "linear-gradient(135deg, #0F2A1A 0%, #163520 100%)",
  "linear-gradient(135deg, #1A1040 0%, #251855 100%)",
  "linear-gradient(135deg, #1E1E28 0%, #282835 100%)",
];

export default function LotCard({ lot }: LotCardProps) {
  const [time, setTime] = useState(() => getTimeRemaining(lot.endTime, lot.startTime));
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(lot.endTime, lot.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [lot.endTime, lot.startTime]);

  const gradient = gradients[parseInt(lot.id.replace(/-/g, ""), 36) % gradients.length];
  const isUrgent = time.seconds < 120 && time.isLive;
  const isActive = lot.status === "Active";
  const hasCoverImage = !!lot.coverImageUrl;
  const imageUrl = hasCoverImage ? lot.coverImageUrl! : null;

  return (
    <Link href={`/lots/${lot.id}`} className="group bg-surface border border-border rounded-[10px] overflow-hidden hover:border-gold hover:translate-y-[-1px] transition-all duration-200 block">
      <div className="w-full h-[162px] relative overflow-hidden" style={{ background: hasCoverImage ? undefined : gradient }}>
        {hasCoverImage && imageUrl && (
          <Image
            src={imageUrl}
            alt={lot.title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute top-[10px] left-[10px]">
          {time.isLive ? (
            <span className="text-[10px] font-medium px-2 py-[3px] rounded bg-[rgba(192,57,43,0.2)] text-[#E05242] tracking-[0.2px]">
              Идут торги
            </span>
          ) : lot.status === "Draft" ? (
            <span className="text-[10px] font-medium px-2 py-[3px] rounded bg-[rgba(184,136,46,0.2)] text-gold tracking-[0.2px]">
              Черновик
            </span>
          ) : lot.status === "PendingModeration" ? (
            <span className="text-[10px] font-medium px-2 py-[3px] rounded bg-[rgba(184,136,46,0.2)] text-gold tracking-[0.2px]">
              На модерации
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-[3px] rounded bg-[rgba(184,136,46,0.2)] text-gold tracking-[0.2px]">
              Завершён
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFav(!isFav);
          }}
          className="absolute top-[10px] right-[10px] w-[28px] h-[28px] rounded-[6px] bg-[rgba(0,0,0,0.35)] border-none cursor-pointer flex items-center justify-center text-[rgba(255,255,255,0.7)] hover:bg-[rgba(0,0,0,0.6)] hover:text-white transition-colors"
          aria-label="В избранное"
        >
          <Heart className={`w-[13px] h-[13px] ${isFav ? "fill-[#E8B84B] text-[#E8B84B]" : ""}`} />
        </button>
      </div>

      <div className="p-[13px]">
        <div className="text-[10.5px] text-text3 mb-1 tracking-[0.1px]">
          {lot.status}
        </div>
        <h3 className="text-[13.5px] font-medium text-text mb-[11px] font-heading leading-[1.4] min-h-[38px] line-clamp-2">
          {lot.title}
        </h3>
        {lot.supportedDeliveryProviders && lot.supportedDeliveryProviders.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-[10px]">
            {lot.supportedDeliveryProviders.map((provider) => (
              <span key={provider} className="text-[10px] px-1.5 py-[2px] rounded bg-bg2 text-text2 border border-border">
                {deliveryProviderLabels[provider] ?? provider}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between pt-[10px] border-t border-border">
          <div>
            <div className="text-[10px] text-text2 mb-[2px] font-light">Текущая ставка</div>
            <div className="text-[17px] font-medium text-gold font-mono tracking-[-0.3px]">
              ₽ {formatPrice(lot.currentPrice)}
            </div>
            <div className="text-[10px] text-text3 mt-[2px]">
              {lot.bidsCount} ставок
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-text2 mb-[2px] font-light">
              {time.isLive ? "Осталось" : "Начало через"}
            </div>
            <div className={`text-[15px] font-medium font-mono tracking-[0.5px] ${isUrgent ? "text-danger" : "text-text"}`}>
              {formatTime(time.seconds)}
            </div>
          </div>
        </div>

        {isActive && (
          <button className="block w-full mt-[11px] py-2 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[12.5px] font-medium cursor-pointer font-ui tracking-[0.1px] hover:bg-gold-hover transition-colors">
            Сделать ставку →
          </button>
        )}
      </div>
    </Link>
  );
}
