/**
 * Tests for the per-question input renderers in inputs.ts.
 *
 * Each renderer is exercised through the public `createInput` factory so
 * we cover the type-switch as well as the individual renderers. We assert
 * on rendered DOM, value reading, onChange/onSubmit/onAutoAdvance wiring,
 * and isValid() across required / bounds / length edge cases.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInput, type QuestionInputOptions } from "./inputs";
import type {
  AnswerValue,
  CurrencyQuestion,
  DateQuestion,
  MultipleChoiceQuestion,
  Question,
  RangeQuestion,
  TextQuestion,
} from "./types";

interface Spies {
  onChange: ReturnType<typeof vi.fn>;
  onSubmit: ReturnType<typeof vi.fn>;
  onAutoAdvance: ReturnType<typeof vi.fn>;
}

function makeOpts(
  question: Question,
  overrides: Partial<QuestionInputOptions> = {},
): QuestionInputOptions & Spies {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const onAutoAdvance = vi.fn();
  return {
    question,
    initialValue: null,
    onChange,
    onSubmit,
    onAutoAdvance,
    autoAdvance: false,
    ...overrides,
  };
}

/** Dispatch a keydown carrying the extra KeyboardEvent props happy-dom honors. */
function keydown(
  el: HTMLElement,
  init: KeyboardEventInit & { isComposing?: boolean } = {},
): KeyboardEvent {
  const e = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  if (init.isComposing) {
    Object.defineProperty(e, "isComposing", { value: true });
  }
  el.dispatchEvent(e);
  return e;
}

