"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { PlaceBidRequest, PlaceBidResponse } from "@/types";
import { formatPrice } from "@/lib/utils";

interface BidFormProps {
  lotId: string;
  currentPrice: number;
  sellerId: string;
  onBidPlaced: (newPrice: number) => void;
}

export default function BidForm({ lotId, currentPrice, sellerId, onBidPlaced }: BidFormProps) {
  const { isAuthenticated, user } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const minBid = currentPrice + 100;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      setError("Войдите в аккаунт, чтобы участвовать в торгах");
      return;
    }

    if (user?.id === sellerId) {
      setError("Нельзя делать ставки на собственный лот");
      return;
    }

    const bidAmount = parseFloat(amount);
    if (Number.isNaN(bidAmount) || bidAmount < minBid) {
      setError(`Минимальная ставка: ${formatPrice(minBid)} ₽`);
      return;
    }

    setLoading(true);
    try {
      const request: PlaceBidRequest = {
        amount: bidAmount,
        idempotencyKey: crypto.randomUUID(),
      };
      const response = await api.post<PlaceBidResponse>(`/api/lots/${lotId}/bids`, request);
      if (response.data.success) {
        setSuccess(response.data.message || "Ставка принята");
        onBidPlaced(response.data.newCurrentPrice);
        setAmount("");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { errors?: { generalErrors?: string[] } } } };
      const errors = axiosError.response?.data?.errors?.generalErrors;
      setError(errors?.[0] || "Не удалось разместить ставку");
    } finally {
      setLoading(false);
    }
  }, [amount, isAuthenticated, lotId, minBid, onBidPlaced, sellerId, user]);

  if (!isAuthenticated) {
    return (
      <section className="rounded-[8px] border border-border bg-surface p-5">
        <h2 className="text-[18px] font-semibold text-text">Участие в торгах</h2>
        <p className="mt-2 text-[13px] leading-5 text-text2">
          Ставки доступны после входа. Деньги резервируются на балансе и списываются только при победе.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex w-full items-center justify-center rounded-[7px] bg-gold px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover"
        >
          Войти и сделать ставку
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-text">Сделать ставку</h2>
          <p className="mt-1 text-[13px] text-text2">Минимум: {formatPrice(minBid)} ₽</p>
        </div>
        <span className="rounded-full border border-gold-border bg-gold-light px-3 py-1 text-[12px] font-medium text-gold">
          Live
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="bid-amount" className="mb-1.5 block text-[13px] font-medium text-text2">
            Сумма ставки
          </label>
          <input
            id="bid-amount"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            placeholder={formatPrice(minBid)}
            min={minBid}
            step={100}
            inputMode="decimal"
            className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2.5 font-mono text-[14px] text-text outline-none transition-colors placeholder:text-text3 focus:border-gold"
          />
        </div>

        <div aria-live="polite">
          {error && (
            <p className="rounded-[7px] border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-[7px] border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
              {success}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[7px] bg-gold py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Отправляем..." : "Сделать ставку"}
        </button>
      </form>
    </section>
  );
}
