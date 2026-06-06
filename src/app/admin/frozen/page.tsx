"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface LotItem {
  id: string;
  title: string;
  startingPrice: number;
  currentPrice: number;
  createdAt: string;
}

export default function FrozenPage() {
  const [lots, setLots] = useState<LotItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = () => {
    setLoading(true);
    api.get("/api/admin/lots/frozen")
      .then((res) => setLots(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to fetch frozen lots:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchLots);
  }, []);

  const unfreeze = async (id: string) => {
    try {
      await api.post(`/api/lots/${id}/unfreeze`);
      setLots((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(`Failed to unfreeze lot ${id}:`, err);
    }
  };

  if (loading) return <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>;

  if (lots.length === 0) return <div className="text-center py-12 text-text3 text-[13px]">Нет замороженных лотов</div>;

  return (
    <div>
      <h1 className="font-heading text-[24px] font-semibold text-text mb-6">Замороженные лоты</h1>
      <div className="space-y-2">
        {lots.map((lot) => (
          <div key={lot.id} className="bg-surface border border-border rounded-[10px] p-4 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-text">{lot.title}</div>
              <div className="text-[12px] text-text2">{lot.currentPrice ?? lot.startingPrice} ₽</div>
            </div>
            <button
              onClick={() => unfreeze(lot.id)}
              className="px-4 py-1.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[13px] font-medium font-ui hover:bg-gold-hover transition-colors"
            >
              Разморозить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
