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
      winnerId: "buyer-1",
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

  if (url.pathname === "/api/lots/mock-delivery-lot/images" && req.method === "GET") {
    json(res, 200, []);
    return;
  }

  if (url.pathname === "/api/lots/mock-delivery-lot/bids" && req.method === "GET") {
    json(res, 200, { bids: [] });
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
