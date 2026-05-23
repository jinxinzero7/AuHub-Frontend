"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSignalR } from "@/hooks/useSignalR";
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

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/api/notifications/unread-count");
      setUnreadCount(res.data.count ?? res.data.unreadCount ?? 0);
    } catch {
      // Ignore fetch errors
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get("/api/notifications?pageSize=5");
      const items = res.data.notifications ?? res.data.items ?? res.data ?? [];
      setRecentNotifications(Array.isArray(items) ? items : []);
    } catch {
      // Ignore fetch errors
    }
  };

  useSignalR({
    userId: user?.id,
    onNewNotification: () => {
      setUnreadCount((c) => c + 1);
      fetchRecent();
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    fetchRecent();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) { fetchRecent(); } }}
        className="w-[34px] h-[34px] rounded-[7px] border border-border bg-surface text-text2 hover:bg-bg2 hover:border-border2 transition-colors flex items-center justify-center relative"
        aria-label="Уведомления"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[40px] w-[320px] bg-surface border border-border rounded-[10px] shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[13px] font-medium text-text">Уведомления</span>
            <Link
              href="/notifications"
              className="text-[12px] text-gold hover:text-gold-hover transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Все уведомления
            </Link>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-text3 text-[13px]">
                Нет уведомлений
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg2 transition-colors cursor-pointer ${
                    !n.isRead ? "bg-bg2/50" : ""
                  }`}
                  onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                >
                  <div className="text-[12px] font-medium text-text mb-0.5">{n.title}</div>
                  <div className="text-[12px] text-text2 line-clamp-2">{n.message}</div>
                  <div className="text-[11px] text-text3 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}