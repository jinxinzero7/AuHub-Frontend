# AuHub Frontend

Клиентская часть платформы онлайн-аукционов. **Next.js 16.2** с SSR для SEO, real-time обновлениями через SignalR и загрузкой изображений.

**Backend:** https://github.com/jinxinzero7/AuHub

---

## Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Next.js 16.2 (App Router, Turbopack, RSC) |
| Язык | TypeScript 5+ |
| Стили | TailwindCSS 4 (CSS variables, dark mode) |
| HTTP | Axios с JWT interceptors |
| Real-time | @microsoft/signalr (auto-reconnect) |
| Иконки | lucide-react |
| Docker | Multi-stage build, standalone output |

## Дизайн

**Концепция:** "Modern Auction House" — вдохновение Christie's и Sotheby's.

**Палитра:** тёплые нейтралы + золото.

| Роль | Светлая тема | Тёмная тема |
|---|---|---|
| Background | `#F9F7F4` | `#111009` |
| Surface | `#FFFFFF` | `#1C1914` |
| Text | `#1A1814` | `#EDE8E0` |
| Gold | `#B8882E` | `#CFA044` |
| Danger | `#C0392B` | `#E05242` |

**Шрифты:** Playfair Display (заголовки), Inter (UI), DM Mono (таймеры/цены).

---

## Структура проекта

```
src/
├── app/
│   ├── layout.tsx                 # Root layout + providers
│   ├── page.tsx                   # Home (SSR lot grid + pagination)
│   ├── globals.css                # Design system (CSS vars, themes)
│   ├── loading.tsx                # Global loading skeleton
│   ├── error.tsx                  # Global error boundary
│   ├── not-found.tsx              # Custom 404 page
│   ├── sitemap.ts                 # Dynamic sitemap (revalidate 1h)
│   ├── robots.ts                  # robots.txt
│   ├── login/page.tsx             # Login page
│   ├── register/page.tsx          # Register page
│   ├── profile/page.tsx           # User profile
│   └── lots/
│       ├── [id]/page.tsx          # Lot details (SSR + metadata)
│       ├── [id]/loading.tsx       # Lot loading skeleton
│       └── create/page.tsx        # Create lot (Admin only)
│
├── components/
│   ├── Header.tsx                 # Nav + search + theme toggle + auth
│   ├── LotCard.tsx                # Lot card with live timer + cover image
│   ├── BidForm.tsx                # Bid placement (validation, auth check)
│   ├── ImageUpload.tsx            # Drag-and-drop image upload (MinIO)
│   └── LotDetailClient.tsx        # Client-side lot page (SignalR, bids, gallery)
│
├── hooks/
│   └── useSignalR.ts              # SignalR hook (auto-reconnect, events)
│
├── contexts/
│   ├── AuthContext.tsx            # JWT auth + auto-refresh
│   └── ThemeContext.tsx           # Light/dark toggle
│
├── lib/
│   ├── api.ts                     # Axios instance + interceptors
│   └── validation.ts              # Form validation helpers
│
└── types/
    └── index.ts                   # TypeScript types
```

---

## Быстрый старт

### Требования

- Node.js 20+
- Запущенный AuHub Backend (Docker)

### Запуск

```bash
npm install
npm run dev
```

Открой **http://localhost:3000**

### Docker

```bash
docker compose up -d --build
```

### Скрипты

```bash
npm run dev       # Dev server (Turbopack)
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

Current verified state:
- `npm run build` passes without Google Fonts network dependency;
- `npm run lint` passes with 0 errors and 0 warnings;
- fonts are CSS system stacks defined in `src/app/globals.css`;
- seller-facing lot creation/detail/profile screens show payout after the 1% service fee;
- sellers can edit own `Draft`/`Rejected` lots from lot detail/profile and either save as draft or submit for moderation;
- lot cards and lot detail show seller rating/review count from Auctions reviews API;
- lot cards, lot detail and profile show public seller reliability score from Auctions trust API;
- winning buyer can leave one seller review after `TransactionComplete`;
- profile shows current user's public seller rating summary;
- admin users page can ban by user ID, list banned users and unban users;
- public registration collects full name, nickname, phone, email and password;
- login accepts email or phone;
- profile shows email/phone verification states;
- profile can request email/phone verification and submit email token / SMS code;
- public registration no longer exposes Admin role selection.

---

## Функционал

### Реализовано

- [x] Регистрация и вход с JWT
- [x] Автоматический refresh токена (Microsoft claim fix)
- [x] SSR networking (INTERNAL_API_URL для Docker)
- [x] Список лотов с пагинацией (SSR)
- [x] Детали лота с SSR + SEO metadata
- [x] Создание лота (Admin only)
- [x] Профиль пользователя
- [x] Тёмная/светлая тема с localStorage
- [x] Live-таймер на карточках лотов
- [x] SignalR real-time обновления ставок
- [x] Bid placement с валидацией
- [x] Image upload (drag-and-drop, progress bar, multi-file)
- [x] Cover images на главной + галерея на странице лота
- [x] SEO: generateMetadata, sitemap, robots
- [x] Loading skeletons, error boundary, 404 page
- [x] Docker multi-stage build

### В планах

- [ ] Поиск и фильтрация лотов
- [ ] Сортировка (по цене, времени, ставкам)
- [ ] Toast уведомления (sonner)
- [ ] Клиентская валидация форм (react-hook-form + zod)
- [ ] Responsive доработки (mobile-first)
- [ ] Offline-состояние

---

## API

Все запросы через **YARP Gateway** (`http://localhost:5000`).

| Метод | Endpoint | Описание | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Регистрация | Нет |
| POST | `/api/auth/login` | Вход | Нет |
| POST | `/api/auth/refresh` | Обновление токена | Нет |
| GET | `/api/lots` | Список лотов | Нет |
| GET | `/api/lots/{id}` | Детали лота | Нет |
| POST | `/api/lots` | Создать лот | Admin |
| POST | `/api/lots/{id}/bids` | Сделать ставку | Auth |
| GET | `/api/lots/{id}/bids` | История ставок | Нет |
| POST | `/api/lots/{id}/images` | Загрузить фото | Admin |
| GET | `/api/lots/{id}/images` | Список фото | Нет |

### SignalR

- Hub: `/hubs/auction`
- Events: `NewBidPlaced`, `LotCompleted`

---

**Автор:** Коля (jinxinzero7)
**Дипломный проект, 2026**
