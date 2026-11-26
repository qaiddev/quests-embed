const P = /QAID_SECRET_[0-9A-Za-z]{16,}/g;
const D = /* @__PURE__ */ new Set();
function de(t) {
  if (t === null || typeof t != "object") return !1;
  const e = Object.getPrototypeOf(t);
  return e === Object.prototype || e === null;
}
function le(t) {
  const e = /* @__PURE__ */ new Set(), i = (a, r) => {
    if (typeof a == "string") {
      const o = a.match(P);
      if (!o) return a;
      for (const s of o) e.add(s);
      return a.replace(P, "").trim();
    }
    if (r >= 6) return a;
    if (Array.isArray(a)) return a.map((o) => i(o, r + 1));
    if (de(a)) {
      const o = {};
      for (const [s, l] of Object.entries(a)) o[s] = i(l, r + 1);
      return o;
    }
    return a;
  }, n = i(t, 0);
  return e.size === 0 ? { value: t, found: [] } : { value: n, found: [...e] };
}
function ce(t) {
  if (!t) return null;
  try {
    const e = typeof location < "u" ? location.href : void 0;
    return new URL("/api/leaked-key", new URL(t, e)).href;
  } catch {
    return null;
  }
}
async function ue(t) {
  try {
    const e = globalThis.crypto?.subtle;
    if (!e) return null;
    const i = await e.digest("SHA-256", new TextEncoder().encode(t));
    return Array.from(new Uint8Array(i), (n) => n.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}
const he = "[qaid] A secret platform API key (QAID_SECRET_…) is in this embed's config. Anyone who opens this page can read it, and it can read and change your project's data. The embed ignored it, and qaid revoked it and emailed the project owner. Make a new platform key, keep it on your server, and use the embed key (QAID_PUB_…) here.";
function pe(t, e, i) {
  if (t.length === 0) return;
  try {
    console.error(he);
  } catch {
  }
  const n = ce(e);
  if (!n || typeof fetch != "function") return;
  const a = typeof location < "u" ? location.href : void 0;
  for (const r of t)
    D.has(r) || (D.add(r), ue(r).then((o) => {
      const s = JSON.stringify(o ? { keyHash: o, pageUrl: a, source: i } : { key: r, pageUrl: a, source: i });
      return fetch(n, {
        method: "POST",
        // text/plain keeps this a simple request: no preflight.
        headers: { "Content-Type": "text/plain" },
        body: s,
        keepalive: !0,
        credentials: "omit"
      });
    }).catch(() => {
    }));
}
function fe(t, e) {
  try {
    const { value: i, found: n } = le(t);
    return pe(n, t.endpoint, e), i;
  } catch {
    return t;
  }
}
const qe = "__qaidQuestsPrefetch";
function R(t) {
  const e = window[qe], i = e?.[t];
  return i ? (delete e[t], i.catch(() => fetch(t, { headers: { Accept: "application/json" } }))) : fetch(t, { headers: { Accept: "application/json" } });
}
const me = `*{box-sizing:border-box}button{cursor:pointer;font-family:inherit}:where(.qaid-q-root){--qaid-q-card-bg: light-dark(#ffffff, #1f2937);--qaid-q-card-fg: light-dark(#1f2937, #f9fafb);--qaid-q-card-border: light-dark(#e5e7eb, #374151);--qaid-q-card-radius: 1rem;--qaid-q-card-padding: 1.5rem;--qaid-q-card-shadow: 0 25px 50px -12px light-dark(rgba(0, 0, 0, .25), rgba(0, 0, 0, .6));--qaid-q-muted-fg: light-dark(#6b7280, #9ca3af);--qaid-q-progress-track: light-dark(#e5e7eb, #374151);--qaid-q-btn-radius: .5rem;--qaid-q-btn-padding-y: .625rem;--qaid-q-btn-padding-x: 1.125rem;--qaid-q-btn-font-weight: 500;--qaid-q-btn-primary-bg: var(--qaid-q-accent, #10b981);--qaid-q-btn-primary-fg: var(--qaid-q-accent-text, #ffffff);--qaid-q-btn-primary-border: transparent;--qaid-q-btn-secondary-bg: transparent;--qaid-q-btn-secondary-fg: light-dark(#374151, #d1d5db);--qaid-q-btn-secondary-border: light-dark(#d1d5db, #4b5563);--qaid-q-btn-secondary-hover-bg: light-dark(#f3f4f6, #374151);--qaid-q-option-bg: light-dark(#ffffff, #111827);--qaid-q-option-bg-selected: color-mix(in srgb, var(--qaid-q-accent, #10b981) 10%, transparent);--qaid-q-option-bg-hover: light-dark(#f9fafb, #1f2937);--qaid-q-option-fg: light-dark(#1f2937, #f9fafb);--qaid-q-option-border: light-dark(#e5e7eb, #374151);--qaid-q-option-border-selected: var(--qaid-q-accent, #10b981);--qaid-q-option-border-hover: light-dark(#9ca3af, #4b5563);--qaid-q-option-radius: .625rem;--qaid-q-option-padding: .75rem .875rem;--qaid-q-marker-bg: light-dark(#ffffff, #111827);--qaid-q-marker-bg-selected: var(--qaid-q-accent, #10b981);--qaid-q-marker-border: light-dark(#d1d5db, #4b5563);--qaid-q-marker-icon: light-dark(#ffffff, #1f2937);--qaid-q-marker-radius: 50%;--qaid-q-input-bg: light-dark(#ffffff, #111827);--qaid-q-input-fg: light-dark(#1f2937, #f9fafb);--qaid-q-input-border: light-dark(#d1d5db, #374151);--qaid-q-input-radius: .625rem;--qaid-q-input-padding: .75rem .875rem;--qaid-q-input-placeholder: light-dark(#9ca3af, #6b7280);--qaid-q-gap: .75rem;--qaid-q-section-gap: 1.25rem}:where(.qaid-q-root.qaid-q-theme-light){--qaid-q-card-bg: #ffffff;--qaid-q-card-fg: #1f2937;--qaid-q-card-border: #e5e7eb;--qaid-q-card-shadow: 0 25px 50px -12px rgba(0, 0, 0, .25);--qaid-q-muted-fg: #6b7280;--qaid-q-progress-track: #e5e7eb;--qaid-q-btn-secondary-fg: #374151;--qaid-q-btn-secondary-border: #d1d5db;--qaid-q-btn-secondary-hover-bg: #f3f4f6;--qaid-q-option-bg: #ffffff;--qaid-q-option-bg-hover: #f9fafb;--qaid-q-option-fg: #1f2937;--qaid-q-option-border: #e5e7eb;--qaid-q-option-border-hover: #9ca3af;--qaid-q-marker-bg: #ffffff;--qaid-q-marker-border: #d1d5db;--qaid-q-marker-icon: #ffffff;--qaid-q-input-bg: #ffffff;--qaid-q-input-fg: #1f2937;--qaid-q-input-border: #d1d5db;--qaid-q-input-placeholder: #9ca3af}:where(.qaid-q-root.qaid-q-theme-dark){--qaid-q-card-bg: #1f2937;--qaid-q-card-fg: #f9fafb;--qaid-q-card-border: #374151;--qaid-q-card-shadow: 0 25px 50px -12px rgba(0, 0, 0, .6);--qaid-q-muted-fg: #9ca3af;--qaid-q-progress-track: #374151;--qaid-q-btn-secondary-fg: #d1d5db;--qaid-q-btn-secondary-border: #4b5563;--qaid-q-btn-secondary-hover-bg: #374151;--qaid-q-option-bg: #111827;--qaid-q-option-bg-hover: #1f2937;--qaid-q-option-fg: #f9fafb;--qaid-q-option-border: #374151;--qaid-q-option-border-hover: #4b5563;--qaid-q-marker-bg: #111827;--qaid-q-marker-border: #4b5563;--qaid-q-marker-icon: #1f2937;--qaid-q-input-bg: #111827;--qaid-q-input-fg: #f9fafb;--qaid-q-input-border: #374151;--qaid-q-input-placeholder: #6b7280}.qaid-q-root{color-scheme:light dark;font-family:var(--qaid-font-family, system-ui, -apple-system, sans-serif);font-size:var(--qaid-font-size, 16px);color:var(--qaid-q-card-fg)}.qaid-q-root.qaid-q-theme-light{color-scheme:light}.qaid-q-root.qaid-q-theme-dark{color-scheme:dark}.qaid-q-backdrop{position:fixed;inset:0;z-index:45;background:rgba(0,0,0,var(--qaid-backdrop-opacity, .4));animation:qaid-q-fade .18s ease-out}@keyframes qaid-q-fade{0%{opacity:0}to{opacity:1}}.qaid-q-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:50;width:var(--qaid-modal-width, 480px);max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);pointer-events:auto;display:flex;flex-direction:column}.qaid-q-card{background:var(--qaid-q-card-bg);color:var(--qaid-q-card-fg);border-radius:var(--qaid-q-card-radius);box-shadow:var(--qaid-q-card-shadow);padding:var(--qaid-q-card-padding);overflow:hidden;display:flex;flex-direction:column;min-height:0}:where(.qaid-q-root.qaid-q-inline) .qaid-q-card{box-shadow:none;border:1px solid var(--qaid-q-card-border);flex:1;min-height:0}:where(.qaid-q-root.qaid-q-inline){height:100%;display:flex;flex-direction:column;min-height:0}.qaid-q-header{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:1rem}.qaid-q-title{font-size:1.125em;font-weight:700;margin:0;color:var(--qaid-q-card-fg)}.qaid-q-step-counter{font-size:.875em;color:var(--qaid-q-muted-fg);font-variant-numeric:tabular-nums;white-space:nowrap}.qaid-q-close{width:28px;height:28px;padding:0;border:none;border-radius:50%;background:transparent;color:var(--qaid-q-muted-fg);display:inline-flex;align-items:center;justify-content:center;-webkit-appearance:none;appearance:none}.qaid-q-close:hover{background:var(--qaid-q-btn-secondary-hover-bg);color:var(--qaid-q-card-fg)}.qaid-q-close:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-q-focus, #6366f1) 30%,transparent)}.qaid-q-progress{position:relative;height:4px;background:var(--qaid-q-progress-track);border-radius:9999px;overflow:hidden;margin-bottom:var(--qaid-q-section-gap)}.qaid-q-progress--inline{flex:1;min-width:60px;margin-bottom:0}.qaid-q-progress-fill{position:absolute;inset:0 auto 0 0;background:var(--qaid-q-accent, #10b981);border-radius:9999px;transition:width .3s ease;width:0%}.qaid-q-body{flex:1;min-height:0;overflow-y:auto;position:relative}.qaid-q-body[data-qaid-scroll=top]{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 2.5rem),transparent 100%);mask-image:linear-gradient(to bottom,#000 calc(100% - 2.5rem),transparent 100%)}.qaid-q-body[data-qaid-scroll=middle]{-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 2rem,#000 calc(100% - 2.5rem),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 2rem,#000 calc(100% - 2.5rem),transparent 100%)}.qaid-q-body[data-qaid-scroll=bottom]{-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 2rem);mask-image:linear-gradient(to bottom,transparent 0,#000 2rem)}.qaid-q-scroll-cue{position:sticky;bottom:0;left:0;display:flex;justify-content:center;align-items:flex-end;height:1.5rem;margin-top:-1.5rem;pointer-events:none;color:var(--qaid-q-muted-fg)}.qaid-q-scroll-cue[hidden]{display:none}.qaid-q-scroll-cue svg{width:1.125rem;height:1.125rem;animation:qaid-q-nudge 1.6s ease-in-out infinite}@keyframes qaid-q-nudge{0%,to{transform:translateY(-2px);opacity:.55}50%{transform:translateY(2px);opacity:1}}.qaid-q-card[data-qaid-fit=compact] .qaid-q-options--image-vertical{grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:.375rem}.qaid-q-card[data-qaid-fit=compact] .qaid-q-options--image-vertical .qaid-q-option{padding:.5rem;gap:.375rem}.qaid-q-card[data-qaid-fit=compact] .qaid-q-options--image-vertical .qaid-q-option-image{max-height:5.5rem;object-fit:contain}.qaid-q-card[data-qaid-fit=compact] .qaid-q-option-desc{font-size:.75em}.qaid-q-card[data-qaid-fit=compact] .qaid-q-step{gap:calc(var(--qaid-q-gap) * .6)}.qaid-q-card[data-qaid-fit=compact] .qaid-q-options--image-horizontal .qaid-q-option-image{width:36px;height:36px}.qaid-q-step{display:flex;flex-direction:column;gap:var(--qaid-q-gap);animation:qaid-q-slide .22s ease-out}@keyframes qaid-q-slide{0%{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.qaid-q-no-motion .qaid-q-step,.qaid-q-no-motion.qaid-q-root{animation:none!important}.qaid-q-label{font-size:1.125em;font-weight:600;margin:0;color:var(--qaid-q-card-fg);line-height:1.35}.qaid-q-label .qaid-q-required{color:var(--qaid-q-error, #ef4444);margin-left:.25rem}.qaid-q-description{font-size:.875em;color:var(--qaid-q-muted-fg);margin:0;line-height:1.4}.qaid-q-error{font-size:.8125em;color:var(--qaid-q-error, #ef4444);margin:0}.qaid-q-error:empty{display:none}.qaid-q-input,.qaid-q-textarea{width:100%;padding:var(--qaid-q-input-padding);border:1px solid var(--qaid-q-input-border);border-radius:var(--qaid-q-input-radius);font-family:inherit;font-size:1em;background:var(--qaid-q-input-bg);color:var(--qaid-q-input-fg);transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;appearance:none}.qaid-q-textarea{min-height:7rem;resize:vertical;font-family:inherit}.qaid-q-input:focus,.qaid-q-textarea:focus{outline:none;border-color:var(--qaid-q-focus, #6366f1);box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-q-focus, #6366f1) 20%,transparent)}.qaid-q-input::placeholder,.qaid-q-textarea::placeholder{color:var(--qaid-q-input-placeholder)}.qaid-q-currency{position:relative}.qaid-q-currency-prefix{position:absolute;left:.875rem;top:50%;transform:translateY(-50%);color:var(--qaid-q-muted-fg);font-size:1em;font-weight:500;pointer-events:none}.qaid-q-currency .qaid-q-input{padding-left:2.25rem}.qaid-q-range-wrap{display:flex;flex-direction:column;gap:.5rem;padding:.5rem 0}.qaid-q-range-value{font-size:2em;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;color:var(--qaid-q-accent, #10b981)}.qaid-q-range-value .qaid-q-range-unit{font-size:.5em;font-weight:500;color:var(--qaid-q-muted-fg);margin-left:.25rem}.qaid-q-range{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:9999px;background:var(--qaid-q-progress-track);outline:none}.qaid-q-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:24px;height:24px;border-radius:50%;background:var(--qaid-q-accent, #10b981);border:3px solid var(--qaid-q-card-bg);box-shadow:0 2px 6px #0003;cursor:pointer;transition:transform .1s}.qaid-q-range::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:var(--qaid-q-accent, #10b981);border:3px solid var(--qaid-q-card-bg);box-shadow:0 2px 6px #0003;cursor:pointer}.qaid-q-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 6px color-mix(in srgb,var(--qaid-q-focus, #6366f1) 30%,transparent)}.qaid-q-range:focus-visible::-moz-range-thumb{box-shadow:0 0 0 6px color-mix(in srgb,var(--qaid-q-focus, #6366f1) 30%,transparent)}.qaid-q-range-bounds{display:flex;justify-content:space-between;font-size:.8125em;color:var(--qaid-q-muted-fg);font-variant-numeric:tabular-nums}.qaid-q-options{display:flex;flex-direction:column;gap:.5rem}.qaid-q-option{display:flex;align-items:flex-start;gap:.625rem;padding:var(--qaid-q-option-padding);border:1px solid var(--qaid-q-option-border);border-radius:var(--qaid-q-option-radius);background:var(--qaid-q-option-bg);text-align:left;font-size:1em;color:var(--qaid-q-option-fg);cursor:pointer;transition:border-color .12s,background .12s,box-shadow .12s;-webkit-appearance:none;appearance:none;width:100%}.qaid-q-option:hover{border-color:var(--qaid-q-option-border-hover);background:var(--qaid-q-option-bg-hover)}.qaid-q-option:focus-visible{outline:none;border-color:var(--qaid-q-focus, #6366f1);box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-q-focus, #6366f1) 25%,transparent)}.qaid-q-option.qaid-q-selected{border-color:var(--qaid-q-option-border-selected);background:var(--qaid-q-option-bg-selected)}.qaid-q-option-marker{flex-shrink:0;width:1.25rem;height:1.25rem;border:2px solid var(--qaid-q-marker-border);border-radius:var(--qaid-q-marker-radius);display:inline-flex;align-items:center;justify-content:center;margin-top:.125rem;background:var(--qaid-q-marker-bg);transition:border-color .12s,background .12s}.qaid-q-option.qaid-q-multi .qaid-q-option-marker{border-radius:.25rem}.qaid-q-option.qaid-q-selected .qaid-q-option-marker{border-color:var(--qaid-q-marker-bg-selected);background:var(--qaid-q-marker-bg-selected)}.qaid-q-option.qaid-q-selected .qaid-q-option-marker:after{content:"";display:block;width:.5rem;height:.5rem;border-radius:50%;background:var(--qaid-q-marker-icon)}.qaid-q-option.qaid-q-multi.qaid-q-selected .qaid-q-option-marker:after{content:"";display:block;width:70%;height:70%;border-radius:0;background:var(--qaid-q-marker-icon);-webkit-mask-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='none' stroke='black' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' d='M5 12l4 4L19 7'/></svg>");mask-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='none' stroke='black' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' d='M5 12l4 4L19 7'/></svg>");-webkit-mask-size:contain;mask-size:contain;-webkit-mask-position:center;mask-position:center;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;transform:none}.qaid-q-option-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:.125rem}.qaid-q-option-image{display:block;width:48px;height:48px;aspect-ratio:1 / 1;object-fit:cover;border-radius:.375rem;background:var(--qaid-q-progress-track);flex-shrink:0}.qaid-q-options--image-horizontal .qaid-q-option-body{flex-direction:row;align-items:center;gap:.75rem}.qaid-q-options--image-horizontal .qaid-q-option-body>:not(.qaid-q-option-image){flex:1;min-width:0;display:flex;flex-direction:column;gap:.125rem}.qaid-q-options--image-vertical{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.5rem}.qaid-q-options--image-vertical .qaid-q-option{flex-direction:column;align-items:stretch;text-align:center;padding:.75rem;gap:.5rem}.qaid-q-options--image-vertical .qaid-q-option-body{align-items:center;text-align:center}.qaid-q-options--image-vertical .qaid-q-option-image{width:100%;height:auto;max-width:100%}.qaid-q-options--image-vertical .qaid-q-option-marker{position:absolute;top:.5rem;right:.5rem;margin-top:0}.qaid-q-options--image-vertical .qaid-q-option{position:relative}.qaid-q-options--image-vertical .qaid-q-option-key{position:absolute;top:.5rem;left:.5rem;align-self:auto}.qaid-q-option-label{font-weight:500;line-height:1.3}.qaid-q-option-desc{font-size:.8125em;color:var(--qaid-q-muted-fg);line-height:1.4}.qaid-q-option-key{flex-shrink:0;align-self:center;font-size:.7em;font-weight:600;padding:.125rem .375rem;border-radius:.25rem;background:var(--qaid-q-progress-track);color:var(--qaid-q-muted-fg);font-variant-numeric:tabular-nums}.qaid-q-footer{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:var(--qaid-q-section-gap)}.qaid-q-footer--inline-progress{justify-content:flex-start;gap:.75rem}.qaid-q-footer-left,.qaid-q-footer-right{display:flex;gap:.5rem}.qaid-q-btn{padding:var(--qaid-q-btn-padding-y) var(--qaid-q-btn-padding-x);border-radius:var(--qaid-q-btn-radius);font-size:var(--qaid-q-btn-font-size, .9375em);font-weight:var(--qaid-q-btn-font-weight);border:1px solid transparent;cursor:pointer;transition:filter .15s,background .15s,color .15s;-webkit-appearance:none;appearance:none}.qaid-q-btn:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-q-focus, #6366f1) 30%,transparent)}.qaid-q-btn-secondary{background:var(--qaid-q-btn-secondary-bg);border-color:var(--qaid-q-btn-secondary-border);color:var(--qaid-q-btn-secondary-fg)}.qaid-q-btn-secondary:hover{background:var(--qaid-q-btn-secondary-hover-bg)}.qaid-q-btn-primary{background:var(--qaid-q-btn-primary-bg);color:var(--qaid-q-btn-primary-fg);border-color:var(--qaid-q-btn-primary-border)}.qaid-q-btn-primary:hover{filter:brightness(.9)}.qaid-q-btn-primary:disabled{opacity:.5;cursor:not-allowed;filter:none}.qaid-q-done{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.5rem;padding:1.5rem 0;flex:1;min-height:0}.qaid-q-done-icon{width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--qaid-q-accent, #10b981) 18%,transparent);color:var(--qaid-q-accent, #10b981);display:inline-flex;align-items:center;justify-content:center;margin-bottom:.5rem}.qaid-q-done-title{font-size:1.25em;font-weight:700;margin:0}.qaid-q-done-message{color:var(--qaid-q-muted-fg);margin:0}.qaid-q-submit-error{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.5rem;padding:1.5rem 0;flex:1;min-height:0}.qaid-q-submit-error-title{font-size:1.25em;font-weight:700;margin:0}.qaid-q-submit-error-message{color:var(--qaid-q-muted-fg);margin:0}.qaid-q-submit-error-actions{display:flex;justify-content:center;gap:.5rem;margin-top:1rem}.qaid-q-saving{display:inline-flex;align-items:center;gap:.375rem;font-size:.75em;color:var(--qaid-q-muted-fg);opacity:0;transition:opacity .2s}.qaid-q-saving.qaid-q-visible{opacity:1}.qaid-q-saving-dot{width:6px;height:6px;border-radius:50%;background:var(--qaid-q-accent, #10b981);animation:qaid-q-pulse 1.2s ease-in-out infinite}@keyframes qaid-q-pulse{0%,to{opacity:.3}50%{opacity:1}}:where(.qaid-q-root.qaid-q-unstyled) :where(.qaid-q-card,.qaid-q-header,.qaid-q-title,.qaid-q-description,.qaid-q-step,.qaid-q-label,.qaid-q-options,.qaid-q-option,.qaid-q-option-marker,.qaid-q-option-body,.qaid-q-option-label,.qaid-q-option-desc,.qaid-q-input,.qaid-q-textarea,.qaid-q-currency,.qaid-q-currency-prefix,.qaid-q-range,.qaid-q-range-wrap,.qaid-q-range-value,.qaid-q-btn,.qaid-q-footer,.qaid-q-progress,.qaid-q-progress-fill,.qaid-q-step-counter,.qaid-q-error,.qaid-q-saving,.qaid-q-done,.qaid-q-done-icon,.qaid-q-done-title,.qaid-q-done-message,.qaid-q-submit-error,.qaid-q-submit-error-title,.qaid-q-submit-error-message,.qaid-q-submit-error-actions){all:unset;display:revert;box-sizing:border-box}.qaid-q-input:focus-visible,.qaid-q-textarea:focus-visible,.qaid-q-option:focus-visible,.qaid-q-btn:focus-visible,.qaid-q-close:focus-visible,.qaid-q-range:focus-visible{outline:2px solid transparent;outline-offset:2px}@media(prefers-reduced-motion:reduce){.qaid-q-root *,.qaid-q-root *:before,.qaid-q-root *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}.qaid-q-range::-webkit-slider-thumb{transition:none!important}.qaid-q-range::-moz-range-thumb{transition:none!important}}@media(forced-colors:active){.qaid-q-input:focus-visible,.qaid-q-textarea:focus-visible,.qaid-q-option:focus-visible,.qaid-q-btn:focus-visible,.qaid-q-close:focus-visible,.qaid-q-range:focus-visible{outline:2px solid Highlight;outline-offset:2px}.qaid-q-card{border:1px solid CanvasText}.qaid-q-input,.qaid-q-textarea,.qaid-q-option{border-color:CanvasText}.qaid-q-option.qaid-q-selected{border-color:Highlight}.qaid-q-option.qaid-q-selected .qaid-q-option-marker{forced-color-adjust:none;background:Highlight;border-color:Highlight}.qaid-q-option.qaid-q-selected .qaid-q-option-marker:after{background:HighlightText}.qaid-q-progress{forced-color-adjust:none;background:Canvas;border:1px solid CanvasText}.qaid-q-progress-fill{forced-color-adjust:none;background:Highlight}}`, ge = "", be = ":where(.qaid-q-root){--qaid-q-card-radius: 0;--qaid-q-card-shadow: none;--qaid-q-btn-radius: 0;--qaid-q-option-radius: 0;--qaid-q-option-bg-selected: transparent;--qaid-q-input-radius: 0}", ve = ":where(.qaid-q-root){--qaid-q-card-radius: 1.5rem;--qaid-q-btn-radius: 9999px;--qaid-q-btn-padding-x: 1.5rem;--qaid-q-option-radius: 9999px;--qaid-q-option-padding: .75rem 1.125rem;--qaid-q-input-radius: 9999px;--qaid-q-input-padding: .75rem 1.125rem}", ye = ":where(.qaid-q-root){--qaid-q-card-padding: 1rem;--qaid-q-btn-padding-y: .5rem;--qaid-q-btn-padding-x: .875rem;--qaid-q-option-padding: .5rem .625rem;--qaid-q-input-padding: .5rem .625rem;--qaid-q-gap: .5rem;--qaid-q-section-gap: .875rem}", Ee = {
  default: ge,
  minimal: be,
  pill: ve,
  dense: ye
};
function xe(t) {
  return Ee[t] ?? "";
}
const we = /^--[A-Za-z0-9_-]+$/, Ce = /[;{}<>\\]/, ke = /url\(|image-set\(|(?:^|[^a-z0-9-])image\(|cross-fade\(|(?:^|[^a-z0-9-])src\(|expression\(|@import|\/\*|javascript:/i;
function Ae(t) {
  const e = [];
  let i = null;
  for (const n of t) {
    if (i) {
      n === i && (i = null);
      continue;
    }
    if (n === '"' || n === "'") i = n;
    else if (n === "(") e.push(")");
    else if (n === "[") e.push("]");
    else if ((n === ")" || n === "]") && e.pop() !== n)
      return !1;
  }
  return i === null && e.length === 0;
}
function B(t) {
  return typeof t != "string" || Ce.test(t) || ke.test(t.replace(/\s+/g, "")) ? !1 : Ae(t);
}
function Se(t) {
  return we.test(t);
}
function Ie(t) {
  if (!t) return "";
  const e = Object.entries(t).filter(([i, n]) => Se(i) && B(n) && n.trim() !== "").map(([i, n]) => `  ${i}: ${n.trim()};`).join(`
`);
  return e ? `:where(.qaid-q-root) {
${e}
}` : "";
}
function v(t) {
  return t.replace(/\\([0-9a-fA-F]{1,6})\s?|\\([^\n0-9a-fA-F])|\\\n/g, (e, i, n) => {
    if (i) {
      const a = parseInt(i, 16);
      return a > 0 && a <= 1114111 ? String.fromCodePoint(a) : "�";
    }
    return n ?? "";
  });
}
const z = /^@((?:[-\w]|\\[0-9a-fA-F]{1,6}\s?|\\[^\n0-9a-fA-F])+)/, Te = /* @__PURE__ */ new Set(["import", "charset", "namespace", "scope"]), Ne = /* @__PURE__ */ new Set(["behavior", "-moz-binding"]), Le = /image-set\(|(?:^|[^a-z0-9-])image\(|cross-fade\(|(?:^|[^a-z0-9-])src\(|expression\(|javascript:/;
function Oe(t, e) {
  const i = v(t).trim().toLowerCase(), n = v(e).toLowerCase().replace(/\s+/g, "");
  if (Ne.has(i) || i.endsWith("behavior") || Le.test(n)) return !1;
  for (const a of n.matchAll(/url\(\s*(['"]?)(.)/g))
    if (a[2] !== "#") return !1;
  return !(i === "position" && /^(fixed|sticky)/.test(n));
}
function Pe(t, e) {
  let i = 0, n = null;
  for (; e < t.length; e++) {
    const a = t[e];
    if (n) {
      a === "\\" ? e++ : (a === n || a === `
`) && (n = null);
      continue;
    }
    if (a === "\\") {
      e++;
      continue;
    }
    if (a === '"' || a === "'") n = a;
    else if (a === "(" || a === "[") i++;
    else if ((a === ")" || a === "]") && i > 0) i--;
    else if (i === 0 && (a === ";" || a === "{" || a === "}")) return e;
  }
  return e;
}
function De(t) {
  return /:host\b/.test(v(t).toLowerCase());
}
const j = /^(--[\w-]+|color|color-scheme|font|font-[a-z-]+|line-height|letter-spacing)$/;
function Re(t) {
  const e = v(t).trim();
  return e.startsWith("--") ? j.test(e) : j.test(e.toLowerCase());
}
function Y(t, e, i, n = !1) {
  const a = [], r = (s) => {
    if (!s) return;
    const l = z.exec(s);
    if (l) {
      v(l[1]).toLowerCase() === "layer" && a.push(`${s};`);
      return;
    }
    if (!i) return;
    const f = s.indexOf(":");
    if (f <= 0) return;
    const q = s.slice(0, f), d = s.slice(f + 1);
    n && !Re(q) || Oe(q, d) && a.push(`  ${q.trim()}: ${d.trim()};`);
  };
  let o = e;
  for (; o < t.length; ) {
    const s = Pe(t, o), l = t.slice(o, s).trim(), f = t[s];
    if (f === "{") {
      const q = z.exec(l), d = q ? n : De(l) || n && l.includes("&"), u = Y(t, s + 1, !0, d);
      if (o = u.end, q && Te.has(v(q[1]).toLowerCase())) continue;
      l && a.push(`${l} {
${u.out}
}`);
      continue;
    }
    if (r(l), o = s + 1, f === "}" && i) return { out: a.join(`
`), end: o };
  }
  return { out: a.join(`
`), end: t.length };
}
function ze(t) {
  if (typeof t != "string" || t.trim() === "") return "";
  let e = t.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, " "), i;
  do
    i = e, e = e.replace(/<(?=[A-Za-z/!?])|-->/g, " ");
  while (e !== i);
  return Y(e, 0, !1).out.trim();
}
const je = {
  contain: "paint",
  "overflow-clip-margin": "40px"
}, Ue = {
  position: "fixed",
  inset: "0",
  width: "auto",
  height: "auto",
  margin: "0",
  transform: "none",
  translate: "none",
  scale: "none",
  rotate: "none"
}, He = {
  position: "fixed",
  top: "50%",
  left: "50%",
  right: "auto",
  bottom: "auto",
  margin: "0",
  transform: "translate(-50%, -50%)",
  translate: "none",
  scale: "none",
  rotate: "none",
  width: "var(--qaid-modal-width, 480px)",
  "max-width": "calc(100vw - 32px)",
  "max-height": "calc(100vh - 32px)"
};
function x(t, e) {
  for (const [i, n] of Object.entries(e))
    t.style.setProperty(i, n, "important");
}
const Ve = /* @__PURE__ */ new WeakMap();
function $e(t, e) {
  if (typeof CSSStyleSheet == "function" && typeof CSSStyleSheet.prototype.replaceSync == "function" && Array.isArray(t.adoptedStyleSheets))
    try {
      const a = new CSSStyleSheet();
      a.replaceSync(e), Ve.set(a, e), t.adoptedStyleSheets = [...t.adoptedStyleSheets, a];
      return;
    } catch {
    }
  const n = document.createElement("style");
  n.setAttribute("data-qaid-q-theme", ""), n.textContent = e, t.appendChild(n);
}
function Fe(t, e, i) {
  const [n, a, r] = [t, e, i].map((o) => (o = o / 255, o <= 0.03928 ? o / 12.92 : Math.pow((o + 0.055) / 1.055, 2.4)));
  return 0.2126 * n + 0.7152 * a + 0.0722 * r;
}
function _e(t) {
  if (t.startsWith("#")) {
    const i = t.slice(1), n = i.length === 3 ? i.split("").map((r) => r + r).join("") : i, a = parseInt(n, 16);
    return { r: a >> 16 & 255, g: a >> 8 & 255, b: a & 255 };
  }
  const e = t.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return e ? { r: parseInt(e[1]), g: parseInt(e[2]), b: parseInt(e[3]) } : null;
}
function U(t) {
  const e = _e(t);
  return e && Fe(e.r, e.g, e.b) > 0.4 ? "black" : "white";
}
function Me(t = {}) {
  const e = {};
  return t.accentColor !== void 0 && (e["--qaid-q-accent"] = t.accentColor, e["--qaid-q-accent-text"] = U(t.accentColor)), t.errorColor !== void 0 && (e["--qaid-q-error"] = t.errorColor), t.focusColor !== void 0 && (e["--qaid-q-focus"] = t.focusColor, e["--qaid-q-focus-text"] = U(t.focusColor)), t.modalWidth !== void 0 && (e["--qaid-modal-width"] = `${t.modalWidth}px`), t.backdropOpacity !== void 0 && (e["--qaid-backdrop-opacity"] = String(t.backdropOpacity)), t.fontFamily !== void 0 && (e["--qaid-font-family"] = t.fontFamily), t.fontSize !== void 0 && (e["--qaid-font-size"] = `${t.fontSize}px`), e;
}
function Qe(t, e) {
  for (const [i, n] of Object.entries(e))
    B(n) && t.style.setProperty(i, n);
}
function Ke() {
  return me;
}
function Be(t) {
  return xe(t);
}
function E(t) {
  let e = null;
  return {
    setInvalid(i) {
      t.setAttribute("aria-invalid", "true");
      const n = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
      n.includes(i) || n.push(i), t.setAttribute("aria-describedby", n.join(" ")), e = i;
    },
    clearInvalid() {
      if (t.removeAttribute("aria-invalid"), e) {
        const i = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean).filter((n) => n !== e);
        i.length ? t.setAttribute("aria-describedby", i.join(" ")) : t.removeAttribute("aria-describedby"), e = null;
      }
    }
  };
}
function Ye(t) {
  switch (t.question.type) {
    case "text":
      return We(t.question, t);
    case "currency":
      return Ge(t.question, t);
    case "range":
      return Ze(t.question, t);
    case "date":
      return et(t.question, t);
    case "multiple-choice":
      return tt(t.question, t);
  }
}
function We(t, e) {
  const i = typeof e.initialValue == "string" ? e.initialValue : "";
  let n;
  if (t.multiline) {
    const a = document.createElement("textarea");
    a.className = "qaid-q-textarea", a.value = i, t.placeholder && (a.placeholder = t.placeholder), t.maxLength && (a.maxLength = t.maxLength), n = a;
  } else {
    const a = document.createElement("input");
    a.className = "qaid-q-input", a.type = t.inputType ?? "text", a.value = i, t.placeholder && (a.placeholder = t.placeholder), t.maxLength && (a.maxLength = t.maxLength), a.setAttribute("autocomplete", Je(t.inputType)), n = a;
  }
  return n.setAttribute("aria-label", t.label), t.required && n.setAttribute("aria-required", "true"), n.addEventListener("input", () => {
    e.onChange(n.value);
  }), n.addEventListener("keydown", ((a) => {
    if (a.key === "Enter") {
      if (t.multiline) {
        (a.metaKey || a.ctrlKey) && (a.preventDefault(), e.onSubmit());
        return;
      }
      a.isComposing || (a.preventDefault(), e.onSubmit());
    }
  })), {
    element: n,
    focus: () => {
      n.focus();
      const a = n.value.length;
      try {
        n.setSelectionRange(a, a);
      } catch {
      }
    },
    getValue: () => n.value,
    isValid: () => {
      if (!t.required) return !0;
      const a = n.value.trim();
      return !(a.length === 0 || t.minLength && a.length < t.minLength);
    },
    ...E(n)
  };
}
function Je(t) {
  switch (t) {
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "url":
      return "url";
    default:
      return "off";
  }
}
function Ge(t, e) {
  const i = document.createElement("div");
  i.className = "qaid-q-currency";
  const n = document.createElement("span");
  n.className = "qaid-q-currency-prefix", n.textContent = Xe(t.currency ?? "USD", t.locale), i.appendChild(n);
  const a = document.createElement("input");
  return a.className = "qaid-q-input", a.type = "number", a.inputMode = "decimal", a.step = "0.01", typeof t.min == "number" && (a.min = String(t.min)), typeof t.max == "number" && (a.max = String(t.max)), t.placeholder && (a.placeholder = t.placeholder), typeof e.initialValue == "number" ? a.value = String(e.initialValue) : typeof e.initialValue == "string" && e.initialValue !== "" && (a.value = e.initialValue), a.setAttribute("aria-label", t.label), t.required && a.setAttribute("aria-required", "true"), a.addEventListener("input", () => {
    const r = a.value;
    if (r === "")
      e.onChange(null);
    else {
      const o = Number(r);
      e.onChange(Number.isNaN(o) ? null : o);
    }
  }), a.addEventListener("keydown", (r) => {
    r.key === "Enter" && !r.isComposing && (r.preventDefault(), e.onSubmit());
  }), i.appendChild(a), {
    element: i,
    focus: () => a.focus(),
    getValue: () => {
      if (a.value === "") return null;
      const r = Number(a.value);
      return Number.isNaN(r) ? null : r;
    },
    isValid: () => {
      const r = a.value === "" ? null : Number(a.value);
      return !(t.required && (r === null || Number.isNaN(r)) || r !== null && !Number.isNaN(r) && (typeof t.min == "number" && r < t.min || typeof t.max == "number" && r > t.max));
    },
    ...E(a)
  };
}
function Xe(t, e) {
  try {
    return new Intl.NumberFormat(e, {
      style: "currency",
      currency: t,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0
    }).formatToParts(0).find((r) => r.type === "currency")?.value ?? t;
  } catch {
    return t;
  }
}
function Ze(t, e) {
  const i = document.createElement("div");
  i.className = "qaid-q-range-wrap";
  const n = document.createElement("div");
  n.className = "qaid-q-range-value";
  const a = document.createElement("span");
  if (n.appendChild(a), t.unit) {
    const d = document.createElement("span");
    d.className = "qaid-q-range-unit", d.textContent = t.unit, n.appendChild(d);
  }
  const r = typeof e.initialValue == "number" ? e.initialValue : t.defaultValue ?? t.min, o = document.createElement("input");
  o.className = "qaid-q-range", o.type = "range", o.min = String(t.min), o.max = String(t.max), o.step = String(t.step ?? 1), o.value = String(r), o.setAttribute("aria-label", t.label), o.setAttribute("aria-valuemin", String(t.min)), o.setAttribute("aria-valuemax", String(t.max));
  const s = () => {
    a.textContent = o.value, o.setAttribute("aria-valuenow", o.value);
  };
  s(), o.addEventListener("input", () => {
    s(), e.onChange(Number(o.value));
  }), o.addEventListener("keydown", (d) => {
    d.key === "Enter" && (d.preventDefault(), e.onSubmit());
  });
  const l = document.createElement("div");
  l.className = "qaid-q-range-bounds";
  const f = document.createElement("span");
  f.textContent = `${t.min}${t.unit ?? ""}`;
  const q = document.createElement("span");
  return q.textContent = `${t.max}${t.unit ?? ""}`, l.appendChild(f), l.appendChild(q), i.appendChild(n), i.appendChild(o), i.appendChild(l), queueMicrotask(() => e.onChange(Number(o.value))), {
    element: i,
    focus: () => o.focus(),
    getValue: () => Number(o.value),
    isValid: () => !0,
    ...E(o)
  };
}
function et(t, e) {
  const i = document.createElement("input");
  return i.className = "qaid-q-input", i.type = "date", t.min && (i.min = t.min), t.max && (i.max = t.max), typeof e.initialValue == "string" && (i.value = e.initialValue), i.setAttribute("aria-label", t.label), t.required && i.setAttribute("aria-required", "true"), i.addEventListener("input", () => {
    e.onChange(i.value || null);
  }), i.addEventListener("keydown", (n) => {
    n.key === "Enter" && !n.isComposing && (n.preventDefault(), e.onSubmit());
  }), {
    element: i,
    focus: () => i.focus(),
    getValue: () => i.value || null,
    isValid: () => t.required ? i.value !== "" : !0,
    ...E(i)
  };
}
function H(t) {
  if (typeof t != "string" || t.trim() === "") return null;
  let e;
  try {
    e = new URL(t.trim());
  } catch {
    return null;
  }
  return e.protocol === "https:" ? e.href : null;
}
function tt(t, e) {
  const i = document.createElement("div"), n = t.imageAlignment ?? "horizontal", r = t.options.some((d) => H(d.image) !== null) ? n === "vertical" ? " qaid-q-options--image-vertical" : " qaid-q-options--image-horizontal" : "";
  i.className = `qaid-q-options${r}`, i.setAttribute("role", t.multiple ? "group" : "radiogroup"), i.setAttribute("aria-label", t.label), t.required && i.setAttribute("aria-required", "true");
  const o = /* @__PURE__ */ new Set();
  if (t.multiple && Array.isArray(e.initialValue))
    for (const d of e.initialValue) o.add(d);
  else !t.multiple && typeof e.initialValue == "string" && o.add(e.initialValue);
  const s = [];
  t.options.forEach((d, u) => {
    const c = document.createElement("button");
    c.type = "button", c.className = `qaid-q-option${t.multiple ? " qaid-q-multi" : ""}`, c.dataset.value = d.value, c.setAttribute("role", t.multiple ? "checkbox" : "radio"), c.setAttribute("aria-checked", o.has(d.value) ? "true" : "false"), o.has(d.value) && c.classList.add("qaid-q-selected");
    const m = document.createElement("span");
    m.className = "qaid-q-option-marker", m.setAttribute("aria-hidden", "true");
    const g = document.createElement("span");
    g.className = "qaid-q-option-body";
    const h = H(d.image);
    if (h) {
      const p = document.createElement("img");
      p.className = "qaid-q-option-image", p.referrerPolicy = "no-referrer", p.alt = "", p.loading = "lazy", p.decoding = "async", p.src = h, g.appendChild(p);
    }
    const b = document.createElement("span");
    if (b.className = "qaid-q-option-label", b.textContent = d.label, g.appendChild(b), d.description) {
      const p = document.createElement("span");
      p.className = "qaid-q-option-desc", p.textContent = d.description, g.appendChild(p);
    }
    if (c.appendChild(m), c.appendChild(g), u < 9) {
      const p = document.createElement("span");
      p.className = "qaid-q-option-key", p.textContent = String(u + 1), p.setAttribute("aria-hidden", "true"), c.appendChild(p);
    }
    c.addEventListener("click", () => f(u)), c.addEventListener("keydown", (p) => {
      if (p.key === "ArrowDown" || p.key === "ArrowRight") {
        p.preventDefault(), l((u + 1) % s.length);
        return;
      }
      if (p.key === "ArrowUp" || p.key === "ArrowLeft") {
        p.preventDefault(), l((u - 1 + s.length) % s.length);
        return;
      }
      !t.multiple && p.key === "Enter" && o.size > 0 && (p.preventDefault(), e.onSubmit());
    }), s.push(c), i.appendChild(c);
  }), i.addEventListener("keydown", (d) => {
    const u = d.key;
    if (u.length === 1 && u >= "1" && u <= "9") {
      const c = parseInt(u, 10) - 1;
      c < s.length && (d.preventDefault(), f(c), l(c));
    }
  });
  function l(d) {
    s[d]?.focus();
  }
  function f(d) {
    const u = t.options[d].value;
    t.multiple ? o.has(u) ? o.delete(u) : o.add(u) : (o.clear(), o.add(u)), s.forEach((c) => {
      const m = c.dataset.value, g = o.has(m);
      c.classList.toggle("qaid-q-selected", g), c.setAttribute("aria-checked", g ? "true" : "false");
    }), e.onChange(q()), !t.multiple && e.autoAdvance && setTimeout(() => e.onAutoAdvance(), 180);
  }
  function q() {
    if (t.multiple) return Array.from(o);
    const d = o.values().next();
    return d.done ? null : d.value;
  }
  return {
    element: i,
    focus: () => {
      (s.find((u) => u.classList.contains("qaid-q-selected")) ?? s[0])?.focus();
    },
    getValue: () => q(),
    isValid: () => t.required ? o.size > 0 : !0,
    ...E(i)
  };
}
function S(t, e) {
  const i = /* @__PURE__ */ Object.create(null), n = [];
  for (const a of t.questions)
    a.visibleIf && !I(a.visibleIf, i) || (n.push(a), Object.prototype.hasOwnProperty.call(e, a.id) && (i[a.id] = e[a.id]));
  return n;
}
function it(t, e) {
  const i = {};
  for (const n of S(t, e))
    Object.prototype.hasOwnProperty.call(e, n.id) && (i[n.id] = e[n.id]);
  return i;
}
function I(t, e) {
  if ("allOf" in t) {
    for (const a of t.allOf)
      if (!I(a, e)) return !1;
    return !0;
  }
  if ("anyOf" in t) {
    for (const a of t.anyOf)
      if (I(a, e)) return !0;
    return !1;
  }
  const i = e[t.questionId], n = i != null && !(typeof i == "string" && i.trim() === "") && !(Array.isArray(i) && i.length === 0);
  return "answered" in t ? t.answered ? n : !n : n ? "equals" in t ? w(i, t.equals) : "notEquals" in t ? !w(i, t.notEquals) : "in" in t ? t.in.some((a) => w(i, a)) : !1 : !1;
}
function w(t, e) {
  return Array.isArray(t) ? t.some((i) => i === e) : t === e;
}
const nt = 360, C = 2;
function at(t) {
  const e = t.scrollHeight - t.clientHeight;
  return e <= C ? "none" : t.scrollTop <= C ? "top" : t.scrollTop >= e - C ? "bottom" : "middle";
}
function rt(t, e) {
  const i = at(t);
  if (t.setAttribute("data-qaid-scroll", i), e) {
    const n = i === "top" || i === "middle";
    e.hidden = !n;
  }
  return i;
}
function ot(t, e) {
  const i = e > 0 && e < nt ? "compact" : "roomy";
  return t.setAttribute("data-qaid-fit", i), i;
}
function st(t, e, i) {
  const n = () => {
    rt(t, i), ot(e, t.clientHeight);
  };
  t.addEventListener("scroll", n, { passive: !0 });
  let a = null;
  return typeof ResizeObserver == "function" && (a = new ResizeObserver(n), a.observe(t)), n(), {
    refresh: n,
    destroy() {
      t.removeEventListener("scroll", n), a?.disconnect();
    }
  };
}
const V = "http://www.w3.org/2000/svg", dt = {
  svg: { width: "14", height: "14", viewBox: "0 0 14 14", "aria-hidden": "true" },
  path: {
    d: "M2 2l10 10M12 2L2 12",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    fill: "none"
  }
}, lt = {
  svg: { width: "24", height: "24", viewBox: "0 0 24 24", "aria-hidden": "true" },
  path: {
    d: "M5 12l4 4L19 7",
    stroke: "currentColor",
    "stroke-width": "3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none"
  }
}, ct = {
  svg: {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  },
  path: { d: "M6 9l6 6 6-6" }
};
function $(t, e) {
  for (const i in e) t.setAttribute(i, e[i]);
  return t;
}
function k(t) {
  const e = $(document.createElementNS(V, "svg"), t.svg);
  return e.appendChild($(document.createElementNS(V, "path"), t.path)), e;
}
const F = "data-qaid-a11y-live", ut = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;", ht = [
  "a[href]",
  "button",
  "input",
  "textarea",
  "select",
  "[tabindex]"
].join(",");
function pt(t) {
  return t.ownerDocument || document;
}
function ft(t, e) {
  const i = e ? "assertive" : "polite", n = t.querySelector(
    `[${F}="${i}"]`
  );
  if (n) return n;
  const r = pt(t).createElement("div");
  return r.setAttribute(F, i), r.setAttribute("role", e ? "alert" : "status"), r.setAttribute("aria-live", e ? "assertive" : "polite"), r.setAttribute("aria-atomic", "true"), r.style.cssText = ut, t.appendChild(r), r;
}
function y(t, e, i = {}) {
  const n = ft(t, !!i.assertive);
  n.textContent = "", n.textContent = e;
}
function qt(t) {
  return t.hasAttribute("disabled") ? !0 : t.disabled === !0;
}
function mt(t) {
  let e = t;
  for (; e; ) {
    if (e.hasAttribute("hidden")) return !0;
    const i = e.style;
    if (i && (i.display === "none" || i.visibility === "hidden" || i.visibility === "collapse"))
      return !0;
    e = e.parentElement;
  }
  return !1;
}
function _(t) {
  return Array.from(
    t.querySelectorAll(ht)
  ).filter((i) => !(i.getAttribute("tabindex") === "-1" || i instanceof HTMLInputElement && i.type === "hidden" || i instanceof HTMLAnchorElement && !i.getAttribute("href") || qt(i) || mt(i)));
}
function W(t) {
  let e = t.activeElement;
  for (; e && e.shadowRoot && e.shadowRoot.activeElement; )
    e = e.shadowRoot.activeElement;
  return e instanceof HTMLElement ? e : null;
}
function gt(t) {
  const e = t.ownerDocument || document;
  let i = !1;
  const n = (r) => {
    if (r.key !== "Tab") return;
    const o = _(t);
    if (o.length === 0) {
      r.preventDefault(), t.focus();
      return;
    }
    const s = o[0], l = o[o.length - 1], f = W(e), q = f ? o.indexOf(f) !== -1 : !1;
    r.shiftKey ? (!q || f === s) && (r.preventDefault(), l.focus()) : (!q || f === l) && (r.preventDefault(), s.focus());
  };
  t.addEventListener("keydown", n);
  const a = _(t);
  return a.length > 0 ? a[0].focus() : (t.hasAttribute("tabindex") || (t.setAttribute("tabindex", "-1"), i = !0), t.focus()), {
    release() {
      t.removeEventListener("keydown", n), i && (t.removeAttribute("tabindex"), i = !1);
    }
  };
}
function bt() {
  return W(document);
}
function vt(t) {
  if (!(!t || typeof t.focus != "function"))
    try {
      t.focus();
    } catch {
    }
}
function yt(t, e = {}) {
  t.setAttribute("role", "dialog"), t.setAttribute("aria-modal", "true"), e.labelledbyId && t.setAttribute("aria-labelledby", e.labelledbyId), e.describedbyId && t.setAttribute("aria-describedby", e.describedbyId), e.label && t.setAttribute("aria-label", e.label);
}
function Et(t, e) {
  let i = t;
  for (; i && i !== e; ) {
    const n = i.parentNode;
    if (n === e) return i;
    if (n && n.host) {
      i = n.host;
      continue;
    }
    if (!n) return null;
    i = n;
  }
  return null;
}
function xt(t) {
  const i = (t.ownerDocument || document).body;
  if (!i) return () => {
  };
  const n = Et(t, i), a = [];
  return Array.from(i.children).forEach((r) => {
    if (!(r instanceof HTMLElement) || n && r === n) return;
    const o = r.inert === !0, s = r.getAttribute("aria-hidden");
    o && s === "true" || (r.inert = !0, r.setAttribute("aria-hidden", "true"), a.push({ el: r, prevInert: o, prevAriaHidden: s }));
  }), function() {
    for (; a.length; ) {
      const o = a.pop();
      o && (o.el.inert = o.prevInert, o.prevAriaHidden === null ? o.el.removeAttribute("aria-hidden") : o.el.setAttribute("aria-hidden", o.prevAriaHidden));
    }
  };
}
const M = "qaid_visitor_id";
function Q() {
  const t = typeof crypto < "u" ? crypto : void 0;
  if (t && typeof t.randomUUID == "function") return t.randomUUID();
  const e = new Uint8Array(16);
  if (t && typeof t.getRandomValues == "function")
    t.getRandomValues(e);
  else
    for (let n = 0; n < e.length; n++) e[n] = Math.floor(Math.random() * 256);
  e[6] = e[6] & 15 | 64, e[8] = e[8] & 63 | 128;
  const i = Array.from(e, (n) => n.toString(16).padStart(2, "0")).join("");
  return `${i.slice(0, 8)}-${i.slice(8, 12)}-${i.slice(12, 16)}-${i.slice(16, 20)}-${i.slice(20)}`;
}
function wt() {
  try {
    let t = localStorage.getItem(M);
    return t || (t = Q(), localStorage.setItem(M, t)), t;
  } catch {
    return Q();
  }
}
class Ct {
  /**
   * What this build accepts, for hosts that load it at runtime and may get
   * an older copy. asyncMetadata: `metadata` may be a promise.
   */
  static supports = { asyncMetadata: !0 };
  config;
  questionnaire = null;
  inlineQuestionnaire;
  configUrl;
  state = "LOADING";
  stepIndex = 0;
  // Cached subset of questionnaire.questions that are currently visible
  // given the answers so far. Recomputed on every answer change so
  // stepIndex always indexes into THIS list, not the raw question array.
  visibleQuestions = [];
  // Latched goToStep request when called before init finishes. Applied
  // once the questionnaire + visible list are ready.
  pendingGoToStep = null;
  // Latched update() request, for the same reason: a host that swaps the
  // questionnaire while init is still in flight would otherwise have its
  // questionnaire overwritten by the one init is already loading.
  pendingUpdate = null;
  // Consumed by the next renderStep(). Set by update(), because a host
  // swapping the questionnaire is not the reader navigating: pulling focus
  // into the form would take it off whatever they are actually using — in
  // an editor preview, the field they are typing the questionnaire into.
  suppressStepFocus = !1;
  // True after the first step has rendered. Used so the focus-on-step
  // logic in renderStep() can distinguish initial mount (driven by the
  // `autoFocus` config) from subsequent step changes (always focused so
  // keyboard + screen-reader users land on the active input after Next
  // / Back).
  hasRenderedStep = !1;
  answers = {};
  responseId = null;
  visitorId;
  // The create-response request, so submit() can wait for one still in
  // flight, and whether it is still running (a save stops waiting for an
  // id the moment the create has failed, instead of sitting out 5 s).
  createPromise = null;
  createPending = !1;
  // Set when an autosave was dropped because there was no response id to
  // PATCH. submit() then re-sends every visible answer once it has an id,
  // since a server may store answers from the PATCHes alone.
  droppedSaves = !1;
  // Guards submit() against a double click or a retry while one runs.
  submitting = !1;
  // Per-question pending autosave (text/currency are debounced)
  pendingSaveTimer = null;
  pendingSaveQuestionId = null;
  pendingSaveValue = null;
  inflightSaves = 0;
  // Shadow DOM
  shadowHost = null;
  shadowRoot = null;
  isUserContainer = !1;
  // Mounted UI elements
  rootEl = null;
  cardEl = null;
  titleEl = null;
  stepCounterEl = null;
  progressEl = null;
  progressFillEl = null;
  bodyEl = null;
  scrollCueEl = null;
  overflow = null;
  footerEl = null;
  // The step's primary (Next / Submit) button. Kept so an answer can relabel
  // it in place, see `syncPrimaryLabel`.
  primaryBtn = null;
  savingEl = null;
  backdropEl = null;
  currentInput = null;
  boundKeyDown;
  // Modal-mode a11y plumbing (never set in inline/container mode, which
  // keeps normal page tab flow and never traps or restores focus).
  savedOpener = null;
  focusTrap = null;
  inertRestore = null;
  cssVars = {};
  // Track which theme-related fields the host explicitly set so the
  // theme document can fill the rest. A `themeUrl` / `themeDocument`
  // theme is layered between the embed's defaults and the host's
  // explicit overrides, so the host always wins.
  hostThemeOverrides;
  // Raw, host-provided values for the tokens we inline as inline-style
  // CSS vars on rootEl. Anything `undefined` here is left out of the
  // inline write so theme tokens (which arrive as `:where(...) { ... }`
  // rules) can win the cascade.
  hostInlineVars;
  themeUrl;
  themeDocument;
  hostCss;
  // Host integration hooks (see QuestsConfig). Kept off the resolved
  // value-config since they're behaviour, not render tokens.
  metadata;
  onCompleteCb;
  onCloseCb;
  // Guards onClose to fire exactly once even if destroy() runs twice.
  closed = !1;
  constructor(e) {
    e = fe(e, "quests-embed"), this.config = {
      endpoint: e.endpoint,
      apiKey: e.apiKey ?? "",
      container: e.container ?? "",
      zIndex: e.zIndex ?? 50,
      // Prefer the new quest-only keys; fall back to the deprecated
      // thumbs-style keys (positive/negative/marker) so existing
      // integrations keep rendering until they migrate.
      colors: {
        accent: e.colors?.accent ?? e.colors?.positive ?? "#10b981",
        error: e.colors?.error ?? e.colors?.negative ?? "#ef4444",
        focus: e.colors?.focus ?? e.colors?.marker ?? "#6366f1"
      },
      modalWidth: e.modalWidth ?? 480,
      backdropOpacity: e.backdropOpacity ?? 0.4,
      fontFamily: e.fontFamily ?? "system-ui, -apple-system, sans-serif",
      fontSize: e.fontSize ?? 16,
      css: e.css ?? "",
      autoAdvance: e.autoAdvance ?? !1,
      saveDebounceMs: e.saveDebounceMs ?? 500,
      autoFocus: e.autoFocus ?? !0,
      animate: e.animate ?? !0,
      // Don't default here — we want to fall through to the
      // questionnaire's `progressPosition` when the host didn't
      // explicitly set one. effectiveProgressPosition() handles the
      // final fallback to "top".
      progressPosition: e.progressPosition,
      theme: e.theme ?? "auto",
      unstyled: e.unstyled ?? !1,
      preset: e.preset ?? "default",
      pageUrl: e.pageUrl ?? ""
    }, this.hostThemeOverrides = {
      preset: e.preset !== void 0,
      mode: e.theme !== void 0,
      unstyled: e.unstyled !== void 0,
      css: e.css !== void 0
    }, this.hostInlineVars = {
      accentColor: e.colors?.accent ?? e.colors?.positive,
      errorColor: e.colors?.error ?? e.colors?.negative,
      focusColor: e.colors?.focus ?? e.colors?.marker,
      modalWidth: e.modalWidth,
      backdropOpacity: e.backdropOpacity,
      fontFamily: e.fontFamily,
      fontSize: e.fontSize
    }, this.themeUrl = e.themeUrl, this.themeDocument = e.themeDocument, this.hostCss = e.css ?? "", this.metadata = e.metadata, this.onCompleteCb = e.onComplete, this.onCloseCb = e.onClose, this.inlineQuestionnaire = e.questionnaire, this.configUrl = e.configUrl, this.visitorId = e.visitorId || wt(), this.boundKeyDown = this.handleKeyDown.bind(this), this.init();
  }
  async init() {
    this.cssVars = Me(this.hostInlineVars), this.mountShell(), this.renderLoading();
    try {
      const [e, i] = await Promise.all([
        this.loadQuestionnaire(),
        this.loadTheme()
      ]);
      if (!e || !e.questions || e.questions.length === 0)
        throw new Error("Questionnaire is empty");
      if (this.questionnaire = this.pendingUpdate ?? e, this.pendingUpdate = null, this.applyResolvedTheme(i ?? e.themeDocument ?? null), this.recomputeVisible(), this.pendingGoToStep) {
        const n = this.visibleQuestions.findIndex(
          (a) => a.id === this.pendingGoToStep
        );
        n !== -1 && (this.stepIndex = n), this.pendingGoToStep = null;
      }
      this.startCreate(), this.state = "READY", this.renderHeader(), this.renderStep(), this.setupModalA11y();
    } catch (e) {
      this.state = "ERROR", this.renderError(e);
    }
  }
  // ------------------------------------------------------------------
  // Theme document loading + merging
  // ------------------------------------------------------------------
  async loadTheme() {
    if (this.themeDocument) return this.themeDocument;
    if (!this.themeUrl) return null;
    try {
      const e = await R(this.themeUrl);
      return e.ok ? await e.json() : (console.warn(
        `[quests-embed] theme fetch failed (${e.status}) — rendering with defaults`
      ), null);
    } catch (e) {
      return console.warn("[quests-embed] theme fetch error — rendering with defaults", e), null;
    }
  }
  /**
   * Merge a fetched theme document into the live config, then inject
   * the resulting CSS layers + class toggles into the shadow root.
   *
   * Precedence (highest first):
   *   1. Host's explicit `QuestsConfig` fields (preset/theme/unstyled/css)
   *   2. Theme document fields (preset/mode/unstyled/tokens/css)
   *   3. Embed defaults
   *
   * CSS layer order (later wins for same-specificity rules):
   *   base stylesheet → theme.tokens block → preset CSS → theme.css → host css
   */
  applyResolvedTheme(e) {
    if (!this.shadowRoot || !this.rootEl) return;
    const i = this.hostThemeOverrides.preset ? this.config.preset : e?.preset ?? this.config.preset, n = this.hostThemeOverrides.mode ? this.config.theme : e?.mode ?? this.config.theme, a = this.hostThemeOverrides.unstyled ? this.config.unstyled : e?.unstyled ?? this.config.unstyled;
    this.rootEl.classList.toggle(
      "qaid-q-theme-light",
      n === "light"
    ), this.rootEl.classList.toggle(
      "qaid-q-theme-dark",
      n === "dark"
    ), this.rootEl.classList.toggle("qaid-q-unstyled", !!a);
    const r = [], o = Ie(e?.tokens);
    if (o && r.push(o), i && i !== "default") {
      const l = Be(i);
      l && r.push(l);
    }
    const s = ze(e?.css);
    s && r.push(s), this.hostCss && this.hostCss.trim() !== "" && r.push(this.hostCss), r.length > 0 && $e(this.shadowRoot, r.join(`

`));
  }
  // ------------------------------------------------------------------
  // Loading the questionnaire JSON
  // ------------------------------------------------------------------
  async loadQuestionnaire() {
    if (this.inlineQuestionnaire) return this.inlineQuestionnaire;
    if (!this.configUrl)
      throw new Error("No questionnaire or configUrl provided");
    const e = await R(this.configUrl);
    if (!e.ok)
      throw new Error(`Failed to load questionnaire (${e.status})`);
    return await e.json();
  }
  // ------------------------------------------------------------------
  // Shell (shadow host + card chrome that's stable across steps)
  // ------------------------------------------------------------------
  mountShell() {
    this.shadowHost = document.createElement("div"), this.shadowHost.setAttribute("data-qaid-quests", "");
    const e = this.config.container ? document.querySelector(this.config.container) : null;
    e ? (this.shadowHost.style.display = "block", this.shadowHost.style.height = "100%", this.shadowHost.style.minHeight = "0", e.appendChild(this.shadowHost), this.isUserContainer = !0) : (this.savedOpener = bt(), this.shadowHost.style.position = "fixed", this.shadowHost.style.inset = "0", this.shadowHost.style.zIndex = String(this.config.zIndex), this.shadowHost.style.pointerEvents = "none", document.body.appendChild(this.shadowHost)), x(this.shadowHost, je), this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" });
    const i = document.createElement("style");
    if (i.textContent = Ke(), this.shadowRoot.appendChild(i), this.rootEl = document.createElement("div"), this.rootEl.className = [
      "qaid-q-root",
      this.isUserContainer ? "qaid-q-inline" : "",
      this.config.animate ? "" : "qaid-q-no-motion"
    ].filter(Boolean).join(" "), Qe(this.rootEl, this.cssVars), this.isUserContainer)
      this.cardEl = document.createElement("div"), this.cardEl.className = "qaid-q-card", this.rootEl.appendChild(this.cardEl);
    else {
      this.backdropEl = document.createElement("div"), this.backdropEl.className = "qaid-q-backdrop", x(this.backdropEl, Ue), this.backdropEl.addEventListener("click", () => this.close()), this.rootEl.appendChild(this.backdropEl);
      const n = document.createElement("div");
      n.className = "qaid-q-modal", x(n, He), this.cardEl = document.createElement("div"), this.cardEl.className = "qaid-q-card", n.appendChild(this.cardEl), this.rootEl.appendChild(n);
    }
    this.shadowRoot.appendChild(this.rootEl), !this.isUserContainer && this.shadowHost && (this.shadowHost.style.pointerEvents = "auto"), !this.isUserContainer && this.cardEl && yt(this.cardEl), document.addEventListener("keydown", this.boundKeyDown);
  }
  renderLoading() {
    if (!this.cardEl) return;
    this.cardEl.replaceChildren();
    const e = document.createElement("p");
    e.className = "qaid-q-description", e.textContent = "Loading…", this.cardEl.appendChild(e), this.shadowRoot && y(this.shadowRoot, "Loading");
  }
  renderError(e) {
    if (!this.cardEl) return;
    this.cardEl.replaceChildren();
    const i = document.createElement("h3");
    i.className = "qaid-q-title", i.textContent = "Couldn't load form";
    const n = e instanceof Error ? e.message : String(e), a = document.createElement("p");
    a.className = "qaid-q-description", a.textContent = n, this.cardEl.appendChild(i), this.cardEl.appendChild(a), this.shadowRoot && y(this.shadowRoot, `Couldn't load form. ${n}`, {
      assertive: !0
    });
  }
  effectiveProgressPosition() {
    return this.config.progressPosition ?? this.questionnaire?.progressPosition ?? "top";
  }
  renderHeader() {
    if (!this.cardEl || !this.questionnaire) return;
    this.cardEl.replaceChildren();
    const e = !!this.questionnaire.hideProgress || this.questionnaire.questions.length <= 1, i = !e && this.effectiveProgressPosition() === "bottom", n = !!this.questionnaire.hideTitle, a = !!this.questionnaire.title && !n, r = !!this.questionnaire.description && !n, o = !this.isUserContainer, s = o || !i && !e;
    this.savingEl = document.createElement("div"), this.savingEl.className = "qaid-q-saving";
    const l = document.createElement("span");
    l.className = "qaid-q-saving-dot";
    const f = document.createElement("span");
    f.textContent = "Saving…", this.savingEl.appendChild(l), this.savingEl.appendChild(f), this.stepCounterEl = document.createElement("div"), this.stepCounterEl.className = "qaid-q-step-counter", this.progressEl = document.createElement("div"), this.progressEl.className = i ? "qaid-q-progress qaid-q-progress--inline" : "qaid-q-progress", this.progressFillEl = document.createElement("div"), this.progressFillEl.className = "qaid-q-progress-fill", this.progressEl.appendChild(this.progressFillEl);
    const q = a || s;
    if (q) {
      const d = document.createElement("div");
      d.className = "qaid-q-header";
      const u = document.createElement("div");
      a && (this.titleEl = document.createElement("h2"), this.titleEl.className = "qaid-q-title", this.titleEl.textContent = this.questionnaire.title, u.appendChild(this.titleEl));
      const c = document.createElement("div");
      if (c.style.display = "flex", c.style.alignItems = "center", c.style.gap = "0.5rem", i || (c.appendChild(this.savingEl), e || c.appendChild(this.stepCounterEl)), o) {
        const m = document.createElement("button");
        m.type = "button", m.className = "qaid-q-close", m.setAttribute("aria-label", "Close form"), m.appendChild(k(dt)), m.addEventListener("click", () => this.close()), c.appendChild(m);
      }
      d.appendChild(u), d.appendChild(c), this.cardEl.appendChild(d);
    }
    if (!this.isUserContainer && this.cardEl && (this.titleEl ? (this.titleEl.id = this.titleEl.id || "qaid-q-dialog-title", this.cardEl.setAttribute("aria-labelledby", this.titleEl.id), this.cardEl.removeAttribute("aria-label")) : (this.cardEl.removeAttribute("aria-labelledby"), this.cardEl.setAttribute(
      "aria-label",
      this.questionnaire.title ?? "Questionnaire"
    ))), r) {
      const d = document.createElement("p");
      d.className = "qaid-q-description", d.textContent = this.questionnaire.description, d.style.marginTop = q ? "-0.5rem" : "0", d.style.marginBottom = "0.75rem", this.cardEl.appendChild(d);
    }
    !i && !e && this.cardEl.appendChild(this.progressEl), this.bodyEl = document.createElement("div"), this.bodyEl.className = "qaid-q-body", this.cardEl.appendChild(this.bodyEl), this.footerEl = document.createElement("div"), this.footerEl.className = "qaid-q-footer", this.cardEl.appendChild(this.footerEl), this.scrollCueEl = document.createElement("div"), this.scrollCueEl.className = "qaid-q-scroll-cue", this.scrollCueEl.setAttribute("aria-hidden", "true"), this.scrollCueEl.hidden = !0, this.scrollCueEl.appendChild(k(ct)), this.bodyEl.appendChild(this.scrollCueEl), this.overflow = st(this.bodyEl, this.cardEl, this.scrollCueEl);
  }
  // ------------------------------------------------------------------
  // Step rendering
  // ------------------------------------------------------------------
  renderStep() {
    const e = this.suppressStepFocus;
    if (this.suppressStepFocus = !1, !this.questionnaire || !this.bodyEl || !this.footerEl) return;
    const i = this.visibleQuestions.length;
    if (i === 0) {
      this.submit();
      return;
    }
    this.stepIndex >= i && (this.stepIndex = i - 1);
    const n = this.stepIndex, a = this.visibleQuestions[n];
    if (this.stepCounterEl && (this.stepCounterEl.textContent = `${n + 1} / ${i}`), this.progressFillEl) {
      const h = (n + 1) / i * 100;
      this.progressFillEl.style.width = `${h}%`;
    }
    this.progressEl && (this.progressEl.setAttribute("role", "progressbar"), this.progressEl.setAttribute("aria-label", "Progress"), this.progressEl.setAttribute("aria-valuemin", "0"), this.progressEl.setAttribute("aria-valuemax", String(i)), this.progressEl.setAttribute("aria-valuenow", String(n + 1)), this.progressEl.setAttribute(
      "aria-valuetext",
      `Question ${n + 1} of ${i}`
    )), this.shadowRoot && i > 1 && y(this.shadowRoot, `Step ${n + 1} of ${i}`);
    const r = document.createElement("div");
    r.className = "qaid-q-step", r.setAttribute("role", "group"), r.setAttribute("aria-labelledby", `qaid-q-label-${n}`);
    const o = document.createElement("label");
    if (o.id = `qaid-q-label-${n}`, o.className = "qaid-q-label", o.textContent = a.label, a.required) {
      const h = document.createElement("span");
      h.className = "qaid-q-required", h.textContent = "*", h.setAttribute("aria-label", "required"), o.appendChild(h);
    }
    if (r.appendChild(o), a.description) {
      const h = document.createElement("p");
      h.className = "qaid-q-description", h.textContent = a.description, r.appendChild(h);
    }
    const s = document.createElement("p");
    s.className = "qaid-q-error", s.id = `qaid-q-error-${n}`, s.setAttribute("aria-live", "polite");
    const l = this.answers[a.id] ?? null, f = Ye({
      question: a,
      initialValue: l,
      onChange: (h) => {
        this.handleAnswerChange(a, h), s.textContent && (s.textContent = "", this.currentInput?.clearInvalid());
      },
      onSubmit: () => this.advance(a, s),
      onAutoAdvance: () => this.advance(a, s),
      autoAdvance: this.config.autoAdvance
    });
    this.currentInput = f, r.appendChild(f.element), r.appendChild(s), this.bodyEl.replaceChildren(r), this.scrollCueEl && this.bodyEl.appendChild(this.scrollCueEl), this.bodyEl.scrollTop = 0, this.overflow?.refresh(), this.footerEl.replaceChildren();
    const d = !(!!this.questionnaire.hideProgress || this.questionnaire.questions.length <= 1) && this.effectiveProgressPosition() === "bottom", u = n > 0 ? (() => {
      const h = document.createElement("button");
      return h.type = "button", h.className = "qaid-q-btn qaid-q-btn-secondary", h.textContent = this.questionnaire.backLabel ?? "Back", h.addEventListener("click", () => this.back()), h;
    })() : null, c = document.createElement("button");
    if (c.type = "button", c.className = "qaid-q-btn qaid-q-btn-primary", this.primaryBtn = c, this.syncPrimaryLabel(), c.addEventListener("click", () => this.advance(a, s)), d)
      this.footerEl.classList.add("qaid-q-footer--inline-progress"), u && this.footerEl.appendChild(u), this.progressEl && this.footerEl.appendChild(this.progressEl), this.savingEl && this.footerEl.appendChild(this.savingEl), this.stepCounterEl && this.footerEl.appendChild(this.stepCounterEl), this.footerEl.appendChild(c);
    else {
      this.footerEl.classList.remove("qaid-q-footer--inline-progress");
      const h = document.createElement("div");
      h.className = "qaid-q-footer-left";
      const b = document.createElement("div");
      b.className = "qaid-q-footer-right", u && h.appendChild(u), b.appendChild(c), this.footerEl.appendChild(h), this.footerEl.appendChild(b);
    }
    const m = !this.hasRenderedStep;
    this.hasRenderedStep = !0, !e && (!m || this.config.autoFocus) && requestAnimationFrame(() => f.focus());
  }
  renderDone() {
    if (!this.cardEl || !this.questionnaire) return;
    this.cardEl.replaceChildren(), this.primaryBtn = null;
    const e = document.createElement("div");
    e.className = "qaid-q-done";
    const i = document.createElement("div");
    i.className = "qaid-q-done-icon", i.appendChild(k(lt)), e.appendChild(i);
    const n = document.createElement("h3");
    n.className = "qaid-q-done-title";
    const a = this.questionnaire.thankYouTitle ?? "Thank you!";
    if (n.textContent = a, n.setAttribute("tabindex", "-1"), e.appendChild(n), this.questionnaire.thankYouMessage) {
      const r = document.createElement("p");
      r.className = "qaid-q-done-message", r.textContent = this.questionnaire.thankYouMessage, e.appendChild(r);
    }
    if (!this.isUserContainer) {
      const r = document.createElement("button");
      r.type = "button", r.className = "qaid-q-btn qaid-q-btn-primary", r.textContent = "Close", r.style.marginTop = "1rem", r.addEventListener("click", () => this.close()), e.appendChild(r);
    }
    if (this.cardEl.appendChild(e), requestAnimationFrame(() => n.focus()), this.shadowRoot) {
      const r = this.questionnaire.thankYouMessage ? `${a}. ${this.questionnaire.thankYouMessage}` : a;
      y(this.shadowRoot, r);
    }
  }
  /**
   * Shown instead of the thank-you screen when the response could not be
   * created or the submit was refused. The answers stay in memory, so
   * "Try again" re-runs the whole submit (re-creating the response first
   * if needed) without the visitor re-entering anything.
   */
  renderSubmitError() {
    if (this.state = "SUBMIT_FAILED", this.primaryBtn = null, !this.cardEl) return;
    this.cardEl.replaceChildren();
    const e = document.createElement("div");
    e.className = "qaid-q-submit-error";
    const i = document.createElement("h3");
    i.className = "qaid-q-submit-error-title";
    const n = "Couldn't send your answers";
    i.textContent = n, i.setAttribute("tabindex", "-1"), e.appendChild(i);
    const a = document.createElement("p");
    a.className = "qaid-q-submit-error-message";
    const r = "Your answers are still here. Check your connection and try again.";
    a.textContent = r, e.appendChild(a);
    const o = document.createElement("div");
    o.className = "qaid-q-submit-error-actions";
    const s = document.createElement("button");
    if (s.type = "button", s.className = "qaid-q-btn qaid-q-btn-primary", s.textContent = "Try again", s.addEventListener("click", () => {
      this.submitting || (s.setAttribute("aria-disabled", "true"), s.textContent = "Sending…", this.submit());
    }), o.appendChild(s), !this.isUserContainer) {
      const l = document.createElement("button");
      l.type = "button", l.className = "qaid-q-btn qaid-q-btn-secondary", l.textContent = "Close", l.addEventListener("click", () => this.close()), o.appendChild(l);
    }
    e.appendChild(o), this.cardEl.appendChild(e), requestAnimationFrame(() => i.focus()), this.shadowRoot && y(this.shadowRoot, `${n}. ${r}`, { assertive: !0 });
  }
  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  advance(e, i) {
    if (!this.currentInput || !this.questionnaire) return;
    if (!this.currentInput.isValid()) {
      i.textContent = kt(e), this.currentInput.setInvalid(i.id), this.currentInput.focus();
      return;
    }
    if (this.handleAnswerChange(e, this.currentInput.getValue(), { immediate: !0 }), this.stepIndex === this.visibleQuestions.length - 1) {
      this.submit();
      return;
    }
    this.stepIndex++, this.renderStep();
  }
  back() {
    this.flushPendingSave(), !(this.stepIndex <= 0) && (this.stepIndex--, this.recomputeVisible(), this.stepIndex >= this.visibleQuestions.length && (this.stepIndex = Math.max(0, this.visibleQuestions.length - 1)), this.renderStep());
  }
  // ------------------------------------------------------------------
  // Answer handling + autosave
  // ------------------------------------------------------------------
  recomputeVisible() {
    this.questionnaire && (this.visibleQuestions = S(this.questionnaire, this.answers));
  }
  /**
   * Label the step's primary button for what pressing it will do: "Submit"
   * when no question after this one is visible under the current answers,
   * "Next" otherwise. Uses the same test as `advance()`, so the two cannot
   * disagree. Called on draw AND on every answer, because an answer can
   * reveal a follow-up (Submit → Next) or hide the last one (Next → Submit).
   * Edits the one button in place — no redraw, so focus and typed text stay.
   */
  syncPrimaryLabel() {
    const e = this.primaryBtn;
    if (!e || !this.questionnaire) return;
    const n = this.stepIndex >= this.visibleQuestions.length - 1 ? this.questionnaire.submitLabel ?? "Submit" : this.questionnaire.nextLabel ?? "Next";
    e.textContent !== n && (e.textContent = n);
  }
  handleAnswerChange(e, i, n = {}) {
    this.answers[e.id] = i, this.recomputeVisible(), this.syncPrimaryLabel();
    const a = e.type === "text" || e.type === "currency" || e.type === "range";
    if (n.immediate || !a) {
      this.flushPendingSave(), this.saveAnswer(e.id, i);
      return;
    }
    this.pendingSaveQuestionId = e.id, this.pendingSaveValue = i, this.pendingSaveTimer && clearTimeout(this.pendingSaveTimer), this.pendingSaveTimer = setTimeout(() => {
      this.flushPendingSave();
    }, this.config.saveDebounceMs);
  }
  flushPendingSave() {
    if (this.pendingSaveTimer && (clearTimeout(this.pendingSaveTimer), this.pendingSaveTimer = null), this.pendingSaveQuestionId !== null) {
      const e = this.pendingSaveQuestionId, i = this.pendingSaveValue;
      this.pendingSaveQuestionId = null, this.pendingSaveValue = null, this.saveAnswer(e, i);
    }
  }
  saveAnswer(e, i) {
    this.showSaving(!0), this.inflightSaves++, this.doSave(e, i).finally(() => {
      this.inflightSaves--, this.inflightSaves === 0 && this.showSaving(!1);
    });
  }
  async doSave(e, i) {
    let n = 0;
    for (; this.responseId === null && this.createPending && n < 5e3; )
      await new Promise((a) => setTimeout(a, 50)), n += 50;
    if (this.responseId === null) {
      this.droppedSaves = !0;
      return;
    }
    await this.patchAnswer(e, i);
  }
  async patchAnswer(e, i) {
    try {
      await fetch(`${this.config.endpoint}/${this.responseId}`, {
        method: "PATCH",
        headers: this.jsonHeaders(),
        body: JSON.stringify({ questionId: e, value: i })
      });
    } catch (n) {
      console.error("[quests-embed] failed to save answer:", n);
    }
  }
  startCreate() {
    return this.createPending = !0, this.createPromise = this.createResponse().finally(() => {
      this.createPending = !1;
    }), this.createPromise;
  }
  async createResponse() {
    let e;
    try {
      e = await this.metadata;
    } catch {
      e = void 0;
    }
    try {
      const i = await fetch(this.config.endpoint, {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({
          apiKey: this.config.apiKey || void 0,
          questId: this.questionnaire?.id,
          pageUrl: this.config.pageUrl || window.location.href,
          visitorId: this.visitorId,
          userAgent: navigator.userAgent,
          metadata: e
        })
      });
      if (!i.ok) {
        console.error(
          `[quests-embed] failed to create response (${i.status})`
        );
        return;
      }
      const n = await i.json();
      n && n.id !== null && n.id !== void 0 ? this.responseId = n.id : console.error("[quests-embed] create response returned no id");
    } catch (i) {
      console.error("[quests-embed] failed to create response:", i);
    }
  }
  async submit() {
    if (!this.submitting) {
      this.submitting = !0;
      try {
        await this.trySubmit();
      } finally {
        this.submitting = !1;
      }
    }
  }
  async trySubmit() {
    for (this.flushPendingSave(); this.inflightSaves > 0; )
      await new Promise((a) => setTimeout(a, 50));
    if (this.createPromise && await this.createPromise, this.responseId === null && await this.startCreate(), this.responseId === null) {
      this.renderSubmitError();
      return;
    }
    const e = this.questionnaire ? it(this.questionnaire, this.answers) : {}, i = [];
    if (this.droppedSaves)
      for (const [a, r] of Object.entries(e))
        i.push(this.patchAnswer(a, r));
    for (const [a, r] of Object.entries(this.answers))
      !Object.prototype.hasOwnProperty.call(e, a) && r !== null && i.push(this.patchAnswer(a, null));
    await Promise.all(i), this.droppedSaves = !1;
    let n = !1;
    try {
      const a = await fetch(`${this.config.endpoint}/${this.responseId}/submit`, {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({ answers: e })
      });
      n = a.ok, n || console.error(`[quests-embed] submit was refused (${a.status})`);
    } catch (a) {
      console.error("[quests-embed] failed to submit:", a);
    }
    if (!n) {
      this.renderSubmitError();
      return;
    }
    if (this.state = "DONE", this.renderDone(), this.onCompleteCb)
      try {
        this.onCompleteCb({ ...e });
      } catch (a) {
        console.error("[quests-embed] onComplete handler threw:", a);
      }
  }
  jsonHeaders() {
    const e = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    return this.config.apiKey && (e["X-API-Key"] = this.config.apiKey), e;
  }
  showSaving(e) {
    this.savingEl && this.savingEl.classList.toggle("qaid-q-visible", e);
  }
  // ------------------------------------------------------------------
  // Keyboard / lifecycle
  // ------------------------------------------------------------------
  handleKeyDown(e) {
    e.key === "Escape" && !this.isUserContainer && this.state !== "DONE" && this.close();
  }
  /**
   * Modal mode only: trap Tab within the card and mark the rest of the
   * page inert while the dialog is open. Runs once (guarded) after the
   * first step renders. Inline mode keeps normal page tab flow and is
   * never trapped or isolated.
   */
  setupModalA11y() {
    this.isUserContainer || !this.cardEl || this.focusTrap || (this.focusTrap = gt(this.cardEl), this.inertRestore = xt(this.cardEl));
  }
  close() {
    this.flushPendingSave(), this.destroy();
  }
  /** Destroy the embed and clean up all resources */
  destroy() {
    if (document.removeEventListener("keydown", this.boundKeyDown), this.pendingSaveTimer && (clearTimeout(this.pendingSaveTimer), this.pendingSaveTimer = null), this.focusTrap && (this.focusTrap.release(), this.focusTrap = null), this.inertRestore && (this.inertRestore(), this.inertRestore = null), !this.isUserContainer && this.savedOpener && vt(this.savedOpener), this.savedOpener = null, this.shadowHost && (this.shadowHost.remove(), this.shadowHost = null, this.shadowRoot = null), this.rootEl = null, this.cardEl = null, this.overflow?.destroy(), this.overflow = null, this.bodyEl = null, this.scrollCueEl = null, this.footerEl = null, this.titleEl = null, this.stepCounterEl = null, this.progressFillEl = null, this.savingEl = null, this.backdropEl = null, this.currentInput = null, !this.closed && (this.closed = !0, this.onCloseCb))
      try {
        this.onCloseCb();
      } catch (e) {
        console.error("[quests-embed] onClose handler threw:", e);
      }
  }
  /** Read-only snapshot of current answers */
  getAnswers() {
    return { ...this.answers };
  }
  /**
   * Id of the question currently rendered, or `null` if the embed
   * isn't on a question (still loading, on the thank-you screen, or
   * unmounted). Useful for editor previews that want to restore the
   * user's place after a forced re-mount.
   */
  getCurrentQuestionId() {
    if (this.state !== "READY") return null;
    const e = this.visibleQuestions[this.stepIndex];
    return e ? e.id : null;
  }
  /**
   * Swap in a new questionnaire without tearing the embed down.
   *
   * Built for editor previews, where the alternative — `destroy()` plus a
   * fresh construction on every edit — re-mounts the shadow root, repaints
   * the loading state, and re-runs both the theme fetch and the create
   * call. Because that path awaits the network it always paints a blank
   * frame first, which is what makes a live preview strobe while the author
   * types. This re-renders the header and the current step and nothing
   * else, synchronously: the shadow root, the resolved theme, the response
   * id and the answers so far all survive.
   *
   * Answers are kept for questions that still exist and dropped for ones
   * that don't, so `getAnswers()` never reports an id the questionnaire has
   * no question for. The reader's place is kept the same way: if the
   * question on screen is still present and visible, the embed stays on it,
   * otherwise the step index is clamped into range.
   *
   * Returns whether the update was applied. It is refused, leaving the
   * embed exactly as it was, when the questionnaire has no questions, or
   * once the reader has completed the form — resuming a submitted response
   * is not something this can decide on the host's behalf, so a host that
   * wants the new form there should rebuild. Called before the embed has
   * finished initializing, the update is latched and applied as soon as it
   * is ready (and reported as applied), the same way `goToStep` is.
   */
  update(e) {
    if (!e?.questions || e.questions.length === 0 || this.state === "DONE") return !1;
    if (this.state === "LOADING")
      return this.pendingUpdate = e, !0;
    const i = new Set(e.questions.map((s) => s.id)), n = {};
    for (const [s, l] of Object.entries(this.answers))
      i.has(s) && (n[s] = l);
    const a = S(e, n);
    if (a.length === 0) return !1;
    this.flushPendingSave();
    const r = this.getCurrentQuestionId();
    this.questionnaire = e, this.inlineQuestionnaire && (this.inlineQuestionnaire = e), this.state = "READY", this.answers = n, this.visibleQuestions = a;
    const o = r ? this.visibleQuestions.findIndex((s) => s.id === r) : -1;
    return this.stepIndex = o !== -1 ? o : Math.min(this.stepIndex, Math.max(0, this.visibleQuestions.length - 1)), this.suppressStepFocus = !0, this.renderHeader(), this.renderStep(), !0;
  }
  /**
   * Jump to the visible question with the given id. Returns true if
   * the question is currently visible (and the embed navigated to
   * it), false if it's hidden by an unmet `visibleIf` predicate or
   * unknown. If the embed is still initializing, the request is
   * latched and applied as soon as the questionnaire is ready.
   *
   * Intended for editor previews and other host-driven step control.
   */
  goToStep(e) {
    if (this.state !== "READY" || !this.questionnaire)
      return this.pendingGoToStep = e, !1;
    const i = this.visibleQuestions.findIndex((n) => n.id === e);
    return i === -1 ? !1 : (i === this.stepIndex || (this.flushPendingSave(), this.stepIndex = i, this.renderStep()), !0);
  }
}
function kt(t) {
  switch (t.type) {
    case "text":
      return t.minLength ? `Please enter at least ${t.minLength} characters.` : "This field is required.";
    case "currency":
      return "Please enter a valid amount.";
    case "date":
      return "Please pick a date.";
    case "multiple-choice":
      return t.multiple ? "Please select at least one option." : "Please select an option.";
    /* v8 ignore start -- unreachable: a range always holds a value, so its isValid() never fails */
    case "range":
      return "Please choose a value.";
  }
}
function J(t) {
  return document.querySelector(t)?.textContent?.trim() ?? "";
}
function At() {
  const t = document.querySelector(
    'script[type="application/json"][data-quests-config]'
  );
  if (!t) return null;
  const e = t.textContent?.trim();
  if (!e) return null;
  try {
    const i = JSON.parse(e);
    return i.cssSelector && !i.css && (i.css = J(i.cssSelector), delete i.cssSelector), i;
  } catch {
    return null;
  }
}
function T(t, e, i) {
  console.warn(
    `[quests-embed] Ignoring ${t}="${e}": expected ${i}.`
  );
}
function K(t, e) {
  if (e !== null) {
    if (e === "true") return !0;
    if (e === "false") return !1;
    T(t, e, '"true" or "false"');
  }
}
function St(t, e, i) {
  if (e !== null) {
    if (i.includes(e)) return e;
    T(t, e, i.map((n) => `"${n}"`).join(" or "));
  }
}
function It(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function A(t, e, i, n = () => !0) {
  if (e === null) return;
  let a = null;
  try {
    a = JSON.parse(e);
  } catch {
    a = null;
  }
  if (It(a) && n(a)) return a;
  T(t, e, i);
}
function Tt(t) {
  const e = t.getAttribute("data-endpoint");
  if (!e) return null;
  const i = t.getAttribute("data-config-url"), n = t.getAttribute("data-api-key"), a = t.getAttribute("data-container"), r = t.getAttribute("data-zindex"), o = t.getAttribute("data-accent-color"), s = t.getAttribute("data-error-color"), l = t.getAttribute("data-focus-color"), f = t.getAttribute("data-positive-color"), q = t.getAttribute("data-negative-color"), d = t.getAttribute("data-marker-color"), u = t.getAttribute("data-modal-width"), c = t.getAttribute("data-backdrop-opacity"), m = t.getAttribute("data-font-family"), g = t.getAttribute("data-font-size"), h = t.getAttribute("data-css"), b = t.getAttribute("data-css-selector"), p = t.getAttribute("data-auto-advance"), N = t.getAttribute("data-save-debounce-ms"), G = t.getAttribute("data-theme-url"), L = t.getAttribute("data-preset"), O = t.getAttribute("data-theme"), X = t.getAttribute("data-unstyled"), Z = K(
    "data-auto-focus",
    t.getAttribute("data-auto-focus")
  ), ee = K(
    "data-animate",
    t.getAttribute("data-animate")
  ), te = St(
    "data-progress-position",
    t.getAttribute("data-progress-position"),
    ["top", "bottom"]
  ), ie = A(
    "data-questionnaire",
    t.getAttribute("data-questionnaire"),
    'a JSON questionnaire with a "questions" array',
    (se) => Array.isArray(se.questions)
  ), ne = A(
    "data-theme-document",
    t.getAttribute("data-theme-document"),
    "a JSON theme object"
  ), ae = A(
    "data-metadata",
    t.getAttribute("data-metadata"),
    "a JSON object"
  ), re = t.getAttribute("data-page-url"), oe = t.getAttribute("data-visitor-id");
  return {
    endpoint: e,
    configUrl: i ?? void 0,
    questionnaire: ie,
    apiKey: n ?? void 0,
    container: a ?? void 0,
    zIndex: r ? parseInt(r, 10) : void 0,
    colors: {
      accent: o ?? void 0,
      error: s ?? void 0,
      focus: l ?? void 0,
      positive: f ?? void 0,
      negative: q ?? void 0,
      marker: d ?? void 0
    },
    modalWidth: u ? parseInt(u, 10) : void 0,
    backdropOpacity: c ? parseFloat(c) : void 0,
    fontFamily: m ?? void 0,
    fontSize: g ? parseInt(g, 10) : void 0,
    // Inline CSS wins over a selector, as `css` wins over `cssSelector` in
    // the JSON block.
    css: h || (b ? J(b) : void 0),
    autoAdvance: p === "true" ? !0 : void 0,
    saveDebounceMs: N ? parseInt(N, 10) : void 0,
    autoFocus: Z,
    animate: ee,
    progressPosition: te,
    themeUrl: G ?? void 0,
    themeDocument: ne,
    preset: L || void 0,
    theme: O || void 0,
    unstyled: X === "true" ? !0 : void 0,
    metadata: ae,
    pageUrl: re || void 0,
    visitorId: oe || void 0
  };
}
if (typeof document < "u") {
  const t = document.currentScript, e = () => {
    const i = t, n = At() ?? (i ? Tt(i) : null);
    n?.endpoint && (n.configUrl || n.questionnaire) && new Ct(n);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e) : e();
}
export {
  Ct as QaidQuests,
  I as evaluateRule,
  it as getVisibleAnswers,
  S as getVisibleQuestions
};
//# sourceMappingURL=qaid-quests.js.map
