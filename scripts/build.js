// Yayın paketini üretir: dev reload kodunu ve yerel izinleri çıkarır, zip'ler.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist");
const FILES = ["background.js", "content.js", "shared.js", "app.html", "app.css", "app.js"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of FILES) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, "icons"), path.join(out, "icons"), { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
manifest.host_permissions = manifest.host_permissions.filter((h) => !h.includes("127.0.0.1"));
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

const bgPath = path.join(out, "background.js");
fs.writeFileSync(bgPath, fs.readFileSync(bgPath, "utf8").replace(/\/\/ <dev-reload>[\s\S]*?\/\/ <\/dev-reload>\n?/, ""));

// Güvenlik ağı: dev kalıntısı kalmamalı.
for (const f of fs.readdirSync(out)) {
  if (fs.statSync(path.join(out, f)).isFile() && /127\.0\.0\.1|dev-reload/.test(fs.readFileSync(path.join(out, f), "utf8"))) {
    console.error(`Dev kalıntısı bulundu: ${f}`);
    process.exit(1);
  }
}

const zip = path.join(root, `takip-analizi-${manifest.version}.zip`);
fs.rmSync(zip, { force: true });
cp.execFileSync("zip", ["-qr", zip, "."], { cwd: out });
console.log(`Hazır: ${path.basename(zip)}`);
