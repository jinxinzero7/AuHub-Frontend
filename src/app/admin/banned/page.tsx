"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface BannedUser {
  userId: string;
  email: string;
  name: string;
  bannedAt: string;
  reason: string;
}

export default function BannedPage() {
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api.get("/api/admin/users/banned")
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to fetch banned users:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, []);

  const unban = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/unban`);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      console.error(`Failed to unban user ${userId}:`, err);
    }
  };

  if (loading) return <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>;

  if (users.length === 0) return <div className="text-center py-12 text-text3 text-[13px]">Нет забаненных пользователей</div>;

  return (
    <div>
      <h1 className="font-heading text-[24px] font-semibold text-text mb-6">Забаненные пользователи</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.userId} className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[14px] font-medium text-text">{u.name}</div>
                <div className="text-[12px] text-text2">{u.email}</div>
              </div>
              <button
                onClick={() => unban(u.userId)}
                className="px-4 py-1.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[13px] font-medium font-ui hover:bg-gold-hover transition-colors"
              >
                Разбанить
              </button>
            </div>
            <div className="text-[12px] text-text3">
              Причина: {u.reason || "Не указана"} · {new Date(u.bannedAt).toLocaleDateString("ru-RU")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
