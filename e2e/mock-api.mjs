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
      lots: [],
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 9),
      totalCount: 0,
      totalPages: 0,
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
    });
    return;
  }

  json(res, 404, { success: false, error: "Not found" });
});

server.listen(port, "127.0.0.1");
