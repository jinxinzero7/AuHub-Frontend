import http from "node:http";

const portArgIndex = process.argv.indexOf("--port");
const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : 59999;

const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const activeLot = (id, title, sellerId) => ({
  id,
  title,
  description: "Публичный активный лот продавца.",
  startingPrice: 2000,
  currentPrice: 2500,
  durationHours: 72,
  startTime: "2026-06-17T10:00:00.000Z",
  endTime: "2026-06-20T10:00:00.000Z",
  sellerId,
  status: "Active",
  createdAt: "2026-06-17T10:00:00.000Z",
  updatedAt: "2026-06-17T10:00:00.000Z",
  bidsCount: 2,
  coverImageUrl: null,
  supportedDeliveryProviders: ["Cdek", "RussianPost"],
});

let adminUserBanned = false;

const adminUserDetail = (userId) => ({
  userId,
  role: "User",
  email: "moderated@example.com",
  phoneNumber: "+79990000001",
  nickname: "moderated_user",
  name: "Иван Модерируемый",
  isEmailVerified: true,
  emailVerifiedAt: "2026-06-01T10:00:00.000Z",
  isPhoneVerified: true,
  phoneVerifiedAt: "2026-06-02T10:00:00.000Z",
  documentVerificationStatus: "Verified",
  documentVerifiedAt: "2026-06-03T10:00:00.000Z",
  isBanned: adminUserBanned,
  bannedAt: adminUserBanned ? "2026-06-18T10:00:00.000Z" : null,
  banReason: adminUserBanned ? "Нарушение правил" : null,
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-06-03T10:00:00.000Z",
  documentVerificationHistory: [{
    requestId: "document-request-1",
    status: "Approved",
    reviewedByAdminId: "admin-1",
    reviewedAt: "2026-06-03T10:00:00.000Z",
    rejectionReason: null,
    createdAt: "2026-06-03T09:00:00.000Z",
    updatedAt: "2026-06-03T10:00:00.000Z",
  }],
  passwordHash: "private-password-hash",
  refreshTokens: ["private-refresh-token"],
  passportImagePath: "private/passport.jpg",
  selfieImagePath: "private/selfie.jpg",
  walletBalance: 999999,
  deliveryAddress: "private-delivery-address",
});

const adminUserActivity = (userId) => ({
  userId,
  createdLotsCount: 2,
  bidsCount: 5,
  winsCount: 1,
  activeDealsCount: 1,
  lotStatusCounts: { Active: 1, TransactionComplete: 1 },
  createdLots: {
    items: [{ lotId: "profile-active-1", title: "Фотоаппарат для путешествий", status: "Active", currentPrice: 2500, bidsCount: 2, endTime: "2026-06-20T10:00:00.000Z", createdAt: "2026-06-17T10:00:00.000Z" }],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
  },
  recentBids: [{ bidId: "bid-admin-view-1", lotId: "profile-active-1", lotTitle: "Фотоаппарат для путешествий", lotStatus: "Active", amount: 2400, placedAt: "2026-06-17T11:00:00.000Z" }],
  sellerRating: { reviewsCount: 3, averageRating: 4.7 },
  sellerTrust: { score: 82, badge: "Reliable", eventsCount: 4 },
  recentTrustEvents: [{ eventId: "trust-event-1", subject: "Seller", reason: "SuccessfulSale", points: 5, referenceType: "Lot", referenceId: "profile-active-1", createdAt: "2026-06-16T10:00:00.000Z" }],
});

