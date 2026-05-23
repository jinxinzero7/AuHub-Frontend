"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSignalR } from "@/hooks/useSignalR";
import Header from "@/components/Header";
import api from "@/lib/api";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  lotId: string | null;
  createdAt: string;
  isRead: boolean;
}

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<string, string> = {
  NewBid: "Новая ставка",
  WonAuction: "Вы выиграли",
  LotApproved: "Лот одобрен",
  LotRejected: "Лот отклонён",
  LotFrozen: "Лот заморожен",
  DisputeResolved: "Спор разрешён",
  LotCompleted: "Аукцион завершён",
  Outbid: "Ставка перебита",
  AuctionEndingSoon: "Аукцион скоро закончится",
};

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useSignalR({
    userId: user?.id,
    onNewNotification: () => {
      fetchNotifications();
    },
  });

  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications?page=${page}&pageSize=${PAGE_SIZE}`);
      const data = res.data;
      const items = data.notifications ?? data.items ?? data ?? [];
      setNotifications(Array.isArray(items) ? items : []);
      setTotalPages(data.totalPages ?? data.total_pages ?? 1);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, page]);

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      try {
        await api.post(`/api/notifications/${n.id}/read`);
      } catch {
        // Ignore per-item errors
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <p className="text-text2 text-[14px]">Войдите, чтобы просматривать уведомления</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-[28px] font-semibold text-text">Уведомления</h1>
            <button
              onClick={markAllAsRead}
              className="text-[13px] text-gold hover:text-gold-hover transition-colors font-ui"
            >
              Отметить все
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-[7px] text-[13px] font-medium transition-colors font-ui border ${
                filter === "all"
                  ? "bg-gold text-[#FFF8E8] border-gold"
                  : "bg-bg2 text-text2 border-border hover:border-gold"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 rounded-[7px] text-[13px] font-medium transition-colors font-ui border ${
                filter === "unread"
                  ? "bg-gold text-[#FFF8E8] border-gold"
                  : "bg-bg2 text-text2 border-border hover:border-gold"
              }`}
            >
              Непрочитанные
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-text3 text-[13px]">Нет уведомлений</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`bg-surface border border-border rounded-[10px] p-4 transition-colors ${
                    !n.isRead ? "border-gold/30 bg-gold/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] text-text3 uppercase tracking-wider mb-1">
                        {getTypeLabel(n.type)}
                      </div>
                      <div className="text-[14px] font-medium text-text mb-1">{n.title}</div>
                      <div className="text-[13px] text-text2">{n.message}</div>
                      <div className="text-[11px] text-text3 mt-2">
                        {new Date(n.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {n.lotId && (
                      <a
                        href={`/lots/${n.lotId}`}
                        className="shrink-0 text-[12px] text-gold hover:text-gold-hover transition-colors whitespace-nowrap"
                      >
                        Перейти →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-[7px] border border-border text-[13px] text-text2 hover:bg-bg2 disabled:opacity-30 transition-colors font-ui"
              >
                ← Назад
              </button>
              <span className="text-[13px] text-text2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-[7px] border border-border text-[13px] text-text2 hover:bg-bg2 disabled:opacity-30 transition-colors font-ui"
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}