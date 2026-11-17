# awesome-free-ai-generation

Verified free tiers for AI image, video and 3D generation tools, as open data.

Live page: **https://tools.freeaivideo.app**

Free tiers change monthly. Vendor pages always claim "free". Directory sites list tools but
rarely check the numbers. This repo tracks the real numbers, per tool:

| Field | Meaning |
|---|---|
| `free_tier.allowance` | What you actually get for free (with numbers where official ones exist) |
| `free_tier.refresh` | Daily / weekly / monthly / one-time / rolling |
| `signup` | Whether an account is required, and which signup method qualifies |
| `api` | Whether an API exists and whether it has a free tier |
| `commercial_use` | Yes / with attribution / limited / no / unclear / conflict |
| `verification_date` | When this row was last checked |
| `confidence` | `high` = official page read directly · `medium` = consistent third-party · `low` = single third-party |
| `flags` | `conflict` = official sources contradict each other |

## Why

Structured free-tier trackers already exist ([Free AI For That](https://freeaiforthat.com/),
[FreeTokenBox](https://freetokenbox.com/), [awesome-free-llm-apis](https://github.com/mnfst/awesome-free-llm-apis) for LLMs),
but a field existing does not mean the data is right. Cross-checking against official docs
turned up real conflicts (Tripo's commercial terms, for one). So every row here carries its
check date, confidence level and sources, and contradictions are flagged as `conflict`
instead of quietly resolved.

## The data

- [`data/tools.json`](data/tools.json) — 61 tools (image 14 · video 13 · 3D 9 · text 13 · audio 12), last verified **2026-11-17**.
- The site is generated from the JSON: `node scripts/build.mjs` → `dist/`.

### Snapshot highlights (2026-11)

- **Renewable daily/weekly free tier still alive**: Perchance (unlimited, no signup),
  Leonardo (150 tokens/day), Krea (100 units/day), Kling (~66 credits/day ⚠conflict),
  PixVerse (60/day, may have dropped to 30), Civitai (daily Buzz), SeaArt (~130 stamina/day).
- **Free tier removed / product dead**: Pika (0 credits/month), Grok Imagine (subscription-only),
  Sora (free basically closed), Haiper (shut down), Luma Genie (discontinued 2026-01-01),
  Spline AI (AI is paid-only), BFL Playground (signup credits reportedly removed).
- **One-time only**: Runway (125 credits, never expire), Pollo (20), Higgsfield (24h trial),
  Masterpiece X (250).
- **Commercial use on free tier**: only Meshy is confirmed **free-commercial with CC BY
  attribution** (3D); Tripo resolved to attribution-commercial (IP stays with Tripo);
  Recraft & PicLumen are explicitly non-commercial. On audio, only the open-source route is
  free-commercial (Kokoro / ACE-Step, Apache-2.0 self-host); Suno, Stable Audio,
  ElevenLabs and Fish Audio all gate commercial use behind paid tiers.

### Text & audio snapshot (2026-11)

- **Text**: ChatGPT instant chat is effectively unlimited; Cloudflare Workers AI gives
  10,000 Neurons/day; OpenRouter :free models give 50–1,000 requests/day; GitHub Copilot
  Free gives 2,000 completions/month. Shrunk hard: Cerebras cancelled its permanent free
  tier (2026-07, $5 trial now requires a payment method), Gemini app free tier was pointed
  to Flash-Lite-class models (2026-10), Perplexity Pro searches cut 5 → 3/day.
- **Audio**: Suno 50 credits/day and Stable Audio 50 credits/month, both non-commercial;
  ElevenLabs 10,000 credits/month, commercial license starts at Starter; Udio is in a
  post-settlement transition (downloads restricted). Free-commercial = open-source
  self-host only (Kokoro, ACE-Step; edge-tts is free but gray-area).

## Contributing

PRs against `data/tools.json` only. Rules:

1. Every change must update `verification_date` and carry at least one `sources` URL.
2. Official pages beat blog posts; if only third-party data exists, set `confidence` accordingly.
3. If official sources contradict each other, keep it and add the `conflict` flag —
   don't quietly pick one side.
4. Non-English sources are welcome (many of these tools are Chinese-made; 官方中文页同样算官方来源).

## Related projects

- [Free AI For That](https://freeaiforthat.com/) — English directory with per-tool free conditions & check dates
- [FreeTokenBox](https://freetokenbox.com/) — 中文免费额度目录
- [awesome-free-llm-apis](https://github.com/mnfst/awesome-free-llm-apis) — structured free LLM APIs (text)

## License

- Code (`scripts/`): [MIT](LICENSE)
- Data (`data/tools.json`, generated site content): [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — attribute as
  "awesome-free-ai-generation" with a link.
