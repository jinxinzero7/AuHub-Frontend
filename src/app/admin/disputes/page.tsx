"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

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

  const fetchLots = () => {
    setLoading(true);
    api.get("/api/admin/disputes")
      .then((res) => setLots(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLots(); }, []);

  const resolve = async (id: string, inFavorOfBuyer: boolean) => {
    setResolving(id);
    try {
      await api.post(`/api/lots/${id}/resolve-dispute`, { inFavorOfBuyer });
      setLots((prev) => prev.filter((l) => l.id !== id));
    } catch { /* ignore */ }
    finally { setResolving(null); }
  };

  if (loading) return <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>;

  if (lots.length === 0) return <div className="text-center py-12 text-text3 text-[13px]">Нет открытых споров</div>;

  return (
    <div>
      <h1 className="font-heading text-[24px] font-semibold text-text mb-6">Споры</h1>
      <div className="space-y-3">
        {lots.map((lot) => (
          <div key={lot.id} className="bg-surface border border-border rounded-[10px] p-5">
            <div className="mb-3">
              <h2 className="text-[15px] font-medium text-text mb-1">{lot.title}</h2>
              <div className="text-[12px] text-text2">
                Сумма: {lot.currentPrice} ₽ · Создан: {new Date(lot.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resolve(lot.id, true)}
                disabled={resolving === lot.id}
                className="px-4 py-1.5 rounded-[7px] border-none bg-green-600 text-white text-[13px] font-medium font-ui hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                В пользу покупателя
              </button>
              <button
                onClick={() => resolve(lot.id, false)}
                disabled={resolving === lot.id}
                className="px-4 py-1.5 rounded-[7px] border-none bg-blue-600 text-white text-[13px] font-medium font-ui hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                В пользу продавца
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
