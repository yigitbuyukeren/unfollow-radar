// src/ altındaki dosyaları tek bir konsol betiğinde birleştirir: unfollow-radar.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const pkg = JSON.parse(read("package.json"));
const css = read("src/app.css");
const logo = "data:image/png;base64," + fs.readFileSync(path.join(root, "icons/icon48.png")).toString("base64");

const parts = ["shared", "i18n", "shim", "scan-core", "queue-core", "panel", "app", "unfollow-api", "entry"].map((n) => `src/${n}.js`);
const header = `/*!
 * Unfollow Radar v${pkg.version} (MIT)
 * EN: Open https://www.instagram.com while signed in, open DevTools (F12) → Console, paste this whole file, press Enter.
 * TR: Giriş yapmış hâlde https://www.instagram.com'u aç, DevTools (F12) → Console'a bu dosyanın tamamını yapıştır, Enter'a bas.
 * Not affiliated with Instagram/Meta. Everything runs locally in your browser; nothing is sent anywhere. Use at your own risk.
 * https://github.com/yigitbuyukeren/unfollow-radar
 */
`;
const body = parts.map((p) => `// ---- ${p} ----\n${read(p)}`).join("\n").replace("__BUILD_ID__", `${pkg.version}-${Date.now()}`);
const out = `${header}(() => {\nconst APP_CSS = ${JSON.stringify(css)};\nconst LOGO = ${JSON.stringify(logo)};\n${body}\n})();\n`;
fs.writeFileSync(path.join(root, "unfollow-radar.js"), out);
console.log(`unfollow-radar.js (${(out.length / 1024).toFixed(0)} KB)`);
