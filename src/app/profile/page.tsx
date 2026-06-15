"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Plus, Star, User as UserIcon } from "lucide-react";
import Header from "@/components/Header";
import { Alert, EmptyState, LoadingState } from "@/components/UiState";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { calculateSellerPayout, formatDate, formatPrice } from "@/lib/utils";
import type {
  BalanceResponse,
  BasicSuccessResponse,
  CreateDocumentVerificationRequest,
  DocumentVerificationRequest,
  DocumentVerificationUploadResponse,
  Lot,
  MyBidsGroup,
  SellerReviewsResponse,
  SellerTrustScoreResponse,
  TopUpCheckoutResponse,
  TransactionItem,
  User,
} from "@/types";

type Tab = "lots" | "bids" | "wins" | "balance";

const lotStatusLabels: Record<string, string> = {
  Draft: "Черновик",
  PendingModeration: "На модерации",
  Active: "Активен",
  Rejected: "Отклонён",
  Cancelled: "Отменён",
  Completed: "Завершён",
  CompletedNoWinner: "Без победителя",
  DeliveryRequestPending: "Ожидает доставку",
  ShippingPending: "Ожидает отправку",
  Shipped: "Отправлен",
  Delivered: "Доставлен",
  TransactionComplete: "Сделка завершена",
  Disputed: "Спор",
  DeliveryRequestExpired: "Доставка не запрошена",
};

function lotStatusLabel(status: string) {
  return lotStatusLabels[status] ?? status;
}

