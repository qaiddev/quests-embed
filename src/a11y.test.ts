import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  announce,
  getFocusable,
  createFocusTrap,
  saveFocus,
  restoreFocus,
  applyDialog,
  setBackgroundInert,
} from "./a11y";

function makeButton(label: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  return b;
}

function tabEvent(shift = false): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });
}

describe("a11y", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("announce", () => {
    let root: HTMLDivElement;

    beforeEach(() => {
      root = document.createElement("div");
      document.body.appendChild(root);
    });

    it("lazily creates a polite status region and writes the message", () => {
      // No region exists until the first announce.
      expect(root.querySelector('[role="status"]')).toBeNull();

      announce(root, "Step 2 of 5");

      const region = root.querySelector('[role="status"]');
      expect(region).not.toBeNull();
      expect(region!.getAttribute("aria-live")).toBe("polite");
      expect(region!.getAttribute("aria-atomic")).toBe("true");
      expect(region!.textContent).toBe("Step 2 of 5");
    });

    it("lazily creates an assertive alert region when opts.assertive", () => {
      announce(root, "Couldn't load form", { assertive: true });

      const region = root.querySelector('[role="alert"]');
      expect(region).not.toBeNull();
      expect(region!.getAttribute("aria-live")).toBe("assertive");
      expect(region!.textContent).toBe("Couldn't load form");
      // Did not create a polite region for an assertive-only announcement.
      expect(root.querySelector('[role="status"]')).toBeNull();
    });

    it("renders regions visually hidden but present in the DOM", () => {
      announce(root, "hi");
      const region = root.querySelector<HTMLElement>('[role="status"]')!;
      expect(region.style.position).toBe("absolute");
      expect(region.style.width).toBe("1px");
      expect(region.style.height).toBe("1px");
      expect(region.style.overflow).toBe("hidden");
    });

    it("reuses the same region across repeated calls", () => {
      announce(root, "Step 1 of 3");
      announce(root, "Step 2 of 3");
      const regions = root.querySelectorAll('[role="status"]');
      expect(regions).toHaveLength(1);
      expect(regions[0].textContent).toBe("Step 2 of 3");
    });

    it("re-announces an identical message by clearing first", () => {
      const region = () => root.querySelector<HTMLElement>('[role="status"]')!;
      announce(root, "Saved");
      expect(region().textContent).toBe("Saved");
      // Announcing the identical string again still lands as text (the
      // clear-then-set forces AT to perceive a change).
      announce(root, "Saved");
      expect(region().textContent).toBe("Saved");
      expect(root.querySelectorAll('[role="status"]')).toHaveLength(1);
    });

    it("keeps polite and assertive as separate independent regions", () => {
      announce(root, "Step 3 of 4");
      announce(root, "Submit failed", { assertive: true });
      expect(root.querySelector('[role="status"]')!.textContent).toBe(
        "Step 3 of 4",
      );
      expect(root.querySelector('[role="alert"]')!.textContent).toBe(
        "Submit failed",
      );
      // One of each, no duplicates.
      expect(root.querySelectorAll('[role="status"]')).toHaveLength(1);
      expect(root.querySelectorAll('[role="alert"]')).toHaveLength(1);
    });

    it("works when the root is an open shadow root (the embed's host)", () => {
      const host = document.createElement("div");
      host.setAttribute("data-qaid-quests", "");
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: "open" });

      announce(shadow, "Thank you!");

      const region = shadow.querySelector('[role="status"]');
      expect(region).not.toBeNull();
      expect(region!.textContent).toBe("Thank you!");
    });
  });

  describe("getFocusable", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    it("returns buttons, links, inputs and textareas in DOM order", () => {
      const btn = makeButton("b");
      const link = document.createElement("a");
      link.href = "#x";
      const input = document.createElement("input");
      const textarea = document.createElement("textarea");
      container.append(btn, link, input, textarea);

      expect(getFocusable(container)).toEqual([btn, link, input, textarea]);
    });

    it("includes elements with a non-negative tabindex", () => {
      const div = document.createElement("div");
      div.setAttribute("tabindex", "0");
      container.appendChild(div);
      expect(getFocusable(container)).toEqual([div]);
    });

    it("excludes elements with tabindex=-1", () => {
      const btn = makeButton("b");
      btn.setAttribute("tabindex", "-1");
      container.appendChild(btn);
      expect(getFocusable(container)).toEqual([]);
    });

    it("excludes disabled controls", () => {
      const btn = makeButton("b");
      btn.disabled = true;
      const input = document.createElement("input");
      input.setAttribute("disabled", "");
      container.append(btn, input);
      expect(getFocusable(container)).toEqual([]);
    });

    it("excludes anchors without href", () => {
      const link = document.createElement("a");
      link.textContent = "no href";
      container.appendChild(link);
      expect(getFocusable(container)).toEqual([]);
    });

    it("excludes hidden inputs", () => {
      const input = document.createElement("input");
      input.type = "hidden";
      container.appendChild(input);
      expect(getFocusable(container)).toEqual([]);
    });

    it("excludes elements hidden via the hidden attribute", () => {
      const btn = makeButton("b");
      btn.hidden = true;
      container.appendChild(btn);
      expect(getFocusable(container)).toEqual([]);
    });

    it("excludes elements hidden by an inline display:none ancestor", () => {
      const wrapper = document.createElement("div");
      wrapper.style.display = "none";
      const btn = makeButton("b");
      wrapper.appendChild(btn);
      container.appendChild(wrapper);
      expect(getFocusable(container)).toEqual([]);
    });

    it("excludes elements with visibility:hidden", () => {
      const btn = makeButton("b");
      btn.style.visibility = "hidden";
      container.appendChild(btn);
      expect(getFocusable(container)).toEqual([]);
    });

    it("collects a realistic quests card (close, choices, back, next)", () => {
      // Mirrors the quests card chrome: a close button, a radiogroup of
      // option buttons, then the Back / Next footer controls.
      const close = makeButton("close");
      const optA = makeButton("Yes");
      const optB = makeButton("No");
      const back = makeButton("Back");
      const next = makeButton("Next");
      container.append(close, optA, optB, back, next);
      expect(getFocusable(container)).toEqual([close, optA, optB, back, next]);
    });
  });

  describe("createFocusTrap", () => {
    let container: HTMLDivElement;
    let first: HTMLButtonElement;
    let middle: HTMLButtonElement;
    let last: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement("div");
      first = makeButton("first");
      middle = makeButton("middle");
      last = makeButton("last");
      container.append(first, middle, last);
      document.body.appendChild(container);
    });

    it("focuses the first focusable element on creation", () => {
      const trap = createFocusTrap(container);
      expect(document.activeElement).toBe(first);
      trap.release();
    });

    it("wraps Tab from the last element back to the first", () => {
      const trap = createFocusTrap(container);
      last.focus();
      const ev = tabEvent(false);
      last.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
      trap.release();
    });

    it("wraps Shift+Tab from the first element to the last", () => {
      const trap = createFocusTrap(container);
      first.focus();
      const ev = tabEvent(true);
      first.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(last);
      trap.release();
    });

    it("does not intercept Tab in the middle of the list", () => {
      const trap = createFocusTrap(container);
      middle.focus();
      const ev = tabEvent(false);
      middle.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(middle);
      trap.release();
    });

    it("pulls focus back into the trap when focus escaped (Tab)", () => {
      const trap = createFocusTrap(container);
      const outside = makeButton("outside");
      document.body.appendChild(outside);
      outside.focus();
      const ev = tabEvent(false);
      // The trap listens on the container, so dispatch there.
      container.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
      trap.release();
    });

    it("ignores non-Tab keys", () => {
      const trap = createFocusTrap(container);
      last.focus();
      const ev = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      last.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(last);
      trap.release();
    });

    it("focuses the container itself when there are no focusables", () => {
      const empty = document.createElement("div");
      document.body.appendChild(empty);
      const trap = createFocusTrap(empty);
      expect(empty.getAttribute("tabindex")).toBe("-1");
      expect(document.activeElement).toBe(empty);

      // Tab is pinned to the container.
      const ev = tabEvent(false);
      empty.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(empty);

      trap.release();
      // The tabindex we added is cleaned up on release.
      expect(empty.hasAttribute("tabindex")).toBe(false);
    });

    it("does not add tabindex when the empty container already has one", () => {
      const empty = document.createElement("div");
      empty.setAttribute("tabindex", "0");
      document.body.appendChild(empty);
      const trap = createFocusTrap(empty);
      expect(empty.getAttribute("tabindex")).toBe("0");
      trap.release();
      // Pre-existing tabindex is preserved.
      expect(empty.getAttribute("tabindex")).toBe("0");
    });

    it("stops trapping after release", () => {
      const trap = createFocusTrap(container);
      trap.release();
      last.focus();
      const ev = tabEvent(false);
      last.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(last);
    });

    it("re-evaluates focusables on each Tab (dynamic step content)", () => {
      // The quests card swaps its step body between renders; the trap must
      // wrap against the CURRENT focusables, not a snapshot from creation.
      const trap = createFocusTrap(container);
      const appended = makeButton("appended");
      container.appendChild(appended);
      // last is no longer the final focusable; appended is.
      appended.focus();
      const ev = tabEvent(false);
      appended.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
      trap.release();
    });
  });

  describe("saveFocus / restoreFocus", () => {
    it("captures the currently focused element", () => {
      const btn = makeButton("b");
      document.body.appendChild(btn);
      btn.focus();
      expect(saveFocus()).toBe(btn);
    });

    it("restores focus to a saved element (modal open -> close)", () => {
      const opener = makeButton("open form");
      const somewhereElse = makeButton("elsewhere");
      document.body.append(opener, somewhereElse);
      opener.focus();
      const saved = saveFocus();
      // Focus moves into the modal, then the modal closes.
      somewhereElse.focus();
      expect(document.activeElement).toBe(somewhereElse);
      restoreFocus(saved);
      expect(document.activeElement).toBe(opener);
    });

    it("drills through an open shadow root when saving", () => {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: "open" });
      const inner = makeButton("inner");
      shadow.appendChild(inner);
      inner.focus();
      expect(saveFocus()).toBe(inner);
    });

    it("restoreFocus(null) is a no-op and does not throw", () => {
      expect(() => restoreFocus(null)).not.toThrow();
    });

    it("restoreFocus tolerates a detached element", () => {
      const btn = makeButton("b");
      // Never attached to the document.
      expect(() => restoreFocus(btn)).not.toThrow();
    });
  });

  describe("applyDialog", () => {
    it("sets role=dialog and aria-modal=true with no extra refs", () => {
      const el = document.createElement("div");
      applyDialog(el);
      expect(el.getAttribute("role")).toBe("dialog");
      expect(el.getAttribute("aria-modal")).toBe("true");
      expect(el.hasAttribute("aria-labelledby")).toBe(false);
      expect(el.hasAttribute("aria-describedby")).toBe(false);
      expect(el.hasAttribute("aria-label")).toBe(false);
    });

    it("wires aria-labelledby and aria-describedby from ids", () => {
      const el = document.createElement("div");
      applyDialog(el, {
        labelledbyId: "qaid-q-title",
        describedbyId: "qaid-q-desc",
      });
      expect(el.getAttribute("aria-labelledby")).toBe("qaid-q-title");
      expect(el.getAttribute("aria-describedby")).toBe("qaid-q-desc");
      expect(el.hasAttribute("aria-label")).toBe(false);
    });

    it("falls back to aria-label when the title is hidden", () => {
      const el = document.createElement("div");
      applyDialog(el, { label: "Customer questionnaire" });
      expect(el.getAttribute("aria-label")).toBe("Customer questionnaire");
      expect(el.hasAttribute("aria-labelledby")).toBe(false);
    });
  });

  describe("setBackgroundInert", () => {
    it("inerts every top-level sibling but not the kept element", () => {
      const dialog = document.createElement("div");
      const sib1 = document.createElement("div");
      const sib2 = document.createElement("main");
      document.body.append(sib1, dialog, sib2);

      const restore = setBackgroundInert(dialog);

      expect(sib1.inert).toBe(true);
      expect(sib1.getAttribute("aria-hidden")).toBe("true");
      expect(sib2.inert).toBe(true);
      expect(sib2.getAttribute("aria-hidden")).toBe("true");
      // The dialog's own top-level element is left interactive.
      expect(dialog.inert).toBe(false);
      expect(dialog.hasAttribute("aria-hidden")).toBe(false);

      restore();
      expect(sib1.inert).toBe(false);
      expect(sib1.hasAttribute("aria-hidden")).toBe(false);
      expect(sib2.inert).toBe(false);
      expect(sib2.hasAttribute("aria-hidden")).toBe(false);
    });

    it("keeps the shadow host of a dialog nested in a shadow root", () => {
      // Matches the embed's modal: [data-qaid-quests] host holds the dialog
      // in its shadow root; page content is a sibling of the host.
      const host = document.createElement("div");
      host.setAttribute("data-qaid-quests", "");
      const pageContent = document.createElement("div");
      document.body.append(host, pageContent);
      const shadow = host.attachShadow({ mode: "open" });
      const dialog = document.createElement("div");
      shadow.appendChild(dialog);

      const restore = setBackgroundInert(dialog);

      expect(host.inert).toBe(false);
      expect(host.hasAttribute("aria-hidden")).toBe(false);
      expect(pageContent.inert).toBe(true);
      expect(pageContent.getAttribute("aria-hidden")).toBe("true");

      restore();
      expect(pageContent.inert).toBe(false);
    });

    it("leaves an already-inert/hidden sibling untouched on restore", () => {
      const dialog = document.createElement("div");
      const preHidden = document.createElement("div");
      preHidden.inert = true;
      preHidden.setAttribute("aria-hidden", "true");
      document.body.append(dialog, preHidden);

      const restore = setBackgroundInert(dialog);
      // Still hidden while open.
      expect(preHidden.inert).toBe(true);
      expect(preHidden.getAttribute("aria-hidden")).toBe("true");

      restore();
      // Its pre-existing state is preserved, not cleared.
      expect(preHidden.inert).toBe(true);
      expect(preHidden.getAttribute("aria-hidden")).toBe("true");
    });

    it("preserves a pre-existing aria-hidden value on a sibling it inerts", () => {
      const dialog = document.createElement("div");
      const sib = document.createElement("div");
      // aria-hidden explicitly false, but not inert -> we will inert it.
      sib.setAttribute("aria-hidden", "false");
      document.body.append(dialog, sib);

      const restore = setBackgroundInert(dialog);
      expect(sib.inert).toBe(true);
      expect(sib.getAttribute("aria-hidden")).toBe("true");

      restore();
      expect(sib.inert).toBe(false);
      // The original aria-hidden="false" is restored, not removed.
      expect(sib.getAttribute("aria-hidden")).toBe("false");
    });

    it("keeps a dialog that is itself a direct body child", () => {
      const dialog = document.createElement("div");
      const sib = document.createElement("div");
      document.body.append(dialog, sib);

      const restore = setBackgroundInert(dialog);
      expect(dialog.inert).toBe(false);
      expect(sib.inert).toBe(true);
      restore();
      expect(sib.inert).toBe(false);
    });
  });
});
