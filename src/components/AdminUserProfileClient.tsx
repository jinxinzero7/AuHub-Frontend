"use client";

import axios from "axios";
import { Ban, Check, Copy, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert, EmptyState, LoadingState } from "@/components/UiState";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { getDocumentVerificationStatusLabel, getLotStatusLabel, getRoleLabel, getTrustBadgeLabel, getTrustScoreReasonLabel } from "@/lib/labels";
import { formatDate, formatPrice } from "@/lib/utils";
import type { AdminUserActivityResponse, AdminUserDetailResponse } from "@/types";

const PAGE_SIZE = 20;

type DetailState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "forbidden" }
  | { status: "error" }
  | { status: "ready"; data: AdminUserDetailResponse };

type ActivityState =
  | { status: "loading"; page: number }
  | { status: "error"; page: number }
  | { status: "ready"; page: number; data: AdminUserActivityResponse };

function statusFromError(error: unknown): "not-found" | "forbidden" | "error" {
  if (!axios.isAxiosError(error)) return "error";
  if (error.response?.status === 404) return "not-found";
  if (error.response?.status === 403) return "forbidden";
  return "error";
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="text-[12px] text-text3">{label}</div>
      <div className="mt-1 break-words text-[14px] font-medium text-text">{value}</div>
    </div>
  );
}

