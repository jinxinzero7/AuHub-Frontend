"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { PlaceBidResponse } from "@/types";

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
      setError("Необходимо авторизоваться для участия в торгах");
      return;
    }

    if (user?.id === sellerId) {
      setError("Вы не можете делать ставки на своём лоте");
      return;
    }

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount < minBid) {
      setError(`Минимальная ставка: ₽ ${minBid.toLocaleString("ru-RU")}`);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<PlaceBidResponse>(`/api/lots/${lotId}/bids`, {
        amount: bidAmount,
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        onBidPlaced(response.data.newCurrentPrice);
        setAmount("");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { errors?: { generalErrors?: string[] } } } };
      const errors = axiosError.response?.data?.errors?.generalErrors;
      setError(errors?.[0] || "Ошибка при размещении ставки");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, sellerId, amount, minBid, lotId, onBidPlaced]);

  if (!isAuthenticated) {
    return (
      <div className="bg-surface border border-border rounded-[10px] p-6">
        <h2 className="font-heading text-[18px] font-medium text-text mb-4">
          Сделать ставку
        </h2>
        <p className="text-[13px] text-text2 font-light text-center py-4">
          Функция ставок доступна после авторизации
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-[10px] p-6">
      <h2 className="font-heading text-[18px] font-medium text-text mb-4">
        Сделать ставку
      </h2>
      <p className="text-[13px] text-text2 font-light mb-4">
        Минимальная ставка: ₽ {minBid.toLocaleString("ru-RU")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`₽ ${minBid.toLocaleString("ru-RU")}`}
            min={minBid}
            step={100}
            className="w-full bg-bg border border-border rounded-[8px] px-4 py-3 text-[14px] text-text font-mono focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-400 font-light">{error}</p>
        )}
        {success && (
          <p className="text-[13px] text-green-400 font-light">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-hover text-bg font-medium py-3 rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Размещение..." : "Сделать ставку"}
        </button>
      </form>
    </div>
  );
}
