"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSignalR } from "@/hooks/useSignalR";
import BidForm from "@/components/BidForm";
import ImageUpload from "@/components/ImageUpload";
import { calculateSellerPayout, calculateServiceFee, formatPrice, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Bid, SellerReviewsResponse } from "@/types";

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
  trackingNumber?: string;
  selectedDeliveryProvider?: string;
  deliveryRequestDeadlineAt?: string;
  currentTime: string;
  supportedDeliveryProviders: string[];
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
  winnerId,
  status,
  startTime,
  endTime,
  trackingNumber,
  selectedDeliveryProvider,
  deliveryRequestDeadlineAt,
  currentTime,
  supportedDeliveryProviders,
  initialBids,
  initialImages,
}: LotDetailClientProps) {
  const { user } = useAuth();
  const isSeller = user?.id === sellerId;
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [images, setImages] = useState<LotImage[]>(initialImages);
  const [newBidNotification, setNewBidNotification] = useState<string | null>(null);
  const [deliveryProvider, setDeliveryProvider] = useState(supportedDeliveryProviders[0] ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [recipientName, setRecipientName] = useState(user?.name ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [isRequestingDelivery, setIsRequestingDelivery] = useState(false);
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isShipping, setIsShipping] = useState(false);
  const [sellerReviews, setSellerReviews] = useState<SellerReviewsResponse | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const refreshSellerReviews = useCallback(async () => {
    try {
      const response = await api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(sellerId));
      setSellerReviews(response.data);
    } catch (err) {
      console.error("Failed to fetch seller reviews:", err);
      setSellerReviews(null);
    }
  }, [sellerId]);

  useEffect(() => {
    let isMounted = true;
    api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(sellerId))
      .then((response) => {
        if (isMounted) setSellerReviews(response.data);
      })
      .catch((err) => {
        console.error("Failed to fetch seller reviews:", err);
        if (isMounted) setSellerReviews(null);
      });

    return () => {
      isMounted = false;
    };
  }, [sellerId]);

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

  const handleRequestDelivery = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeliveryError(null);

    if (!deliveryProvider) {
      setDeliveryError("Выберите службу доставки");
      return;
    }

    if (!deliveryAddress.trim() || !recipientName.trim() || !recipientPhone.trim()) {
      setDeliveryError("Заполните данные для доставки");
      return;
    }

    setIsRequestingDelivery(true);
    try {
      await api.post(`/api/lots/${lotId}/delivery-request`, {
        provider: deliveryProvider,
        address: deliveryAddress.trim(),
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
  }, [deliveryAddress, deliveryProvider, lotId, recipientName, recipientPhone]);

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
  const deliveryProviderLabels: Record<string, string> = {
    Cdek: "СДЭК",
    YandexDelivery: "Яндекс Доставка",
    RussianPost: "Почта России",
  };
  const isDeliveryDeadlineExpired = deliveryRequestDeadlineAt
    ? Date.parse(deliveryRequestDeadlineAt) < Date.parse(currentTime)
    : false;
  const canRequestDelivery = user?.id === winnerId && status === "DeliveryRequestPending" && !isDeliveryDeadlineExpired;
  const canShipLot = isSeller && status === "ShippingPending";
  const canEditLot = isSeller && (status === "Draft" || status === "Rejected");
  const serviceFee = calculateServiceFee(currentPrice);
  const sellerPayout = calculateSellerPayout(currentPrice);
  const existingReview = sellerReviews?.reviews.find((review) => review.lotId === lotId);
  const canReviewSeller = sellerReviews !== null && user?.id === winnerId && status === "TransactionComplete" && !existingReview;

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

          {isSeller && (
            <div className="mt-4 rounded-[8px] border border-border bg-bg2 px-4 py-3 text-[13px]">
              <div className="flex items-center justify-between gap-3 text-text2">
                <span>Комиссия сервиса 1%</span>
                <span>₽ {formatPrice(serviceFee)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-text font-medium">
                <span>Вы получите</span>
                <span>₽ {formatPrice(sellerPayout)}</span>
              </div>
            </div>
          )}

          {supportedDeliveryProviders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[12px] text-text2 font-light mb-2">Доставка:</div>
              <div className="flex flex-wrap gap-2">
                {supportedDeliveryProviders.map((provider) => (
                  <span key={provider} className="text-[12px] px-2 py-1 rounded-[6px] bg-bg2 text-text border border-border">
                    {deliveryProviderLabels[provider] ?? provider}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] text-text2 font-light mb-1">Рейтинг продавца</div>
                <div className="flex items-center gap-2 text-[14px] text-text">
                  <Star className={`w-4 h-4 ${sellerReviews && sellerReviews.reviewsCount > 0 ? "fill-gold text-gold" : "text-text3"}`} />
                  {sellerReviews && sellerReviews.reviewsCount > 0 ? (
                    <span>{sellerReviews.averageRating.toFixed(1)} из 5</span>
                  ) : (
                    <span>Пока нет отзывов</span>
                  )}
                </div>
              </div>
              <div className="text-[12px] text-text2">
                {sellerReviews?.reviewsCount ?? 0} отзывов
              </div>
            </div>
          </div>

          {canRequestDelivery && (
            <form onSubmit={handleRequestDelivery} className="mt-5 pt-5 border-t border-border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-[16px] font-medium text-text">Запросить доставку</h2>
                {deliveryRequestDeadlineAt && (
                  <span className="text-[11px] text-text3">
                    до {formatDate(deliveryRequestDeadlineAt)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] text-text2 mb-1">Служба доставки</span>
                  <select
                    value={deliveryProvider}
                    onChange={(event) => setDeliveryProvider(event.target.value)}
                    className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                  >
                    {supportedDeliveryProviders.map((provider) => (
                      <option key={provider} value={provider}>
                        {deliveryProviderLabels[provider] ?? provider}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[12px] text-text2 mb-1">Телефон получателя</span>
                  <input
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                    placeholder="+7..."
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-[12px] text-text2 mb-1">Получатель</span>
                <input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                />
              </label>

              <label className="block">
                <span className="block text-[12px] text-text2 mb-1">ПВЗ или адрес</span>
                <textarea
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  rows={3}
                  className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text outline-none focus:border-gold resize-none"
                />
              </label>

              {deliveryError && (
                <div className="text-[12px] text-danger">{deliveryError}</div>
              )}

              <button
                type="submit"
                disabled={isRequestingDelivery}
                className="w-full bg-gold hover:bg-gold-hover disabled:opacity-60 disabled:cursor-not-allowed text-bg font-medium py-3 rounded-[8px] transition-colors"
              >
                {isRequestingDelivery ? "Отправка..." : "Запросить доставку"}
              </button>
            </form>
          )}

          {canShipLot && (
            <form onSubmit={handleShipLot} className="mt-5 pt-5 border-t border-border space-y-3">
              <div>
                <h2 className="font-heading text-[16px] font-medium text-text">Отправить лот</h2>
                <p className="text-[12px] text-text2 mt-1">
                  Покупатель запросил доставку
                  {selectedDeliveryProvider ? ` через ${deliveryProviderLabels[selectedDeliveryProvider] ?? selectedDeliveryProvider}` : ""}.
                </p>
              </div>

              <label className="block">
                <span className="block text-[12px] text-text2 mb-1">Трек-номер или номер отправления</span>
                <input
                  value={shippingTrackingNumber}
                  onChange={(event) => setShippingTrackingNumber(event.target.value)}
                  className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text outline-none focus:border-gold"
                />
              </label>

              {shippingError && (
                <div className="text-[12px] text-danger">{shippingError}</div>
              )}

              <button
                type="submit"
                disabled={isShipping}
                className="w-full bg-gold hover:bg-gold-hover disabled:opacity-60 disabled:cursor-not-allowed text-bg font-medium py-3 rounded-[8px] transition-colors"
              >
                {isShipping ? "Отправка..." : "Отметить как отправленный"}
              </button>
            </form>
          )}

          {status === "Shipped" && trackingNumber && (
            <div className="mt-5 pt-5 border-t border-border">
              <div className="text-[12px] text-text2 font-light mb-1">Отправление:</div>
              <div className="text-[13px] text-text font-medium">{trackingNumber}</div>
            </div>
          )}

          {existingReview && (
            <div className="mt-5 pt-5 border-t border-border">
              <div className="text-[12px] text-text2 font-light mb-1">Отзыв по сделке</div>
              <div className="flex items-center gap-1 text-gold mb-2">
                {Array.from({ length: existingReview.rating }).map((_, index) => (
                  <Star key={index} className="w-4 h-4 fill-gold" />
                ))}
              </div>
              {existingReview.comment && (
                <p className="text-[13px] text-text2 leading-relaxed">{existingReview.comment}</p>
              )}
            </div>
          )}

          {canReviewSeller && (
            <form onSubmit={handleCreateReview} className="mt-5 pt-5 border-t border-border space-y-3">
              <h2 className="font-heading text-[16px] font-medium text-text">Оставить отзыв продавцу</h2>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    className="w-8 h-8 rounded-[6px] border border-border bg-bg2 flex items-center justify-center hover:border-gold transition-colors"
                    aria-label={`${rating} из 5`}
                  >
                    <Star className={`w-4 h-4 ${rating <= reviewRating ? "fill-gold text-gold" : "text-text3"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text outline-none focus:border-gold resize-none"
                placeholder="Опишите, как прошла сделка"
              />
              {reviewError && (
                <div className="text-[12px] text-danger">{reviewError}</div>
              )}
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-gold hover:bg-gold-hover disabled:opacity-60 disabled:cursor-not-allowed text-bg font-medium py-3 rounded-[8px] transition-colors"
              >
                {isSubmittingReview ? "Отправка..." : "Отправить отзыв"}
              </button>
            </form>
          )}

          {isSeller && status === "Draft" && (
            <button
              onClick={handleSubmitForModeration}
              className="mt-4 w-full bg-gold hover:bg-gold-hover text-bg font-medium py-3 rounded-[8px] transition-colors"
            >
              Отправить на модерацию
            </button>
          )}

          {canEditLot && (
            <Link
              href={`/lots/${lotId}/edit`}
              className="mt-3 block w-full text-center bg-bg2 hover:border-gold border border-border text-text font-medium py-3 rounded-[8px] transition-colors"
            >
              Редактировать лот
            </Link>
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
