"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSignalR } from "@/hooks/useSignalR";
import BidForm from "@/components/BidForm";
import ImageUpload from "@/components/ImageUpload";
import { calculateSellerPayout, calculateServiceFee, formatDate, formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getDeliveryProviderLabel, getLotStatusLabel, getTrustBadgeLabel } from "@/lib/labels";
import type { Bid, Lot, PublicUserProfileResponse, SellerReviewsResponse, SellerTrustScoreResponse } from "@/types";

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
  winnerId?: string;
  status: string;
  startTime: string;
  endTime: string;
  trackingNumber?: string | null;
  selectedDeliveryProvider?: string | null;
  deliveryAddress?: string | null;
  deliveryRecipientName?: string | null;
  deliveryRecipientPhone?: string | null;
  deliveryRequestedAt?: string | null;
  deliveryRequestDeadlineAt?: string | null;
  currentTime: string;
  supportedDeliveryProviders: string[];
  initialBids: Bid[];
  initialImages: LotImage[];
}

interface DeliveryRequestDetails {
  selectedDeliveryProvider?: string | null;
  deliveryAddress?: string | null;
  deliveryRecipientName?: string | null;
  deliveryRecipientPhone?: string | null;
  deliveryRequestedAt?: string | null;
  trackingNumber?: string | null;
}

function mapDeliveryRequestDetails(lot: Pick<Lot, "selectedDeliveryProvider" | "deliveryAddress" | "deliveryRecipientName" | "deliveryRecipientPhone" | "deliveryRequestedAt" | "trackingNumber">): DeliveryRequestDetails {
  return {
    selectedDeliveryProvider: lot.selectedDeliveryProvider,
    deliveryAddress: lot.deliveryAddress,
    deliveryRecipientName: lot.deliveryRecipientName,
    deliveryRecipientPhone: lot.deliveryRecipientPhone,
    deliveryRequestedAt: lot.deliveryRequestedAt,
    trackingNumber: lot.trackingNumber,
  };
}

function statusClassName(status: string) {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "PendingModeration" || status === "ShippingPending" || status === "DeliveryRequestPending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }
  if (status === "Rejected" || status === "Disputed" || status === "Cancelled") {
    return "border-danger/20 bg-danger-bg text-danger";
  }
  if (status === "TransactionComplete" || status === "Delivered") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-border bg-bg2 text-text2";
}

