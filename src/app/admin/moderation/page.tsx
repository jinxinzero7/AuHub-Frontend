"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/UiState";
import { formatPrice } from "@/lib/utils";

interface LotItem {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: string;
  createdAt: string;
}

export default function ModerationPage() {
  const [lots, setLots] = useState<LotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchLots = () => {
    setLoading(true);
    setError(null);
    api.get(API_ENDPOINTS.ADMIN.PENDING_LOTS)
      .then((res) => setLots(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить лоты на модерации")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchLots);
  }, []);

  const approve = async (lot: LotItem) => {
    setProcessingId(lot.id);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.LOTS.APPROVE(lot.id));
      setLots((prev) => prev.filter((item) => item.id !== lot.id));
      setMessage(`Лот «${lot.title}» одобрен и опубликован`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось одобрить лот"));
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (lot: LotItem) => {
    const reason = rejectReason[lot.id]?.trim();
    if (!reason) {
      setError("Укажите причину отклонения");
      return;
    }

    setProcessingId(lot.id);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.LOTS.REJECT(lot.id), { reason });
      setLots((prev) => prev.filter((item) => item.id !== lot.id));
      setMessage(`Лот «${lot.title}» отклонён`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось отклонить лот"));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Модерация лотов"
        description="Проверьте описание и цену. После одобрения лот сразу становится активным для покупателей."
      />

      <div className="mb-4 space-y-2" aria-live="polite">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      {lots.length === 0 ? (
        <EmptyState title="Нет лотов на модерации" description="Когда продавец отправит черновик, он появится в этом списке." />
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <article key={lot.id} className="rounded-[8px] border border-border bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/lots/${lot.id}`} className="text-[16px] font-semibold text-text hover:text-gold">
                    {lot.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-text2">{lot.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-text3">
                    <span>Старт: {formatPrice(lot.startingPrice)} ₽</span>
                    <span>Создан: {new Date(lot.createdAt).toLocaleDateString("ru-RU")}</span>
                    <span className="break-all">Seller: {lot.sellerId}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <button
                  onClick={() => approve(lot)}
                  disabled={processingId === lot.id}
                  className="rounded-[7px] bg-green-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === lot.id ? "Обработка..." : "Одобрить"}
                </button>
                <input
                  value={rejectReason[lot.id] ?? ""}
                  onChange={(e) => setRejectReason((prev) => ({ ...prev, [lot.id]: e.target.value }))}
                  placeholder="Причина отклонения"
                  className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text3 focus:border-gold"
                />
                <button
                  onClick={() => reject(lot)}
                  disabled={processingId === lot.id || !rejectReason[lot.id]?.trim()}
                  className="rounded-[7px] border border-danger px-4 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Отклонить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
