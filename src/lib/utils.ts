export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU").format(price);
}

export const SERVICE_FEE_RATE = 0.01;

export function calculateServiceFee(price: number): number {
  return Math.round(price * SERVICE_FEE_RATE * 100) / 100;
}

export function calculateSellerPayout(price: number): number {
  return Math.max(0, Math.round((price - calculateServiceFee(price)) * 100) / 100);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTimeRemaining(endTime: string, startTime: string) {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const start = new Date(startTime).getTime();

  if (now < start) {
    return { seconds: Math.floor((start - now) / 1000), isLive: false };
  }

  const remaining = Math.floor((end - now) / 1000);
  return { seconds: Math.max(0, remaining), isLive: now >= start && now < end };
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
