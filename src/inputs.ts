/**
 * Input renderers for each question type.
 *
 * Each renderer returns a small object with an element to mount, a
 * focus helper, a synchronous current-value reader, and a validator.
 *
 * Per-keystroke autosave is wired by the embed: the renderer just
 * calls back into onChange whenever its underlying value changes.
 * Renderers also call onSubmit when the user presses Enter (or
 * onAutoAdvance after a discrete selection that should auto-advance).
 */

import type {
  AnswerValue,
  CurrencyQuestion,
  DateQuestion,
  MultipleChoiceQuestion,
  Question,
  RangeQuestion,
  TextQuestion,
} from "./types";

export interface QuestionInput {
  element: HTMLElement;
  focus(): void;
  getValue(): AnswerValue;
  isValid(): boolean;
  /**
   * Mark the control invalid: sets aria-invalid="true" and links the
   * error text (identified by `errorId`) via aria-describedby so a
   * screen reader reads the error as the field's description. Do not
   * rely on colour alone (WCAG 3.3.1 / 1.3.1 / 4.1.2).
   */
  setInvalid(errorId: string): void;
  /** Clear aria-invalid and unlink the error text once the field is corrected. */
  clearInvalid(): void;
}

/**
 * Wire aria-invalid + aria-describedby error association onto a control.
 * setInvalid(id) marks it invalid and appends the error id to
 * aria-describedby (preserving any existing tokens); clearInvalid()
 * removes aria-invalid and only the token it added.
 */
function createInvalidState(
  control: HTMLElement,
): Pick<QuestionInput, "setInvalid" | "clearInvalid"> {
  let linkedId: string | null = null;
  return {
    setInvalid(errorId: string): void {
      control.setAttribute("aria-invalid", "true");
      const ids = (control.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter(Boolean);
      if (!ids.includes(errorId)) ids.push(errorId);
      control.setAttribute("aria-describedby", ids.join(" "));
      linkedId = errorId;
    },
    clearInvalid(): void {
      control.removeAttribute("aria-invalid");
      if (linkedId) {
        const ids = (control.getAttribute("aria-describedby") ?? "")
          .split(/\s+/)
          .filter(Boolean)
          .filter((id) => id !== linkedId);
        if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
        else control.removeAttribute("aria-describedby");
        linkedId = null;
      }
    },
  };
}

export interface QuestionInputOptions {
  question: Question;
  initialValue: AnswerValue;
  /** Called any time the value changes (every keystroke for text). */
  onChange: (value: AnswerValue) => void;
  /** Called when the user presses Enter to advance. */
  onSubmit: () => void;
  /**
   * Called after a discrete selection that should auto-advance
   * (e.g. picking a single-choice option when autoAdvance is on).
   */
  onAutoAdvance: () => void;
  /** Whether the embed is configured to auto-advance after discrete selections */
  autoAdvance: boolean;
}

export function createInput(options: QuestionInputOptions): QuestionInput {
  switch (options.question.type) {
    case "text":
      return createTextInput(options.question, options);
    case "currency":
      return createCurrencyInput(options.question, options);
    case "range":
      return createRangeInput(options.question, options);
    case "date":
      return createDateInput(options.question, options);
    case "multiple-choice":
      return createMultipleChoiceInput(options.question, options);
  }
}

// ====================================================================
// Text
// ====================================================================

function createTextInput(
  q: TextQuestion,
  opts: QuestionInputOptions,
): QuestionInput {
  const initial = typeof opts.initialValue === "string" ? opts.initialValue : "";

  let el: HTMLInputElement | HTMLTextAreaElement;

  if (q.multiline) {
    const textarea = document.createElement("textarea");
    textarea.className = "qaid-q-textarea";
    textarea.value = initial;
    if (q.placeholder) textarea.placeholder = q.placeholder;
    if (q.maxLength) textarea.maxLength = q.maxLength;
    el = textarea;
  } else {
    const input = document.createElement("input");
    input.className = "qaid-q-input";
    input.type = q.inputType ?? "text";
    input.value = initial;
    if (q.placeholder) input.placeholder = q.placeholder;
    if (q.maxLength) input.maxLength = q.maxLength;
    input.setAttribute("autocomplete", inputAutocomplete(q.inputType));
    el = input;
  }

  el.setAttribute("aria-label", q.label);
  if (q.required) el.setAttribute("aria-required", "true");

  el.addEventListener("input", () => {
    opts.onChange(el.value);
  });

  el.addEventListener("keydown", ((e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (q.multiline) {
      // In multiline, Enter inserts newline; Cmd/Ctrl+Enter submits.
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        opts.onSubmit();
      }
      return;
    }
    // Single-line: Enter submits, but allow IME composition to finish first.
    if (e.isComposing) return;
    e.preventDefault();
    opts.onSubmit();
  }) as EventListener);

  return {
    element: el,
    focus: () => {
      el.focus();
      // Place cursor at end so user can keep typing.
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        // input types like email may not support selectionRange
      }
    },
    getValue: () => el.value,
    isValid: () => {
      if (!q.required) return true;
      const v = el.value.trim();
      if (v.length === 0) return false;
      if (q.minLength && v.length < q.minLength) return false;
      return true;
    },
    ...createInvalidState(el),
  };
}

