const y = '*{box-sizing:border-box}button{cursor:pointer;font-family:inherit}.qaid-q-root{font-family:var(--qaid-font-family, system-ui, -apple-system, sans-serif);font-size:var(--qaid-font-size, 16px);color:light-dark(#1f2937,#f9fafb)}.qaid-q-backdrop{position:fixed;inset:0;z-index:45;background:rgba(0,0,0,var(--qaid-backdrop-opacity, .4));animation:qaid-q-fade .18s ease-out}@keyframes qaid-q-fade{0%{opacity:0}to{opacity:1}}.qaid-q-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:50;width:var(--qaid-modal-width, 480px);max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);pointer-events:auto;display:flex;flex-direction:column}.qaid-q-card{background:light-dark(#ffffff,#1f2937);color:light-dark(#1f2937,#f9fafb);border-radius:1rem;box-shadow:0 25px 50px -12px light-dark(rgba(0,0,0,.25),rgba(0,0,0,.6));padding:1.5rem;overflow:hidden;display:flex;flex-direction:column;min-height:0}:where(.qaid-q-root.qaid-q-inline) .qaid-q-card{box-shadow:none;border:1px solid light-dark(#e5e7eb,#374151)}.qaid-q-header{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:1rem}.qaid-q-title{font-size:1.125rem;font-weight:700;margin:0;color:light-dark(#1f2937,#f9fafb)}.qaid-q-step-counter{font-size:.875rem;color:light-dark(#6b7280,#9ca3af);font-variant-numeric:tabular-nums;white-space:nowrap}.qaid-q-close{width:28px;height:28px;padding:0;border:none;border-radius:50%;background:transparent;color:light-dark(#6b7280,#9ca3af);display:inline-flex;align-items:center;justify-content:center;-webkit-appearance:none;appearance:none}.qaid-q-close:hover{background:light-dark(#f3f4f6,#374151);color:light-dark(#1f2937,#f9fafb)}.qaid-q-close:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-marker, #6366f1) 30%,transparent)}.qaid-q-progress{position:relative;height:4px;background:light-dark(#e5e7eb,#374151);border-radius:9999px;overflow:hidden;margin-bottom:1.25rem}.qaid-q-progress-fill{position:absolute;inset:0 auto 0 0;background:var(--qaid-positive, #10b981);border-radius:9999px;transition:width .3s ease;width:0%}.qaid-q-body{flex:1;min-height:0;overflow-y:auto}.qaid-q-step{display:flex;flex-direction:column;gap:.75rem;animation:qaid-q-slide .22s ease-out}@keyframes qaid-q-slide{0%{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.qaid-q-label{font-size:1.125rem;font-weight:600;margin:0;color:light-dark(#1f2937,#f9fafb);line-height:1.35}.qaid-q-label .qaid-q-required{color:var(--qaid-negative, #ef4444);margin-left:.25rem}.qaid-q-description{font-size:.875rem;color:light-dark(#6b7280,#9ca3af);margin:0;line-height:1.4}.qaid-q-error{font-size:.8125rem;color:var(--qaid-negative, #ef4444);margin:0;min-height:1.1em}.qaid-q-input,.qaid-q-textarea{width:100%;padding:.75rem .875rem;border:1px solid light-dark(#d1d5db,#374151);border-radius:.625rem;font-family:inherit;font-size:1rem;background:light-dark(#ffffff,#111827);color:light-dark(#1f2937,#f9fafb);transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;appearance:none}.qaid-q-textarea{min-height:7rem;resize:vertical;font-family:inherit}.qaid-q-input:focus,.qaid-q-textarea:focus{outline:none;border-color:var(--qaid-marker, #6366f1);box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-marker, #6366f1) 20%,transparent)}.qaid-q-input::placeholder,.qaid-q-textarea::placeholder{color:light-dark(#9ca3af,#6b7280)}.qaid-q-currency{position:relative}.qaid-q-currency-prefix{position:absolute;left:.875rem;top:50%;transform:translateY(-50%);color:light-dark(#6b7280,#9ca3af);font-size:1rem;font-weight:500;pointer-events:none}.qaid-q-currency .qaid-q-input{padding-left:2.25rem}.qaid-q-range-wrap{display:flex;flex-direction:column;gap:.5rem;padding:.5rem 0}.qaid-q-range-value{font-size:2rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;color:var(--qaid-positive, #10b981)}.qaid-q-range-value .qaid-q-range-unit{font-size:1rem;font-weight:500;color:light-dark(#6b7280,#9ca3af);margin-left:.25rem}.qaid-q-range{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:9999px;background:light-dark(#e5e7eb,#374151);outline:none}.qaid-q-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:var(--qaid-positive, #10b981);border:3px solid light-dark(#ffffff,#1f2937);box-shadow:0 2px 6px #0003;cursor:pointer;transition:transform .1s}.qaid-q-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--qaid-positive, #10b981);border:3px solid light-dark(#ffffff,#1f2937);box-shadow:0 2px 6px #0003;cursor:pointer}.qaid-q-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 6px color-mix(in srgb,var(--qaid-marker, #6366f1) 30%,transparent)}.qaid-q-range:focus-visible::-moz-range-thumb{box-shadow:0 0 0 6px color-mix(in srgb,var(--qaid-marker, #6366f1) 30%,transparent)}.qaid-q-range-bounds{display:flex;justify-content:space-between;font-size:.8125rem;color:light-dark(#6b7280,#9ca3af);font-variant-numeric:tabular-nums}.qaid-q-options{display:flex;flex-direction:column;gap:.5rem}.qaid-q-option{display:flex;align-items:flex-start;gap:.625rem;padding:.75rem .875rem;border:1px solid light-dark(#e5e7eb,#374151);border-radius:.625rem;background:light-dark(#ffffff,#111827);text-align:left;font-size:1rem;color:light-dark(#1f2937,#f9fafb);cursor:pointer;transition:border-color .12s,background .12s,box-shadow .12s;-webkit-appearance:none;appearance:none;width:100%}.qaid-q-option:hover{border-color:light-dark(#9ca3af,#4b5563);background:light-dark(#f9fafb,#1f2937)}.qaid-q-option:focus-visible{outline:none;border-color:var(--qaid-marker, #6366f1);box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-marker, #6366f1) 25%,transparent)}.qaid-q-option.qaid-q-selected{border-color:var(--qaid-positive, #10b981);background:color-mix(in srgb,var(--qaid-positive, #10b981) 10%,transparent)}.qaid-q-option-marker{flex-shrink:0;width:1.25rem;height:1.25rem;border:2px solid light-dark(#d1d5db,#4b5563);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-top:.125rem;background:light-dark(#ffffff,#111827);transition:border-color .12s,background .12s}.qaid-q-option.qaid-q-multi .qaid-q-option-marker{border-radius:.25rem}.qaid-q-option.qaid-q-selected .qaid-q-option-marker{border-color:var(--qaid-positive, #10b981);background:var(--qaid-positive, #10b981)}.qaid-q-option.qaid-q-selected .qaid-q-option-marker:after{content:"";display:block;width:.5rem;height:.5rem;border-radius:50%;background:light-dark(#ffffff,#1f2937)}.qaid-q-option.qaid-q-multi.qaid-q-selected .qaid-q-option-marker:after{content:"";display:block;width:.625rem;height:.625rem;border-radius:0;background:transparent;border-right:2px solid light-dark(#ffffff,#1f2937);border-bottom:2px solid light-dark(#ffffff,#1f2937);transform:rotate(45deg) translate(-1px,-2px)}.qaid-q-option-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:.125rem}.qaid-q-option-label{font-weight:500;line-height:1.3}.qaid-q-option-desc{font-size:.8125rem;color:light-dark(#6b7280,#9ca3af);line-height:1.4}.qaid-q-option-key{flex-shrink:0;align-self:center;font-size:.7rem;font-weight:600;padding:.125rem .375rem;border-radius:.25rem;background:light-dark(#f3f4f6,#374151);color:light-dark(#6b7280,#9ca3af);font-variant-numeric:tabular-nums}.qaid-q-footer{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:1.25rem}.qaid-q-footer-left,.qaid-q-footer-right{display:flex;gap:.5rem}.qaid-q-btn{padding:.625rem 1.125rem;border-radius:.5rem;font-size:.9375rem;font-weight:500;border:1px solid transparent;cursor:pointer;transition:filter .15s,background .15s,color .15s;-webkit-appearance:none;appearance:none}.qaid-q-btn:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--qaid-marker, #6366f1) 30%,transparent)}.qaid-q-btn-secondary{background:transparent;border-color:light-dark(#d1d5db,#4b5563);color:light-dark(#374151,#d1d5db)}.qaid-q-btn-secondary:hover{background:light-dark(#f3f4f6,#374151)}.qaid-q-btn-primary{background:var(--qaid-positive, #10b981);color:var(--qaid-positive-text, #ffffff);border-color:transparent}.qaid-q-btn-primary:hover{filter:brightness(.9)}.qaid-q-btn-primary:disabled{opacity:.5;cursor:not-allowed;filter:none}.qaid-q-hint{font-size:.75rem;color:light-dark(#6b7280,#9ca3af)}.qaid-q-hint kbd{display:inline-block;padding:.05rem .35rem;border-radius:.25rem;background:light-dark(#f3f4f6,#374151);border:1px solid light-dark(#e5e7eb,#4b5563);font-family:inherit;font-size:.7rem;font-weight:600;color:light-dark(#374151,#e5e7eb)}.qaid-q-done{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.5rem;padding:1.5rem 0}.qaid-q-done-icon{width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--qaid-positive, #10b981) 18%,transparent);color:var(--qaid-positive, #10b981);display:inline-flex;align-items:center;justify-content:center;margin-bottom:.5rem}.qaid-q-done-title{font-size:1.25rem;font-weight:700;margin:0}.qaid-q-done-message{color:light-dark(#6b7280,#9ca3af);margin:0}.qaid-q-saving{display:inline-flex;align-items:center;gap:.375rem;font-size:.75rem;color:light-dark(#6b7280,#9ca3af);opacity:0;transition:opacity .2s}.qaid-q-saving.qaid-q-visible{opacity:1}.qaid-q-saving-dot{width:6px;height:6px;border-radius:50%;background:var(--qaid-positive, #10b981);animation:qaid-q-pulse 1.2s ease-in-out infinite}@keyframes qaid-q-pulse{0%,to{opacity:.3}50%{opacity:1}}';
function x(t, e, a) {
  const [n, i, o] = [t, e, a].map((r) => (r = r / 255, r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)));
  return 0.2126 * n + 0.7152 * i + 0.0722 * o;
}
function E(t) {
  if (t.startsWith("#")) {
    const a = t.slice(1), n = a.length === 3 ? a.split("").map((o) => o + o).join("") : a, i = parseInt(n, 16);
    return { r: i >> 16 & 255, g: i >> 8 & 255, b: i & 255 };
  }
  const e = t.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return e ? { r: parseInt(e[1]), g: parseInt(e[2]), b: parseInt(e[3]) } : null;
}
function b(t) {
  const e = E(t);
  return e && x(e.r, e.g, e.b) > 0.4 ? "black" : "white";
}
function k(t = {}) {
  const {
    positiveColor: e = "#10b981",
    negativeColor: a = "#ef4444",
    markerColor: n = "#6366f1",
    modalWidth: i = 480,
    backdropOpacity: o = 0.4,
    fontFamily: r = "system-ui, -apple-system, sans-serif",
    fontSize: c = 16
  } = t;
  return {
    "--qaid-positive": e,
    "--qaid-positive-text": b(e),
    "--qaid-negative": a,
    "--qaid-marker": n,
    "--qaid-marker-text": b(n),
    "--qaid-modal-width": `${i}px`,
    "--qaid-backdrop-opacity": String(o),
    "--qaid-font-family": r,
    "--qaid-font-size": `${c}px`
  };
}
function w(t, e) {
  for (const [a, n] of Object.entries(e))
    t.style.setProperty(a, n);
}
function C() {
  return y;
}
function S(t) {
  switch (t.question.type) {
    case "text":
      return N(t.question, t);
    case "currency":
      return I(t.question, t);
    case "range":
      return z(t.question, t);
    case "date":
      return V(t.question, t);
    case "multiple-choice":
      return D(t.question, t);
  }
}
function N(t, e) {
  const a = typeof e.initialValue == "string" ? e.initialValue : "";
  let n;
  if (t.multiline) {
    const i = document.createElement("textarea");
    i.className = "qaid-q-textarea", i.value = a, t.placeholder && (i.placeholder = t.placeholder), t.maxLength && (i.maxLength = t.maxLength), n = i;
  } else {
    const i = document.createElement("input");
    i.className = "qaid-q-input", i.type = t.inputType ?? "text", i.value = a, t.placeholder && (i.placeholder = t.placeholder), t.maxLength && (i.maxLength = t.maxLength), i.setAttribute("autocomplete", A(t.inputType)), n = i;
  }
  return n.setAttribute("aria-label", t.label), n.addEventListener("input", () => {
    e.onChange(n.value);
  }), n.addEventListener("keydown", ((i) => {
    if (i.key === "Enter") {
      if (t.multiline) {
        (i.metaKey || i.ctrlKey) && (i.preventDefault(), e.onSubmit());
        return;
      }
      i.isComposing || (i.preventDefault(), e.onSubmit());
    }
  })), {
    element: n,
    focus: () => {
      n.focus();
      const i = n.value.length;
      try {
        n.setSelectionRange(i, i);
      } catch {
      }
    },
    getValue: () => n.value,
    isValid: () => {
      if (!t.required) return !0;
      const i = n.value.trim();
      return !(i.length === 0 || t.minLength && i.length < t.minLength);
    }
  };
}
function A(t) {
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
function I(t, e) {
  const a = document.createElement("div");
  a.className = "qaid-q-currency";
  const n = document.createElement("span");
  n.className = "qaid-q-currency-prefix", n.textContent = L(t.currency ?? "USD", t.locale), a.appendChild(n);
  const i = document.createElement("input");
  return i.className = "qaid-q-input", i.type = "number", i.inputMode = "decimal", i.step = "0.01", typeof t.min == "number" && (i.min = String(t.min)), typeof t.max == "number" && (i.max = String(t.max)), t.placeholder && (i.placeholder = t.placeholder), typeof e.initialValue == "number" ? i.value = String(e.initialValue) : typeof e.initialValue == "string" && e.initialValue !== "" && (i.value = e.initialValue), i.setAttribute("aria-label", t.label), i.addEventListener("input", () => {
    const o = i.value;
    if (o === "")
      e.onChange(null);
    else {
      const r = Number(o);
      e.onChange(Number.isNaN(r) ? null : r);
    }
  }), i.addEventListener("keydown", (o) => {
    o.key === "Enter" && !o.isComposing && (o.preventDefault(), e.onSubmit());
  }), a.appendChild(i), {
    element: a,
    focus: () => i.focus(),
    getValue: () => {
      if (i.value === "") return null;
      const o = Number(i.value);
      return Number.isNaN(o) ? null : o;
    },
    isValid: () => {
      const o = i.value === "" ? null : Number(i.value);
      return !(t.required && (o === null || Number.isNaN(o)) || o !== null && !Number.isNaN(o) && (typeof t.min == "number" && o < t.min || typeof t.max == "number" && o > t.max));
    }
  };
}
function L(t, e) {
  try {
    return new Intl.NumberFormat(e, {
      style: "currency",
      currency: t,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0
    }).formatToParts(0).find((o) => o.type === "currency")?.value ?? t;
  } catch {
    return t;
  }
}
function z(t, e) {
  const a = document.createElement("div");
  a.className = "qaid-q-range-wrap";
  const n = document.createElement("div");
  n.className = "qaid-q-range-value";
  const i = document.createElement("span");
  if (n.appendChild(i), t.unit) {
    const h = document.createElement("span");
    h.className = "qaid-q-range-unit", h.textContent = t.unit, n.appendChild(h);
  }
  const o = typeof e.initialValue == "number" ? e.initialValue : t.defaultValue ?? t.min, r = document.createElement("input");
  r.className = "qaid-q-range", r.type = "range", r.min = String(t.min), r.max = String(t.max), r.step = String(t.step ?? 1), r.value = String(o), r.setAttribute("aria-label", t.label), r.setAttribute("aria-valuemin", String(t.min)), r.setAttribute("aria-valuemax", String(t.max));
  const c = () => {
    i.textContent = r.value, r.setAttribute("aria-valuenow", r.value);
  };
  c(), r.addEventListener("input", () => {
    c(), e.onChange(Number(r.value));
  }), r.addEventListener("keydown", (h) => {
    h.key === "Enter" && (h.preventDefault(), e.onSubmit());
  });
  const l = document.createElement("div");
  l.className = "qaid-q-range-bounds";
  const d = document.createElement("span");
  d.textContent = `${t.min}${t.unit ?? ""}`;
  const s = document.createElement("span");
  return s.textContent = `${t.max}${t.unit ?? ""}`, l.appendChild(d), l.appendChild(s), a.appendChild(n), a.appendChild(r), a.appendChild(l), queueMicrotask(() => e.onChange(Number(r.value))), {
    element: a,
    focus: () => r.focus(),
    getValue: () => Number(r.value),
    isValid: () => !0
  };
}
function V(t, e) {
  const a = document.createElement("input");
  return a.className = "qaid-q-input", a.type = "date", t.min && (a.min = t.min), t.max && (a.max = t.max), typeof e.initialValue == "string" && (a.value = e.initialValue), a.setAttribute("aria-label", t.label), a.addEventListener("input", () => {
    e.onChange(a.value || null);
  }), a.addEventListener("keydown", (n) => {
    n.key === "Enter" && !n.isComposing && (n.preventDefault(), e.onSubmit());
  }), {
    element: a,
    focus: () => a.focus(),
    getValue: () => a.value || null,
    isValid: () => t.required ? a.value !== "" : !0
  };
}
function D(t, e) {
  const a = document.createElement("div");
  a.className = "qaid-q-options", a.setAttribute("role", t.multiple ? "group" : "radiogroup"), a.setAttribute("aria-label", t.label);
  const n = /* @__PURE__ */ new Set();
  if (t.multiple && Array.isArray(e.initialValue))
    for (const l of e.initialValue) n.add(l);
  else !t.multiple && typeof e.initialValue == "string" && n.add(e.initialValue);
  const i = [];
  t.options.forEach((l, d) => {
    const s = document.createElement("button");
    s.type = "button", s.className = `qaid-q-option${t.multiple ? " qaid-q-multi" : ""}`, s.dataset.value = l.value, s.setAttribute("role", t.multiple ? "checkbox" : "radio"), s.setAttribute("aria-checked", n.has(l.value) ? "true" : "false"), n.has(l.value) && s.classList.add("qaid-q-selected");
    const h = document.createElement("span");
    h.className = "qaid-q-option-marker", h.setAttribute("aria-hidden", "true");
    const m = document.createElement("span");
    m.className = "qaid-q-option-body";
    const f = document.createElement("span");
    if (f.className = "qaid-q-option-label", f.textContent = l.label, m.appendChild(f), l.description) {
      const u = document.createElement("span");
      u.className = "qaid-q-option-desc", u.textContent = l.description, m.appendChild(u);
    }
    if (s.appendChild(h), s.appendChild(m), d < 9) {
      const u = document.createElement("span");
      u.className = "qaid-q-option-key", u.textContent = String(d + 1), u.setAttribute("aria-hidden", "true"), s.appendChild(u);
    }
    s.addEventListener("click", () => r(d)), s.addEventListener("keydown", (u) => {
      if (u.key === "ArrowDown" || u.key === "ArrowRight") {
        u.preventDefault(), o((d + 1) % i.length);
        return;
      }
      if (u.key === "ArrowUp" || u.key === "ArrowLeft") {
        u.preventDefault(), o((d - 1 + i.length) % i.length);
        return;
      }
      !t.multiple && u.key === "Enter" && n.size > 0 && (u.preventDefault(), e.onSubmit());
    }), i.push(s), a.appendChild(s);
  }), a.addEventListener("keydown", (l) => {
    const d = l.key;
    if (d.length === 1 && d >= "1" && d <= "9") {
      const s = parseInt(d, 10) - 1;
      s < i.length && (l.preventDefault(), r(s), o(s));
    }
  });
  function o(l) {
    i[l]?.focus();
  }
  function r(l) {
    const d = t.options[l].value;
    t.multiple ? n.has(d) ? n.delete(d) : n.add(d) : (n.clear(), n.add(d)), i.forEach((s) => {
      const h = s.dataset.value, m = n.has(h);
      s.classList.toggle("qaid-q-selected", m), s.setAttribute("aria-checked", m ? "true" : "false");
    }), e.onChange(c()), !t.multiple && e.autoAdvance && setTimeout(() => e.onAutoAdvance(), 180);
  }
  function c() {
    if (t.multiple) return Array.from(n);
    const l = n.values().next();
    return l.done ? null : l.value;
  }
  return {
    element: a,
    focus: () => {
      (i.find((d) => d.classList.contains("qaid-q-selected")) ?? i[0])?.focus();
    },
    getValue: () => c(),
    isValid: () => t.required ? n.size > 0 : !0
  };
}
const q = "qaid_visitor_id";
function T() {
  try {
    let t = localStorage.getItem(q);
    return t || (t = crypto.randomUUID(), localStorage.setItem(q, t)), t;
  } catch {
    return crypto.randomUUID();
  }
}
const H = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>', F = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
class O {
  config;
  questionnaire = null;
  inlineQuestionnaire;
  configUrl;
  state = "LOADING";
  stepIndex = 0;
  // True after the first step has rendered. Used so the focus-on-step
  // logic in renderStep() can distinguish initial mount (driven by the
  // `autoFocus` config) from subsequent step changes (always focused so
  // keyboard + screen-reader users land on the active input after Next
  // / Back).
  hasRenderedStep = !1;
  answers = {};
  responseId = null;
  visitorId;
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
  progressFillEl = null;
  bodyEl = null;
  footerEl = null;
  savingEl = null;
  backdropEl = null;
  currentInput = null;
  boundKeyDown;
  cssVars = {};
  constructor(e) {
    this.config = {
      endpoint: e.endpoint,
      apiKey: e.apiKey ?? "",
      container: e.container ?? "",
      zIndex: e.zIndex ?? 50,
      colors: {
        positive: e.colors?.positive ?? "#10b981",
        negative: e.colors?.negative ?? "#ef4444",
        marker: e.colors?.marker ?? "#6366f1"
      },
      modalWidth: e.modalWidth ?? 480,
      backdropOpacity: e.backdropOpacity ?? 0.4,
      fontFamily: e.fontFamily ?? "system-ui, -apple-system, sans-serif",
      fontSize: e.fontSize ?? 16,
      css: e.css ?? "",
      autoAdvance: e.autoAdvance ?? !1,
      saveDebounceMs: e.saveDebounceMs ?? 500,
      autoFocus: e.autoFocus ?? !0
    }, this.inlineQuestionnaire = e.questionnaire, this.configUrl = e.configUrl, this.visitorId = T(), this.boundKeyDown = this.handleKeyDown.bind(this), this.init();
  }
  async init() {
    this.cssVars = k({
      positiveColor: this.config.colors.positive,
      negativeColor: this.config.colors.negative,
      markerColor: this.config.colors.marker,
      modalWidth: this.config.modalWidth,
      backdropOpacity: this.config.backdropOpacity,
      fontFamily: this.config.fontFamily,
      fontSize: this.config.fontSize
    }), this.mountShell(), this.renderLoading();
    try {
      const e = await this.loadQuestionnaire();
      if (!e || !e.questions || e.questions.length === 0)
        throw new Error("Questionnaire is empty");
      this.questionnaire = e, this.createResponse(), this.state = "READY", this.renderHeader(), this.renderStep();
    } catch (e) {
      this.state = "ERROR", this.renderError(e);
    }
  }
  // ------------------------------------------------------------------
  // Loading the questionnaire JSON
  // ------------------------------------------------------------------
  async loadQuestionnaire() {
    if (this.inlineQuestionnaire) return this.inlineQuestionnaire;
    if (!this.configUrl)
      throw new Error("No questionnaire or configUrl provided");
    const e = await fetch(this.configUrl, {
      headers: { Accept: "application/json" }
    });
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
    e ? (this.shadowHost.style.display = "block", e.appendChild(this.shadowHost), this.isUserContainer = !0) : (this.shadowHost.style.position = "fixed", this.shadowHost.style.inset = "0", this.shadowHost.style.zIndex = String(this.config.zIndex), this.shadowHost.style.pointerEvents = "none", document.body.appendChild(this.shadowHost)), this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" });
    const a = document.createElement("style");
    if (a.textContent = C(), this.shadowRoot.appendChild(a), this.config.css) {
      const n = document.createElement("style");
      n.textContent = this.config.css, this.shadowRoot.appendChild(n);
    }
    if (this.rootEl = document.createElement("div"), this.rootEl.className = `qaid-q-root${this.isUserContainer ? " qaid-q-inline" : ""}`, w(this.rootEl, this.cssVars), this.isUserContainer)
      this.cardEl = document.createElement("div"), this.cardEl.className = "qaid-q-card", this.rootEl.appendChild(this.cardEl);
    else {
      this.backdropEl = document.createElement("div"), this.backdropEl.className = "qaid-q-backdrop", this.backdropEl.addEventListener("click", () => this.close()), this.rootEl.appendChild(this.backdropEl);
      const n = document.createElement("div");
      n.className = "qaid-q-modal", this.cardEl = document.createElement("div"), this.cardEl.className = "qaid-q-card", n.appendChild(this.cardEl), this.rootEl.appendChild(n);
    }
    this.shadowRoot.appendChild(this.rootEl), !this.isUserContainer && this.shadowHost && (this.shadowHost.style.pointerEvents = "auto"), document.addEventListener("keydown", this.boundKeyDown);
  }
  renderLoading() {
    if (!this.cardEl) return;
    this.cardEl.replaceChildren();
    const e = document.createElement("p");
    e.className = "qaid-q-description", e.textContent = "Loading…", this.cardEl.appendChild(e);
  }
  renderError(e) {
    if (!this.cardEl) return;
    this.cardEl.replaceChildren();
    const a = document.createElement("h3");
    a.className = "qaid-q-title", a.textContent = "Couldn't load form";
    const n = document.createElement("p");
    n.className = "qaid-q-description", n.textContent = e instanceof Error ? e.message : String(e), this.cardEl.appendChild(a), this.cardEl.appendChild(n);
  }
  renderHeader() {
    if (!this.cardEl || !this.questionnaire) return;
    this.cardEl.replaceChildren();
    const e = document.createElement("div");
    e.className = "qaid-q-header";
    const a = document.createElement("div");
    this.titleEl = document.createElement("h2"), this.titleEl.className = "qaid-q-title", this.titleEl.textContent = this.questionnaire.title ?? "", this.questionnaire.title && a.appendChild(this.titleEl);
    const n = document.createElement("div");
    n.style.display = "flex", n.style.alignItems = "center", n.style.gap = "0.5rem", this.savingEl = document.createElement("div"), this.savingEl.className = "qaid-q-saving";
    const i = document.createElement("span");
    i.className = "qaid-q-saving-dot";
    const o = document.createElement("span");
    if (o.textContent = "Saving…", this.savingEl.appendChild(i), this.savingEl.appendChild(o), this.stepCounterEl = document.createElement("div"), this.stepCounterEl.className = "qaid-q-step-counter", n.appendChild(this.savingEl), n.appendChild(this.stepCounterEl), !this.isUserContainer) {
      const c = document.createElement("button");
      c.type = "button", c.className = "qaid-q-close", c.setAttribute("aria-label", "Close form"), c.innerHTML = H, c.addEventListener("click", () => this.close()), n.appendChild(c);
    }
    if (e.appendChild(a), e.appendChild(n), this.cardEl.appendChild(e), this.questionnaire.description) {
      const c = document.createElement("p");
      c.className = "qaid-q-description", c.textContent = this.questionnaire.description, c.style.marginTop = "-0.5rem", c.style.marginBottom = "0.75rem", this.cardEl.appendChild(c);
    }
    const r = document.createElement("div");
    r.className = "qaid-q-progress", this.progressFillEl = document.createElement("div"), this.progressFillEl.className = "qaid-q-progress-fill", r.appendChild(this.progressFillEl), this.cardEl.appendChild(r), this.bodyEl = document.createElement("div"), this.bodyEl.className = "qaid-q-body", this.cardEl.appendChild(this.bodyEl), this.footerEl = document.createElement("div"), this.footerEl.className = "qaid-q-footer", this.cardEl.appendChild(this.footerEl);
  }
  // ------------------------------------------------------------------
  // Step rendering
  // ------------------------------------------------------------------
  renderStep() {
    if (!this.questionnaire || !this.bodyEl || !this.footerEl) return;
    const e = this.questionnaire.questions.length, a = this.stepIndex, n = this.questionnaire.questions[a];
    if (this.stepCounterEl && (this.stepCounterEl.textContent = `${a + 1} / ${e}`), this.progressFillEl) {
      const p = (a + 1) / e * 100;
      this.progressFillEl.style.width = `${p}%`;
    }
    const i = document.createElement("div");
    i.className = "qaid-q-step", i.setAttribute("role", "group"), i.setAttribute("aria-labelledby", `qaid-q-label-${a}`);
    const o = document.createElement("label");
    if (o.id = `qaid-q-label-${a}`, o.className = "qaid-q-label", o.textContent = n.label, n.required) {
      const p = document.createElement("span");
      p.className = "qaid-q-required", p.textContent = "*", p.setAttribute("aria-label", "required"), o.appendChild(p);
    }
    if (i.appendChild(o), n.description) {
      const p = document.createElement("p");
      p.className = "qaid-q-description", p.textContent = n.description, i.appendChild(p);
    }
    const r = document.createElement("p");
    r.className = "qaid-q-error", r.setAttribute("aria-live", "polite");
    const c = this.answers[n.id] ?? null, l = a === e - 1, d = S({
      question: n,
      initialValue: c,
      onChange: (p) => {
        this.handleAnswerChange(n, p), r.textContent && (r.textContent = "");
      },
      onSubmit: () => this.advance(n, r),
      onAutoAdvance: () => this.advance(n, r),
      autoAdvance: this.config.autoAdvance
    });
    this.currentInput = d, i.appendChild(d.element), i.appendChild(r), this.bodyEl.replaceChildren(i), this.footerEl.replaceChildren();
    const s = document.createElement("div");
    s.className = "qaid-q-footer-left";
    const h = document.createElement("div");
    if (h.className = "qaid-q-footer-right", a > 0) {
      const p = document.createElement("button");
      p.type = "button", p.className = "qaid-q-btn qaid-q-btn-secondary", p.textContent = this.questionnaire.backLabel ?? "Back", p.addEventListener("click", () => this.back()), s.appendChild(p);
    }
    const m = document.createElement("span");
    m.className = "qaid-q-hint", m.innerHTML = l ? "<kbd>Enter</kbd> to submit" : "<kbd>Enter</kbd> to continue", h.appendChild(m);
    const f = document.createElement("button");
    f.type = "button", f.className = "qaid-q-btn qaid-q-btn-primary", f.textContent = l ? this.questionnaire.submitLabel ?? "Submit" : this.questionnaire.nextLabel ?? "Next", f.addEventListener("click", () => this.advance(n, r)), h.appendChild(f), this.footerEl.appendChild(s), this.footerEl.appendChild(h);
    const u = !this.hasRenderedStep;
    this.hasRenderedStep = !0, (!u || this.config.autoFocus) && requestAnimationFrame(() => d.focus());
  }
  renderDone() {
    if (!this.cardEl || !this.questionnaire) return;
    this.cardEl.replaceChildren();
    const e = document.createElement("div");
    e.className = "qaid-q-done";
    const a = document.createElement("div");
    a.className = "qaid-q-done-icon", a.innerHTML = F, e.appendChild(a);
    const n = document.createElement("h3");
    if (n.className = "qaid-q-done-title", n.textContent = this.questionnaire.thankYouTitle ?? "Thank you!", e.appendChild(n), this.questionnaire.thankYouMessage) {
      const i = document.createElement("p");
      i.className = "qaid-q-done-message", i.textContent = this.questionnaire.thankYouMessage, e.appendChild(i);
    }
    if (!this.isUserContainer) {
      const i = document.createElement("button");
      i.type = "button", i.className = "qaid-q-btn qaid-q-btn-primary", i.textContent = "Close", i.style.marginTop = "1rem", i.addEventListener("click", () => this.close()), e.appendChild(i);
    }
    this.cardEl.appendChild(e);
  }
  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  advance(e, a) {
    if (!this.currentInput || !this.questionnaire) return;
    if (!this.currentInput.isValid()) {
      a.textContent = U(e), this.currentInput.focus();
      return;
    }
    if (this.handleAnswerChange(e, this.currentInput.getValue(), { immediate: !0 }), this.stepIndex === this.questionnaire.questions.length - 1) {
      this.submit();
      return;
    }
    this.stepIndex++, this.renderStep();
  }
  back() {
    this.flushPendingSave(), this.stepIndex > 0 && (this.stepIndex--, this.renderStep());
  }
  // ------------------------------------------------------------------
  // Answer handling + autosave
  // ------------------------------------------------------------------
  handleAnswerChange(e, a, n = {}) {
    this.answers[e.id] = a;
    const i = e.type === "text" || e.type === "currency" || e.type === "range";
    if (n.immediate || !i) {
      this.flushPendingSave(), this.saveAnswer(e.id, a);
      return;
    }
    this.pendingSaveQuestionId = e.id, this.pendingSaveValue = a, this.pendingSaveTimer && clearTimeout(this.pendingSaveTimer), this.pendingSaveTimer = setTimeout(() => {
      this.flushPendingSave();
    }, this.config.saveDebounceMs);
  }
  flushPendingSave() {
    if (this.pendingSaveTimer && (clearTimeout(this.pendingSaveTimer), this.pendingSaveTimer = null), this.pendingSaveQuestionId !== null) {
      const e = this.pendingSaveQuestionId, a = this.pendingSaveValue;
      this.pendingSaveQuestionId = null, this.pendingSaveValue = null, this.saveAnswer(e, a);
    }
  }
  saveAnswer(e, a) {
    this.showSaving(!0), this.inflightSaves++, this.doSave(e, a).finally(() => {
      this.inflightSaves--, this.inflightSaves === 0 && this.showSaving(!1);
    });
  }
  async doSave(e, a) {
    let n = 0;
    for (; this.responseId === null && n < 5e3; )
      await new Promise((i) => setTimeout(i, 50)), n += 50;
    if (this.responseId !== null)
      try {
        await fetch(`${this.config.endpoint}/${this.responseId}`, {
          method: "PATCH",
          headers: this.jsonHeaders(),
          body: JSON.stringify({ questionId: e, value: a })
        });
      } catch (i) {
        console.error("[quests-embed] failed to save answer:", i);
      }
  }
  async createResponse() {
    try {
      const e = await fetch(this.config.endpoint, {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({
          apiKey: this.config.apiKey || void 0,
          questId: this.questionnaire?.id,
          pageUrl: window.location.href,
          visitorId: this.visitorId,
          userAgent: navigator.userAgent
        })
      });
      if (e.ok) {
        const a = await e.json();
        this.responseId = a.id;
      }
    } catch (e) {
      console.error("[quests-embed] failed to create response:", e);
    }
  }
  async submit() {
    for (this.flushPendingSave(); this.inflightSaves > 0; )
      await new Promise((e) => setTimeout(e, 50));
    if (this.responseId !== null)
      try {
        await fetch(`${this.config.endpoint}/${this.responseId}/submit`, {
          method: "POST",
          headers: this.jsonHeaders(),
          body: JSON.stringify({ answers: this.answers })
        });
      } catch (e) {
        console.error("[quests-embed] failed to submit:", e);
      }
    this.state = "DONE", this.renderDone();
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
  close() {
    this.flushPendingSave(), this.destroy();
  }
  /** Destroy the embed and clean up all resources */
  destroy() {
    document.removeEventListener("keydown", this.boundKeyDown), this.pendingSaveTimer && (clearTimeout(this.pendingSaveTimer), this.pendingSaveTimer = null), this.shadowHost && (this.shadowHost.remove(), this.shadowHost = null, this.shadowRoot = null), this.rootEl = null, this.cardEl = null, this.bodyEl = null, this.footerEl = null, this.titleEl = null, this.stepCounterEl = null, this.progressFillEl = null, this.savingEl = null, this.backdropEl = null, this.currentInput = null;
  }
  /** Read-only snapshot of current answers */
  getAnswers() {
    return { ...this.answers };
  }
}
function U(t) {
  switch (t.type) {
    case "text":
      return t.minLength ? `Please enter at least ${t.minLength} characters.` : "This field is required.";
    case "currency":
      return "Please enter a valid amount.";
    case "date":
      return "Please pick a date.";
    case "multiple-choice":
      return t.multiple ? "Please select at least one option." : "Please select an option.";
    case "range":
      return "Please choose a value.";
  }
}
function v(t) {
  return document.querySelector(t)?.textContent?.trim() ?? "";
}
function j() {
  const t = document.querySelector(
    'script[type="application/json"][data-quests-config]'
  );
  if (!t) return null;
  const e = t.textContent?.trim();
  if (!e) return null;
  try {
    const a = JSON.parse(e);
    return a.cssSelector && !a.css && (a.css = v(a.cssSelector), delete a.cssSelector), a;
  } catch {
    return null;
  }
}
function P(t) {
  const e = t.getAttribute("data-endpoint");
  if (!e) return null;
  const a = t.getAttribute("data-config-url"), n = t.getAttribute("data-api-key"), i = t.getAttribute("data-container"), o = t.getAttribute("data-zindex"), r = t.getAttribute("data-positive-color"), c = t.getAttribute("data-negative-color"), l = t.getAttribute("data-marker-color"), d = t.getAttribute("data-modal-width"), s = t.getAttribute("data-backdrop-opacity"), h = t.getAttribute("data-font-family"), m = t.getAttribute("data-font-size"), f = t.getAttribute("data-css-selector"), u = t.getAttribute("data-auto-advance"), g = t.getAttribute("data-save-debounce-ms");
  return {
    endpoint: e,
    configUrl: a ?? void 0,
    apiKey: n ?? void 0,
    container: i ?? void 0,
    zIndex: o ? parseInt(o, 10) : void 0,
    colors: {
      positive: r ?? void 0,
      negative: c ?? void 0,
      marker: l ?? void 0
    },
    modalWidth: d ? parseInt(d, 10) : void 0,
    backdropOpacity: s ? parseFloat(s) : void 0,
    fontFamily: h ?? void 0,
    fontSize: m ? parseInt(m, 10) : void 0,
    css: f ? v(f) : void 0,
    autoAdvance: u === "true" ? !0 : void 0,
    saveDebounceMs: g ? parseInt(g, 10) : void 0
  };
}
if (typeof document < "u") {
  const t = () => {
    const e = document.currentScript, a = j(), n = e ? P(e) : null, i = a ?? n;
    i?.endpoint && (i.configUrl || i.questionnaire) && new O(i);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t) : t();
}
export {
  O as QaidQuests
};
//# sourceMappingURL=qaid-quests.js.map
