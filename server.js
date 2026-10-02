// Zero-dependency static server for The Squishy Corner.
// Serves the storefront and rewrites /p/:slug to the single product template.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  // Dynamic product pages: every /p/:slug renders the one product template.
  if (pathname === "/p" || pathname.startsWith("/p/")) {
    return serveFile(res, path.join(ROOT, "product.html"));
  }
  if (pathname === "/") pathname = "/index.html";
  // Extensionless trust pages: /faq -> /faq.html, etc.
  if (!path.extname(pathname)) pathname = pathname + ".html";

  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      return serveFile(res, path.join(filePath, "index.html"));
    }
    serveFile(res, filePath);
  });
});

server.listen(PORT, () => {
  console.log(`The Squishy Corner running at http://localhost:${PORT}`);
});
