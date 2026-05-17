# AuHub Frontend

Платформа для онлайн-аукционов — клиентская часть. Построена на **Next.js 16.2** с Turbopack, SSR для SEO и real-time обновлениями через SignalR.

**Backend:** https://github.com/jinxinzero7/AuHub

---

## Технологический стек

- **Next.js 16.2** — App Router, Turbopack, React Server Components
- **TypeScript** — полная типизация
- **TailwindCSS 4** — стилизация через CSS variables
- **Axios** — HTTP клиент с JWT interceptors
- **@microsoft/signalr** — real-time обновления
- **lucide-react** — иконки

## Дизайн

**Концепция:** "Modern Auction House" — вдохновение Christie's и Sotheby's.

**Палитра:** тёплые нейтралы + золото, без холодного синего.

| Роль | Светлая тема | Тёмная тема |
|---|---|---|
| Background | `#F9F7F4` | `#111009` |
| Surface | `#FFFFFF` | `#1C1914` |
| Text | `#1A1814` | `#EDE8E0` |
| Gold accent | `#B8882E` | `#CFA044` |
| Danger | `#C0392B` | `#E05242` |

**Шрифты:**
- **Playfair Display** — заголовки (ощущение аукционного дома)
- **Inter** — UI текст
- **DM Mono** — таймеры и цены (tabular-nums)

---

## Структура проекта

```
src/
├── app/
│   ├── layout.tsx                 # Root layout + fonts + providers
│   ├── page.tsx                   # Home (SSR lot grid)
│   ├── globals.css                # Design system (CSS vars, themes)
│   ├── login/page.tsx             # Login page
│   ├── register/page.tsx          # Register page
│   ├── profile/page.tsx           # User profile
│   └── lots/
│       ├── [id]/page.tsx          # Lot details (SSR)
│       └── create/page.tsx        # Create lot (Admin only)
│
├── components/
│   ├── Header.tsx                 # Nav + search + theme toggle + auth
│   └── LotCard.tsx                # Lot card with live timer
│
├── contexts/
│   ├── AuthContext.tsx            # JWT auth + auto-refresh
│   └── ThemeContext.tsx           # Light/dark toggle
│
├── lib/
│   └── api.ts                     # Axios instance + interceptors
│
└── types/
    └── index.ts                   # TypeScript types
```

---

## Быстрый старт

### Требования

- Node.js 22+
- Запущенный AuHub Backend (Docker)

### Запуск

```bash
# 1. Установить зависимости
npm install

# 2. Запустить backend (в отдельном терминале)
cd ../AuHub
docker compose up -d

# 3. Запустить frontend
npm run dev
```

Открой **http://localhost:3000**

### Доступные скрипты

```bash
npm run dev       # Dev server с Turbopack
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

---

## Функционал

### Реализовано

- [x] Регистрация и вход с JWT
- [x] Автоматический refresh токена
- [x] Список лотов (SSR)
- [x] Детали лота (SSR)
- [x] Создание лота (Admin only)
- [x] Профиль пользователя
- [x] Тёмная/светлая тема с переключателем
- [x] Live-таймер на карточках лотов
- [x] Responsive дизайн

### В работе

- [ ] Размещение ставок
- [ ] SignalR real-time обновления
- [ ] SEO (meta tags, sitemap, robots)
- [ ] Toast уведомления
- [ ] Loading skeletons

---

## API

Все запросы идут через **YARP Gateway** на `http://localhost:5000`.

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

---

## Планы развития

1. **SignalR** — real-time обновление цены и статуса лотов
2. **Bid placement** — полноценная форма ставок с валидацией
3. **SEO** — динамический sitemap, meta tags для каждого лота
4. **Notifications** — интеграция с Notifications Service
5. **Изображения** — загрузка и отображение фото лотов
6. **Фильтры** — поиск, сортировка, категории

---

**Автор:** Коля (jinxinzero7)
**Дипломный проект, 2026**
