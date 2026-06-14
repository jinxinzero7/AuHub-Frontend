import http from "node:http";

const portArgIndex = process.argv.indexOf("--port");
const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : 59999;

const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    json(res, 400, { success: false });
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${port}`);

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

  json(res, 404, { success: false, error: "Not found" });
});

server.listen(port, "127.0.0.1");
