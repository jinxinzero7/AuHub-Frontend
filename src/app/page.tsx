import Header from "@/components/Header";
import LotCard from "@/components/LotCard";
import CreateDraftButton from "@/components/CreateDraftButton";
import api from "@/lib/api";
import type { Lot, PaginatedResponse } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Search, ShieldCheck, Truck, WalletCards } from "lucide-react";

export const dynamic = "force-dynamic";

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
  title: "AuHub - онлайн-аукционы для обычных сделок",
  description: "Маркетплейс онлайн-аукционов с модерацией лотов, рейтингом продавцов, доставкой через внешние службы и безопасным платежным сценарием.",
  keywords: ["аукцион", "онлайн торги", "AuHub", "ставки", "маркетплейс"],
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

      <main id="main-content" className="bg-bg min-h-screen">
        {!searchQuery && (
          <section className="border-b border-border bg-surface">
            <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-10 pb-8">
              <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-start">
                <div>
                  <div className="inline-flex items-center gap-2 text-[12px] text-gold bg-gold-light border border-gold-border px-3 py-1.5 rounded-[8px] mb-4 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Модерируемые лоты и понятные правила сделки
                  </div>

                  <h1 className="text-[34px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.4px] text-text max-w-[720px]">
                    Онлайн-аукционы для вещей, которые хочется купить честно
                  </h1>
                  <p className="text-[16px] leading-7 text-text2 mt-4 max-w-[680px]">
                    AuHub соединяет продавцов и покупателей в формате торгов: продавец выставляет лот, покупатели делают ставки, а рейтинг, модерация и доставка помогают снизить риск обычной сделки с рук.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <Link
                      href="#catalog"
                      className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-gold px-4 py-2.5 text-[14px] font-medium text-white hover:bg-gold-hover transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Смотреть лоты
                    </Link>
                    <CreateDraftButton />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="rounded-[8px] border border-border bg-bg px-4 py-3">
                    <div className="text-[13px] text-text2">Всего лотов</div>
                    <div className="text-[28px] font-semibold text-text mt-1">{totalCount}</div>
                  </div>
                  <div className="rounded-[8px] border border-border bg-bg px-4 py-3">
                    <div className="text-[13px] text-text2">Активных торгов</div>
                    <div className="text-[28px] font-semibold text-text mt-1">{activeLots.length}</div>
                  </div>
                  <div className="rounded-[8px] border border-border bg-bg px-4 py-4 sm:col-span-2 lg:col-span-1">
                    <div className="grid gap-3 text-[13px] text-text2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-gold" />
                        Рейтинг и отзывы продавца видны в карточке
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gold" />
                        Доставка выбирается из вариантов продавца
                      </div>
                      <div className="flex items-center gap-2">
                        <WalletCards className="w-4 h-4 text-gold" />
                        Ставки завязаны на баланс покупателя
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="catalog" className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8">
          {searchQuery ? (
            <div className="mb-6">
              <h1 className="text-[28px] font-semibold leading-[1.2] text-text">
                Поиск: <span className="text-gold">&quot;{searchQuery}&quot;</span>
              </h1>
              <p className="text-[14px] text-text2 mt-2">
                {totalCount > 0 ? `Найдено ${totalCount} лотов` : "Ничего не найдено"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.2px] text-text">
                  Активные аукционы
                </h2>
                <p className="text-[14px] text-text2 mt-1">
                  Лоты от пользователей с понятными условиями доставки и историей продавца.
                </p>
              </div>
              {totalPages > 0 && (
                <span className="text-[13px] text-text2">
                  Страница {currentPage} из {totalPages}
                </span>
              )}
            </div>
          )}

          {lots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lots.map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-border bg-surface px-6 py-14 text-center">
              <p className="text-text text-[16px] font-medium">
                {searchQuery ? "По этому запросу лотов нет" : "Пока нет активных лотов"}
              </p>
              <p className="text-text2 text-[14px] mt-2">
                {searchQuery ? "Попробуйте другой запрос или вернитесь к каталогу." : "Когда продавцы опубликуют новые лоты, они появятся здесь."}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={paginationHref(currentPage - 1)}
                  className="px-4 py-2 text-[13px] text-text2 border border-border rounded-[8px] hover:border-gold hover:text-gold transition-colors"
                >
                  Назад
                </Link>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={paginationHref(p)}
                  className={`px-4 py-2 text-[13px] rounded-[8px] transition-colors ${
                    p === currentPage
                      ? "bg-gold text-white font-medium"
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
                  Вперёд
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
