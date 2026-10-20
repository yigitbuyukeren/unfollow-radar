// Konsol sürümünü tek dosyada birleştirir: console/unfollow-radar.console.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const pkg = JSON.parse(read("package.json"));
const css = read("app.css");
const logo = "data:image/png;base64," + fs.readFileSync(path.join(root, "icons/icon48.png")).toString("base64");

const parts = ["shared.js", "i18n.js", "console-src/shim.js", "scan-core.js", "queue-core.js", "panel.js", "app.js", "console-src/unfollow-api.js", "console-src/entry.js"];
const header = `/*!
 * Unfollow Radar — console edition v${pkg.version} (MIT)
 * EN: Open https://www.instagram.com while signed in, open DevTools (F12) → Console, paste this whole file, press Enter.
 * TR: Giriş yapmış hâlde https://www.instagram.com'u aç, DevTools (F12) → Console'a bu dosyanın tamamını yapıştır, Enter'a bas.
 * Not affiliated with Instagram/Meta. Everything runs locally in your browser; nothing is sent anywhere. Use at your own risk.
 * https://github.com/yigitbuyukeren/unfollow-radar
 */
`;
const body = parts.map((p) => `// ---- ${p} ----\n${read(p)}`).join("\n");
const out = `${header}(() => {\nconst APP_CSS = ${JSON.stringify(css)};\nconst LOGO = ${JSON.stringify(logo)};\n${body}\n})();\n`;
fs.mkdirSync(path.join(root, "console"), { recursive: true });
fs.writeFileSync(path.join(root, "console/unfollow-radar.console.js"), out);
console.log(`console/unfollow-radar.console.js (${(out.length / 1024).toFixed(0)} KB)`);
