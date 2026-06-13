"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import api from "@/lib/api";
import { User as UserIcon, LogOut, Plus, Star } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Lot, MyBidsGroup, BalanceResponse, TransactionItem, SellerReviewsResponse } from "@/types";
import { calculateSellerPayout, formatDate, formatPrice } from "@/lib/utils";

type Tab = "lots" | "bids" | "wins" | "balance";

const lotStatusLabels: Record<string, string> = {
  CompletedNoWinner: "Без победителя",
};

function lotStatusLabel(status: string) {
  return lotStatusLabels[status] ?? status;
}

function SellerRatingBlock({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<SellerReviewsResponse | null>(null);

  useEffect(() => {
    api.get<SellerReviewsResponse>(API_ENDPOINTS.SELLERS.REVIEWS(userId))
      .then((response) => setReviews(response.data))
      .catch((err) => {
        console.error("Failed to fetch seller rating:", err);
        setReviews(null);
      });
  }, [userId]);

  return (
    <div className="mb-6 rounded-[8px] border border-border bg-bg2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] text-text2 font-light mb-1">Рейтинг продавца</div>
          <div className="flex items-center gap-2 text-[14px] text-text">
            <Star className={`w-4 h-4 ${reviews && reviews.reviewsCount > 0 ? "fill-gold text-gold" : "text-text3"}`} />
            {reviews && reviews.reviewsCount > 0 ? (
              <span>{reviews.averageRating.toFixed(1)} из 5</span>
            ) : (
              <span>Пока нет отзывов</span>
            )}
          </div>
        </div>
        <div className="text-[12px] text-text2">
          {reviews?.reviewsCount ?? 0} отзывов
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("lots");

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Необходима авторизация</h1>
            <p className="text-text2 text-[14px] font-light">Войдите, чтобы просмотреть профиль</p>
          </div>
        </main>
      </>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "lots", label: "Мои лоты" },
    { key: "bids", label: "Мои ставки" },
    { key: "wins", label: "Мои выигрыши" },
    { key: "balance", label: "Баланс" },
  ];

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-10">
          <div className="bg-surface border border-border rounded-[10px] p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-[10px] bg-gold-light border border-gold-border flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h1 className="font-heading text-[22px] font-semibold text-text">{user.name}</h1>
                <p className="text-[13px] text-text2 font-light">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[13px] text-text2 font-light">Роль</span>
                <span className="text-[13px] text-text font-medium">
                  {user.role === 1 ? "Администратор" : "Участник"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[13px] text-text2 font-light">ID</span>
                <span className="text-[13px] text-text font-mono text-[11px]">{user.id}</span>
              </div>
            </div>

            <SellerRatingBlock userId={user.id} />

            <button
              onClick={logout}
              className="w-full py-2.5 rounded-[7px] border border-border bg-transparent text-text text-[14px] font-medium cursor-pointer font-ui hover:bg-bg2 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-[7px] text-[13px] font-medium transition-colors font-ui border ${
                  tab === t.key
                    ? "bg-gold text-[#FFF8E8] border-gold"
                    : "bg-bg2 text-text2 border-border hover:border-gold"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "lots" && <MyLotsTab userId={user.id} />}
          {tab === "bids" && <MyBidsTab />}
          {tab === "wins" && <MyWinsTab userId={user.id} />}
          {tab === "balance" && <BalanceTab />}
        </div>
      </main>
    </>
  );
}

