// Geliştirme sırasında dosya değişikliğini izler; uzantı /wait ile değişimi bekler.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = 8765;
let version = String(Date.now());
let waiters = [];

function bump() {
  version = String(Date.now());
  waiters.forEach((res) => res.end(version));
  waiters = [];
  console.log("Değişiklik algılandı ->", version);
}

let timer;
fs.watch(ROOT, { recursive: true }, (_evt, file) => {
  if (!file || /^(\.git|dev|dist|scripts|store|console|console-src|node_modules)/.test(file) || /\.(md|zip)$/.test(file)) return;
  clearTimeout(timer);
  timer = setTimeout(bump, 150);
});

http
  .createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const since = new URL(req.url, "http://x").searchParams.get("since");
    if (since && since === version) {
      waiters.push(res);
      setTimeout(() => res.writableEnded || res.end(version), 25000); // long-poll
      req.on("close", () => (waiters = waiters.filter((w) => w !== res)));
    } else {
      res.end(version);
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`Dev reload sunucusu: http://127.0.0.1:${PORT}`));
