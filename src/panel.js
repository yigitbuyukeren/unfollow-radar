// Panel arayüzü. HTML metni (innerHTML) kullanmaz; yalnızca DOM komutları: Instagram'ın sayfa güvenlik
// kuralları (CSP / Trusted Types) altında da çalışır. Uzantı ve konsol sürümü ortak kullanır.
function buildPanel(doc, opts = {}) {
  const e = (tag, attrs = {}, ...kids) => {
    const el = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "hidden" || k === "disabled") el[k] = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) el.append(kid?.nodeType ? kid : doc.createTextNode(String(kid)));
    return el;
  };
  const stat = (cls, id, label) => e("div", { class: `stat ${cls}`.trim() }, e("b", { id }, "0"), e("span", { "data-i": label }, tx(label)));
  const tab = (name, label, active) => e("button", { "data-tab": name, "data-i": label, class: active ? "active" : "", role: "tab" }, tx(label), " ", e("i"));

  const frag = doc.createDocumentFragment();
  frag.append(
    e("header", { class: "top" },
      e("div", { class: "brand" },
        e("img", { class: "logo", src: opts.logoSrc || "", alt: "", width: 44, height: 44 }),
        e("div", {}, e("h1", {}, tx("appName")), e("p", {}, tx("tagline")))
      ),
      e("button", { id: "lang", class: "ghost small" }, tx("langToggle"))
    ),
    e("main", {},
      e("section", { id: "onboarding", class: "card", hidden: true },
        e("h2", {}, tx("onbTitle")),
        e("ul", { class: "points" }, tx("onbPoints").map(([b, text]) => e("li", {}, e("b", {}, b), " ", text))),
        e("button", { id: "ack", class: "primary wide" }, tx("ack"))
      ),
      e("section", { id: "start", class: "card start", hidden: true },
        e("div", { class: "row" },
          e("div", { class: "who-me" }, e("b", {}, tx("scanTitle")), e("span", { id: "quota" })),
          e("button", { id: "run", class: "primary" }, tx("run"))
        ),
        e("div", { id: "banner", class: "banner", hidden: true }, e("div", { class: "spinner" }), e("span", { id: "status" })),
        e("p", { id: "error", class: "error", hidden: true }),
        e("p", { id: "notice", class: "notice", hidden: true })
      ),
      e("section", { id: "queue", class: "card queue", hidden: true },
        e("div", { class: "q-head" }, e("b", { id: "q-title" }), e("span", { id: "q-sub" })),
        e("div", { class: "progress" }, e("div", { id: "q-bar" })),
        e("p", { id: "q-note", class: "hint", hidden: true }),
        e("p", { id: "q-fail", class: "error", hidden: true }),
        e("div", { class: "q-actions" }, e("button", { id: "q-pause", class: "ghost" }), e("button", { id: "q-clear", class: "ghost" }))
      ),
      e("section", { id: "results", hidden: true },
        e("p", { id: "who", class: "who" }),
        e("div", { class: "stats" },
          stat("", "s-followers", "statFollowers"),
          stat("", "s-following", "statFollowing"),
          stat("warn", "s-nfb", "statNfb"),
          stat("good", "s-mutual", "statMutual")
        ),
        e("p", { id: "incomplete", class: "error", hidden: true }),
        e("div", { class: "toolbar" },
          e("div", { id: "tabs", class: "tabs", role: "tablist" },
            tab("notFollowingBack", "tabNfb", true),
            tab("notFollowedBack", "tabNfbMe"),
            tab("mutual", "tabMutual"),
            tab("whitelist", "tabWl"),
            tab("history", "tabHist")
          ),
          e("input", { id: "search", type: "search", placeholder: tx("search"), autocomplete: "off" })
        ),
        e("div", { id: "bulk", class: "bulk", hidden: true },
          e("label", { class: "check" }, e("input", { type: "checkbox", id: "select-all" }), " ", tx("selectAll")),
          e("button", { id: "bulk-run", class: "danger", disabled: true })
        ),
        e("div", { id: "wl-tools", class: "bulk", hidden: true },
          e("span", { class: "muted" }, tx("wlHint")),
          e("div", { class: "row-actions" },
            e("button", { id: "wl-export", class: "ghost small" }, tx("wlExport")),
            e("button", { id: "wl-import", class: "ghost small" }, tx("wlImport")),
            e("button", { id: "wl-paste", class: "ghost small" }, tx("wlPaste")),
            e("input", { id: "wl-file", type: "file", accept: ".json,application/json", hidden: true })
          )
        ),
        e("ul", { id: "list", class: "list" }),
        e("p", { id: "empty", class: "empty", hidden: true }, tx("empty"))
      )
    ),
    e("footer", {},
      e("p", {}, tx("footerNote")),
      e("button", { id: "wipe", class: "link" }, tx("wipe")),
      " · ",
      e("a", { class: "link", href: "https://github.com/yigitbuyukeren/unfollow-radar", target: "_blank", rel: "noreferrer" }, "GitHub")
    ),
    e("dialog", { id: "dlg" },
      e("p", { id: "dlg-msg" }),
      e("div", { class: "dlg-actions" }, e("button", { id: "dlg-no", class: "ghost" }, tx("cancel")), e("button", { id: "dlg-yes", class: "danger" }, tx("confirmYes")))
    ),
    e("dialog", { id: "dlg-paste" },
      e("p", {}, tx("pasteMsg")),
      e("textarea", { id: "paste-text", rows: 6, placeholder: tx("pastePh") }),
      e("div", { class: "dlg-actions" }, e("button", { id: "paste-no", class: "ghost" }, tx("cancel")), e("button", { id: "paste-yes", class: "primary" }, tx("add")))
    )
  );
  return frag;
}
