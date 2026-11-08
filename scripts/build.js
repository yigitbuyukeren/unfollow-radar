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
const outputPath = path.join(root, "unfollow-radar.js");
const check = process.argv.slice(2).includes("--check");
let buildId = `${pkg.version}-${Date.now()}`;
if (check) {
  let existing;
  try { existing = fs.readFileSync(outputPath, "utf8"); }
  catch (err) {
    if (err.code !== "ENOENT") throw err;
    console.error("unfollow-radar.js bulunamadı; npm run build çalıştırın.");
    process.exit(1);
  }
  const match = existing.match(/^const BUILD = "([^"\n]+)"; \/\/ build betiği doldurur$/m);
  if (!match || !match[1].startsWith(`${pkg.version}-`) || !/^\d+$/.test(match[1].slice(pkg.version.length + 1))) {
    console.error("Geçersiz derleme kimliği; npm run build çalıştırın.");
    process.exit(1);
  }
  buildId = match[1];
}
const body = parts.map((p) => `// ---- ${p} ----\n${read(p)}`).join("\n").replace("__BUILD_ID__", buildId);
const out = `${header}(() => {\nconst APP_CSS = ${JSON.stringify(css)};\nconst LOGO = ${JSON.stringify(logo)};\n${body}\n})();\n`;
if (check) {
  if (fs.readFileSync(outputPath, "utf8") !== out) {
    console.error("unfollow-radar.js güncel değil; npm run build çalıştırın.");
    process.exit(1);
  }
  console.log("unfollow-radar.js güncel.");
  process.exit(0);
}
fs.writeFileSync(outputPath, out);
console.log(`unfollow-radar.js (${(out.length / 1024).toFixed(0)} KB)`);