function fireInput(el: HTMLElement): void {
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("createInput dispatch", () => {
  it("returns a text input for type 'text'", () => {
    const opts = makeOpts({ id: "t", type: "text", label: "Name" });
    const input = createInput(opts);
    expect(input.element.querySelector?.("input") ?? input.element).toBeTruthy();
    expect((input.element as HTMLInputElement).className).toContain("qaid-q-input");
  });
});

describe("text input", () => {
  function build(q: Partial<TextQuestion> = {}, overrides: Partial<QuestionInputOptions> = {}) {
    const question: TextQuestion = { id: "t", type: "text", label: "Name", ...q };
    const opts = makeOpts(question, overrides);
    const input = createInput(opts);
    return { input, opts, el: input.element as HTMLInputElement };
  }

  it("renders a single-line input with placeholder, maxLength and aria-label", () => {
    const { el } = build({ placeholder: "Jane", maxLength: 10 });
    expect(el.tagName).toBe("INPUT");
    expect(el.type).toBe("text");
    expect(el.placeholder).toBe("Jane");
    expect(el.maxLength).toBe(10);
    expect(el.getAttribute("aria-label")).toBe("Name");
    expect(el.getAttribute("autocomplete")).toBe("off");
  });

  it("renders a textarea when multiline is set", () => {
    const { el } = build({ multiline: true, placeholder: "tell us", maxLength: 200 });
    expect(el.tagName).toBe("TEXTAREA");
    expect(el.className).toContain("qaid-q-textarea");
    expect((el as unknown as HTMLTextAreaElement).maxLength).toBe(200);
  });

  it("seeds value from a string initialValue and ignores non-string", () => {
    const a = build({}, { initialValue: "hello" });
    expect(a.el.value).toBe("hello");
    const b = build({}, { initialValue: 42 });
    expect(b.el.value).toBe("");
  });

  it.each([
    ["email", "email"],
    ["tel", "tel"],
    ["url", "url"],
    ["text", "off"],
    [undefined, "off"],
  ] as const)("maps inputType %s to autocomplete %s", (inputType, expected) => {
    const { el } = build({ inputType: inputType as TextQuestion["inputType"] });
    expect(el.getAttribute("autocomplete")).toBe(expected);
    if (inputType) expect(el.type).toBe(inputType);
  });

  it("fires onChange with the current value on input", () => {
    const { el, opts } = build();
    el.value = "abc";
    fireInput(el);
    expect(opts.onChange).toHaveBeenCalledWith("abc");
  });

  it("getValue returns the live element value", () => {
    const { el, input } = build();
    el.value = "live";
    expect(input.getValue()).toBe("live");
  });

  it("single-line Enter submits and prevents default", () => {
    const { el, opts } = build();
    const e = keydown(el, { key: "Enter" });
    expect(opts.onSubmit).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  it("single-line ignores Enter while composing (IME)", () => {
    const { el, opts } = build();
    keydown(el, { key: "Enter", isComposing: true });
    expect(opts.onSubmit).not.toHaveBeenCalled();
  });

  it("non-Enter keys do not submit", () => {
    const { el, opts } = build();
    keydown(el, { key: "a" });
    expect(opts.onSubmit).not.toHaveBeenCalled();
  });

  it("multiline plain Enter inserts a newline (no submit)", () => {
    const { el, opts } = build({ multiline: true });
    const e = keydown(el, { key: "Enter" });
    expect(opts.onSubmit).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });

  it("multiline Cmd/Ctrl+Enter submits", () => {
    const meta = build({ multiline: true });
    keydown(meta.el, { key: "Enter", metaKey: true });
    expect(meta.opts.onSubmit).toHaveBeenCalledTimes(1);

    const ctrl = build({ multiline: true });
    keydown(ctrl.el, { key: "Enter", ctrlKey: true });
    expect(ctrl.opts.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("focus() moves caret to end of value", () => {
    const { el, input } = build({}, { initialValue: "abcd" });
    document.body.appendChild(el);
    input.focus();
    expect(el.selectionStart).toBe(4);
    expect(el.selectionEnd).toBe(4);
    el.remove();
  });

  it("focus() swallows setSelectionRange errors", () => {
    const { el, input } = build({ inputType: "email" }, { initialValue: "a@b.com" });
    document.body.appendChild(el);
    // setSelectionRange throws on type=email in real browsers; ensure no throw.
    expect(() => input.focus()).not.toThrow();
    el.remove();
  });

  describe("isValid", () => {
    it("non-required is always valid even when empty", () => {
      const { input } = build({ required: false });
      expect(input.isValid()).toBe(true);
    });

    it("required rejects empty / whitespace-only", () => {
      const { el, input } = build({ required: true });
      expect(input.isValid()).toBe(false);
      el.value = "   ";
      expect(input.isValid()).toBe(false);
      el.value = " x ";
      expect(input.isValid()).toBe(true);
    });

    it("required + minLength enforces trimmed length", () => {
      const { el, input } = build({ required: true, minLength: 3 });
      el.value = "ab";
      expect(input.isValid()).toBe(false);
      el.value = "abc";
      expect(input.isValid()).toBe(true);
    });
  });
});

describe("currency input", () => {
  function build(q: Partial<CurrencyQuestion> = {}, overrides: Partial<QuestionInputOptions> = {}) {
    const question: CurrencyQuestion = { id: "c", type: "currency", label: "Budget", ...q };
    const opts = makeOpts(question, overrides);
    const input = createInput(opts);
    const wrap = input.element as HTMLDivElement;
    const el = wrap.querySelector("input") as HTMLInputElement;
    const prefix = wrap.querySelector(".qaid-q-currency-prefix") as HTMLSpanElement;
    return { input, opts, wrap, el, prefix };
  }

  it("renders a number input wrapped with a currency prefix", () => {
    const { wrap, el, prefix } = build();
    expect(wrap.className).toBe("qaid-q-currency");
    expect(el.type).toBe("number");
    expect(el.inputMode).toBe("decimal");
    expect(el.step).toBe("0.01");
    expect(prefix.textContent).toBeTruthy();
  });

  it("shows the $ symbol for USD", () => {
    const { prefix } = build({ currency: "USD", locale: "en-US" });
    expect(prefix.textContent).toContain("$");
  });

  it("falls back to the raw currency code on bad input", () => {
    const { prefix } = build({ currency: "NOTACURRENCY" });
    expect(prefix.textContent).toBe("NOTACURRENCY");
  });

  it("applies min/max/placeholder attributes", () => {
    const { el } = build({ min: 5, max: 100, placeholder: "0.00" });
    expect(el.min).toBe("5");
    expect(el.max).toBe("100");
    expect(el.placeholder).toBe("0.00");
  });

  it("seeds value from a numeric initialValue", () => {
    const { el } = build({}, { initialValue: 42 });
    expect(el.value).toBe("42");
  });

  it("seeds value from a non-empty string initialValue", () => {
    const { el } = build({}, { initialValue: "12.5" });
    expect(el.value).toBe("12.5");
  });

  it("does not seed from an empty string initialValue", () => {
    const { el } = build({}, { initialValue: "" });
    expect(el.value).toBe("");
  });

  it("onChange receives null for empty, a number for valid input", () => {
    const { el, opts } = build();
    el.value = "12.5";
    fireInput(el);
    expect(opts.onChange).toHaveBeenLastCalledWith(12.5);
    el.value = "";
    fireInput(el);
    expect(opts.onChange).toHaveBeenLastCalledWith(null);
  });

  it("getValue parses the current value, null when blank", () => {
    const { el, input } = build();
    expect(input.getValue()).toBe(null);
    el.value = "9.99";
    expect(input.getValue()).toBe(9.99);
  });

  it("Enter submits and prevents default", () => {
    const { el, opts } = build();
    const e = keydown(el, { key: "Enter" });
    expect(opts.onSubmit).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  it("Enter while composing does not submit", () => {
    const { el, opts } = build();
    keydown(el, { key: "Enter", isComposing: true });
    expect(opts.onSubmit).not.toHaveBeenCalled();
  });

  it("focus() focuses the inner number input", () => {
    const { el, input, wrap } = build();
    document.body.appendChild(wrap);
    input.focus();
    expect(document.activeElement).toBe(el);
    wrap.remove();
  });

  describe("isValid", () => {
    it("non-required blank is valid", () => {
      const { input } = build({ required: false });
      expect(input.isValid()).toBe(true);
    });

    it("required blank is invalid", () => {
      const { input } = build({ required: true });
      expect(input.isValid()).toBe(false);
    });

    it("required with a value is valid", () => {
      const { el, input } = build({ required: true });
      el.value = "10";
      expect(input.isValid()).toBe(true);
    });

    it("enforces min", () => {
      const { el, input } = build({ min: 5 });
      el.value = "4";
      expect(input.isValid()).toBe(false);
      el.value = "5";
      expect(input.isValid()).toBe(true);
    });

    it("enforces max", () => {
      const { el, input } = build({ max: 100 });
      el.value = "101";
      expect(input.isValid()).toBe(false);
      el.value = "100";
      expect(input.isValid()).toBe(true);
    });

    it("non-required out-of-range still reports invalid by bounds", () => {
      const { el, input } = build({ required: false, min: 5, max: 10 });
      el.value = "20";
      expect(input.isValid()).toBe(false);
    });
  });
});

describe("range input", () => {
  function build(q: Partial<RangeQuestion> = {}, overrides: Partial<QuestionInputOptions> = {}) {
    const question: RangeQuestion = {
      id: "r",
      type: "range",
      label: "Rating",
      min: 0,
      max: 10,
      ...q,
    };
    const opts = makeOpts(question, overrides);
    const input = createInput(opts);
    const wrap = input.element as HTMLDivElement;
    const el = wrap.querySelector("input") as HTMLInputElement;
    const valueText = wrap.querySelector(".qaid-q-range-value span") as HTMLSpanElement;
    return { input, opts, wrap, el, valueText };
  }

  it("renders range input with min/max/step and aria attributes", () => {
    const { el } = build({ step: 2 });
    expect(el.type).toBe("range");
    expect(el.min).toBe("0");
    expect(el.max).toBe("10");
    expect(el.step).toBe("2");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("10");
    expect(el.getAttribute("aria-label")).toBe("Rating");
  });

  it("defaults step to 1 when unset", () => {
    const { el } = build();
    expect(el.step).toBe("1");
  });

  it("initial value comes from initialValue when numeric", () => {
    const { el, valueText } = build({}, { initialValue: 7 });
    expect(el.value).toBe("7");
    expect(valueText.textContent).toBe("7");
  });

  it("initial value falls back to defaultValue then min", () => {
    const withDefault = build({ defaultValue: 3 });
    expect(withDefault.el.value).toBe("3");
    const withMin = build({ min: 2 });
    expect(withMin.el.value).toBe("2");
  });

  it("renders unit next to value and in bounds labels", () => {
    const { wrap } = build({ unit: "/10" });
    const unit = wrap.querySelector(".qaid-q-range-unit");
    expect(unit?.textContent).toBe("/10");
    const bounds = wrap.querySelectorAll(".qaid-q-range-bounds span");
    expect(bounds[0].textContent).toBe("0/10");
    expect(bounds[1].textContent).toBe("10/10");
  });

  it("bounds labels omit unit when unset", () => {
    const { wrap } = build();
    const bounds = wrap.querySelectorAll(".qaid-q-range-bounds span");
    expect(bounds[0].textContent).toBe("0");
    expect(bounds[1].textContent).toBe("10");
  });

  it("input updates the displayed value, aria-valuenow and calls onChange", () => {
    const { el, valueText, opts } = build();
    el.value = "6";
    fireInput(el);
    expect(valueText.textContent).toBe("6");
    expect(el.getAttribute("aria-valuenow")).toBe("6");
    expect(opts.onChange).toHaveBeenCalledWith(6);
  });

  it("Enter submits and prevents default", () => {
    const { el, opts } = build();
    const e = keydown(el, { key: "Enter" });
    expect(opts.onSubmit).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  it("getValue returns a number; isValid always true", () => {
    const { el, input } = build();
    el.value = "8";
    expect(input.getValue()).toBe(8);
    expect(input.isValid()).toBe(true);
  });

  it("pushes the initial value to onChange on a microtask", async () => {
    const { opts } = build({}, { initialValue: 4 });
    expect(opts.onChange).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(opts.onChange).toHaveBeenCalledWith(4);
  });

  it("focus() focuses the range input", () => {
    const { el, input, wrap } = build();
    document.body.appendChild(wrap);
    input.focus();
    expect(document.activeElement).toBe(el);
    wrap.remove();
  });
});

describe("date input", () => {
  function build(q: Partial<DateQuestion> = {}, overrides: Partial<QuestionInputOptions> = {}) {
    const question: DateQuestion = { id: "d", type: "date", label: "When", ...q };
    const opts = makeOpts(question, overrides);
    const input = createInput(opts);
    return { input, opts, el: input.element as HTMLInputElement };
  }

  it("renders a date input with min/max and aria-label", () => {
    const { el } = build({ min: "2020-01-01", max: "2030-12-31" });
    expect(el.type).toBe("date");
    expect(el.min).toBe("2020-01-01");
    expect(el.max).toBe("2030-12-31");
    expect(el.getAttribute("aria-label")).toBe("When");
  });

  it("seeds value from a string initialValue", () => {
    const { el } = build({}, { initialValue: "2024-05-01" });
    expect(el.value).toBe("2024-05-01");
  });

  it("onChange gets the value, or null when cleared", () => {
    const { el, opts } = build();
    el.value = "2024-05-01";
    fireInput(el);
    expect(opts.onChange).toHaveBeenLastCalledWith("2024-05-01");
    el.value = "";
    fireInput(el);
    expect(opts.onChange).toHaveBeenLastCalledWith(null);
  });

  it("getValue returns value or null", () => {
    const { el, input } = build();
    expect(input.getValue()).toBe(null);
    el.value = "2024-01-02";
    expect(input.getValue()).toBe("2024-01-02");
  });

  it("Enter submits and prevents default", () => {
    const { el, opts } = build();
    const e = keydown(el, { key: "Enter" });
    expect(opts.onSubmit).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  it("Enter while composing does not submit", () => {
    const { el, opts } = build();
    keydown(el, { key: "Enter", isComposing: true });
    expect(opts.onSubmit).not.toHaveBeenCalled();
  });

  it("focus() focuses the date input", () => {
    const { el, input } = build();
    document.body.appendChild(el);
    input.focus();
    expect(document.activeElement).toBe(el);
    el.remove();
  });

  it("isValid honors required", () => {
    const optional = build({ required: false });
    expect(optional.input.isValid()).toBe(true);
    const required = build({ required: true });
    expect(required.input.isValid()).toBe(false);
    required.el.value = "2024-01-01";
    expect(required.input.isValid()).toBe(true);
  });
});

describe("multiple-choice input", () => {
  const baseOptions = [
    { value: "a", label: "Apple" },
    { value: "b", label: "Banana" },
    { value: "c", label: "Cherry" },
  ];

  function build(q: Partial<MultipleChoiceQuestion> = {}, overrides: Partial<QuestionInputOptions> = {}) {
    const question: MultipleChoiceQuestion = {
      id: "m",
      type: "multiple-choice",
      label: "Pick",
      options: baseOptions,
      ...q,
    };
    const opts = makeOpts(question, overrides);
    const input = createInput(opts);
    const wrap = input.element as HTMLDivElement;
    const buttons = Array.from(wrap.querySelectorAll("button")) as HTMLButtonElement[];
    return { input, opts, wrap, buttons };
  }

  it("renders a radiogroup for single-choice with radio options", () => {
    const { wrap, buttons } = build();
    expect(wrap.getAttribute("role")).toBe("radiogroup");
    expect(wrap.getAttribute("aria-label")).toBe("Pick");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].getAttribute("role")).toBe("radio");
    expect(buttons[0].dataset.value).toBe("a");
    expect(buttons[0].type).toBe("button");
  });

  it("renders a group with checkbox options for multiple", () => {
    const { wrap, buttons } = build({ multiple: true });
    expect(wrap.getAttribute("role")).toBe("group");
    expect(buttons[0].getAttribute("role")).toBe("checkbox");
    expect(buttons[0].className).toContain("qaid-q-multi");
  });

  it("renders option label, description and image", () => {
    const { buttons } = build({
      options: [
        { value: "a", label: "Apple", description: "A fruit", image: "https://x/a.png" },
      ],
    });
    const btn = buttons[0];
    expect(btn.querySelector(".qaid-q-option-label")?.textContent).toBe("Apple");
    expect(btn.querySelector(".qaid-q-option-desc")?.textContent).toBe("A fruit");
    const img = btn.querySelector("img.qaid-q-option-image") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("https://x/a.png");
    expect(img.loading).toBe("lazy");
  });

  it("adds image-horizontal layout class by default when any option has an image", () => {
    const { wrap } = build({ options: [{ value: "a", label: "A", image: "x" }] });
    expect(wrap.className).toContain("qaid-q-options--image-horizontal");
  });

  it("adds image-vertical layout class when imageAlignment is vertical", () => {
    const { wrap } = build({
      imageAlignment: "vertical",
      options: [{ value: "a", label: "A", image: "x" }],
    });
    expect(wrap.className).toContain("qaid-q-options--image-vertical");
  });

  it("adds no image layout class when no option has an image", () => {
    const { wrap } = build();
    expect(wrap.className).toBe("qaid-q-options");
  });

  it("renders number-key hints only for the first 9 options", () => {
    const opts10 = Array.from({ length: 10 }, (_, i) => ({ value: `v${i}`, label: `L${i}` }));
    const { buttons } = build({ options: opts10 });
    expect(buttons[0].querySelector(".qaid-q-option-key")?.textContent).toBe("1");
    expect(buttons[8].querySelector(".qaid-q-option-key")?.textContent).toBe("9");
    expect(buttons[9].querySelector(".qaid-q-option-key")).toBeNull();
  });

  it("seeds single-choice selection from a string initialValue", () => {
    const { buttons, input } = build({}, { initialValue: "b" });
    expect(buttons[1].classList.contains("qaid-q-selected")).toBe(true);
    expect(buttons[1].getAttribute("aria-checked")).toBe("true");
    expect(input.getValue()).toBe("b");
  });

  it("seeds multi-choice selection from an array initialValue", () => {
    const { buttons, input } = build({ multiple: true }, { initialValue: ["a", "c"] });
    expect(buttons[0].classList.contains("qaid-q-selected")).toBe(true);
    expect(buttons[2].classList.contains("qaid-q-selected")).toBe(true);
    expect(buttons[1].classList.contains("qaid-q-selected")).toBe(false);
    expect(input.getValue()).toEqual(["a", "c"]);
  });

  it("single-choice click selects exclusively and fires onChange", () => {
    const { buttons, opts, input } = build();
    buttons[0].click();
    expect(input.getValue()).toBe("a");
    expect(opts.onChange).toHaveBeenLastCalledWith("a");
    buttons[2].click();
    expect(input.getValue()).toBe("c");
    expect(buttons[0].classList.contains("qaid-q-selected")).toBe(false);
    expect(buttons[2].getAttribute("aria-checked")).toBe("true");
  });

  it("multi-choice click toggles each value independently", () => {
    const { buttons, input, opts } = build({ multiple: true });
    buttons[0].click();
    buttons[1].click();
    expect(input.getValue()).toEqual(["a", "b"]);
    buttons[0].click();
    expect(input.getValue()).toEqual(["b"]);
    expect(opts.onChange).toHaveBeenLastCalledWith(["b"]);
  });

  it("getValue is null for single-choice with nothing selected", () => {
    const { input } = build();
    expect(input.getValue()).toBe(null);
  });

  it("getValue is an empty array for multi-choice with nothing selected", () => {
    const { input } = build({ multiple: true });
    expect(input.getValue()).toEqual([]);
  });

  it("single-choice with autoAdvance schedules onAutoAdvance after selection", () => {
    vi.useFakeTimers();
    try {
      const { buttons, opts } = build({}, { autoAdvance: true });
      buttons[0].click();
      expect(opts.onAutoAdvance).not.toHaveBeenCalled();
      vi.advanceTimersByTime(180);
      expect(opts.onAutoAdvance).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("multi-choice does not auto-advance even when autoAdvance is on", () => {
    vi.useFakeTimers();
    try {
      const { buttons, opts } = build({ multiple: true }, { autoAdvance: true });
      buttons[0].click();
      vi.advanceTimersByTime(500);
      expect(opts.onAutoAdvance).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("number key 1-9 selects and focuses the matching option", () => {
    const { wrap, buttons, input } = build();
    document.body.appendChild(wrap);
    const e = keydown(wrap, { key: "2" });
    expect(e.defaultPrevented).toBe(true);
    expect(input.getValue()).toBe("b");
    expect(document.activeElement).toBe(buttons[1]);
    wrap.remove();
  });

  it("number key beyond the option count is ignored", () => {
    const { wrap, input } = build();
    const e = keydown(wrap, { key: "9" });
    expect(e.defaultPrevented).toBe(false);
    expect(input.getValue()).toBe(null);
  });

  it("ArrowDown / ArrowRight move roving focus forward and wrap", () => {
    const { wrap, buttons } = build();
    document.body.appendChild(wrap);
    keydown(buttons[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(buttons[1]);
    keydown(buttons[1], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[2]);
    keydown(buttons[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(buttons[0]);
    wrap.remove();
  });

  it("ArrowUp / ArrowLeft move roving focus backward and wrap", () => {
    const { wrap, buttons } = build();
    document.body.appendChild(wrap);
    keydown(buttons[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(buttons[2]);
    keydown(buttons[2], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[1]);
    wrap.remove();
  });

  it("single-choice Enter advances when something is selected", () => {
    const { buttons, opts } = build({}, { initialValue: "a" });
    const e = keydown(buttons[0], { key: "Enter" });
    expect(opts.onSubmit).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  it("single-choice Enter does nothing when nothing is selected", () => {
    const { buttons, opts } = build();
    const e = keydown(buttons[0], { key: "Enter" });
    expect(opts.onSubmit).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });

  it("multi-choice Enter does not submit via the option handler", () => {
    const { buttons, opts } = build({ multiple: true }, { initialValue: ["a"] });
    keydown(buttons[0], { key: "Enter" });
    expect(opts.onSubmit).not.toHaveBeenCalled();
  });

  describe("focus()", () => {
    it("focuses the first selected option when one exists", () => {
      const { wrap, buttons, input } = build({}, { initialValue: "c" });
      document.body.appendChild(wrap);
      input.focus();
      expect(document.activeElement).toBe(buttons[2]);
      wrap.remove();
    });

    it("focuses the first option when nothing is selected", () => {
      const { wrap, buttons, input } = build();
      document.body.appendChild(wrap);
      input.focus();
      expect(document.activeElement).toBe(buttons[0]);
      wrap.remove();
    });
  });

  describe("isValid", () => {
    it("non-required is always valid", () => {
      const { input } = build({ required: false });
      expect(input.isValid()).toBe(true);
    });

    it("required is invalid with no selection, valid once selected", () => {
      const { input, buttons } = build({ required: true });
      expect(input.isValid()).toBe(false);
      buttons[0].click();
      expect(input.isValid()).toBe(true);
    });

    it("required multi is invalid until at least one is chosen", () => {
      const { input, buttons } = build({ multiple: true, required: true });
      expect(input.isValid()).toBe(false);
      buttons[1].click();
      expect(input.isValid()).toBe(true);
    });
  });
});
