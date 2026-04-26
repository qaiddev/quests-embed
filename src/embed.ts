import type {
  Answers,
  AnswerValue,
  CreateResponseResult,
  Question,
  Questionnaire,
  QuestsConfig,
  ResolvedQuestsConfig,
} from "./types";
import { applyCssVars, buildCssVars, getEmbedStyles } from "./styles";
import { createInput, type QuestionInput } from "./inputs";

const VISITOR_ID_KEY = "qaid_visitor_id";

type EmbedState = "LOADING" | "READY" | "DONE" | "ERROR";

function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const CLOSE_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`;
const CHECK_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

export class QaidQuests {
  private config: ResolvedQuestsConfig;
  private questionnaire: Questionnaire | null = null;
  private inlineQuestionnaire: Questionnaire | undefined;
  private configUrl: string | undefined;

  private state: EmbedState = "LOADING";
  private stepIndex = 0;
  // True after the first step has rendered. Used so the focus-on-step
  // logic in renderStep() can distinguish initial mount (driven by the
  // `autoFocus` config) from subsequent step changes (always focused so
  // keyboard + screen-reader users land on the active input after Next
  // / Back).
  private hasRenderedStep = false;
  private answers: Answers = {};
  private responseId: string | number | null = null;
  private visitorId: string;

  // Per-question pending autosave (text/currency are debounced)
  private pendingSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSaveQuestionId: string | null = null;
  private pendingSaveValue: AnswerValue = null;
  private inflightSaves = 0;

  // Shadow DOM
  private shadowHost: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private isUserContainer = false;

  // Mounted UI elements
  private rootEl: HTMLDivElement | null = null;
  private cardEl: HTMLDivElement | null = null;
  private titleEl: HTMLHeadingElement | null = null;
  private stepCounterEl: HTMLDivElement | null = null;
  private progressFillEl: HTMLDivElement | null = null;
  private bodyEl: HTMLDivElement | null = null;
  private footerEl: HTMLDivElement | null = null;
  private savingEl: HTMLDivElement | null = null;
  private backdropEl: HTMLDivElement | null = null;
  private currentInput: QuestionInput | null = null;
  private boundKeyDown: (e: KeyboardEvent) => void;

  private cssVars: Record<string, string> = {};

  constructor(config: QuestsConfig) {
    this.config = {
      endpoint: config.endpoint,
      apiKey: config.apiKey ?? "",
      container: config.container ?? "",
      zIndex: config.zIndex ?? 50,
      colors: {
        positive: config.colors?.positive ?? "#10b981",
        negative: config.colors?.negative ?? "#ef4444",
        marker: config.colors?.marker ?? "#6366f1",
      },
      modalWidth: config.modalWidth ?? 480,
      backdropOpacity: config.backdropOpacity ?? 0.4,
      fontFamily: config.fontFamily ?? "system-ui, -apple-system, sans-serif",
      fontSize: config.fontSize ?? 16,
      css: config.css ?? "",
      autoAdvance: config.autoAdvance ?? false,
      saveDebounceMs: config.saveDebounceMs ?? 500,
      autoFocus: config.autoFocus ?? true,
    };

    this.inlineQuestionnaire = config.questionnaire;
    this.configUrl = config.configUrl;
    this.visitorId = getOrCreateVisitorId();
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.init();
  }

  private async init(): Promise<void> {
    this.cssVars = buildCssVars({
      positiveColor: this.config.colors.positive,
      negativeColor: this.config.colors.negative,
      markerColor: this.config.colors.marker,
      modalWidth: this.config.modalWidth,
      backdropOpacity: this.config.backdropOpacity,
      fontFamily: this.config.fontFamily,
      fontSize: this.config.fontSize,
    });

    this.mountShell();
    this.renderLoading();

    try {
      const q = await this.loadQuestionnaire();
      if (!q || !q.questions || q.questions.length === 0) {
        throw new Error("Questionnaire is empty");
      }
      this.questionnaire = q;
      // Fire-and-forget create. The form is usable immediately;
      // saves will queue until the response id arrives.
      this.createResponse();
      this.state = "READY";
      this.renderHeader();
      this.renderStep();
    } catch (err) {
      this.state = "ERROR";
      this.renderError(err);
    }
  }

  // ------------------------------------------------------------------
  // Loading the questionnaire JSON
  // ------------------------------------------------------------------

  private async loadQuestionnaire(): Promise<Questionnaire> {
    if (this.inlineQuestionnaire) return this.inlineQuestionnaire;
    if (!this.configUrl) {
      throw new Error("No questionnaire or configUrl provided");
    }
    const res = await fetch(this.configUrl, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Failed to load questionnaire (${res.status})`);
    }
    return (await res.json()) as Questionnaire;
  }

  // ------------------------------------------------------------------
  // Shell (shadow host + card chrome that's stable across steps)
  // ------------------------------------------------------------------

  private mountShell(): void {
    this.shadowHost = document.createElement("div");
    this.shadowHost.setAttribute("data-qaid-quests", "");

    const userContainer = this.config.container
      ? document.querySelector<HTMLElement>(this.config.container)
      : null;

    if (userContainer) {
      this.shadowHost.style.display = "block";
      userContainer.appendChild(this.shadowHost);
      this.isUserContainer = true;
    } else {
      // Modal mode: shadow host is fixed and full-viewport.
      this.shadowHost.style.position = "fixed";
      this.shadowHost.style.inset = "0";
      this.shadowHost.style.zIndex = String(this.config.zIndex);
      this.shadowHost.style.pointerEvents = "none";
      document.body.appendChild(this.shadowHost);
    }

    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" });

    const baseStyle = document.createElement("style");
    baseStyle.textContent = getEmbedStyles();
    this.shadowRoot.appendChild(baseStyle);

    if (this.config.css) {
      const themeStyle = document.createElement("style");
      themeStyle.textContent = this.config.css;
      this.shadowRoot.appendChild(themeStyle);
    }

    this.rootEl = document.createElement("div");
    this.rootEl.className = `qaid-q-root${this.isUserContainer ? " qaid-q-inline" : ""}`;
    applyCssVars(this.rootEl, this.cssVars);

    if (!this.isUserContainer) {
      this.backdropEl = document.createElement("div");
      this.backdropEl.className = "qaid-q-backdrop";
      this.backdropEl.addEventListener("click", () => this.close());
      this.rootEl.appendChild(this.backdropEl);

      const modal = document.createElement("div");
      modal.className = "qaid-q-modal";
      this.cardEl = document.createElement("div");
      this.cardEl.className = "qaid-q-card";
      modal.appendChild(this.cardEl);
      this.rootEl.appendChild(modal);
    } else {
      this.cardEl = document.createElement("div");
      this.cardEl.className = "qaid-q-card";
      this.rootEl.appendChild(this.cardEl);
    }

    this.shadowRoot.appendChild(this.rootEl);

    // Modal mode needs pointer-events on host so the modal itself is clickable.
    if (!this.isUserContainer && this.shadowHost) {
      this.shadowHost.style.pointerEvents = "auto";
    }

    document.addEventListener("keydown", this.boundKeyDown);
  }

  private renderLoading(): void {
    if (!this.cardEl) return;
    this.cardEl.replaceChildren();
    const msg = document.createElement("p");
    msg.className = "qaid-q-description";
    msg.textContent = "Loading…";
    this.cardEl.appendChild(msg);
  }

  private renderError(err: unknown): void {
    if (!this.cardEl) return;
    this.cardEl.replaceChildren();
    const heading = document.createElement("h3");
    heading.className = "qaid-q-title";
    heading.textContent = "Couldn't load form";
    const msg = document.createElement("p");
    msg.className = "qaid-q-description";
    msg.textContent = err instanceof Error ? err.message : String(err);
    this.cardEl.appendChild(heading);
    this.cardEl.appendChild(msg);
  }

  private renderHeader(): void {
    if (!this.cardEl || !this.questionnaire) return;
    this.cardEl.replaceChildren();

    const header = document.createElement("div");
    header.className = "qaid-q-header";

    const titleWrap = document.createElement("div");
    this.titleEl = document.createElement("h2");
    this.titleEl.className = "qaid-q-title";
    this.titleEl.textContent = this.questionnaire.title ?? "";
    if (this.questionnaire.title) titleWrap.appendChild(this.titleEl);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "0.5rem";

    this.savingEl = document.createElement("div");
    this.savingEl.className = "qaid-q-saving";
    const dot = document.createElement("span");
    dot.className = "qaid-q-saving-dot";
    const savingText = document.createElement("span");
    savingText.textContent = "Saving…";
    this.savingEl.appendChild(dot);
    this.savingEl.appendChild(savingText);

    this.stepCounterEl = document.createElement("div");
    this.stepCounterEl.className = "qaid-q-step-counter";

    right.appendChild(this.savingEl);
    right.appendChild(this.stepCounterEl);

    if (!this.isUserContainer) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "qaid-q-close";
      closeBtn.setAttribute("aria-label", "Close form");
      closeBtn.innerHTML = CLOSE_ICON;
      closeBtn.addEventListener("click", () => this.close());
      right.appendChild(closeBtn);
    }

    header.appendChild(titleWrap);
    header.appendChild(right);
    this.cardEl.appendChild(header);

    if (this.questionnaire.description) {
      const desc = document.createElement("p");
      desc.className = "qaid-q-description";
      desc.textContent = this.questionnaire.description;
      desc.style.marginTop = "-0.5rem";
      desc.style.marginBottom = "0.75rem";
      this.cardEl.appendChild(desc);
    }

    const progress = document.createElement("div");
    progress.className = "qaid-q-progress";
    this.progressFillEl = document.createElement("div");
    this.progressFillEl.className = "qaid-q-progress-fill";
    progress.appendChild(this.progressFillEl);
    this.cardEl.appendChild(progress);

    this.bodyEl = document.createElement("div");
    this.bodyEl.className = "qaid-q-body";
    this.cardEl.appendChild(this.bodyEl);

    this.footerEl = document.createElement("div");
    this.footerEl.className = "qaid-q-footer";
    this.cardEl.appendChild(this.footerEl);
  }

  // ------------------------------------------------------------------
  // Step rendering
  // ------------------------------------------------------------------

  private renderStep(): void {
    if (!this.questionnaire || !this.bodyEl || !this.footerEl) return;

    const total = this.questionnaire.questions.length;
    const idx = this.stepIndex;
    const question = this.questionnaire.questions[idx];

    if (this.stepCounterEl) {
      this.stepCounterEl.textContent = `${idx + 1} / ${total}`;
    }
    if (this.progressFillEl) {
      const pct = ((idx + 1) / total) * 100;
      this.progressFillEl.style.width = `${pct}%`;
    }

    // Build step body
    const step = document.createElement("div");
    step.className = "qaid-q-step";
    step.setAttribute("role", "group");
    step.setAttribute("aria-labelledby", `qaid-q-label-${idx}`);

    const label = document.createElement("label");
    label.id = `qaid-q-label-${idx}`;
    label.className = "qaid-q-label";
    label.textContent = question.label;
    if (question.required) {
      const star = document.createElement("span");
      star.className = "qaid-q-required";
      star.textContent = "*";
      star.setAttribute("aria-label", "required");
      label.appendChild(star);
    }
    step.appendChild(label);

    if (question.description) {
      const desc = document.createElement("p");
      desc.className = "qaid-q-description";
      desc.textContent = question.description;
      step.appendChild(desc);
    }

    const errorEl = document.createElement("p");
    errorEl.className = "qaid-q-error";
    errorEl.setAttribute("aria-live", "polite");

    const initialValue = this.answers[question.id] ?? null;
    const isLast = idx === total - 1;

    const input = createInput({
      question,
      initialValue,
      onChange: (value) => {
        this.handleAnswerChange(question, value);
        // clearing error if the user starts typing again
        if (errorEl.textContent) errorEl.textContent = "";
      },
      onSubmit: () => this.advance(question, errorEl),
      onAutoAdvance: () => this.advance(question, errorEl),
      autoAdvance: this.config.autoAdvance,
    });
    this.currentInput = input;

    step.appendChild(input.element);
    step.appendChild(errorEl);

    this.bodyEl.replaceChildren(step);

    // Footer
    this.footerEl.replaceChildren();
    const left = document.createElement("div");
    left.className = "qaid-q-footer-left";
    const right = document.createElement("div");
    right.className = "qaid-q-footer-right";

    if (idx > 0) {
      const back = document.createElement("button");
      back.type = "button";
      back.className = "qaid-q-btn qaid-q-btn-secondary";
      back.textContent = this.questionnaire.backLabel ?? "Back";
      back.addEventListener("click", () => this.back());
      left.appendChild(back);
    }

    const hint = document.createElement("span");
    hint.className = "qaid-q-hint";
    hint.innerHTML = isLast
      ? `<kbd>Enter</kbd> to submit`
      : `<kbd>Enter</kbd> to continue`;
    right.appendChild(hint);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "qaid-q-btn qaid-q-btn-primary";
    next.textContent = isLast
      ? (this.questionnaire.submitLabel ?? "Submit")
      : (this.questionnaire.nextLabel ?? "Next");
    next.addEventListener("click", () => this.advance(question, errorEl));
    right.appendChild(next);

    this.footerEl.appendChild(left);
    this.footerEl.appendChild(right);

    // Focus policy:
    //   - Initial render: only focus when `autoFocus` is enabled.
    //     Embedded previews and "open in page" usages set autoFocus:false
    //     to avoid yanking focus on mount.
    //   - Every subsequent step (advance / back): always focus the
    //     active input. The user just performed a keyboard or click
    //     action expecting to interact with the next question, and
    //     screen-reader users need focus to move so the new question's
    //     accessible name is announced.
    const isInitialRender = !this.hasRenderedStep;
    this.hasRenderedStep = true;
    const shouldFocus = isInitialRender ? this.config.autoFocus : true;
    if (shouldFocus) {
      requestAnimationFrame(() => input.focus());
    }
  }

  private renderDone(): void {
    if (!this.cardEl || !this.questionnaire) return;
    this.cardEl.replaceChildren();

    const done = document.createElement("div");
    done.className = "qaid-q-done";

    const icon = document.createElement("div");
    icon.className = "qaid-q-done-icon";
    icon.innerHTML = CHECK_ICON;
    done.appendChild(icon);

    const title = document.createElement("h3");
    title.className = "qaid-q-done-title";
    title.textContent = this.questionnaire.thankYouTitle ?? "Thank you!";
    done.appendChild(title);

    if (this.questionnaire.thankYouMessage) {
      const msg = document.createElement("p");
      msg.className = "qaid-q-done-message";
      msg.textContent = this.questionnaire.thankYouMessage;
      done.appendChild(msg);
    }

    if (!this.isUserContainer) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "qaid-q-btn qaid-q-btn-primary";
      closeBtn.textContent = "Close";
      closeBtn.style.marginTop = "1rem";
      closeBtn.addEventListener("click", () => this.close());
      done.appendChild(closeBtn);
    }

    this.cardEl.appendChild(done);
  }

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  private advance(question: Question, errorEl: HTMLElement): void {
    if (!this.currentInput || !this.questionnaire) return;
    if (!this.currentInput.isValid()) {
      errorEl.textContent = validationMessage(question);
      this.currentInput.focus();
      return;
    }
    // Capture latest value (e.g. range may not have fired its first change).
    this.handleAnswerChange(question, this.currentInput.getValue(), { immediate: true });

    const last = this.stepIndex === this.questionnaire.questions.length - 1;
    if (last) {
      void this.submit();
      return;
    }
    this.stepIndex++;
    this.renderStep();
  }

  private back(): void {
    // Flush any pending save before navigating
    this.flushPendingSave();
    if (this.stepIndex > 0) {
      this.stepIndex--;
      this.renderStep();
    }
  }

  // ------------------------------------------------------------------
  // Answer handling + autosave
  // ------------------------------------------------------------------

  private handleAnswerChange(
    question: Question,
    value: AnswerValue,
    opts: { immediate?: boolean } = {},
  ): void {
    this.answers[question.id] = value;

    const debounced =
      question.type === "text" ||
      question.type === "currency" ||
      question.type === "range";

    if (opts.immediate || !debounced) {
      this.flushPendingSave();
      this.saveAnswer(question.id, value);
      return;
    }

    // Debounce — collapse rapid keystrokes into one PATCH.
    this.pendingSaveQuestionId = question.id;
    this.pendingSaveValue = value;
    if (this.pendingSaveTimer) clearTimeout(this.pendingSaveTimer);
    this.pendingSaveTimer = setTimeout(() => {
      this.flushPendingSave();
    }, this.config.saveDebounceMs);
  }

  private flushPendingSave(): void {
    if (this.pendingSaveTimer) {
      clearTimeout(this.pendingSaveTimer);
      this.pendingSaveTimer = null;
    }
    if (this.pendingSaveQuestionId !== null) {
      const id = this.pendingSaveQuestionId;
      const value = this.pendingSaveValue;
      this.pendingSaveQuestionId = null;
      this.pendingSaveValue = null;
      this.saveAnswer(id, value);
    }
  }

  private saveAnswer(questionId: string, value: AnswerValue): void {
    this.showSaving(true);
    this.inflightSaves++;
    void this.doSave(questionId, value).finally(() => {
      this.inflightSaves--;
      if (this.inflightSaves === 0) this.showSaving(false);
    });
  }

  private async doSave(questionId: string, value: AnswerValue): Promise<void> {
    // Wait for response id to be assigned before sending updates.
    // If creation is still in flight, queue tightly via microtask polling.
    let waited = 0;
    while (this.responseId === null && waited < 5000) {
      await new Promise((r) => setTimeout(r, 50));
      waited += 50;
    }
    if (this.responseId === null) return;

    try {
      await fetch(`${this.config.endpoint}/${this.responseId}`, {
        method: "PATCH",
        headers: this.jsonHeaders(),
        body: JSON.stringify({ questionId, value }),
      });
    } catch (err) {
      console.error("[quests-embed] failed to save answer:", err);
    }
  }

  private async createResponse(): Promise<void> {
    try {
      const res = await fetch(this.config.endpoint, {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({
          apiKey: this.config.apiKey || undefined,
          questId: this.questionnaire?.id,
          pageUrl: window.location.href,
          visitorId: this.visitorId,
          userAgent: navigator.userAgent,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as CreateResponseResult;
        this.responseId = data.id;
      }
    } catch (err) {
      console.error("[quests-embed] failed to create response:", err);
    }
  }

  private async submit(): Promise<void> {
    this.flushPendingSave();
    // Wait for any in-flight saves so the server sees the final state.
    while (this.inflightSaves > 0) {
      await new Promise((r) => setTimeout(r, 50));
    }

    if (this.responseId !== null) {
      try {
        await fetch(`${this.config.endpoint}/${this.responseId}/submit`, {
          method: "POST",
          headers: this.jsonHeaders(),
          body: JSON.stringify({ answers: this.answers }),
        });
      } catch (err) {
        console.error("[quests-embed] failed to submit:", err);
      }
    }

    this.state = "DONE";
    this.renderDone();
  }

  private jsonHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.config.apiKey) headers["X-API-Key"] = this.config.apiKey;
    return headers;
  }

  private showSaving(visible: boolean): void {
    if (!this.savingEl) return;
    this.savingEl.classList.toggle("qaid-q-visible", visible);
  }

  // ------------------------------------------------------------------
  // Keyboard / lifecycle
  // ------------------------------------------------------------------

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape" && !this.isUserContainer && this.state !== "DONE") {
      this.close();
    }
  }

  private close(): void {
    this.flushPendingSave();
    this.destroy();
  }

  /** Destroy the embed and clean up all resources */
  public destroy(): void {
    document.removeEventListener("keydown", this.boundKeyDown);
    if (this.pendingSaveTimer) {
      clearTimeout(this.pendingSaveTimer);
      this.pendingSaveTimer = null;
    }
    if (this.shadowHost) {
      this.shadowHost.remove();
      this.shadowHost = null;
      this.shadowRoot = null;
    }
    this.rootEl = null;
    this.cardEl = null;
    this.bodyEl = null;
    this.footerEl = null;
    this.titleEl = null;
    this.stepCounterEl = null;
    this.progressFillEl = null;
    this.savingEl = null;
    this.backdropEl = null;
    this.currentInput = null;
  }

  /** Read-only snapshot of current answers */
  public getAnswers(): Answers {
    return { ...this.answers };
  }
}

function validationMessage(q: Question): string {
  switch (q.type) {
    case "text":
      if (q.minLength) return `Please enter at least ${q.minLength} characters.`;
      return "This field is required.";
    case "currency":
      return "Please enter a valid amount.";
    case "date":
      return "Please pick a date.";
    case "multiple-choice":
      return q.multiple ? "Please select at least one option." : "Please select an option.";
    case "range":
      return "Please choose a value.";
  }
}
