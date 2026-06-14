"use client";

import Link from "next/link";
import Image from "next/image";
import { Gavel, Heart, ShieldCheck, Star, Timer, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPrice, getTimeRemaining, formatTime } from "@/lib/utils";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import type { PublicUserProfileResponse, SellerReviewsResponse, SellerTrustScoreResponse } from "@/types";

interface LotCardProps {
  lot: {
    id: string;
    title: string;
    description: string;
    currentPrice: number;
    startTime: string;
    endTime: string;
    status: string;
    sellerId?: string;
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

const statusLabels: Record<string, string> = {
  Active: "Идут торги",
  Draft: "Черновик",
  PendingModeration: "На модерации",
  Completed: "Завершён",
  CompletedNoWinner: "Без победителя",
  DeliveryRequestPending: "Ожидает доставку",
  ShippingPending: "К отправке",
  Shipped: "Отправлен",
  TransactionComplete: "Сделка закрыта",
};

const placeholderStyles = [
  "bg-[linear-gradient(135deg,#E0F2FE_0%,#F8FAFC_52%,#DCFCE7_100%)]",
  "bg-[linear-gradient(135deg,#F1F5F9_0%,#DBEAFE_48%,#F8FAFC_100%)]",
  "bg-[linear-gradient(135deg,#ECFDF5_0%,#F8FAFC_54%,#E0E7FF_100%)]",
  "bg-[linear-gradient(135deg,#F8FAFC_0%,#E2E8F0_50%,#FEF3C7_100%)]",
];

function stableIndex(value: string, length: number) {
  const sum = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return sum % length;
}

export default function LotCard({ lot }: LotCardProps) {
  const [time, setTime] = useState(() => getTimeRemaining(lot.endTime, lot.startTime));
  const [isFav, setIsFav] = useState(false);
  const [sellerReviews, setSellerReviews] = useState<SellerReviewsResponse | null>(null);
  const [sellerTrust, setSellerTrust] = useState<SellerTrustScoreResponse | null>(null);
  const [sellerProfile, setSellerProfile] = useState<PublicUserProfileResponse | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(lot.endTime, lot.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [lot.endTime, lot.startTime]);

  useEffect(() => {
    if (!lot.sellerId) return;

    let isMounted = true;
    Promise.all([
      api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(lot.sellerId)),
      api.get<SellerTrustScoreResponse>(API_ENDPOINTS.SELLERS.TRUST(lot.sellerId)),
      api.get<PublicUserProfileResponse>(API_ENDPOINTS.AUTH.PUBLIC_PROFILE(lot.sellerId)),
    ])
      .then(([reviewsResponse, trustResponse, profileResponse]) => {
        if (!isMounted) return;
        setSellerReviews(reviewsResponse.data);
        setSellerTrust(trustResponse.data);
        setSellerProfile(profileResponse.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setSellerReviews(null);
        setSellerTrust(null);
        setSellerProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, [lot.sellerId]);

  const isUrgent = time.seconds < 120 && time.isLive;
  const isActive = lot.status === "Active";
  const hasCoverImage = !!lot.coverImageUrl;
  const placeholderClass = placeholderStyles[stableIndex(lot.id, placeholderStyles.length)];
  const statusLabel = statusLabels[lot.status] ?? lot.status;
  const hasReviews = !!sellerReviews && sellerReviews.reviewsCount > 0;
  const hasVerifiedDocs = sellerProfile?.documentVerificationStatus === "Verified";

  return (
    <Link
      href={`/lots/${lot.id}`}
      className="group block overflow-hidden rounded-[8px] border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-border2 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
    >
      <div className={`relative aspect-[4/3] overflow-hidden ${hasCoverImage ? "bg-bg2" : placeholderClass}`}>
        {hasCoverImage && lot.coverImageUrl && (
          <Image
            src={lot.coverImageUrl}
            alt={lot.title}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        )}

        {!hasCoverImage && (
          <div className="absolute inset-0 flex items-center justify-center text-text3">
            <Gavel className="w-10 h-10" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={`rounded-[7px] px-2.5 py-1 text-[11px] font-medium ${
            isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-white/90 text-text2 border border-white/70"
          }`}>
            {statusLabel}
          </span>
          {isUrgent && (
            <span className="rounded-[7px] bg-danger-bg border border-danger/20 px-2.5 py-1 text-[11px] font-medium text-danger">
              Скоро конец
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFav(!isFav);
          }}
          className="absolute right-3 top-3 w-9 h-9 rounded-[8px] border border-white/70 bg-white/90 text-text2 flex items-center justify-center transition-colors hover:text-danger"
          aria-label="В избранное"
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-danger text-danger" : ""}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-h-[42px] text-[15px] font-semibold leading-[1.35] text-text line-clamp-2">
            {lot.title}
          </h3>
          <div className="shrink-0 text-right">
            <div className="text-[18px] font-semibold text-text font-mono tracking-[-0.3px]">
              ₽ {formatPrice(lot.currentPrice)}
            </div>
            <div className="text-[11px] text-text3 mt-0.5">
              {lot.bidsCount} ставок
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[12px] text-text2">
          <Star className={`w-4 h-4 ${hasReviews ? "fill-amber-400 text-amber-400" : "text-text3"}`} />
          {hasReviews ? (
            <span>{sellerReviews.averageRating.toFixed(1)} · {sellerReviews.reviewsCount} отзывов</span>
          ) : (
            <span>Новый продавец</span>
          )}
          {hasVerifiedDocs && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              проверен
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {sellerTrust && (
            <span className="inline-flex items-center rounded-[6px] bg-bg2 border border-border px-2 py-1 text-[11px] text-text2">
              Надёжность {sellerTrust.score}/100
            </span>
          )}
          {lot.supportedDeliveryProviders?.map((provider) => (
            <span key={provider} className="inline-flex items-center gap-1 rounded-[6px] bg-bg2 border border-border px-2 py-1 text-[11px] text-text2">
              <Truck className="w-3 h-3" />
              {deliveryProviderLabels[provider] ?? provider}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-[12px] text-text2">
            <Timer className={`w-4 h-4 ${isUrgent ? "text-danger" : "text-text3"}`} />
            <span>{time.isLive ? "Осталось" : "Начало через"}</span>
            <span className={`font-mono font-medium ${isUrgent ? "text-danger" : "text-text"}`}>
              {formatTime(time.seconds)}
            </span>
          </div>

          {isActive && (
            <span className="text-[12px] font-medium text-gold">
              Сделать ставку
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