function inputAutocomplete(t?: TextQuestion["inputType"]): string {
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

// ====================================================================
// Currency
// ====================================================================

function createCurrencyInput(
  q: CurrencyQuestion,
  opts: QuestionInputOptions,
): QuestionInput {
  const wrap = document.createElement("div");
  wrap.className = "qaid-q-currency";

  const prefix = document.createElement("span");
  prefix.className = "qaid-q-currency-prefix";
  prefix.textContent = currencySymbol(q.currency ?? "USD", q.locale);
  wrap.appendChild(prefix);

  const input = document.createElement("input");
  input.className = "qaid-q-input";
  // type="number" gives native numeric keyboard + min/max validation hooks.
  input.type = "number";
  input.inputMode = "decimal";
  input.step = "0.01";
  if (typeof q.min === "number") input.min = String(q.min);
  if (typeof q.max === "number") input.max = String(q.max);
  if (q.placeholder) input.placeholder = q.placeholder;
  if (typeof opts.initialValue === "number") input.value = String(opts.initialValue);
  else if (typeof opts.initialValue === "string" && opts.initialValue !== "")
    input.value = opts.initialValue;
  input.setAttribute("aria-label", q.label);
  if (q.required) input.setAttribute("aria-required", "true");

  input.addEventListener("input", () => {
    const raw = input.value;
    if (raw === "") {
      opts.onChange(null);
    } else {
      const num = Number(raw);
      opts.onChange(Number.isNaN(num) ? null : num);
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !(e as KeyboardEvent).isComposing) {
      e.preventDefault();
      opts.onSubmit();
    }
  });

  wrap.appendChild(input);

  return {
    element: wrap,
    focus: () => input.focus(),
    getValue: () => {
      if (input.value === "") return null;
      const num = Number(input.value);
      return Number.isNaN(num) ? null : num;
    },
    isValid: () => {
      const v = input.value === "" ? null : Number(input.value);
      if (q.required && (v === null || Number.isNaN(v as number))) return false;
      if (v !== null && !Number.isNaN(v as number)) {
        if (typeof q.min === "number" && (v as number) < q.min) return false;
        if (typeof q.max === "number" && (v as number) > q.max) return false;
      }
      return true;
    },
    ...createInvalidState(input),
  };
}

function currencySymbol(currency: string, locale?: string): string {
  try {
    const fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    // Pull the symbol out of a formatted zero
    const parts = fmt.formatToParts(0);
    const sym = parts.find((p) => p.type === "currency");
    return sym?.value ?? currency;
  } catch {
    return currency;
  }
}

// ====================================================================
// Range
// ====================================================================

function createRangeInput(
  q: RangeQuestion,
  opts: QuestionInputOptions,
): QuestionInput {
  const wrap = document.createElement("div");
  wrap.className = "qaid-q-range-wrap";

  const valueDisplay = document.createElement("div");
  valueDisplay.className = "qaid-q-range-value";

  const valueText = document.createElement("span");
  valueDisplay.appendChild(valueText);

  if (q.unit) {
    const unit = document.createElement("span");
    unit.className = "qaid-q-range-unit";
    unit.textContent = q.unit;
    valueDisplay.appendChild(unit);
  }

  const initial =
    typeof opts.initialValue === "number"
      ? opts.initialValue
      : (q.defaultValue ?? q.min);

  const input = document.createElement("input");
  input.className = "qaid-q-range";
  input.type = "range";
  input.min = String(q.min);
  input.max = String(q.max);
  input.step = String(q.step ?? 1);
  input.value = String(initial);
  input.setAttribute("aria-label", q.label);
  input.setAttribute("aria-valuemin", String(q.min));
  input.setAttribute("aria-valuemax", String(q.max));

  const updateDisplay = () => {
    valueText.textContent = input.value;
    input.setAttribute("aria-valuenow", input.value);
  };
  updateDisplay();

  input.addEventListener("input", () => {
    updateDisplay();
    opts.onChange(Number(input.value));
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      opts.onSubmit();
    }
  });

  const bounds = document.createElement("div");
  bounds.className = "qaid-q-range-bounds";
  const lower = document.createElement("span");
  lower.textContent = `${q.min}${q.unit ?? ""}`;
  const upper = document.createElement("span");
  upper.textContent = `${q.max}${q.unit ?? ""}`;
  bounds.appendChild(lower);
  bounds.appendChild(upper);

  wrap.appendChild(valueDisplay);
  wrap.appendChild(input);
  wrap.appendChild(bounds);

  // Push the initial value to onChange so first interaction is recorded
  // even if the user presses Enter without dragging.
  // (Defer to the next tick so the embed has wired up its handler.)
  queueMicrotask(() => opts.onChange(Number(input.value)));

  return {
    element: wrap,
    focus: () => input.focus(),
    getValue: () => Number(input.value),
    isValid: () => true,
    ...createInvalidState(input),
  };
}

