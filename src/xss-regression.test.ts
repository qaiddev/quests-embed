/**
 * XSS regression suite (2026-11 audit, after the Optimizely incident).
 *
 * Quest text is written by qaid project members and served from qaid's
 * server; this embed draws it on partner sites. None of it may become markup
 * or script in the partner's origin. If a test here fails, a hole has
 * reopened: fix the code, never the check.
 *
 * The payload list is kept in step with qaid.dev's src/test-helpers/xss.ts
 * (the packages never depend on each other, so it is copied).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { QaidQuests } from "./embed";
import type { Questionnaire } from "./types";

const PAYLOADS: readonly string[] = [
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "<script>alert(1)</script>",
  '"><script>alert(1)</script>',
  "</style><script>alert(1)</script>",
  '<a href="javascript:alert(1)">click</a>',
  "<iframe src=javascript:alert(1)></iframe>",
  "<details open ontoggle=alert(1)>",
  "<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>",
  "{{constructor.constructor('alert(1)')()}}",
];

/** Anything in the rendered quest that could run or link to script. */
function live(root: ParentNode): string[] {
  const problems: string[] = [];
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const tag = el.localName.toLowerCase();
    if (["script", "iframe", "object", "embed", "foreignobject", "img", "a", "details"].includes(tag)) {
      problems.push(`<${tag}>`);
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) problems.push(`<${tag}> ${name}`);
      // Only attributes that load or navigate: text attributes (placeholder,
      // aria-label, data-value) may hold the words, inertly.
      const loads = /^(href|xlink:href|src|srcset|action|formaction|data|poster|background)$/.test(name);
      if (loads && /javascript:|vbscript:|data:text/i.test(attr.value.replace(/[\u0000- ]+/g, ""))) {
        problems.push(`<${tag}> ${name}=${attr.value}`);
      }
    }
  }
  return problems;
}

function hostile(payload: string, first: "text" | "choice"): Questionnaire {
  const text = {
    id: "t",
    type: "text" as const,
    label: payload,
    description: payload,
    placeholder: payload,
  };
  const choice = {
    id: "c",
    type: "multiple-choice" as const,
    label: payload,
    description: payload,
    options: [
      { value: payload, label: payload, description: payload },
      { value: "b", label: payload },
    ],
  };
  return {
    id: "q",
    title: payload,
    description: payload,
    questions: first === "text" ? [text, choice] : [choice, text],
  } as Questionnaire;
}

describe("quest text from qaid's server is drawn as text", () => {
  let mount: HTMLDivElement;
  let embed: QaidQuests | null = null;

  beforeEach(() => {
    mount = document.createElement("div");
    mount.id = "mount";
    document.body.appendChild(mount);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: "r1" }), { status: 200 })),
    );
  });

  afterEach(() => {
    embed?.destroy();
    embed = null;
    mount.remove();
    vi.unstubAllGlobals();
  });

  async function rendered(): Promise<ShadowRoot> {
    const shadow = (document.querySelector("[data-qaid-quests]") as HTMLElement).shadowRoot!;
    for (let i = 0; i < 100 && !shadow.querySelector(".qaid-q-step"); i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(shadow.querySelector(".qaid-q-step")).toBeTruthy();
    return shadow;
  }

  it.each(PAYLOADS.flatMap((p) => [[p, "text"], [p, "choice"]] as const))(
    "%s on a %s question",
    async (payload, first) => {
      embed = new QaidQuests({
        endpoint: "/api/responses",
        questionnaire: hostile(payload, first),
        container: "#mount",
      });
      const shadow = await rendered();
      expect(live(shadow), JSON.stringify(live(shadow))).toEqual([]);
      // Still visible, as text, so the author can see what they wrote.
      expect(shadow.textContent).toContain(payload);
    },
  );
});

describe("no raw-HTML or eval sink in the embed's source", () => {
  // Built DOM only. A string handed to the HTML parser or to eval on a partner
  // page is exactly the hole this audit closed; this keeps it closed.
  const SINK = /\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write|createContextualFragment|\beval\s*\(|new Function\s*\(|\.srcdoc\s*=|setAttribute\(\s*["']on/;
  const dir = path.join(import.meta.dirname);
  const files = readdirSync(dir).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith(".d.ts"));

  it("scans the source files", () => {
    expect(files.length).toBeGreaterThan(8);
  });

  it.each(files)("%s has no sink", (file) => {
    const hits = readFileSync(path.join(dir, file), "utf8")
      .split("\n")
      .map((line, i) => ({ line: line.trim(), at: i + 1 }))
      .filter(({ line }) => SINK.test(line) && !/^(\/\/|\*|\/\*)/.test(line))
      .map(({ line, at }) => `${file}:${at} ${line}`);
    expect(hits).toEqual([]);
  });
});
