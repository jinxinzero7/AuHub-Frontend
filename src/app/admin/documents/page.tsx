"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import type { DocumentVerificationRequest } from "@/types";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/UiState";

export default function AdminDocumentsPage() {
  const [requests, setRequests] = useState<DocumentVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    setError(null);
    api.get<DocumentVerificationRequest[]>(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_PENDING)
      .then((response) => setRequests(Array.isArray(response.data) ? response.data : []))
      .catch((err) => setError(getApiErrorMessage(err, "Не удалось загрузить заявки на проверку документов")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchRequests);
  }, []);

  const approve = async (request: DocumentVerificationRequest) => {
    setProcessingId(request.id);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_APPROVE(request.id));
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      setMessage(`Заявка ${request.id.slice(0, 8)} одобрена`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось одобрить заявку"));
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (request: DocumentVerificationRequest) => {
    const reason = rejectReason[request.id]?.trim();
    if (!reason) {
      setError("Укажите причину отказа");
      return;
    }

    setProcessingId(request.id);
    setError(null);
    setMessage(null);
    try {
      await api.post(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_REJECT(request.id), { reason });
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      setMessage(`Заявка ${request.id.slice(0, 8)} отклонена`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось отклонить заявку"));
    } finally {
      setProcessingId(null);
    }
  };

  const openDocumentFile = async (id: string, fileType: "passport" | "selfie") => {
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.DOCUMENT_VERIFICATION_FILE(id, fileType), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось открыть файл документа"));
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Проверка документов"
        description="Админ видит только приватные файлы заявки. После отказа пользователь остаётся без подтверждения и может отправить новую заявку."
      />

      <div className="mb-4 space-y-2" aria-live="polite">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      {requests.length === 0 ? (
        <EmptyState title="Нет заявок на проверку" description="Новые заявки появятся после загрузки паспорта и селфи пользователем." />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[8px] border border-border bg-surface p-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[16px] font-semibold text-text">Заявка {request.id.slice(0, 8)}</h2>
                  <span className="text-[12px] text-text3">{new Date(request.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
                <Link href={`/admin/users/${request.userId}`} className="break-all text-[12px] text-gold hover:underline">Профиль пользователя: {request.userId}</Link>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openDocumentFile(request.id, "passport")}
                  className="rounded-[7px] border border-border px-4 py-2 text-[13px] font-medium text-text transition-colors hover:border-gold"
                >
                  Открыть паспорт
                </button>
                <button
                  type="button"
                  onClick={() => openDocumentFile(request.id, "selfie")}
                  className="rounded-[7px] border border-border px-4 py-2 text-[13px] font-medium text-text transition-colors hover:border-gold"
                >
                  Открыть селфи
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <button
                  onClick={() => approve(request)}
                  disabled={processingId === request.id}
                  className="rounded-[7px] bg-green-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === request.id ? "Обработка..." : "Одобрить"}
                </button>
                <input
                  value={rejectReason[request.id] ?? ""}
                  onChange={(e) => setRejectReason((prev) => ({ ...prev, [request.id]: e.target.value }))}
                  placeholder="Причина отказа"
                  className="w-full rounded-[7px] border border-border bg-bg2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text3 focus:border-gold"
                />
                <button
                  onClick={() => reject(request)}
                  disabled={processingId === request.id || !rejectReason[request.id]?.trim()}
                  className="rounded-[7px] border border-danger px-4 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Отклонить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