// ====================================================================
// Date
// ====================================================================

function createDateInput(q: DateQuestion, opts: QuestionInputOptions): QuestionInput {
  const input = document.createElement("input");
  input.className = "qaid-q-input";
  input.type = "date";
  if (q.min) input.min = q.min;
  if (q.max) input.max = q.max;
  if (typeof opts.initialValue === "string") input.value = opts.initialValue;
  input.setAttribute("aria-label", q.label);
  if (q.required) input.setAttribute("aria-required", "true");

  input.addEventListener("input", () => {
    opts.onChange(input.value || null);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !(e as KeyboardEvent).isComposing) {
      e.preventDefault();
      opts.onSubmit();
    }
  });

  return {
    element: input,
    focus: () => input.focus(),
    getValue: () => input.value || null,
    isValid: () => {
      if (!q.required) return true;
      return input.value !== "";
    },
    ...createInvalidState(input),
  };
}

// ====================================================================
// Multiple choice
// ====================================================================

function createMultipleChoiceInput(
  q: MultipleChoiceQuestion,
  opts: QuestionInputOptions,
): QuestionInput {
  const wrap = document.createElement("div");
  const alignment = q.imageAlignment ?? "horizontal";
  const hasAnyImage = q.options.some((o) => !!o.image);
  const layoutClass = hasAnyImage
    ? alignment === "vertical"
      ? " qaid-q-options--image-vertical"
      : " qaid-q-options--image-horizontal"
    : "";
  wrap.className = `qaid-q-options${layoutClass}`;
  wrap.setAttribute("role", q.multiple ? "group" : "radiogroup");
  wrap.setAttribute("aria-label", q.label);
  if (q.required) wrap.setAttribute("aria-required", "true");

  // Normalize initial selection to a Set for both modes
  const selected = new Set<string>();
  if (q.multiple && Array.isArray(opts.initialValue)) {
    for (const v of opts.initialValue) selected.add(v);
  } else if (!q.multiple && typeof opts.initialValue === "string") {
    selected.add(opts.initialValue);
  }

  const buttons: HTMLButtonElement[] = [];

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `qaid-q-option${q.multiple ? " qaid-q-multi" : ""}`;
    btn.dataset.value = opt.value;
    btn.setAttribute("role", q.multiple ? "checkbox" : "radio");
    btn.setAttribute("aria-checked", selected.has(opt.value) ? "true" : "false");
    if (selected.has(opt.value)) btn.classList.add("qaid-q-selected");

    const marker = document.createElement("span");
    marker.className = "qaid-q-option-marker";
    marker.setAttribute("aria-hidden", "true");

    const body = document.createElement("span");
    body.className = "qaid-q-option-body";

    if (opt.image) {
      const img = document.createElement("img");
      img.className = "qaid-q-option-image";
      img.src = opt.image;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      body.appendChild(img);
    }

    const label = document.createElement("span");
    label.className = "qaid-q-option-label";
    label.textContent = opt.label;
    body.appendChild(label);

    if (opt.description) {
      const desc = document.createElement("span");
      desc.className = "qaid-q-option-desc";
      desc.textContent = opt.description;
      body.appendChild(desc);
    }

    btn.appendChild(marker);
    btn.appendChild(body);

    if (idx < 9) {
      const key = document.createElement("span");
      key.className = "qaid-q-option-key";
      key.textContent = String(idx + 1);
      key.setAttribute("aria-hidden", "true");
      btn.appendChild(key);
    }

    btn.addEventListener("click", () => toggle(idx));

    btn.addEventListener("keydown", (e) => {
      // Native button handles Space/Enter; we add arrow-key roving focus
      // and Enter-to-advance for single-choice.
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        focusOption((idx + 1) % buttons.length);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        focusOption((idx - 1 + buttons.length) % buttons.length);
        return;
      }
      if (!q.multiple && e.key === "Enter") {
        // If something is already selected, advance instead of toggling
        if (selected.size > 0) {
          e.preventDefault();
          opts.onSubmit();
        }
      }
    });

    buttons.push(btn);
    wrap.appendChild(btn);
  });

  // Number-key shortcuts (1-9) at the wrap level
  wrap.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k.length === 1 && k >= "1" && k <= "9") {
      const idx = parseInt(k, 10) - 1;
      if (idx < buttons.length) {
        e.preventDefault();
        toggle(idx);
        focusOption(idx);
      }
    }
  });

  function focusOption(idx: number): void {
    buttons[idx]?.focus();
  }

  function toggle(idx: number): void {
    const value = q.options[idx].value;
    if (q.multiple) {
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
    } else {
      selected.clear();
      selected.add(value);
    }
    // Update DOM state
    buttons.forEach((b) => {
      const v = b.dataset.value!;
      const on = selected.has(v);
      b.classList.toggle("qaid-q-selected", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
    opts.onChange(currentValue());
    if (!q.multiple && opts.autoAdvance) {
      // Tiny delay so the user sees the selection animation before advancing.
      setTimeout(() => opts.onAutoAdvance(), 180);
    }
  }

  function currentValue(): AnswerValue {
    if (q.multiple) return Array.from(selected);
    const it = selected.values().next();
    return it.done ? null : it.value;
  }

  return {
    element: wrap,
    focus: () => {
      // Focus the first selected option, or the first option overall.
      const firstSelected = buttons.find((b) => b.classList.contains("qaid-q-selected"));
      (firstSelected ?? buttons[0])?.focus();
    },
    getValue: () => currentValue(),
    isValid: () => {
      if (!q.required) return true;
      return selected.size > 0;
    },
    ...createInvalidState(wrap),
  };
}
