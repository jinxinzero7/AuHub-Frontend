"use client";

import axios from "axios";
import { BadgeCheck, ShieldCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Alert, EmptyState, LoadingState } from "@/components/UiState";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getDocumentVerificationStatusLabel, getTrustBadgeLabel } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import type { PublicUserProfileResponse, SellerReviewsResponse, SellerTrustScoreResponse } from "@/types";

type ProfileState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | {
      status: "ready";
      profile: PublicUserProfileResponse;
      reviews: SellerReviewsResponse;
      trust: SellerTrustScoreResponse | null;
    };

export default function SellerProfileClient({ sellerId }: { sellerId: string }) {
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get<PublicUserProfileResponse>(API_ENDPOINTS.AUTH.PUBLIC_PROFILE(sellerId)),
      api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(sellerId)),
      api.get<SellerTrustScoreResponse>(API_ENDPOINTS.SELLERS.TRUST(sellerId)).catch(() => null),
    ])
      .then(([profileResponse, reviewsResponse, trustResponse]) => {
        if (!active) return;
        setState({
          status: "ready",
          profile: profileResponse.data,
          reviews: reviewsResponse.data,
          trust: trustResponse?.data ?? null,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ status: axios.isAxiosError(error) && error.response?.status === 404 ? "not-found" : "error" });
      });

    return () => {
      active = false;
    };
  }, [sellerId]);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-bg">
        <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-8 sm:py-10">
          {state.status === "loading" && <LoadingState label="Загружаем профиль продавца..." />}

          {state.status === "not-found" && (
            <EmptyState
              title="Продавец не найден"
              description="Возможно, профиль был удалён или ссылка устарела."
              actionHref="/"
              actionLabel="Вернуться к каталогу"
            />
          )}

          {state.status === "error" && (
            <Alert>Не удалось загрузить профиль продавца. Обновите страницу и попробуйте снова.</Alert>
          )}

          {state.status === "ready" && (
            <div className="space-y-6">
              <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[13px] text-text2">Продавец</p>
                    <h1 className="mt-1 text-[26px] font-semibold text-text">
                      {state.profile.nickname ? `@${state.profile.nickname}` : state.profile.name}
                    </h1>
                    {state.profile.name && state.profile.name !== state.profile.nickname && (
                      <p className="mt-1 text-[14px] text-text2">{state.profile.name}</p>
                    )}
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[12px] text-text2">
                    {state.profile.documentVerificationStatus === "Verified" && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                    {getDocumentVerificationStatusLabel(state.profile.documentVerificationStatus)}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[7px] border border-border bg-bg2 p-4">
                    <div className="flex items-center gap-2 text-[13px] text-text2">
                      <Star className={`h-4 w-4 ${state.reviews.reviewsCount > 0 ? "fill-amber-400 text-amber-400" : "text-text3"}`} />
                      Рейтинг продавца
                    </div>
                    <p className="mt-2 text-[20px] font-semibold text-text">
                      {state.reviews.reviewsCount > 0 ? `${state.reviews.averageRating.toFixed(1)} из 5` : "Пока без оценок"}
                    </p>
                    <p className="mt-1 text-[12px] text-text3">Отзывов: {state.reviews.reviewsCount}</p>
                  </div>

                  <div className="rounded-[7px] border border-border bg-bg2 p-4">
                    <div className="flex items-center gap-2 text-[13px] text-text2">
                      <ShieldCheck className="h-4 w-4 text-gold" />
                      Надёжность
                    </div>
                    <p className="mt-2 text-[20px] font-semibold text-text">
                      {state.trust ? `${state.trust.score}/100` : "Формируется"}
                    </p>
                    <p className="mt-1 text-[12px] text-text3">
                      {state.trust ? getTrustBadgeLabel(state.trust.badge) : "Оценка пока недоступна"}
                    </p>
                  </div>
                </div>
              </section>

              <section aria-labelledby="seller-reviews-title">
                <h2 id="seller-reviews-title" className="mb-3 text-[20px] font-semibold text-text">Отзывы</h2>
                {state.reviews.reviews.length === 0 ? (
                  <EmptyState title="Отзывов пока нет" description="После завершённых сделок здесь появятся оценки покупателей." />
                ) : (
                  <div className="space-y-3">
                    {state.reviews.reviews.map((review) => (
                      <article key={review.id} className="rounded-[8px] border border-border bg-surface p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1" aria-label={`Оценка: ${review.rating} из 5`}>
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-border2"}`} />
                            ))}
                          </div>
                          <time className="text-[12px] text-text3" dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                        </div>
                        <p className="mt-3 text-[14px] leading-6 text-text2">
                          {review.comment?.trim() || "Покупатель оставил оценку без комментария."}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section aria-labelledby="seller-lots-title">
                <h2 id="seller-lots-title" className="mb-3 text-[20px] font-semibold text-text">Активные лоты</h2>
                <EmptyState title="Лоты появятся позже" description="Публичная витрина продавца пока недоступна." />
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
