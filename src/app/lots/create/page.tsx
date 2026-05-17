"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import api from "@/lib/api";

export default function CreateLotPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated || user?.role !== 1) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Доступ запрещён</h1>
            <p className="text-text2 text-[14px] font-light">
              Только администраторы могут создавать лоты
            </p>
          </div>
        </main>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/api/lots", {
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
        const errors = axiosErr.response?.data?.errors;
        if (errors) {
          setError(Object.values(errors).flat().join(", "));
        } else {
          setError("Ошибка создания лота");
        }
      } else {
        setError("Ошибка создания лота");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-10">
          <h1 className="font-heading text-[28px] font-semibold text-text mb-6">
            Создать лот
          </h1>

          <div className="bg-surface border border-border rounded-[10px] p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-[7px] px-4 py-2.5">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-[13px] font-medium text-text2 mb-1.5">
                  Название
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                  className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none focus:border-gold transition-colors font-ui"
                  placeholder="Название лота"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-[13px] font-medium text-text2 mb-1.5">
                  Описание
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none focus:border-gold transition-colors font-ui resize-none"
                  placeholder="Описание лота"
                />
              </div>

              <div>
                <label htmlFor="startingPrice" className="block text-[13px] font-medium text-text2 mb-1.5">
                  Стартовая цена (₽)
                </label>
                <input
                  id="startingPrice"
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text placeholder:text-text3 outline-none focus:border-gold transition-colors font-ui"
                  placeholder="1000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-[13px] font-medium text-text2 mb-1.5">
                    Начало
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text outline-none focus:border-gold transition-colors font-ui"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-[13px] font-medium text-text2 mb-1.5">
                    Окончание
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-[14px] bg-bg2 border border-border rounded-[7px] text-text outline-none focus:border-gold transition-colors font-ui"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[7px] border-none bg-gold text-[#FFF8E8] text-[14px] font-medium cursor-pointer font-ui hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Создание..." : "Создать лот"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
