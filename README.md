# @qaiddev/quests-embed

[![npm version](https://img.shields.io/npm/v/@qaiddev/quests-embed)](https://www.npmjs.com/package/@qaiddev/quests-embed)
[![coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fqaiddev%2Fquests-embed%2Fprod%2Fcoverage-badge.json)](https://github.com/qaiddev/quests-embed)

A zero-dependency, lightweight questionnaire embed that renders step-by-step forms from a JSON definition. Drop it inline on a page or open it as a modal — answers are autosaved as the user types and submitted to your API endpoint or the [QAid.dev hosted dashboard](https://qaid.dev).

## Install

### npm

```bash
npm install @qaiddev/quests-embed
```

```typescript
import { QaidQuests } from '@qaiddev/quests-embed';

new QaidQuests({
  endpoint: 'https://qaid.dev/api/responses',
  apiKey: 'YOUR_API_KEY',
  configUrl: '/forms/intake.json',
  container: '#form',
});
```

### CDN / Script Tag

```html
<div id="form"></div>

<script
  src="https://unpkg.com/@qaiddev/quests-embed/dist/qaid-quests.umd.cjs"
  data-endpoint="https://qaid.dev/api/responses"
  data-api-key="YOUR_API_KEY"
  data-config-url="/forms/intake.json"
  data-container="#form"
></script>
```

The embed auto-initializes when it detects a `data-endpoint` attribute on its script tag and either `data-config-url` or an inline JSON config.

### JSON Config (Script Tag)

For complex configurations or inline questionnaires, use a separate JSON config element:

```html
<script type="application/json" data-quests-config>
{
  "endpoint": "https://qaid.dev/api/responses",
  "apiKey": "YOUR_API_KEY",
  "container": "#form",
  "questionnaire": {
    "title": "Tell us about your project",
    "questions": [
      { "id": "name", "type": "text", "label": "Your name", "required": true },
      { "id": "budget", "type": "currency", "label": "Project budget", "currency": "USD" },
      {
        "id": "stack",
        "type": "multiple-choice",
        "label": "Which stack are you using?",
        "options": [
          { "value": "react", "label": "React" },
          { "value": "vue", "label": "Vue" },
          { "value": "svelte", "label": "Svelte" }
        ]
      }
    ]
  }
}
</script>
<script src="https://unpkg.com/@qaiddev/quests-embed/dist/qaid-quests.umd.cjs"></script>
```

## How It Works

1. The embed loads the questionnaire — either inline via `questionnaire`, or fetched from `configUrl`
2. A response record is created on your server (`POST` to `endpoint`)
3. Questions render one at a time with a progress bar and Back/Next navigation
4. Answers autosave as the user moves between steps (`PATCH` per question). Text and currency fields debounce by `saveDebounceMs` (default 500ms)
5. On the final step, all answers are submitted in a single batch (`POST` to `{endpoint}/{id}/submit`)
6. A "thank you" screen appears when finished

If `container` is set, the form renders inline inside that element. If not, it opens as a centered modal with a backdrop.

## Questionnaire Definition

A `Questionnaire` is the JSON document that describes the form. It can be loaded inline via the `questionnaire` config option, or fetched from a URL via `configUrl`.

```typescript
interface Questionnaire {
  id?: string;                 // Stable identifier sent with createResponse
  title?: string;              // Shown at the top of the form
  description?: string;        // Shown under the title
  thankYouTitle?: string;      // Default "Thank you!"
  thankYouMessage?: string;    // Optional subtitle on the done screen
  submitLabel?: string;        // Default "Submit"
  nextLabel?: string;          // Default "Next"
  backLabel?: string;          // Default "Back"
  questions: Question[];
}
```

### Question Types

All questions share these base fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | **(required)** Stable answer key |
| `label` | `string` | **(required)** Question label |
| `description` | `string` | Optional helper text |
| `required` | `boolean` | Whether an answer is required to advance |

Plus a `type` discriminator that selects one of:

#### Text — `type: "text"`

| Field | Type | Description |
|-------|------|-------------|
| `placeholder` | `string` | Input placeholder |
| `multiline` | `boolean` | Use a textarea instead of a single-line input |
| `maxLength` | `number` | Max length |
| `minLength` | `number` | Min length (only enforced when `required`) |
| `inputType` | `"text" \| "email" \| "tel" \| "url"` | Native input type for short fields. Default `"text"` |

#### Currency — `type: "currency"`

| Field | Type | Description |
|-------|------|-------------|
| `currency` | `string` | ISO currency code, e.g. `"USD"`. Default `"USD"` |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `locale` | `string` | Locale for number formatting. Default browser locale |
| `placeholder` | `string` | Input placeholder |

#### Range — `type: "range"`

| Field | Type | Description |
|-------|------|-------------|
| `min` | `number` | **(required)** Minimum value |
| `max` | `number` | **(required)** Maximum value |
| `step` | `number` | Step size. Default `1` |
| `defaultValue` | `number` | Initial value when no answer yet. Default `min` |
| `unit` | `string` | Suffix shown next to the value (e.g. `"/10"`, `"%"`) |

#### Date — `type: "date"`

| Field | Type | Description |
|-------|------|-------------|
| `min` | `string` | ISO date string for the earliest allowed date |
| `max` | `string` | ISO date string for the latest allowed date |

#### Multiple Choice — `type: "multiple-choice"`

| Field | Type | Description |
|-------|------|-------------|
| `options` | `MultipleChoiceOption[]` | **(required)** List of options |
| `multiple` | `boolean` | Allow multiple selections. Answer becomes `string[]`. Default `false` |

Each option has `value`, `label`, and optional `description`.

### Example questionnaire JSON

```json
{
  "id": "intake-2026",
  "title": "Project intake",
  "description": "Tell us a bit about your project. Takes about 2 minutes.",
  "submitLabel": "Submit",
  "thankYouTitle": "Got it!",
  "thankYouMessage": "We'll be in touch within one business day.",
  "questions": [
    {
      "id": "name",
      "type": "text",
      "label": "Your name",
      "required": true,
      "placeholder": "Jane Smith"
    },
    {
      "id": "email",
      "type": "text",
      "label": "Best email to reach you",
      "inputType": "email",
      "required": true
    },
    {
      "id": "budget",
      "type": "currency",
      "label": "What's your budget?",
      "currency": "USD",
      "min": 0
    },
    {
      "id": "timeline",
      "type": "range",
      "label": "How urgent is this?",
      "min": 1,
      "max": 10,
      "defaultValue": 5,
      "unit": "/10"
    },
    {
      "id": "start",
      "type": "date",
      "label": "When would you like to start?"
    },
    {
      "id": "needs",
      "type": "multiple-choice",
      "label": "What do you need help with?",
      "multiple": true,
      "options": [
        { "value": "design", "label": "Design" },
        { "value": "engineering", "label": "Engineering" },
        { "value": "strategy", "label": "Strategy" }
      ]
    }
  ]
}
```

## Configuration

All options are optional except `endpoint` and one of `questionnaire` / `configUrl`.

We offer a Free Plan that hosts both the endpoint and a dashboard for managing your form responses.

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | **(required)** | API endpoint URL for storing answers |
| `questionnaire` | `Questionnaire` | — | Inline questionnaire definition (takes precedence over `configUrl`) |
| `configUrl` | `string` | — | URL to fetch the questionnaire JSON from |
| `apiKey` | `string` | `""` | API key for authenticating with the service |
| `container` | `string` | `""` | CSS selector for a host element. If absent, the form opens as a modal |
| `zIndex` | `number` | `50` | z-index for modal mode |

### Behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoAdvance` | `boolean` | `false` | Advance automatically on selection for single-choice multiple-choice and range questions |
| `saveDebounceMs` | `number` | `500` | Debounce in ms for autosave on text/currency/range |
| `autoFocus` | `boolean` | `true` | Auto-focus the input on each step. Set `false` in preview/embedded contexts that shouldn't steal focus |

### Appearance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `modalWidth` | `number` | `480` | Width of the modal in pixels |
| `backdropOpacity` | `number` | `0.4` | Opacity of the dark backdrop in modal mode (0-1) |
| `fontFamily` | `string` | `"system-ui, -apple-system, sans-serif"` | Font family for all text |
| `fontSize` | `number` | `16` | Base font size in pixels |
| `css` | `string` | `""` | Custom CSS injected into the shadow root for theming |

### Colors

Pass a `colors` object to customize the color scheme. Variable names are shared with `@qaiddev/thumbs-embed`, so themes written for one embed render identically in the other:

```typescript
new QaidQuests({
  endpoint: '/api/responses',
  configUrl: '/forms/intake.json',
  colors: {
    positive: 'rgb(0, 200, 83)',  // Progress bar, focus rings, submit button
    negative: 'rgb(255, 0, 0)',   // Validation errors
    marker: '#6366f1',            // Selection / highlight
  },
});
```

Colors accept hex (`#ABC`, `#AABBCC`) or `rgb(r, g, b)` format. The text color used on top of `positive` and `marker` is computed automatically based on luminance.

## Script Tag Data Attributes

When using the script tag method, all config options are available as `data-*` attributes:

| Attribute | Maps To |
|-----------|---------|
| `data-endpoint` | `endpoint` |
| `data-config-url` | `configUrl` |
| `data-api-key` | `apiKey` |
| `data-container` | `container` |
| `data-zindex` | `zIndex` |
| `data-positive-color` | `colors.positive` |
| `data-negative-color` | `colors.negative` |
| `data-marker-color` | `colors.marker` |
| `data-modal-width` | `modalWidth` |
| `data-backdrop-opacity` | `backdropOpacity` |
| `data-font-family` | `fontFamily` |
| `data-font-size` | `fontSize` |
| `data-auto-advance` | `autoAdvance` (`"true"` to enable) |
| `data-save-debounce-ms` | `saveDebounceMs` |
| `data-css-selector` | CSS selector for an element whose `textContent` is used as `css` |

## Modal vs. Inline

By default the embed opens as a fixed-position modal centered on the viewport. To render the form inline inside your own element, pass `container`:

```html
<div id="my-form-spot"></div>

<script>
new QaidQuests({
  endpoint: '/api/responses',
  configUrl: '/forms/intake.json',
  container: '#my-form-spot',
});
</script>
```

When `container` is set, `zIndex` is ignored and the backdrop / close button are not rendered. You control the layout.

## API

### Constructor

```typescript
const quests = new QaidQuests(config: QuestsConfig);
```

### Methods

| Method | Description |
|--------|-------------|
| `getAnswers()` | Read-only snapshot of the answers collected so far, keyed by question id |
| `destroy()` | Remove all DOM elements, event listeners, and injected styles. Safe to call multiple times |

### Server Protocol

The embed talks to your endpoint in three steps:

**1. Create response** — `POST {endpoint}`:

```json
{
  "apiKey": "YOUR_API_KEY",
  "questId": "intake-2026",
  "pageUrl": "https://example.com/contact",
  "visitorId": "a1b2c3d4-...",
  "userAgent": "Mozilla/5.0 ..."
}
```

Your endpoint should return `{ "id": "..." }` (string or number). The form is usable immediately while creation is in flight — saves queue until the id arrives.

**2. Save answer** — `PATCH {endpoint}/{id}` (one request per question, debounced for text/currency/range):

```json
{
  "questionId": "budget",
  "value": 5000
}
```

`value` is `string | number | string[] | null` depending on the question type.

**3. Submit** — `POST {endpoint}/{id}/submit`:

```json
{
  "answers": {
    "name": "Jane Smith",
    "budget": 5000,
    "needs": ["design", "engineering"]
  }
}
```

When an `apiKey` is configured, it's also sent as an `X-API-Key` header on every request.

## Answer Types

| Question type | Answer value type |
|---------------|-------------------|
| `text` | `string` |
| `currency` | `number` |
| `range` | `number` |
| `date` | `string` (ISO date) |
| `multiple-choice` (single) | `string` |
| `multiple-choice` (multiple) | `string[]` |

Unanswered questions are stored as `null`.

## Visitor IDs

The embed generates a stable `visitorId` (UUID) per browser, stored in `localStorage` under the `qaid_visitor_id` key. It's sent with every `createResponse` call so you can correlate multiple responses from the same visitor. If `localStorage` is unavailable, a fresh UUID is generated per session.

## Keyboard Behavior

- **Enter** — advance to the next question, or submit on the final step
- **Escape** — close the form (modal mode only; ignored when `container` is set)
- **Tab / Shift+Tab** — move focus between inputs and buttons

Each step auto-focuses its input on render so keyboard and screen-reader users land on the active question. Set `autoFocus: false` on the initial mount to opt out.

## Theming

The embed renders inside a Shadow DOM, so your page's CSS can't leak in. To theme it, pass a `css` string that's injected into the shadow root, or override the CSS custom properties:

```css
:root {
  --qaid-positive: rgb(0, 200, 83);
  --qaid-negative: rgb(255, 0, 0);
  --qaid-marker: #6366f1;
  --qaid-modal-width: 480px;
  --qaid-backdrop-opacity: 0.4;
  --qaid-font-family: system-ui, -apple-system, sans-serif;
  --qaid-font-size: 16px;
}
```

The variable names are shared with `@qaiddev/thumbs-embed`, so a single theme can drive both embeds.

## Hosted Dashboard

[Qaid](https://qaid.dev) provides a hosted dashboard for managing responses collected by this embed:

- **Response inbox** with answers, timestamps, and visitor history
- **Form builder** for editing questionnaire JSON without redeploying
- **Project management** with multiple API keys
- **Team collaboration** with owners, members, and invitations
- **Analytics** and data retention

### Plans

| | Cadet (Free) | Commander ($9/mo) | Admiral (Enterprise) |
|---|---|---|---|
| Projects | 1 | Unlimited | Unlimited |
| Responses | 100/mo | Unlimited | Unlimited |
| Data retention | 7 days | 1 year | Unlimited |
| Notifications | - | Email/Text | Email/Text |
| Integrations | - | GitHub + more | Custom |

Sign up at [qaid.dev](https://qaid.dev). You can also self-host — the embed works with any endpoint that accepts the protocol described above.

## Self-Hosting

The embed is endpoint-agnostic. Point it at your own server:

```typescript
new QaidQuests({
  endpoint: 'https://your-server.com/api/responses',
  configUrl: '/forms/intake.json',
});
```

Your server needs to handle:

1. `POST /api/responses` — Accept the create-response payload, return `{ "id": string | number }`
2. `PATCH /api/responses/:id` — Accept `{ "questionId": string, "value": ... }` to save a single answer
3. `POST /api/responses/:id/submit` — Accept `{ "answers": Record<string, ...> }` for the final batch

## Project Badges

<a href="https://www.npmjs.com/package/@qaiddev/quests-embed">
<img alt="npm version" src="https://img.shields.io/npm/v/@qaiddev/quests-embed" />
</a>

<a href="https://github.com/qaiddev/quests-embed/blob/prod/LICENSE">
  <img alt="license" src="https://img.shields.io/npm/l/@qaiddev/quests-embed"/>
</a>
