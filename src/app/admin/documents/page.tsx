"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import type { DocumentVerificationRequest } from "@/types";

export default function AdminDocumentsPage() {
  const [requests, setRequests] = useState<DocumentVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const fetchRequests = () => {
    setLoading(true);
    api.get<DocumentVerificationRequest[]>(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_PENDING)
      .then((response) => setRequests(Array.isArray(response.data) ? response.data : []))
      .catch((err) => console.error("Failed to fetch document verification requests:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchRequests);
  }, []);

  const approve = async (id: string) => {
    try {
      await api.post(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_APPROVE(id));
      setRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (err) {
      console.error(`Failed to approve document verification request ${id}:`, err);
    }
  };

  const reject = async (id: string) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) return;

    try {
      await api.post(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_REJECT(id), { reason });
      setRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (err) {
      console.error(`Failed to reject document verification request ${id}:`, err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text3 text-[13px]">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-[24px] font-semibold text-text mb-6">Проверка документов</h1>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-text3 text-[13px]">Нет заявок на проверку</div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="bg-surface border border-border rounded-[10px] p-5">
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[14px] font-medium text-text">Заявка {request.id.slice(0, 8)}</div>
                  <div className="text-[12px] text-text3">
                    {new Date(request.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div className="text-[12px] text-text2 break-all">User ID: {request.userId}</div>
                <div className="text-[12px] text-text2 break-all">Паспорт: {request.passportImagePath}</div>
                <div className="text-[12px] text-text2 break-all">Селфи: {request.selfieImagePath}</div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  onClick={() => approve(request.id)}
                  className="w-full sm:w-auto px-4 py-2 rounded-[7px] border-none bg-green-600 text-white text-[13px] font-medium font-ui hover:bg-green-700 transition-colors"
                >
                  Одобрить
                </button>
                <input
                  value={rejectReason[request.id] ?? ""}
                  onChange={(e) => setRejectReason((prev) => ({ ...prev, [request.id]: e.target.value }))}
                  placeholder="Причина отказа"
                  className="w-full min-w-0 flex-1 px-3 py-2 text-[13px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none font-ui focus:border-gold"
                />
                <button
                  onClick={() => reject(request.id)}
                  disabled={!rejectReason[request.id]?.trim()}
                  className="w-full sm:w-auto px-4 py-2 rounded-[7px] border border-danger text-danger text-[13px] font-medium font-ui hover:bg-danger-bg transition-colors disabled:opacity-30"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