export default function LotDetailClient({
  lotId,
  title,
  description,
  startingPrice,
  initialCurrentPrice,
  sellerId,
  winnerId,
  status,
  startTime,
  endTime,
  trackingNumber,
  selectedDeliveryProvider,
  deliveryAddress: initialDeliveryAddress,
  deliveryRecipientName,
  deliveryRecipientPhone,
  deliveryRequestedAt,
  deliveryRequestDeadlineAt,
  currentTime,
  supportedDeliveryProviders,
  initialBids,
  initialImages,
}: LotDetailClientProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const isSeller = user?.id === sellerId;
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [images, setImages] = useState<LotImage[]>(initialImages);
  const [newBidNotification, setNewBidNotification] = useState<string | null>(null);
  const [deliveryProvider, setDeliveryProvider] = useState(supportedDeliveryProviders[0] ?? "");
  const [deliveryAddressInput, setDeliveryAddressInput] = useState("");
  const [recipientName, setRecipientName] = useState(user?.name ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryRequestDetails, setDeliveryRequestDetails] = useState<DeliveryRequestDetails>(() => ({
    selectedDeliveryProvider,
    deliveryAddress: initialDeliveryAddress,
    deliveryRecipientName,
    deliveryRecipientPhone,
    deliveryRequestedAt,
    trackingNumber,
  }));
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [isRequestingDelivery, setIsRequestingDelivery] = useState(false);
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isShipping, setIsShipping] = useState(false);
  const [dealActionError, setDealActionError] = useState<string | null>(null);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isOpeningDispute, setIsOpeningDispute] = useState(false);
  const [sellerReviews, setSellerReviews] = useState<SellerReviewsResponse | null>(null);
  const [sellerTrust, setSellerTrust] = useState<SellerTrustScoreResponse | null>(null);
  const [sellerProfile, setSellerProfile] = useState<PublicUserProfileResponse | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [demoCompleteError, setDemoCompleteError] = useState<string | null>(null);
  const [isDemoCompleting, setIsDemoCompleting] = useState(false);

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
    setNewBidNotification(`Новая ставка от ${message.bidderName}: ${formatPrice(message.currentPrice)} ₽`);
    setTimeout(() => setNewBidNotification(null), 3000);
  }, []);

  const handleLotCompleted = useCallback(() => {
    setNewBidNotification("Аукцион завершён");
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

  const refreshSellerReviews = useCallback(async () => {
    try {
      const [reviewsResponse, trustResponse, profileResponse] = await Promise.all([
        api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(sellerId)),
        api.get<SellerTrustScoreResponse>(API_ENDPOINTS.SELLERS.TRUST(sellerId)),
        api.get<PublicUserProfileResponse>(API_ENDPOINTS.AUTH.PUBLIC_PROFILE(sellerId)),
      ]);
      setSellerReviews(reviewsResponse.data);
      setSellerTrust(trustResponse.data);
      setSellerProfile(profileResponse.data);
    } catch (err) {
      console.error("Failed to fetch seller reviews:", err);
      setSellerReviews(null);
      setSellerTrust(null);
      setSellerProfile(null);
    }
  }, [sellerId]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(sellerId)),
      api.get<SellerTrustScoreResponse>(API_ENDPOINTS.SELLERS.TRUST(sellerId)),
      api.get<PublicUserProfileResponse>(API_ENDPOINTS.AUTH.PUBLIC_PROFILE(sellerId)),
    ])
      .then(([reviewsResponse, trustResponse, profileResponse]) => {
        if (!isMounted) return;
        setSellerReviews(reviewsResponse.data);
        setSellerTrust(trustResponse.data);
        setSellerProfile(profileResponse.data);
      })
      .catch((err) => {
        console.error("Failed to fetch seller reviews:", err);
        if (!isMounted) return;
        setSellerReviews(null);
        setSellerTrust(null);
        setSellerProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, [sellerId]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    api.get<Lot>(API_ENDPOINTS.LOTS.DETAIL(lotId))
      .then((response) => {
        if (!isMounted) return;
        setDeliveryRequestDetails(mapDeliveryRequestDetails(response.data));
      })
      .catch((err) => {
        console.error("Failed to fetch private delivery details:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [lotId, userId]);

  const handleSubmitForModeration = useCallback(async () => {
    try {
      await api.post(`/api/lots/${lotId}/submit-for-moderation`);
      window.location.reload();
    } catch (err) {
      console.error("Failed to submit lot for moderation:", err);
      setNewBidNotification("Не удалось отправить лот на модерацию");
      setTimeout(() => setNewBidNotification(null), 3000);
    }
  }, [lotId]);

  const handleDemoComplete = useCallback(async () => {
    setDemoCompleteError(null);
    setIsDemoCompleting(true);
    try {
      await api.post(API_ENDPOINTS.LOTS.DEMO_COMPLETE(lotId));
      window.location.reload();
    } catch (err) {
      console.error("Failed to demo-complete lot:", err);
      setDemoCompleteError("Не удалось завершить лот для демо. Проверьте, что лот активен и у покупателя хватает замороженных средств.");
    } finally {
      setIsDemoCompleting(false);
    }
  }, [lotId]);

  const handleRequestDelivery = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeliveryError(null);

    if (!deliveryProvider) {
      setDeliveryError("Выберите службу доставки");
      return;
    }

    if (!deliveryAddressInput.trim() || !recipientName.trim() || !recipientPhone.trim()) {
      setDeliveryError("Заполните данные для доставки");
      return;
    }

    setIsRequestingDelivery(true);
    try {
      await api.post(`/api/lots/${lotId}/delivery-request`, {
        provider: deliveryProvider,
        address: deliveryAddressInput.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to request delivery:", err);
      setDeliveryError("Не удалось запросить доставку");
    } finally {
      setIsRequestingDelivery(false);
    }
  }, [deliveryAddressInput, deliveryProvider, lotId, recipientName, recipientPhone]);

  const handleShipLot = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShippingError(null);

    if (!shippingTrackingNumber.trim()) {
      setShippingError("Введите трек-номер или номер отправления");
      return;
    }

    setIsShipping(true);
    try {
      await api.post(`/api/lots/${lotId}/ship`, {
        trackingNumber: shippingTrackingNumber.trim(),
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to ship lot:", err);
      setShippingError("Не удалось отметить лот как отправленный");
    } finally {
      setIsShipping(false);
    }
  }, [lotId, shippingTrackingNumber]);

  const handleConfirmDelivery = useCallback(async () => {
    setDealActionError(null);
    setIsConfirmingDelivery(true);
    try {
      await api.post(`/api/lots/${lotId}/confirm-delivery`);
      window.location.reload();
    } catch (err) {
      console.error("Failed to confirm delivery:", err);
      setDealActionError("Не удалось подтвердить доставку");
    } finally {
      setIsConfirmingDelivery(false);
    }
  }, [lotId]);

  const handleOpenDispute = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDealActionError(null);

    if (!disputeReason.trim()) {
      setDealActionError("Укажите причину спора");
      return;
    }

    setIsOpeningDispute(true);
    try {
      await api.post(`/api/lots/${lotId}/dispute`, { reason: disputeReason.trim() });
      window.location.reload();
    } catch (err) {
      console.error("Failed to open dispute:", err);
      setDealActionError("Не удалось открыть спор");
    } finally {
      setIsOpeningDispute(false);
    }
  }, [disputeReason, lotId]);

  const handleCreateReview = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewError(null);

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Выберите оценку от 1 до 5");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post(API_ENDPOINTS.LOTS.REVIEWS(lotId), {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewComment("");
      await refreshSellerReviews();
    } catch (err) {
      console.error("Failed to create review:", err);
      setReviewError("Не удалось отправить отзыв");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [lotId, refreshSellerReviews, reviewComment, reviewRating]);

  const coverImage = images.length > 0 ? images[0].url : null;
  const isDeliveryDeadlineExpired = deliveryRequestDeadlineAt
    ? Date.parse(deliveryRequestDeadlineAt) < Date.parse(currentTime)
    : false;
  const canRequestDelivery = user?.id === winnerId && status === "DeliveryRequestPending" && !isDeliveryDeadlineExpired;
  const canShipLot = isSeller && status === "ShippingPending";
  const canEditLot = isSeller && (status === "Draft" || status === "Rejected");
  const canDemoComplete = isSeller && status === "Active";
  const canConfirmDelivery = user?.id === winnerId && status === "Shipped";
  const canOpenDispute = user?.id === winnerId && ["Completed", "DeliveryRequestPending", "ShippingPending", "Shipped", "Delivered"].includes(status);
  const serviceFee = calculateServiceFee(currentPrice);
  const sellerPayout = calculateSellerPayout(currentPrice);
  const existingReview = sellerReviews?.reviews.find((review) => review.lotId === lotId);
  const canReviewSeller = sellerReviews !== null && user?.id === winnerId && status === "TransactionComplete" && !existingReview;
  const deliveryDetailRows = [
    deliveryRequestDetails.selectedDeliveryProvider?.trim()
      ? { label: "Служба доставки", value: getDeliveryProviderLabel(deliveryRequestDetails.selectedDeliveryProvider) }
      : null,
    deliveryRequestDetails.deliveryAddress?.trim()
      ? { label: "ПВЗ или адрес", value: deliveryRequestDetails.deliveryAddress.trim() }
      : null,
    deliveryRequestDetails.deliveryRecipientName?.trim()
      ? { label: "Получатель", value: deliveryRequestDetails.deliveryRecipientName.trim() }
      : null,
    deliveryRequestDetails.deliveryRecipientPhone?.trim()
      ? { label: "Телефон", value: deliveryRequestDetails.deliveryRecipientPhone.trim() }
      : null,
    deliveryRequestDetails.deliveryRequestedAt?.trim()
      ? { label: "Запрошено", value: formatDate(deliveryRequestDetails.deliveryRequestedAt) }
      : null,
    deliveryRequestDetails.trackingNumber?.trim()
      ? { label: "Отправление", value: deliveryRequestDetails.trackingNumber.trim() }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null);
  const hasDeliveryRequestDetails = deliveryDetailRows.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="overflow-hidden rounded-[8px] border border-border bg-surface">
          <div className="relative aspect-[4/3] w-full bg-bg2">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-6 text-center text-[14px] text-text3">
                Изображение лота появится после загрузки продавцом
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
            {newBidNotification && (
              <div
                className="mb-4 rounded-[7px] border border-gold-border bg-gold-light px-4 py-3 text-center text-[13px] font-medium text-gold"
                aria-live="polite"
              >
                {newBidNotification}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-medium ${statusClassName(status)}`}>
                  {getLotStatusLabel(status)}
                </span>
                <h1 className="mt-3 text-[28px] font-semibold leading-tight text-text">{title}</h1>
              </div>
              {canEditLot && (
                <Link
                  href={`/lots/${lotId}/edit`}
                  className="inline-flex shrink-0 items-center justify-center rounded-[7px] border border-border bg-bg2 px-4 py-2 text-[13px] font-medium text-text transition-colors hover:border-gold"
                >
                  Редактировать
                </Link>
              )}
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[14px] leading-6 text-text2">{description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-[7px] bg-bg2 p-3 sm:col-span-2">
                <div className="text-[12px] text-text2">Текущая цена</div>
                <div className="mt-1 font-mono text-[28px] font-semibold text-gold">
                  {formatPrice(currentPrice)} ₽
                </div>
              </div>
              <div className="rounded-[7px] bg-bg2 p-3">
                <div className="text-[12px] text-text2">Ставок</div>
                <div className="mt-1 text-[20px] font-semibold text-text">{bids.length}</div>
              </div>
              <div className="rounded-[7px] bg-bg2 p-3">
                <div className="text-[12px] text-text2">Старт</div>
                <div className="mt-1 text-[20px] font-semibold text-text">{formatPrice(startingPrice)} ₽</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-border pt-5 text-[13px] sm:grid-cols-2">
              <div>
                <span className="text-text2">Начало: </span>
                <span className="font-medium text-text">{formatDate(startTime)}</span>
              </div>
              <div>
                <span className="text-text2">Окончание: </span>
                <span className="font-medium text-text">{formatDate(endTime)}</span>
              </div>
            </div>

            {supportedDeliveryProviders.length > 0 && (
              <div className="mt-5 border-t border-border pt-5">
                <div className="mb-2 text-[12px] font-medium text-text2">Доступная доставка</div>
                <div className="flex flex-wrap gap-2">
                  {supportedDeliveryProviders.map((provider) => (
                    <span key={provider} className="rounded-full border border-border bg-bg2 px-3 py-1 text-[12px] text-text">
                      {getDeliveryProviderLabel(provider)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isSeller && (
              <div className="mt-5 rounded-[7px] border border-border bg-bg2 p-4 text-[13px]">
                <div className="flex items-center justify-between gap-3 text-text2">
                  <span>Комиссия AuHub 1%</span>
                  <span>{formatPrice(serviceFee)} ₽</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 font-medium text-text">
                  <span>С учётом комиссии вы получите</span>
                  <span>{formatPrice(sellerPayout)} ₽</span>
                </div>
                {canDemoComplete && (
                  <div className="mt-4 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={handleDemoComplete}
                      disabled={isDemoCompleting}
                      className="w-full rounded-[7px] border border-blue-200 bg-blue-50 py-2.5 text-[13px] font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDemoCompleting ? "Завершаем..." : "Завершить лот для демо"}
                    </button>
                    <p className="mt-2 text-[12px] leading-5 text-text3">
                      Для показа: завершает активный аукцион сейчас и открывает победителю форму доставки.
                    </p>
                    {demoCompleteError && (
                      <div className="mt-2 text-[12px] text-danger" aria-live="polite">
                        {demoCompleteError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-text">Продавец</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/sellers/${sellerId}`}
                className="text-[14px] font-medium text-text hover:text-gold"
              >
                {sellerProfile?.nickname ? `@${sellerProfile.nickname}` : sellerProfile?.name || "Профиль продавца"}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-text2">
                <Star className={`h-4 w-4 ${sellerReviews && sellerReviews.reviewsCount > 0 ? "fill-gold text-gold" : "text-text3"}`} />
                {sellerReviews && sellerReviews.reviewsCount > 0 ? (
                  <span>{sellerReviews.averageRating.toFixed(1)} из 5, {sellerReviews.reviewsCount} отзывов</span>
                ) : (
                  <span>Пока нет отзывов</span>
                )}
              </div>
            </div>
            {sellerProfile?.documentVerificationStatus === "Verified" && (
              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[12px] font-medium text-green-700">
                Документы подтверждены
              </span>
            )}
          </div>
          {sellerTrust && (
            <div className="mt-4 rounded-[7px] border border-border bg-bg2 p-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-text2">Надёжность продавца</span>
                <span className="font-medium text-text">{sellerTrust.score}/100 · {getTrustBadgeLabel(sellerTrust.badge)}</span>
              </div>
              <div className="mt-1 text-[12px] text-text3">
                Успешных сделок: {sellerTrust.successfulSales}, проигранных споров: {sellerTrust.sellerLostDisputes}
              </div>
            </div>
          )}
        </section>

        {canRequestDelivery && (
          <form onSubmit={handleRequestDelivery} className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-text">Запросить доставку</h2>
                <p className="mt-1 text-[13px] text-text2">
                  Укажите удобный ПВЗ или адрес из доступных продавцу служб.
                </p>
              </div>
              {deliveryRequestDeadlineAt && (
                <span className="text-[12px] text-text3">до {formatDate(deliveryRequestDeadlineAt)}</span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-text2">Служба доставки</span>
                <select
                  value={deliveryProvider}
                  onChange={(event) => setDeliveryProvider(event.target.value)}
                  className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                >
                  {supportedDeliveryProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {getDeliveryProviderLabel(provider)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-text2">Телефон получателя</span>
                <input
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                  className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                  placeholder="+7..."
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-[12px] font-medium text-text2">Получатель</span>
              <input
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-1 block text-[12px] font-medium text-text2">ПВЗ или адрес</span>
              <textarea
                value={deliveryAddressInput}
                onChange={(event) => setDeliveryAddressInput(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
              />
            </label>

            <div className="mt-3" aria-live="polite">
              {deliveryError && <div className="text-[12px] text-danger">{deliveryError}</div>}
            </div>

            <button
              type="submit"
              disabled={isRequestingDelivery}
              className="mt-4 w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRequestingDelivery ? "Отправляем..." : "Запросить доставку"}
            </button>
          </form>
        )}

        {hasDeliveryRequestDetails && (
          <section
            aria-labelledby="delivery-details-heading"
            className="rounded-[8px] border border-border bg-surface p-5 sm:p-6"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="delivery-details-heading" className="text-[18px] font-semibold text-text">Данные доставки</h2>
                <p className="mt-1 text-[13px] leading-5 text-text2">
                  Информация доступна только участникам сделки и администраторам.
                </p>
              </div>
              {deliveryRequestDeadlineAt && status === "DeliveryRequestPending" && (
                <span className="text-[12px] text-text3">до {formatDate(deliveryRequestDeadlineAt)}</span>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {deliveryDetailRows.map((row) => (
                <div key={row.label} className="rounded-[7px] border border-border bg-bg2 px-3 py-2">
                  <div className="text-[11px] font-medium uppercase text-text3">{row.label}</div>
                  <div className="mt-1 break-words text-[13px] font-medium text-text">{row.value}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {canShipLot && (
          <form onSubmit={handleShipLot} className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-text">Отправить лот</h2>
            <p className="mt-1 text-[13px] text-text2">
              Покупатель запросил доставку
              {deliveryRequestDetails.selectedDeliveryProvider ? ` через ${getDeliveryProviderLabel(deliveryRequestDetails.selectedDeliveryProvider)}` : ""}.
            </p>

            <label className="mt-4 block">
              <span className="mb-1 block text-[12px] font-medium text-text2">Трек-номер или номер отправления</span>
              <input
                value={shippingTrackingNumber}
                onChange={(event) => setShippingTrackingNumber(event.target.value)}
                className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
              />
            </label>

            <div className="mt-3" aria-live="polite">
              {shippingError && <div className="text-[12px] text-danger">{shippingError}</div>}
            </div>

            <button
              type="submit"
              disabled={isShipping}
              className="mt-4 w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isShipping ? "Отправляем..." : "Отметить как отправленный"}
            </button>
          </form>
        )}

        {(canConfirmDelivery || canOpenDispute) && (
          <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-text">Действия по сделке</h2>
            <p className="mt-1 text-[13px] leading-5 text-text2">
              Подтверждение доставки завершит сделку и переведёт выплату продавцу. Если с товаром проблема, откройте спор.
            </p>

            {canConfirmDelivery && (
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={isConfirmingDelivery}
                className="mt-4 w-full rounded-[7px] bg-green-600 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirmingDelivery ? "Подтверждаем..." : "Подтвердить получение"}
              </button>
            )}

            {canOpenDispute && (
              <form onSubmit={handleOpenDispute} className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-text2">Причина спора</span>
                  <textarea
                    value={disputeReason}
                    onChange={(event) => setDisputeReason(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                    placeholder="Например: товар не соответствует описанию"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isOpeningDispute}
                  className="w-full rounded-[7px] border border-danger py-2.5 text-[14px] font-medium text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isOpeningDispute ? "Открываем..." : "Открыть спор"}
                </button>
              </form>
            )}

            <div className="mt-3" aria-live="polite">
              {dealActionError && <div className="text-[12px] text-danger">{dealActionError}</div>}
            </div>
          </section>
        )}

        {existingReview && (
          <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-text">Отзыв по сделке</h2>
            <div className="mt-3 flex items-center gap-1 text-gold">
              {Array.from({ length: existingReview.rating }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-gold" />
              ))}
            </div>
            {existingReview.comment && (
              <p className="mt-3 text-[13px] leading-6 text-text2">{existingReview.comment}</p>
            )}
          </section>
        )}

        {canReviewSeller && (
          <form onSubmit={handleCreateReview} className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-text">Оставить отзыв продавцу</h2>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border bg-bg2 transition-colors hover:border-gold"
                  aria-label={`${rating} из 5`}
                >
                  <Star className={`h-4 w-4 ${rating <= reviewRating ? "fill-gold text-gold" : "text-text3"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-3 w-full resize-none rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
              placeholder="Опишите, как прошла сделка"
            />
            <div className="mt-3" aria-live="polite">
              {reviewError && <div className="text-[12px] text-danger">{reviewError}</div>}
            </div>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="mt-4 w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingReview ? "Отправляем..." : "Отправить отзыв"}
            </button>
          </form>
        )}

        {isSeller && (
          <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-text">Изображения лота</h2>
            <div className="mt-4">
              <ImageUpload lotId={lotId} existingImages={images} onImagesChange={setImages} />
            </div>
          </section>
        )}
      </section>

      <aside className="space-y-5">
        <section className="rounded-[8px] border border-border bg-surface p-5">
          <h2 className="text-[18px] font-semibold text-text">История ставок</h2>
          {bids.length === 0 ? (
            <p className="py-5 text-center text-[13px] text-text2">Пока нет ставок</p>
          ) : (
            <div className="mt-4 space-y-2">
              {bids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <div className="text-[12px] text-text2">{formatDate(bid.createdAt)}</div>
                  <div className="font-mono text-[14px] font-medium text-gold">{formatPrice(bid.amount)} ₽</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {status === "Active" && (
          <BidForm
            lotId={lotId}
            currentPrice={currentPrice}
            sellerId={sellerId}
            onBidPlaced={handleBidPlaced}
          />
        )}

        {isSeller && status === "Draft" && (
          <button
            onClick={handleSubmitForModeration}
            className="w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover"
          >
            Отправить на модерацию
          </button>
        )}
      </aside>
    </div>
  );
}