const server = http.createServer((req, res) => {
  if (!req.url) {
    json(res, 400, { success: false });
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    res.end();
    return;
  }

  if (url.pathname === "/health") {
    json(res, 200, { status: "ok" });
    return;
  }

  if (url.pathname === "/api/admin/users/missing-admin-user" && req.method === "GET") {
    json(res, 404, { title: "Not found" });
    return;
  }

  if (url.pathname === "/api/admin/users/forbidden-admin-user" && req.method === "GET") {
    json(res, 403, { title: "Forbidden" });
    return;
  }

  if (url.pathname === "/api/admin/users/main-error-user" && req.method === "GET") {
    json(res, 500, { title: "Identity unavailable" });
    return;
  }

  if (["admin-user", "activity-error-user"].includes(url.pathname.split("/")[4]) && /^\/api\/admin\/users\/[^/]+$/.test(url.pathname) && req.method === "GET") {
    json(res, 200, adminUserDetail(url.pathname.split("/")[4]));
    return;
  }

  if (url.pathname === "/api/admin/users/activity-error-user/activity" && req.method === "GET") {
    json(res, 500, { title: "Activity unavailable" });
    return;
  }

  if (url.pathname === "/api/admin/users/admin-user/activity" && req.method === "GET") {
    json(res, 200, adminUserActivity("admin-user"));
    return;
  }

  if (url.pathname === "/api/admin/users/admin-user/ban" && req.method === "POST") {
    adminUserBanned = true;
    json(res, 200, { success: true });
    return;
  }

  if (url.pathname === "/api/admin/users/admin-user/unban" && req.method === "POST") {
    adminUserBanned = false;
    json(res, 200, { success: true });
    return;
  }

  if (url.pathname === "/api/admin/lots/pending" && req.method === "GET") {
    json(res, 200, [{ id: "pending-lot-1", title: "Лот на проверке", description: "Описание", startingPrice: 1000, currentPrice: 1000, sellerId: "admin-user", createdAt: "2026-06-17T10:00:00.000Z" }]);
    return;
  }

  if (url.pathname === "/api/auth/document-verification/pending" && req.method === "GET") {
    json(res, 200, [{ id: "document-request-1", userId: "admin-user", passportImagePath: "private/passport.jpg", selfieImagePath: "private/selfie.jpg", status: "PendingReview", createdAt: "2026-06-17T10:00:00.000Z" }]);
    return;
  }

  if (url.pathname === "/api/admin/disputes" && req.method === "GET") {
    json(res, 200, [{ id: "disputed-lot-1", title: "Спорный лот", sellerId: "admin-user", winnerId: null, currentPrice: 3000, createdAt: "2026-06-17T10:00:00.000Z" }]);
    return;
  }

  if (url.pathname === "/api/admin/lots/frozen" && req.method === "GET") {
    json(res, 200, [{ id: "frozen-lot-1", title: "Замороженный лот", sellerId: "admin-user", winnerId: null, startingPrice: 2000, currentPrice: 2500, createdAt: "2026-06-17T10:00:00.000Z" }]);
    return;
  }

  if (url.pathname === "/api/admin/users/banned" && req.method === "GET") {
    json(res, 200, [{ userId: "admin-user", email: "moderated@example.com", name: "Иван Модерируемый", bannedAt: "2026-06-18T10:00:00.000Z", reason: "Нарушение правил" }]);
    return;
  }

  if (url.pathname === "/api/lots" && req.method === "GET") {
    json(res, 200, {
      success: true,
      lots: [
        {
          id: "mock-delivery-lot",
          title: "Тестовый лот с доставкой",
          description: "Публичный лот для проверки карточки.",
          startingPrice: 1000,
          currentPrice: 1500,
          durationHours: 48,
          startTime: "2026-06-17T10:00:00.000Z",
          endTime: "2026-06-19T10:00:00.000Z",
          sellerId: "seller-1",
          status: "Active",
          createdAt: "2026-06-17T10:00:00.000Z",
          updatedAt: "2026-06-17T10:00:00.000Z",
          bidsCount: 1,
          coverImageUrl: null,
          supportedDeliveryProviders: ["Cdek"],
        },
      ],
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 9),
      totalCount: 1,
      totalPages: 1,
      error: null,
    });
    return;
  }

  if (url.pathname === "/api/lots/mock-delivery-lot" && req.method === "GET") {
    const hasAuth = Boolean(req.headers.authorization);
    json(res, 200, {
      id: "mock-delivery-lot",
      title: "Тестовый лот с доставкой",
      description: "Лот для проверки отображения приватных данных доставки.",
      startingPrice: 1000,
      currentPrice: 1500,
      durationHours: 48,
      startTime: "2026-06-16T10:00:00.000Z",
      endTime: "2026-06-18T10:00:00.000Z",
      sellerId: "seller-1",
      winnerId: hasAuth ? "buyer-1" : null,
      status: "ShippingPending",
      createdAt: "2026-06-16T10:00:00.000Z",
      updatedAt: "2026-06-17T10:00:00.000Z",
      bidsCount: 1,
      coverImageUrl: null,
      trackingNumber: hasAuth ? "TRACK-12345" : null,
      selectedDeliveryProvider: hasAuth ? "YandexDelivery" : null,
      deliveryAddress: hasAuth ? "ПВЗ Москва, Тверская 1" : null,
      deliveryRecipientName: hasAuth ? "Иван Покупатель" : null,
      deliveryRecipientPhone: hasAuth ? "+79990001122" : null,
      deliveryRequestedAt: hasAuth ? "2026-06-17T09:30:00.000Z" : null,
      deliveryRequestDeadlineAt: "2026-06-20T09:30:00.000Z",
      supportedDeliveryProviders: ["Cdek", "YandexDelivery", "RussianPost"],
      adminComment: null,
    });
    return;
  }

  if (url.pathname === "/api/lots/mock-winner-lot" && req.method === "GET") {
    const hasAuth = Boolean(req.headers.authorization);
    json(res, 200, {
      id: "mock-winner-lot",
      title: "Лот победителя",
      description: "Лот для проверки авторизованного обновления данных победителя.",
      startingPrice: 1000,
      currentPrice: 1700,
      durationHours: 48,
      startTime: "2026-06-16T10:00:00.000Z",
      endTime: "2026-06-18T10:00:00.000Z",
      sellerId: "seller-1",
      winnerId: hasAuth ? "buyer-1" : null,
      status: "DeliveryRequestPending",
      createdAt: "2026-06-16T10:00:00.000Z",
      updatedAt: "2026-06-18T10:00:00.000Z",
      bidsCount: 1,
      coverImageUrl: null,
      trackingNumber: null,
      selectedDeliveryProvider: null,
      deliveryAddress: null,
      deliveryRecipientName: null,
      deliveryRecipientPhone: null,
      deliveryRequestedAt: null,
      deliveryRequestDeadlineAt: hasAuth ? "2099-06-21T10:00:00.000Z" : null,
      supportedDeliveryProviders: ["Cdek"],
      adminComment: null,
    });
    return;
  }

  if (url.pathname === "/api/lots/mock-delivery-lot/images" && req.method === "GET") {
    json(res, 200, []);
    return;
  }

  if (url.pathname === "/api/lots/mock-delivery-lot/bids" && req.method === "GET") {
    json(res, 200, { bids: [] });
    return;
  }

  if (url.pathname === "/api/lots/mock-winner-lot/images" && req.method === "GET") {
    json(res, 200, []);
    return;
  }

  if (url.pathname === "/api/lots/mock-winner-lot/bids" && req.method === "GET") {
    json(res, 200, {
      success: true,
      bids: [{ id: "public-bid-1", bidderId: null, amount: 1700, placedAt: "2026-06-18T09:00:00.000Z" }],
    });
    return;
  }

  if (["/api/lots/profile-active-1", "/api/lots/profile-active-2"].includes(url.pathname) && req.method === "GET") {
    const id = url.pathname.split("/").at(-1);
    json(res, 200, activeLot(id, id === "profile-active-1" ? "Фотоаппарат для путешествий" : "Объектив 50 мм", "profile-seller"));
    return;
  }

  if (["/api/lots/profile-active-1/images", "/api/lots/profile-active-2/images"].includes(url.pathname) && req.method === "GET") {
    json(res, 200, []);
    return;
  }

  if (["/api/lots/profile-active-1/bids", "/api/lots/profile-active-2/bids"].includes(url.pathname) && req.method === "GET") {
    json(res, 200, { bids: [] });
    return;
  }

  if (url.pathname === "/api/sellers/seller-1/lots" && req.method === "GET") {
    json(res, 200, {
      success: true,
      lots: [activeLot("seller-active-lot", "Активный лот продавца", "seller-1")],
      page: 1,
      pageSize: 9,
      totalCount: 1,
      totalPages: 1,
    });
    return;
  }

  if (url.pathname === "/api/sellers/profile-seller/lots" && req.method === "GET") {
    const page = Number(url.searchParams.get("page") ?? 1);
    json(res, 200, {
      success: true,
      lots: page === 1
        ? [activeLot("profile-active-1", "Фотоаппарат для путешествий", "profile-seller")]
        : [activeLot("profile-active-2", "Объектив 50 мм", "profile-seller")],
      page,
      pageSize: 9,
      totalCount: 2,
      totalPages: 2,
    });
    return;
  }

  if (url.pathname === "/api/sellers/empty-seller/lots" && req.method === "GET") {
    json(res, 200, { success: true, lots: [], page: 1, pageSize: 9, totalCount: 0, totalPages: 0 });
    return;
  }

  if (url.pathname === "/api/sellers/lots-error-seller/lots" && req.method === "GET") {
    json(res, 500, { success: false, error: "Lots unavailable" });
    return;
  }

  if (url.pathname === "/api/sellers/seller-1/reviews" && req.method === "GET") {
    json(res, 200, {
      sellerId: "seller-1",
      reviewsCount: 0,
      averageRating: 0,
      reviews: [],
    });
    return;
  }

  if (url.pathname === "/api/sellers/seller-1/trust" && req.method === "GET") {
    json(res, 200, {
      sellerId: "seller-1",
      score: 70,
      badge: "Reliable",
      eventsCount: 2,
      successfulSales: 1,
      sellerLostDisputes: 0,
    });
    return;
  }

  if (url.pathname === "/api/auth/users/seller-1/public-profile" && req.method === "GET") {
    json(res, 200, {
      userId: "seller-1",
      nickname: "seller",
      name: "Тестовый продавец",
      documentVerificationStatus: "Verified",
      email: "private@example.com",
      phoneNumber: "+79999999999",
      documentImagePath: "private/passport.jpg",
      banReason: "private",
      adminComment: "private",
    });
    return;
  }

  if (url.pathname === "/api/sellers/profile-seller/reviews" && req.method === "GET") {
    json(res, 200, {
      sellerId: "profile-seller",
      reviewsCount: 2,
      averageRating: 4.5,
      reviews: [
        {
          id: "review-1",
          lotId: "sold-lot-1",
          sellerId: "profile-seller",
          buyerId: "private-buyer-id",
          rating: 5,
          comment: "Всё соответствует описанию, отправка без задержек.",
          createdAt: "2026-06-15T12:00:00.000Z",
        },
        {
          id: "review-2",
          lotId: "sold-lot-2",
          sellerId: "profile-seller",
          buyerId: "private-buyer-id-2",
          rating: 4,
          comment: null,
          createdAt: "2026-06-10T12:00:00.000Z",
        },
      ],
    });
    return;
  }

  if (url.pathname === "/api/sellers/profile-seller/trust" && req.method === "GET") {
    json(res, 200, {
      sellerId: "profile-seller",
      score: 82,
      badge: "Reliable",
      eventsCount: 7,
      successfulSales: 6,
      sellerLostDisputes: 0,
    });
    return;
  }

  if (url.pathname === "/api/auth/users/profile-seller/public-profile" && req.method === "GET") {
    json(res, 200, {
      userId: "profile-seller",
      nickname: "technik",
      name: "Иван Петров",
      documentVerificationStatus: "Verified",
      email: "private@example.com",
      phoneNumber: "+79999999999",
      documentImagePath: "private/passport.jpg",
      banReason: "private",
      adminComment: "private",
      walletBalance: 500000,
    });
    return;
  }

  if (["empty-seller", "lots-error-seller"].some((id) => url.pathname === `/api/sellers/${id}/reviews`) && req.method === "GET") {
    const sellerId = url.pathname.split("/")[3];
    json(res, 200, { sellerId, reviewsCount: 0, averageRating: 0, reviews: [] });
    return;
  }

  if (["empty-seller", "lots-error-seller"].some((id) => url.pathname === `/api/sellers/${id}/trust`) && req.method === "GET") {
    const sellerId = url.pathname.split("/")[3];
    json(res, 200, { sellerId, score: 50, badge: "NewSeller", eventsCount: 0, successfulSales: 0, sellerLostDisputes: 0 });
    return;
  }

  if (["empty-seller", "lots-error-seller"].some((id) => url.pathname === `/api/auth/users/${id}/public-profile`) && req.method === "GET") {
    const userId = url.pathname.split("/")[4];
    json(res, 200, { userId, nickname: userId, name: "Тестовый продавец", documentVerificationStatus: "Unverified" });
    return;
  }

  if (url.pathname === "/api/auth/users/missing-seller/public-profile" && req.method === "GET") {
    json(res, 404, { success: false, error: "Not found" });
    return;
  }

  json(res, 404, { success: false, error: "Not found" });
});

server.listen(port, "127.0.0.1");
