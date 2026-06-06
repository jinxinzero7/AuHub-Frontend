"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

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

  const fetchLots = () => {
    setLoading(true);
    api.get("/api/admin/lots/pending")
      .then((res) => setLots(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to fetch pending lots:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchLots);
  }, []);

  const approve = async (id: string) => {
    try {
      await api.post(`/api/lots/${id}/approve`);
      setLots((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(`Failed to approve lot ${id}:`, err);
    }
  };

  const reject = async (id: string) => {
    const reason = rejectReason[id];
    if (!reason?.trim()) return;
    try {
      await api.post(`/api/lots/${id}/reject`, { reason });
      setLots((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(`Failed to reject lot ${id}:`, err);
    }
  };

  if (loading) return <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>;

  if (lots.length === 0) return <div className="text-center py-12 text-text3 text-[13px]">Нет лотов на модерации</div>;

  return (
    <div>
      <h1 className="font-heading text-[24px] font-semibold text-text mb-6">Модерация лотов</h1>
      <div className="space-y-3">
        {lots.map((lot) => (
          <div key={lot.id} className="bg-surface border border-border rounded-[10px] p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-medium text-text mb-1">{lot.title}</h2>
                <p className="text-[13px] text-text2 line-clamp-2 mb-2">{lot.description}</p>
                <div className="text-[12px] text-text3">
                  Старт: {lot.startingPrice} ₽ · {new Date(lot.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => approve(lot.id)}
                className="px-4 py-1.5 rounded-[7px] border-none bg-green-600 text-white text-[13px] font-medium font-ui hover:bg-green-700 transition-colors"
              >
                Одобрить
              </button>
              <input
                value={rejectReason[lot.id] ?? ""}
                onChange={(e) => setRejectReason((prev) => ({ ...prev, [lot.id]: e.target.value }))}
                placeholder="Причина отклонения"
                className="flex-1 px-3 py-1.5 text-[13px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none font-ui"
              />
              <button
                onClick={() => reject(lot.id)}
                disabled={!rejectReason[lot.id]?.trim()}
                className="px-4 py-1.5 rounded-[7px] border border-danger text-danger text-[13px] font-medium font-ui hover:bg-danger-bg transition-colors disabled:opacity-30"
              >
                Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
