"use client";

import { useEffect, useState, type FormEvent } from "react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/UiState";

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banning, setBanning] = useState(false);
  const [unbanningId, setUnbanningId] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    api.get(API_ENDPOINTS.ADMIN.BANNED_USERS)
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить забаненных пользователей")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, []);

  const ban = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const userId = banUserId.trim();
    if (!userId) {
      setError("Укажите ID пользователя");
      return;
    }

    setBanning(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN.BAN(userId), {
        reason: banReason.trim() || "Нарушение правил платформы",
      });
      setBanUserId("");
      setBanReason("");
      setMessage("Пользователь забанен");
      fetchUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось забанить пользователя"));
    } finally {
      setBanning(false);
    }
  };

  const unban = async (user: BannedUser) => {
    setUnbanningId(user.userId);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.ADMIN.UNBAN(user.userId));
      setUsers((prev) => prev.filter((item) => item.userId !== user.userId));
      setMessage(`Пользователь ${user.email || user.userId} разбанен`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось разбанить пользователя"));
    } finally {
      setUnbanningId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Пользователи"
        description="Бан блокирует вход пользователя и его действия на платформе. Для MVP бан выполняется по User ID."
      />

      <div className="mb-4 space-y-2" aria-live="polite">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      <form onSubmit={ban} className="mb-6 rounded-[8px] border border-border bg-surface p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-text2">User ID</span>
            <input
              value={banUserId}
              onChange={(event) => setBanUserId(event.target.value)}
              placeholder="GUID пользователя"
              className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text3 focus:border-gold"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-text2">Причина</span>
            <input
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
              placeholder="Например: мошеннические действия"
              className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text3 focus:border-gold"
            />
          </label>
          <button
            type="submit"
            disabled={banning}
            className="self-end rounded-[7px] bg-danger px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {banning ? "Бан..." : "Забанить"}
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState title="Нет забаненных пользователей" description="Забаненные аккаунты появятся в этом списке." />
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <article key={user.userId} className="rounded-[8px] border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-text">{user.name || "Без имени"}</div>
                  <div className="truncate text-[13px] text-text2">{user.email}</div>
                  <div className="mt-2 break-all text-[12px] text-text3">ID: {user.userId}</div>
                  <div className="mt-1 text-[12px] text-text3">
                    Причина: {user.reason || "не указана"} · {new Date(user.bannedAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <button
                  onClick={() => unban(user)}
                  disabled={unbanningId === user.userId}
                  className="rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unbanningId === user.userId ? "Обработка..." : "Разбанить"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