function MyLotsTab({ userId }: { userId: string }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/lots?sellerId=${userId}&includeDrafts=true`)
      .then((res) => setLots(res.data.lots ?? []))
      .catch((err) => console.error("Failed to fetch my lots:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="text-center py-8 text-text3 text-[13px]">Загрузка...</div>;

  if (lots.length === 0) return <div className="text-center py-8 text-text3 text-[13px]">У вас пока нет лотов</div>;

  return (
    <div className="space-y-2">
      {lots.map((lot) => (
        <div key={lot.id}
          className="bg-surface border border-border rounded-[10px] p-4 hover:border-gold/50 transition-colors">
          <Link href={`/lots/${lot.id}`} className="block text-[14px] font-medium text-text mb-1 hover:text-gold transition-colors">
            {lot.title}
          </Link>
          <div className="flex items-center gap-3 text-[12px] text-text2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              lot.status === "Active" ? "bg-green-100 text-green-700" :
              lot.status === "Draft" ? "bg-gray-100 text-gray-600" :
              lot.status === "PendingModeration" ? "bg-yellow-100 text-yellow-700" :
              lot.status === "Completed" ? "bg-blue-100 text-blue-700" :
              lot.status === "CompletedNoWinner" ? "bg-gray-100 text-gray-600" :
              "bg-gray-100 text-gray-600"
            }`}>{lotStatusLabel(lot.status)}</span>
            <span>{lot.currentPrice ?? lot.startingPrice} ₽</span>
            <span>{lot.bidsCount ?? 0} ставок</span>
          </div>
          <div className="mt-2 text-[12px] text-text3">
            С учетом комиссии вы получите {formatPrice(calculateSellerPayout(lot.currentPrice ?? lot.startingPrice))} ₽
          </div>
          {(lot.status === "Draft" || lot.status === "Rejected") && (
            <Link
              href={`/lots/${lot.id}/edit`}
              className="mt-3 inline-flex rounded-[7px] border border-border bg-bg2 px-3 py-1.5 text-[12px] font-medium text-text hover:border-gold transition-colors"
            >
              Редактировать
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function MyBidsTab() {
  const [groups, setGroups] = useState<MyBidsGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/bids/my")
      .then((res) => setGroups(res.data.items ?? []))
      .catch((err) => console.error("Failed to fetch my bids:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-text3 text-[13px]">Загрузка...</div>;

  if (groups.length === 0) return <div className="text-center py-8 text-text3 text-[13px]">Вы ещё не делали ставок</div>;

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <a key={g.lotId} href={`/lots/${g.lotId}`}
          className="block bg-surface border border-border rounded-[10px] p-4 hover:border-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[14px] font-medium text-text">{g.lotTitle}</div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{lotStatusLabel(g.lotStatus)}</span>
          </div>
          {g.bids.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-1 text-[13px]">
              <span className="text-text2">{formatDate(b.placedAt)}</span>
              <span className="text-text font-medium">{b.amount} ₽</span>
            </div>
          ))}
        </a>
      ))}
    </div>
  );
}

function MyWinsTab({ userId }: { userId: string }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/lots?winnerId=${userId}`)
      .then((res) => setLots(res.data.lots ?? []))
      .catch((err) => console.error("Failed to fetch my wins:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="text-center py-8 text-text3 text-[13px]">Загрузка...</div>;

  if (lots.length === 0) return <div className="text-center py-8 text-text3 text-[13px]">У вас пока нет выигранных лотов</div>;

  return (
    <div className="space-y-2">
      {lots.map((lot) => (
        <a key={lot.id} href={`/lots/${lot.id}`}
          className="block bg-surface border border-border rounded-[10px] p-4 hover:border-gold/50 transition-colors">
          <div className="text-[14px] font-medium text-text mb-1">{lot.title}</div>
          <div className="flex items-center gap-3 text-[12px] text-text2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              lot.status === "ShippingPending" ? "bg-yellow-100 text-yellow-700" :
              lot.status === "Shipped" ? "bg-blue-100 text-blue-700" :
              lot.status === "Delivered" ? "bg-green-100 text-green-700" :
              lot.status === "CompletedNoWinner" ? "bg-gray-100 text-gray-600" :
              "bg-gray-100 text-gray-600"
            }`}>{lotStatusLabel(lot.status)}</span>
            <span>{lot.currentPrice ?? lot.startingPrice} ₽</span>
          </div>
        </a>
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

  const fetchBalance = async () => {
    try {
      const res = await api.get("/api/payment/balance");
      setBalance(res.data);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/api/payment/transactions");
      setTransactions(res.data.transactions ?? res.data.items ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      Promise.all([fetchBalance(), fetchTransactions()]).finally(() => setLoading(false));
    });
  }, []);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;
    setTopUpLoading(true);
    try {
      await api.post("/api/payment/topup", { amount });
      setTopUpAmount("");
      await fetchBalance();
      await fetchTransactions();
    } catch (err) {
      console.error("Failed to top up:", err);
    } finally { setTopUpLoading(false); }
  };

  if (loading) return <div className="text-center py-8 text-text3 text-[13px]">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-[10px] p-6">
        <div className="text-[13px] text-text2 mb-1">Доступно</div>
        <div className="text-[28px] font-heading font-semibold text-text mb-4">
          {balance?.balance ?? 0} ₽
        </div>
        {balance && balance.frozenBalance > 0 && (
          <div className="text-[12px] text-text3 mb-4">Заморожено: {balance.frozenBalance} ₽</div>
        )}
        <div className="flex gap-2">
          <input
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Сумма"
            className="flex-1 px-3 py-2 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none font-ui"
          />
          <button
            onClick={handleTopUp}
            disabled={topUpLoading || !topUpAmount}
            className="px-4 py-2 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[13px] font-medium font-ui hover:bg-gold-hover transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Пополнить
          </button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-surface border border-border rounded-[10px] p-4">
          <div className="text-[13px] font-medium text-text mb-3">История операций</div>
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 text-[13px]">
                <div>
                  <span className="text-text2">{t.description}</span>
                  <span className="text-text3 ml-2">{new Date(t.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
                <span className={`font-medium ${t.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {t.amount >= 0 ? "+" : ""}{t.amount} ₽
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
