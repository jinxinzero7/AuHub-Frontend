import Header from "@/components/Header";
import api from "@/lib/api";
import type { Lot, Bid } from "@/types";
import Link from "next/link";

async function getLot(id: string): Promise<Lot | null> {
  try {
    const response = await api.get(`/api/lots/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

async function getBids(id: string): Promise<Bid[]> {
  try {
    const response = await api.get(`/api/lots/${id}/bids`);
    return response.data?.bids || [];
  } catch {
    return [];
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await getLot(id);
  const bids = await getBids(id);

  if (!lot) {
    return (
      <>
        <Header />
        <main className="bg-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-[28px] text-text mb-2">Лот не найден</h1>
            <Link href="/" className="text-gold hover:text-gold-hover transition-colors">
              Вернуться на главную
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="w-full aspect-[4/3] bg-bg2 border border-border rounded-[10px] flex items-center justify-center mb-4">
                <span className="text-text3 text-[14px] font-light">Изображение лота</span>
              </div>

              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h1 className="font-heading text-[24px] font-semibold text-text mb-2">
                  {lot.title}
                </h1>
                <p className="text-[14px] text-text2 font-light mb-4 leading-relaxed">
                  {lot.description}
                </p>

                <div className="flex items-baseline gap-4 mb-4">
                  <div>
                    <div className="text-[10px] text-text2 font-light mb-0.5">Текущая ставка</div>
                    <div className="text-[28px] font-medium text-gold font-mono tracking-[-0.5px]">
                      ₽ {formatPrice(lot.currentPrice)}
                    </div>
                  </div>
                  <div className="text-[12px] text-text3">
                    {lot.bidsCount} ставок
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <span className="text-text2 font-light">Статус:</span>
                    <span className="ml-2 text-text font-medium">{lot.status}</span>
                  </div>
                  <div>
                    <span className="text-text2 font-light">Стартовая цена:</span>
                    <span className="ml-2 text-text font-medium">₽ {formatPrice(lot.startingPrice)}</span>
                  </div>
                  <div>
                    <span className="text-text2 font-light">Начало:</span>
                    <span className="ml-2 text-text font-medium">{formatDate(lot.startTime)}</span>
                  </div>
                  <div>
                    <span className="text-text2 font-light">Окончание:</span>
                    <span className="ml-2 text-text font-medium">{formatDate(lot.endTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-surface border border-border rounded-[10px] p-6 mb-6">
                <h2 className="font-heading text-[18px] font-medium text-text mb-4">
                  История ставок
                </h2>

                {bids.length === 0 ? (
                  <p className="text-[13px] text-text2 font-light text-center py-4">
                    Пока нет ставок
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="text-[13px] text-text2">
                          {formatDate(bid.createdAt)}
                        </div>
                        <div className="text-[14px] font-medium text-gold font-mono">
                          ₽ {formatPrice(bid.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {lot.status === "Active" && (
                <div className="bg-surface border border-border rounded-[10px] p-6">
                  <h2 className="font-heading text-[18px] font-medium text-text mb-4">
                    Сделать ставку
                  </h2>
                  <p className="text-[13px] text-text2 font-light mb-4">
                    Минимальная ставка: ₽ {formatPrice(lot.currentPrice + 100)}
                  </p>
                  <p className="text-[13px] text-text3 text-center py-4">
                    Функция ставок доступна после авторизации
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
