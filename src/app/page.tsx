import Header from "@/components/Header";
import LotCard from "@/components/LotCard";
import api from "@/lib/api";
import type { Lot } from "@/types";

async function getLots(): Promise<Lot[]> {
  try {
    const response = await api.get("/api/lots");
    if (response.data.success) {
      return response.data.lots || [];
    }
    return [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const lots = await getLots();

  const activeLots = lots.filter((l) => l.status === "Active");
  const totalCount = lots.length;

  return (
    <>
      <Header />

      <main className="bg-bg min-h-screen">
        <section className="max-w-[960px] mx-auto px-4 sm:px-8 pt-10 pb-8">
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
        </section>

        {lots.length > 0 && (
          <>
            <div className="max-w-[960px] mx-auto px-4 sm:px-8 mt-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[14px] font-medium text-text">Активные аукционы</h2>
                <span className="text-[12px] text-text2">Показано {lots.length}</span>
              </div>
            </div>

            <div className="max-w-[960px] mx-auto px-4 sm:px-8 mt-3 mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px]">
                {lots.map((lot) => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
            </div>
          </>
        )}

        {lots.length === 0 && (
          <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-20 text-center">
            <p className="text-text2 text-[14px] font-light">
              Пока нет активных лотов. Загляните позже!
            </p>
          </div>
        )}
      </main>
    </>
  );
}
