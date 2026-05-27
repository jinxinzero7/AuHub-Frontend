import Header from "@/components/Header";
import LotCard from "@/components/LotCard";
import CreateDraftButton from "@/components/CreateDraftButton";
import api from "@/lib/api";
import type { Lot, PaginatedResponse } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

const PAGE_SIZE = 9;

async function getLots(page: number, search?: string): Promise<PaginatedResponse<Lot>> {
  try {
    const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
    if (search) {
      params.search = search;
    }
    const response = await api.get("/api/lots", { params });
    return response.data;
  } catch (err) {
    console.error("Failed to fetch lots:", err);
    return { success: false, lots: [], page, pageSize: PAGE_SIZE, totalCount: 0, totalPages: 0, error: null };
  }
}

export const metadata: Metadata = {
  title: "AuHub — Онлайн аукционы",
  description: "Редкие предметы, честные торги, ставки в реальном времени. Современная платформа онлайн-аукционов.",
  keywords: ["аукцион", "онлайн торги", "AuHub", "ставки"],
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const searchQuery = params.search || "";
  const data = await getLots(currentPage, searchQuery);

  const lots = data.lots || [];
  const totalPages = data.totalPages || 0;
  const totalCount = data.totalCount || 0;
  const activeLots = lots.filter((l) => l.status === "Active");

  const paginationHref = (page: number) => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    if (searchQuery) q.set("search", searchQuery);
    const qs = q.toString();
    return page === 1 && !searchQuery ? "/" : `/?${qs}`;
  };

  return (
    <>
      <Header />

      <main className="bg-bg min-h-screen">
        <section className="max-w-[960px] mx-auto px-4 sm:px-8 pt-10 pb-8">
          {!searchQuery && (
            <>
              <div className="inline-flex items-center gap-1.5 text-[11.5px] text-gold bg-gold-light border border-gold-border px-[11px] py-1 rounded-[20px] mb-3.5 font-medium tracking-[0.3px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Искал Cu — нашёл Au
              </div>

              <h1 className="font-heading text-[34px] font-semibold leading-[1.25] mb-2">
                Лучший сервис онлайн <span className="text-gold">аукционов</span>
              </h1>
              <p className="text-[14px] text-text2 font-light mb-7">
                Редкие предметы, честные торги, ставки в реальном времени
              </p>
            </>
          )}

          {searchQuery && (
            <>
              <h1 className="font-heading text-[26px] font-semibold leading-[1.25] mb-2">
                Поиск: <span className="text-gold">&quot;{searchQuery}&quot;</span>
              </h1>
              <p className="text-[14px] text-text2 font-light mb-7">
                {totalCount > 0
                  ? `Найдено ${totalCount} лотов`
                  : "Ничего не найдено"}
              </p>
            </>
          )}

          <div className="flex gap-10 py-5 border-t border-b border-border">
            <div>
              <div className="text-[20px] font-medium text-gold font-mono">{totalCount}</div>
              <div className="text-[11.5px] text-text2 mt-0.5 font-light">всего лотов</div>
            </div>
            <div>
              <div className="text-[20px] font-medium text-gold font-mono">{activeLots.length}</div>
              <div className="text-[11.5px] text-text2 mt-0.5 font-light">активных</div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <CreateDraftButton />
          </div>
        </section>

        {lots.length > 0 && (
          <>
            <div className="max-w-[960px] mx-auto px-4 sm:px-8 mt-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[14px] font-medium text-text">
                  {searchQuery ? "Результаты поиска" : "Активные аукционы"}
                </h2>
                <span className="text-[12px] text-text2">
                  Страница {currentPage} из {totalPages}
                </span>
              </div>
            </div>

            <div className="max-w-[960px] mx-auto px-4 sm:px-8 mt-3 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px]">
                {lots.map((lot) => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="max-w-[960px] mx-auto px-4 sm:px-8 mb-12">
                <div className="flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link
                      href={paginationHref(currentPage - 1)}
                      className="px-4 py-2 text-[13px] text-text2 border border-border rounded-[8px] hover:border-gold hover:text-gold transition-colors"
                    >
                      ← Назад
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={paginationHref(p)}
                      className={`px-4 py-2 text-[13px] rounded-[8px] transition-colors ${
                        p === currentPage
                          ? "bg-gold text-bg font-medium"
                          : "text-text2 border border-border hover:border-gold hover:text-gold"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}

                  {currentPage < totalPages && (
                    <Link
                      href={paginationHref(currentPage + 1)}
                      className="px-4 py-2 text-[13px] text-text2 border border-border rounded-[8px] hover:border-gold hover:text-gold transition-colors"
                    >
                      Вперёд →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {lots.length === 0 && (
          <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-20 text-center">
            <p className="text-text2 text-[14px] font-light">
              {searchQuery ? "По вашему запросу ничего не найдено. Попробуйте изменить поиск." : "Пока нет активных лотов. Загляните позже!"}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
