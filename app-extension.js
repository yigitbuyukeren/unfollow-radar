// Uzantı sayfası (app.html) açılış kodu.
mountApp(document, {
  chrome,
  mode: "extension",
  logoSrc: "icons/icon128.png",
  reload: () => location.reload(),
  open: (url) => window.open(url, "_blank", "noreferrer"),
});