export default function AdminUserProfileClient({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<DetailState>({ status: "loading" });
  const [activityPage, setActivityPage] = useState(1);
  const [activity, setActivity] = useState<ActivityState>({ status: "loading", page: 1 });
  const [banReason, setBanReason] = useState("");
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const response = await api.get<AdminUserDetailResponse>(API_ENDPOINTS.ADMIN.USER_DETAIL(userId));
      setDetail({ status: "ready", data: response.data });
      setBanReason(response.data.banReason ?? "");
    } catch (error) {
      setDetail({ status: statusFromError(error) });
    }
  }, [userId]);

  useEffect(() => {
    void Promise.resolve().then(loadDetail);
  }, [loadDetail]);

  useEffect(() => {
    let active = true;
    api.get<AdminUserActivityResponse>(API_ENDPOINTS.ADMIN.USER_ACTIVITY(userId), {
      params: { page: activityPage, pageSize: PAGE_SIZE },
    })
      .then((response) => {
        if (active) setActivity({ status: "ready", page: activityPage, data: response.data });
      })
      .catch(() => {
        if (active) setActivity({ status: "error", page: activityPage });
      });
    return () => {
      active = false;
    };
  }, [activityPage, userId]);

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const changeBanState = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (detail.status !== "ready") return;
    const isUnban = detail.data.isBanned;
    const reason = banReason.trim();
    if (!isUnban && !reason) {
      setMutationError("Укажите причину блокировки");
      return;
    }

    setMutationPending(true);
    setMutationError(null);
    setMutationMessage(null);
    try {
      if (isUnban) {
        await api.post(API_ENDPOINTS.ADMIN.UNBAN(userId));
      } else {
        await api.post(API_ENDPOINTS.ADMIN.BAN(userId), { reason });
      }
      await loadDetail();
      setMutationMessage(isUnban ? "Пользователь разблокирован" : "Пользователь заблокирован");
    } catch (error) {
      setMutationError(getApiErrorMessage(error, isUnban ? "Не удалось разблокировать пользователя" : "Не удалось заблокировать пользователя"));
    } finally {
      setMutationPending(false);
    }
  };

  if (detail.status === "loading") return <LoadingState label="Загружаем профиль пользователя..." />;
  if (detail.status === "not-found") {
    return <EmptyState title="Пользователь не найден" description="Проверьте ID или вернитесь к списку пользователей." actionHref="/admin/banned" actionLabel="К пользователям" />;
  }
  if (detail.status === "forbidden") {
    return <EmptyState title="Недостаточно прав" description="Профили пользователей доступны только администраторам платформы." actionHref="/" actionLabel="На главную" />;
  }
  if (detail.status === "error") return <Alert>Не удалось загрузить профиль пользователя. Обновите страницу и попробуйте снова.</Alert>;

  const user = detail.data;
  const isActivityLoading = activity.status === "loading" || activity.page !== activityPage;

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-text3">
              <span>{getRoleLabel(user.role)}</span>
              <span>·</span>
              <span className={user.isBanned ? "text-danger" : "text-green-700"}>{user.isBanned ? "Заблокирован" : "Активен"}</span>
            </div>
            <h1 className="mt-2 text-[26px] font-semibold text-text">{user.name || user.nickname || "Без имени"}</h1>
            {user.nickname && <p className="mt-1 text-[14px] text-text2">@{user.nickname}</p>}
          </div>
          <button type="button" onClick={copyUserId} title="Скопировать ID пользователя" className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] border border-border text-text2 hover:border-gold hover:text-gold">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Скопировать ID пользователя</span>
          </button>
        </div>
        <p className="mt-4 break-all font-mono text-[12px] text-text3">{user.userId}</p>
      </header>

      <section aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-[19px] font-semibold text-text">Аккаунт</h2>
        <div className="mt-3 grid border-y border-border sm:grid-cols-2 sm:gap-x-8">
          <InfoItem label="Email" value={user.email || "Не указан"} />
          <InfoItem label="Email подтверждён" value={user.isEmailVerified ? `Да${user.emailVerifiedAt ? `, ${formatDate(user.emailVerifiedAt)}` : ""}` : "Нет"} />
          <InfoItem label="Телефон" value={user.phoneNumber || "Не указан"} />
          <InfoItem label="Телефон подтверждён" value={user.isPhoneVerified ? `Да${user.phoneVerifiedAt ? `, ${formatDate(user.phoneVerifiedAt)}` : ""}` : "Нет"} />
          <InfoItem label="Создан" value={formatDate(user.createdAt)} />
          <InfoItem label="Обновлён" value={user.updatedAt ? formatDate(user.updatedAt) : "Нет данных"} />
        </div>
      </section>

      <section aria-labelledby="moderation-heading">
        <div className="flex items-center gap-2">
          {user.isBanned ? <Ban className="h-5 w-5 text-danger" /> : <UserCheck className="h-5 w-5 text-green-700" />}
          <h2 id="moderation-heading" className="text-[19px] font-semibold text-text">Модерация</h2>
        </div>
        <div className="mt-3 space-y-3" aria-live="polite">
          {mutationMessage && <Alert tone="success">{mutationMessage}</Alert>}
          {mutationError && <Alert>{mutationError}</Alert>}
        </div>
        <form onSubmit={changeBanState} className="mt-4 border-y border-border py-4">
          {user.isBanned ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] text-text2">Причина: {user.banReason || "не указана"}</p>
                {user.bannedAt && <p className="mt-1 text-[12px] text-text3">С {formatDate(user.bannedAt)}</p>}
              </div>
              <button type="submit" disabled={mutationPending} className="rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white hover:bg-gold-hover disabled:opacity-50">
                {mutationPending ? "Обработка..." : "Разблокировать"}
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label>
                <span className="mb-1 block text-[12px] text-text2">Причина блокировки</span>
                <input value={banReason} onChange={(event) => setBanReason(event.target.value)} className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none focus:border-gold" />
              </label>
              <button type="submit" disabled={mutationPending} className="self-end rounded-[7px] bg-danger px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50">
                {mutationPending ? "Обработка..." : "Заблокировать"}
              </button>
            </div>
          )}
        </form>
      </section>

      <section aria-labelledby="documents-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="documents-heading" className="text-[19px] font-semibold text-text">Проверка документов</h2>
          <span className="rounded-[7px] border border-border bg-bg2 px-3 py-1.5 text-[12px] text-text2">{getDocumentVerificationStatusLabel(user.documentVerificationStatus)}</span>
        </div>
        {user.documentVerificationHistory.length === 0 ? (
          <p className="mt-3 border-y border-border py-5 text-[13px] text-text2">Заявок на проверку документов нет.</p>
        ) : (
          <div className="mt-3 divide-y divide-border border-y border-border">
            {user.documentVerificationHistory.map((request) => (
              <div key={request.requestId} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[13px] font-medium text-text">{getDocumentVerificationStatusLabel(request.status)}</div>
                  <div className="mt-1 text-[12px] text-text3">Отправлена {formatDate(request.createdAt)}</div>
                  {request.rejectionReason && <div className="mt-1 text-[12px] text-danger">Причина: {request.rejectionReason}</div>}
                </div>
                <Link href="/admin/documents" className="text-[13px] font-medium text-gold hover:underline">Открыть раздел документов</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-[19px] font-semibold text-text">Активность на площадке</h2>
        {isActivityLoading && <div className="mt-3"><LoadingState label="Загружаем активность..." /></div>}
        {!isActivityLoading && activity.status === "error" && <div className="mt-3"><Alert>Активность временно недоступна. Данные аккаунта загружены.</Alert></div>}
        {!isActivityLoading && activity.status === "ready" && (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Лоты", activity.data.createdLotsCount],
                ["Ставки", activity.data.bidsCount],
                ["Победы", activity.data.winsCount],
                ["Активные сделки", activity.data.activeDealsCount],
              ].map(([label, value]) => (
                <div key={String(label)} className="border-l-2 border-gold pl-3">
                  <div className="text-[12px] text-text3">{label}</div>
                  <div className="mt-1 text-[20px] font-semibold text-text">{value}</div>
                </div>
              ))}
            </div>

            {activity.data.createdLots.items.length === 0 ? (
              <p className="border-y border-border py-5 text-[13px] text-text2">Пользователь ещё не создавал лоты.</p>
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {activity.data.createdLots.items.map((lot) => (
                  <div key={lot.lotId} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link href={`/lots/${lot.lotId}`} className="text-[14px] font-medium text-text hover:text-gold">{lot.title}</Link>
                      <div className="mt-1 text-[12px] text-text3">{getLotStatusLabel(lot.status)} · {formatPrice(lot.currentPrice)} ₽ · ставок {lot.bidsCount}</div>
                    </div>
                    <span className="text-[12px] text-text3">{formatDate(lot.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}

            {activity.data.createdLots.totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3" aria-label="Страницы лотов пользователя">
                <button type="button" onClick={() => setActivityPage((page) => Math.max(1, page - 1))} disabled={activity.data.createdLots.page <= 1} className="rounded-[7px] border border-border px-3 py-2 text-[13px] text-text2 disabled:opacity-40">Назад</button>
                <span className="text-[13px] text-text2">{activity.data.createdLots.page} из {activity.data.createdLots.totalPages}</span>
                <button type="button" onClick={() => setActivityPage((page) => Math.min(activity.data.createdLots.totalPages, page + 1))} disabled={activity.data.createdLots.page >= activity.data.createdLots.totalPages} className="rounded-[7px] border border-border px-3 py-2 text-[13px] text-text2 disabled:opacity-40">Вперёд</button>
              </nav>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-[15px] font-semibold text-text">Последние ставки</h3>
                {activity.data.recentBids.length === 0 ? <p className="mt-3 text-[13px] text-text2">Ставок нет.</p> : (
                  <div className="mt-2 divide-y divide-border">
                    {activity.data.recentBids.map((bid) => <div key={bid.bidId} className="py-3 text-[13px] text-text2"><Link href={`/lots/${bid.lotId}`} className="font-medium text-text hover:text-gold">{bid.lotTitle}</Link><div className="mt-1 text-[12px] text-text3">{formatPrice(bid.amount)} ₽ · {formatDate(bid.placedAt)}</div></div>)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text"><ShieldCheck className="h-4 w-4 text-gold" />Репутация</h3>
                <div className="mt-3 text-[13px] text-text2">Рейтинг: {activity.data.sellerRating.reviewsCount ? `${activity.data.sellerRating.averageRating.toFixed(1)} (${activity.data.sellerRating.reviewsCount})` : "без отзывов"}</div>
                <div className="mt-1 text-[13px] text-text2">Надёжность: {activity.data.sellerTrust.score}/100 · {getTrustBadgeLabel(activity.data.sellerTrust.badge)}</div>
                <div className="mt-3 divide-y divide-border">
                  {activity.data.recentTrustEvents.map((event) => <div key={event.eventId} className="py-3"><div className="flex justify-between gap-3 text-[13px]"><span className="text-text">{getTrustScoreReasonLabel(event.reason)}</span><span className={event.points >= 0 ? "text-green-700" : "text-danger"}>{event.points > 0 ? "+" : ""}{event.points}</span></div><div className="mt-1 text-[12px] text-text3">{formatDate(event.createdAt)}</div></div>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
