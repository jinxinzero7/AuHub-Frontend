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
  winnerId?: string | null;
  startingPrice: number;
  currentPrice: number;
  createdAt: string;
}

export default function FrozenPage() {
  const [lots, setLots] = useState<LotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLots = () => {
    setLoading(true);
    setError(null);
    api.get(API_ENDPOINTS.ADMIN.FROZEN_LOTS)
      .then((res) => setLots(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить замороженные лоты")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchLots);
  }, []);

  const unfreeze = async (lot: LotItem) => {
    setProcessingId(lot.id);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.LOTS.UNFREEZE(lot.id));
      setLots((prev) => prev.filter((item) => item.id !== lot.id));
      setMessage(`Лот «${lot.title}» разморожен`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось разморозить лот"));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Замороженные лоты" description="Список лотов, временно остановленных администратором." />

      <div className="mb-4 space-y-2" aria-live="polite">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      {lots.length === 0 ? (
        <EmptyState title="Нет замороженных лотов" description="Когда активный лот будет заморожен, он появится здесь." />
      ) : (
        <div className="space-y-2">
          {lots.map((lot) => (
            <article key={lot.id} className="flex flex-col gap-3 rounded-[8px] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/lots/${lot.id}`} className="text-[15px] font-semibold text-text hover:text-gold">
                  {lot.title}
                </Link>
                <div className="mt-1 text-[12px] text-text2">
                  Цена: {formatPrice(lot.currentPrice ?? lot.startingPrice)} ₽
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                  <Link href={`/admin/users/${lot.sellerId}`} className="break-all text-gold hover:underline">Продавец: {lot.sellerId}</Link>
                  {lot.winnerId && <Link href={`/admin/users/${lot.winnerId}`} className="break-all text-gold hover:underline">Победитель: {lot.winnerId}</Link>}
                </div>
              </div>
              <button
                onClick={() => unfreeze(lot)}
                disabled={processingId === lot.id}
                className="rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId === lot.id ? "Обработка..." : "Разморозить"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