function statusClassName(status: string) {
  if (status === "Active" || status === "TransactionComplete") return "bg-green-100 text-green-700";
  if (status === "PendingModeration" || status === "DeliveryRequestPending" || status === "ShippingPending") return "bg-yellow-100 text-yellow-700";
  if (status === "Rejected" || status === "Cancelled" || status === "Disputed") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

function SellerRatingBlock({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<SellerReviewsResponse | null>(null);
  const [trust, setTrust] = useState<SellerTrustScoreResponse | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(userId)),
      api.get<SellerTrustScoreResponse>(API_ENDPOINTS.SELLERS.TRUST(userId)),
    ])
      .then(([reviewsResponse, trustResponse]) => {
        setReviews(reviewsResponse.data);
        setTrust(trustResponse.data);
      })
      .catch(() => {
        setReviews(null);
        setTrust(null);
      });
  }, [userId]);

  return (
    <section className="rounded-[8px] border border-border bg-bg2 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[12px] font-medium text-text2">Публичный рейтинг продавца</div>
          <div className="mt-1 flex items-center gap-2 text-[14px] text-text">
            <Star className={`h-4 w-4 ${reviews && reviews.reviewsCount > 0 ? "fill-gold text-gold" : "text-text3"}`} />
            {reviews && reviews.reviewsCount > 0 ? (
              <span>{reviews.averageRating.toFixed(1)} из 5, {reviews.reviewsCount} отзывов</span>
            ) : (
              <span>Пока нет отзывов</span>
            )}
          </div>
        </div>
        {trust && (
          <div className="rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px]">
            <span className="text-text2">Надёжность: </span>
            <span className="font-medium text-text">{trust.score}/100 · {trust.badge}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function VerificationControls({ user, refreshSession }: { user: User; refreshSession: () => Promise<void> }) {
  const [emailToken, setEmailToken] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const runAction = async (action: string, handler: () => Promise<void>) => {
    setError(null);
    setMessage(null);
    setLoadingAction(action);
    try {
      await handler();
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось выполнить действие"));
    } finally {
      setLoadingAction(null);
    }
  };

  if (user.isEmailVerified && user.isPhoneVerified) {
    return <Alert tone="success">Email и телефон подтверждены</Alert>;
  }

  return (
    <section className="space-y-3 rounded-[8px] border border-border bg-surface p-4">
      <h2 className="text-[16px] font-semibold text-text">Подтверждение контактов</h2>

      {!user.isEmailVerified && (
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <button
            type="button"
            onClick={() => runAction("request-email", async () => {
              await api.post<BasicSuccessResponse>(API_ENDPOINTS.AUTH.REQUEST_EMAIL_VERIFICATION);
              setMessage("Письмо подтверждения отправлено");
            })}
            disabled={loadingAction !== null}
            className="rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] font-medium text-text hover:border-gold disabled:opacity-50"
          >
            {loadingAction === "request-email" ? "Отправка..." : "Отправить email"}
          </button>
          <input
            value={emailToken}
            onChange={(e) => setEmailToken(e.target.value)}
            placeholder="Токен из письма"
            className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text3 focus:border-gold"
            autoComplete="one-time-code"
          />
          <button
            type="button"
            onClick={() => runAction("confirm-email", async () => {
              await api.post<BasicSuccessResponse>(API_ENDPOINTS.AUTH.CONFIRM_EMAIL_VERIFICATION, { token: emailToken.trim() });
              setEmailToken("");
              await refreshSession();
              setMessage("Email подтверждён");
            })}
            disabled={loadingAction !== null || !emailToken.trim()}
            className="rounded-[7px] bg-gold px-3 py-2 text-[13px] font-medium text-white hover:bg-gold-hover disabled:opacity-50"
          >
            OK
          </button>
        </div>
      )}

      {!user.isPhoneVerified && (
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <button
            type="button"
            onClick={() => runAction("request-phone", async () => {
              await api.post<BasicSuccessResponse>(API_ENDPOINTS.AUTH.REQUEST_PHONE_VERIFICATION);
              setMessage("SMS-код отправлен");
            })}
            disabled={loadingAction !== null}
            className="rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] font-medium text-text hover:border-gold disabled:opacity-50"
          >
            {loadingAction === "request-phone" ? "Отправка..." : "Отправить SMS"}
          </button>
          <input
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text3 focus:border-gold"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <button
            type="button"
            onClick={() => runAction("confirm-phone", async () => {
              await api.post<BasicSuccessResponse>(API_ENDPOINTS.AUTH.CONFIRM_PHONE_VERIFICATION, { code: phoneCode.trim() });
              setPhoneCode("");
              await refreshSession();
              setMessage("Телефон подтверждён");
            })}
            disabled={loadingAction !== null || phoneCode.length !== 6}
            className="rounded-[7px] bg-gold px-3 py-2 text-[13px] font-medium text-white hover:bg-gold-hover disabled:opacity-50"
          >
            OK
          </button>
        </div>
      )}

      <div aria-live="polite" className="space-y-2">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>
    </section>
  );
}

function DocumentVerificationControls({ user, refreshSession }: { user: User; refreshSession: () => Promise<void> }) {
  const [passportImage, setPassportImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [requests, setRequests] = useState<DocumentVerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DocumentVerificationRequest[]>(API_ENDPOINTS.AUTH.MY_DOCUMENT_VERIFICATIONS)
      .then((response) => setRequests(Array.isArray(response.data) ? response.data : []))
      .catch(() => setRequests([]));
  }, []);

  const submitRequest = async () => {
    setError(null);
    setMessage(null);

    if (!passportImage || !selfieImage) {
      setError("Загрузите разворот паспорта и селфи с паспортом");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("passportImage", passportImage);
      formData.append("selfieImage", selfieImage);

      const uploadResponse = await api.post<DocumentVerificationUploadResponse>(
        API_ENDPOINTS.AUTH.UPLOAD_DOCUMENT_VERIFICATION_FILES,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const request: CreateDocumentVerificationRequest = {
        passportImagePath: uploadResponse.data.passportImagePath,
        selfieImagePath: uploadResponse.data.selfieImagePath,
      };

      const response = await api.post<DocumentVerificationRequest>(
        API_ENDPOINTS.AUTH.CREATE_DOCUMENT_VERIFICATION,
        request,
      );
      setRequests((prev) => [response.data, ...prev]);
      setPassportImage(null);
      setSelfieImage(null);
      await refreshSession();
      setMessage("Заявка отправлена на проверку");
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось отправить заявку"));
    } finally {
      setLoading(false);
    }
  };

  const hasPendingRequest = requests.some((request) => request.status === "PendingReview") ||
    user.documentVerificationStatus === "PendingReview";
  const isVerified = user.documentVerificationStatus === "Verified";

  return (
    <section className="space-y-4 rounded-[8px] border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-text">Проверка документов</h2>
        <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${
          isVerified ? "bg-green-100 text-green-700" : hasPendingRequest ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
        }`}>
          {isVerified ? "Verified" : hasPendingRequest ? "PendingReview" : "Unverified"}
        </span>
      </div>

      {!isVerified && !hasPendingRequest && (
        <div className="grid gap-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-text2">Разворот паспорта</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPassportImage(e.target.files?.[0] ?? null)}
              className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-text2">Селфи с паспортом</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelfieImage(e.target.files?.[0] ?? null)}
              className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text"
            />
          </label>
          <button
            type="button"
            onClick={submitRequest}
            disabled={loading}
            className="rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white hover:bg-gold-hover disabled:opacity-50"
          >
            {loading ? "Отправка..." : "Отправить заявку"}
          </button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          {requests.slice(0, 3).map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-text2">{new Date(request.createdAt).toLocaleDateString("ru-RU")}</span>
              <span className="font-medium text-text">{request.status}</span>
            </div>
          ))}
        </div>
      )}

      <div aria-live="polite" className="space-y-2">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout, refreshSession } = useAuth();
  const [tab, setTab] = useState<Tab>("lots");

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="max-w-[460px]">
            <EmptyState
              title="Нужен вход"
              description="Войдите, чтобы посмотреть профиль, баланс, свои лоты и выигрыши."
              actionHref="/login"
              actionLabel="Войти"
            />
          </div>
        </main>
      </>
    );
  }

  const isAdmin = user.role === 1;
  const tabs: { key: Tab; label: string }[] = isAdmin ? [] : [
    { key: "lots", label: "Лоты" },
    { key: "bids", label: "Ставки" },
    { key: "wins", label: "Выигрыши" },
    { key: "balance", label: "Баланс" },
  ];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-bg">
        <div className="mx-auto max-w-[980px] px-4 py-8 sm:px-6">
          <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-gold-border bg-gold-light">
                  <UserIcon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h1 className="text-[24px] font-semibold text-text">{user.name}</h1>
                  <p className="text-[13px] text-text2">@{user.nickname || user.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 rounded-[7px] border border-border bg-bg2 px-4 py-2 text-[13px] font-medium text-text hover:border-gold"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>

            <div className="mt-6 grid gap-3 text-[13px] sm:grid-cols-2">
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Телефон" value={user.phoneNumber || "Не указан"} />
              <InfoRow label="Email подтверждён" value={user.isEmailVerified ? "Да" : "Нет"} tone={user.isEmailVerified ? "success" : "warning"} />
              <InfoRow label="Телефон подтверждён" value={user.isPhoneVerified ? "Да" : "Нет"} tone={user.isPhoneVerified ? "success" : "warning"} />
              <InfoRow label="Роль" value={user.role === 1 ? "Администратор" : "Участник"} />
              <InfoRow label="ID" value={user.id} mono />
            </div>
          </section>

          {isAdmin ? (
            <section className="mt-5 rounded-[8px] border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-[18px] font-semibold text-text">Админский аккаунт</h2>
              <p className="mt-2 text-[14px] leading-6 text-text2">
                Этот профиль используется для операционной работы платформы. Пополнение баланса, ставки, выигрыши и создание лотов доступны только обычным пользователям.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex rounded-[7px] bg-gold px-4 py-2.5 text-[14px] font-medium text-white hover:bg-gold-hover"
              >
                Открыть админ-раздел
              </Link>
            </section>
          ) : (
            <>
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                  <VerificationControls user={user} refreshSession={refreshSession} />
                  <DocumentVerificationControls user={user} refreshSession={refreshSession} />
                </div>
                <SellerRatingBlock userId={user.id} />
              </div>

              <div className="mt-6 flex gap-2 overflow-x-auto rounded-[8px] border border-border bg-surface p-2">
                {tabs.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`whitespace-nowrap rounded-[7px] px-4 py-2 text-[13px] font-medium transition-colors ${
                      tab === item.key ? "bg-gold text-white" : "text-text2 hover:bg-bg2 hover:text-text"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {tab === "lots" && <MyLotsTab userId={user.id} />}
                {tab === "bids" && <MyBidsTab />}
                {tab === "wins" && <MyWinsTab userId={user.id} />}
                {tab === "balance" && <BalanceTab />}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function InfoRow({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-[7px] border border-border bg-bg2 px-3 py-2">
      <span className="shrink-0 text-text2">{label}</span>
      <span className={`min-w-0 truncate text-right font-medium ${
        tone === "success" ? "text-green-600" : tone === "warning" ? "text-yellow-700" : "text-text"
      } ${mono ? "font-mono text-[11px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function MyLotsTab({ userId }: { userId: string }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/lots?sellerId=${userId}&includeDrafts=true`)
      .then((res) => setLots(res.data.lots ?? []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить ваши лоты")))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingState />;
  if (error) return <Alert>{error}</Alert>;
  if (lots.length === 0) return <EmptyState title="У вас пока нет лотов" actionHref="/lots/create" actionLabel="Создать лот" />;

  return (
    <div className="space-y-2">
      {lots.map((lot) => (
        <article key={lot.id} className="rounded-[8px] border border-border bg-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/lots/${lot.id}`} className="text-[15px] font-semibold text-text hover:text-gold">
                {lot.title}
              </Link>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-text2">
                <span className={`rounded-full px-2 py-0.5 font-medium ${statusClassName(lot.status)}`}>{lotStatusLabel(lot.status)}</span>
                <span>{formatPrice(lot.currentPrice ?? lot.startingPrice)} ₽</span>
                <span>{lot.bidsCount ?? 0} ставок</span>
              </div>
              <div className="mt-2 text-[12px] text-text3">
                С учётом комиссии вы получите {formatPrice(calculateSellerPayout(lot.currentPrice ?? lot.startingPrice))} ₽
              </div>
            </div>
            {(lot.status === "Draft" || lot.status === "Rejected") && (
              <Link
                href={`/lots/${lot.id}/edit`}
                className="rounded-[7px] border border-border bg-bg2 px-3 py-2 text-center text-[12px] font-medium text-text hover:border-gold"
              >
                Редактировать
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function MyBidsTab() {
  const [groups, setGroups] = useState<MyBidsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(API_ENDPOINTS.BIDS.MY)
      .then((res) => setGroups(res.data.items ?? []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить ваши ставки")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <Alert>{error}</Alert>;
  if (groups.length === 0) return <EmptyState title="Вы ещё не делали ставок" description="Откройте активный лот и сделайте ставку с баланса." actionHref="/" actionLabel="Смотреть лоты" />;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Link key={group.lotId} href={`/lots/${group.lotId}`} className="block rounded-[8px] border border-border bg-surface p-4 hover:border-gold">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold text-text">{group.lotTitle}</div>
            <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">{lotStatusLabel(group.lotStatus)}</span>
          </div>
          <div className="mt-3 space-y-1">
            {group.bids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-text2">{formatDate(bid.placedAt)}</span>
                <span className="font-medium text-text">{formatPrice(bid.amount)} ₽</span>
              </div>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}

function MyWinsTab({ userId }: { userId: string }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/lots?winnerId=${userId}`)
      .then((res) => setLots(res.data.lots ?? []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить выигрыши")))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingState />;
  if (error) return <Alert>{error}</Alert>;
  if (lots.length === 0) return <EmptyState title="Выигрышей пока нет" description="Когда вы выиграете лот, здесь появится карточка с действиями по доставке." />;

  return (
    <div className="space-y-2">
      {lots.map((lot) => (
        <Link key={lot.id} href={`/lots/${lot.id}`} className="block rounded-[8px] border border-border bg-surface p-4 hover:border-gold">
          <div className="font-semibold text-text">{lot.title}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-text2">
            <span className={`rounded-full px-2 py-0.5 font-medium ${statusClassName(lot.status)}`}>{lotStatusLabel(lot.status)}</span>
            <span>{formatPrice(lot.currentPrice ?? lot.startingPrice)} ₽</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function BalanceTab() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENT.BALANCE);
    setBalance(res.data);
  };

  const fetchTransactions = async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENT.TRANSACTIONS);
    setTransactions(res.data.transactions ?? res.data.items ?? []);
  };

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([fetchBalance(), fetchTransactions()]))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить баланс")))
      .finally(() => setLoading(false));
  }, []);

  const parseAmount = () => {
    const amount = parseFloat(topUpAmount);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  };

  const handleTopUp = async () => {
    const amount = parseAmount();
    if (!amount) {
      setError("Введите сумму пополнения");
      return;
    }

    setError(null);
    setMessage(null);
    setTopUpLoading(true);
    try {
      await api.post(API_ENDPOINTS.PAYMENT.TOPUP, { amount });
      setTopUpAmount("");
      await Promise.all([fetchBalance(), fetchTransactions()]);
      setMessage(`Баланс пополнен на ${formatPrice(amount)} ₽`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось пополнить баланс"));
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleProviderCheckout = async () => {
    const amount = parseAmount();
    if (!amount) {
      setError("Введите сумму пополнения");
      return;
    }

    setError(null);
    setMessage(null);
    setCheckoutLoading(true);
    try {
      const response = await api.post<TopUpCheckoutResponse>(
        API_ENDPOINTS.PAYMENT.TOPUP_CHECKOUT,
        { amount },
      );
      window.open(response.data.paymentUrl, "_blank", "noopener,noreferrer");
      setMessage("Открыта демо-страница оплаты Robokassa");
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось создать Robokassa checkout"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[13px] text-text2">Доступно</div>
            <div className="mt-1 text-[30px] font-semibold text-text">{formatPrice(balance?.balance ?? 0)} ₽</div>
          </div>
          <div>
            <div className="text-[13px] text-text2">Заморожено в ставках</div>
            <div className="mt-1 text-[30px] font-semibold text-text">{formatPrice(balance?.frozenBalance ?? 0)} ₽</div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Сумма"
            min={1}
            className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[14px] text-text outline-none placeholder:text-text3 focus:border-gold"
          />
          <button
            onClick={handleTopUp}
            disabled={topUpLoading || !topUpAmount}
            className="inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white hover:bg-gold-hover disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {topUpLoading ? "Пополнение..." : "Demo top-up"}
          </button>
          <button
            onClick={handleProviderCheckout}
            disabled={checkoutLoading || !topUpAmount}
            className="rounded-[7px] border border-border px-4 py-2 text-[13px] font-medium text-text hover:border-gold disabled:opacity-50"
          >
            {checkoutLoading ? "Создание..." : "Robokassa"}
          </button>
        </div>
      </section>

      <div aria-live="polite" className="space-y-2">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      <section className="rounded-[8px] border border-border bg-surface p-5">
        <h2 className="text-[17px] font-semibold text-text">История операций</h2>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-text2">Операций пока нет</p>
        ) : (
          <div className="mt-3 space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col gap-1 border-b border-border py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[13px] text-text">{transaction.description}</div>
                  <div className="text-[12px] text-text3">{new Date(transaction.createdAt).toLocaleDateString("ru-RU")}</div>
                </div>
                <span className={`font-medium ${transaction.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {transaction.amount >= 0 ? "+" : ""}{formatPrice(transaction.amount)} ₽
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
