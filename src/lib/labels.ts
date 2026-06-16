export const DELIVERY_PROVIDER_OPTIONS = [
  { value: "Cdek", label: "СДЭК" },
  { value: "YandexDelivery", label: "Яндекс Доставка" },
  { value: "RussianPost", label: "Почта России" },
] as const;

export const deliveryProviderLabels: Record<string, string> = {
  Cdek: "СДЭК",
  YandexDelivery: "Яндекс Доставка",
  RussianPost: "Почта России",
};

export const shortDeliveryProviderLabels: Record<string, string> = {
  Cdek: "СДЭК",
  YandexDelivery: "Яндекс",
  RussianPost: "Почта",
};

export const lotStatusLabels: Record<string, string> = {
  Draft: "Черновик",
  PendingModeration: "На модерации",
  Active: "Идут торги",
  Frozen: "Заморожен",
  Rejected: "Отклонён",
  Cancelled: "Отменён",
  Completed: "Завершён",
  CompletedNoWinner: "Без победителя",
  DeliveryRequestPending: "Ожидает доставку",
  ShippingPending: "Ожидает отправку",
  Shipped: "Отправлен",
  Delivered: "Доставлен",
  TransactionComplete: "Сделка завершена",
  Disputed: "Спор",
  DeliveryRequestExpired: "Доставка не запрошена",
};

export const documentVerificationStatusLabels: Record<string, string> = {
  Unverified: "Не проверен",
  PendingReview: "На проверке",
  Verified: "Проверен",
  Approved: "Одобрена",
  Rejected: "Отклонена",
};

export const trustBadgeLabels: Record<string, string> = {
  New: "Новый продавец",
  NewSeller: "Новый продавец",
  Reliable: "Надёжный",
  Trusted: "Проверенный",
  TopSeller: "Отличная репутация",
  Low: "Низкая надёжность",
  Medium: "Средняя надёжность",
  High: "Высокая надёжность",
  Risky: "Есть риски",
  NeedsAttention: "Требует внимания",
};

export const notificationTypeLabels: Record<string, string> = {
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

export const roleLabels: Record<string, string> = {
  "0": "Участник",
  "1": "Администратор",
  User: "Участник",
  Admin: "Администратор",
};

export const transactionTypeLabels: Record<string, string> = {
  TopUp: "Пополнение",
  Reserve: "Резервирование ставки",
  Release: "Разморозка средств",
  Charge: "Оплата выигранного лота",
  Refund: "Возврат",
  SellerPayout: "Выплата продавцу",
  PlatformFee: "Комиссия платформы",
  Transfer: "Перевод",
};

export const transactionEffectLabels: Record<string, string> = {
  Credit: "Зачисление",
  Debit: "Списание",
  Freeze: "Заморозка",
  Unfreeze: "Разморозка",
  Hold: "Удержание",
  Payout: "Выплата",
  Fee: "Комиссия",
};

export function getDeliveryProviderLabel(provider: string, short = false) {
  const labels = short ? shortDeliveryProviderLabels : deliveryProviderLabels;
  return labels[provider] ?? "Служба доставки";
}

export function getLotStatusLabel(status: string) {
  return lotStatusLabels[status] ?? "Статус обновляется";
}

export function getDocumentVerificationStatusLabel(status: string) {
  return documentVerificationStatusLabels[status] ?? "Статус обновляется";
}

export function getTrustBadgeLabel(badge: string) {
  return trustBadgeLabels[badge] ?? "Оценка формируется";
}

export function getNotificationTypeLabel(type: string) {
  return notificationTypeLabels[type] ?? "Уведомление";
}

export function getRoleLabel(role: string | number) {
  return roleLabels[String(role)] ?? "Участник";
}

export function getTransactionTypeLabel(type: string) {
  return transactionTypeLabels[type] ?? "Операция";
}

export function getTransactionEffectLabel(effect: string) {
  return transactionEffectLabels[effect] ?? "Изменение баланса";
}
