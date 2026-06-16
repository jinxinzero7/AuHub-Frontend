"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/utils";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/UiState";

interface LotItem {
  id: string;
  title: string;
  sellerId: string;
  winnerId: string | null;
  currentPrice: number;
  createdAt: string;
}

export default function DisputesPage() {
  const [lots, setLots] = useState<LotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLots = () => {
    setLoading(true);
    setError(null);
    api.get(API_ENDPOINTS.ADMIN.DISPUTES)
      .then((res) => setLots(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить споры")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchLots);
  }, []);

  const resolve = async (lot: LotItem, inFavorOfBuyer: boolean) => {
    setResolving(lot.id);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.LOTS.RESOLVE_DISPUTE(lot.id), { inFavorOfBuyer });
      setLots((prev) => prev.filter((item) => item.id !== lot.id));
      setMessage(`Спор по лоту «${lot.title}» решён в пользу ${inFavorOfBuyer ? "покупателя" : "продавца"}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось решить спор"));
    } finally {
      setResolving(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Споры"
        description="Решение спора завершает escrow-сценарий: покупатель получает возврат или продавец получает выплату."
      />

      <div className="mb-4 space-y-2" aria-live="polite">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      {lots.length === 0 ? (
        <EmptyState title="Нет открытых споров" description="Споры появятся здесь после обращения победителя сделки." />
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <article key={lot.id} className="rounded-[8px] border border-border bg-surface p-5">
              <Link href={`/lots/${lot.id}`} className="text-[16px] font-semibold text-text hover:text-gold">
                {lot.title}
              </Link>
              <div className="mt-3 grid gap-2 text-[12px] text-text2 sm:grid-cols-2">
                <span>Сумма: {formatPrice(lot.currentPrice)} ₽</span>
                <span>Создан: {new Date(lot.createdAt).toLocaleDateString("ru-RU")}</span>
                <span className="break-all">Продавец: {lot.sellerId}</span>
                <span className="break-all">Победитель: {lot.winnerId ?? "нет"}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => resolve(lot, true)}
                  disabled={resolving === lot.id}
                  className="rounded-[7px] bg-green-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resolving === lot.id ? "Обработка..." : "В пользу покупателя"}
                </button>
                <button
                  onClick={() => resolve(lot, false)}
                  disabled={resolving === lot.id}
                  className="rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resolving === lot.id ? "Обработка..." : "В пользу продавца"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
