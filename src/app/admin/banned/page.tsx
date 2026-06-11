"use client";

import { useEffect, useState, type FormEvent } from "react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

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
  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banError, setBanError] = useState<string | null>(null);
  const [banning, setBanning] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.ADMIN.BANNED_USERS)
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to fetch banned users:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, []);

  const ban = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBanError(null);

    const userId = banUserId.trim();
    if (!userId) {
      setBanError("Укажите ID пользователя");
      return;
    }

    setBanning(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN.BAN(userId), {
        reason: banReason.trim() || "Нарушение правил платформы",
      });
      setBanUserId("");
      setBanReason("");
      fetchUsers();
    } catch (err) {
      console.error(`Failed to ban user ${userId}:`, err);
      setBanError("Не удалось забанить пользователя");
    } finally {
      setBanning(false);
    }
  };

  const unban = async (userId: string) => {
    try {
      await api.post(API_ENDPOINTS.ADMIN.UNBAN(userId));
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      console.error(`Failed to unban user ${userId}:`, err);
    }
  };

  const renderUsers = () => {
    if (loading) {
      return <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>;
    }

    if (users.length === 0) {
      return <div className="text-center py-12 text-text3 text-[13px]">Нет забаненных пользователей</div>;
    }

    return (
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.userId} className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-text truncate">{u.name}</div>
                <div className="text-[12px] text-text2 truncate">{u.email}</div>
              </div>
              <button
                onClick={() => unban(u.userId)}
                className="shrink-0 px-4 py-1.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[13px] font-medium font-ui hover:bg-gold-hover transition-colors"
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
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-[24px] font-semibold text-text">Пользователи</h1>

      <form onSubmit={ban} className="bg-surface border border-border rounded-[10px] p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            value={banUserId}
            onChange={(event) => setBanUserId(event.target.value)}
            placeholder="ID пользователя"
            className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text placeholder:text-text3 outline-none focus:border-gold"
          />
          <input
            value={banReason}
            onChange={(event) => setBanReason(event.target.value)}
            placeholder="Причина"
            className="w-full bg-bg2 border border-border rounded-[7px] px-3 py-2 text-[13px] text-text placeholder:text-text3 outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={banning}
            className="px-4 py-2 rounded-[7px] border-none bg-danger text-white text-[13px] font-medium font-ui hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {banning ? "Бан..." : "Забанить"}
          </button>
        </div>
        {banError && <div className="text-[12px] text-danger">{banError}</div>}
      </form>

      <div>
        <h2 className="font-heading text-[18px] font-medium text-text mb-3">Забаненные пользователи</h2>
        {renderUsers()}
      </div>
    </div>
  );
}
