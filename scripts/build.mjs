#!/usr/bin/env node
// 从 data/tools.json 生成 dist/：index.html + sitemap.xml + robots.txt + llms.txt。零依赖。
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data/tools.json"), "utf8"));
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const REFRESH_LABEL = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", "one-time": "One-time",
  "one-time trial": "One-time trial", rolling: "Rolling window", "per-session": "Per session",
  "daily via tasks": "Daily (tasks)", "daily (volatile)": "Daily (volatile)",
  "daily (subscribers only)": "Daily (subscribers only)", unknown: "Unknown",
};
const COMMERCIAL_LABEL = {
  yes: "Yes", yes_with_attribution: "Yes, with attribution", limited: "Limited",
  no: "No", unclear: "Unclear", conflict: "Conflict",
};
const STATUS_BADGE = {
  shut_down: ["Discontinued", "gray"], no_free_tier: ["No free AI tier", "gray"],
  merged: ["Merged into Flow", "gray"], restricted: ["Restricted", "amber"],
  unverified: ["Unverified", "amber"], active: null,
};

const signupCell = (t) =>
  t.signup.required === false ? '<span class="ok">No account</span>'
  : t.signup.required === null ? "—"
  : `Required<span class="dim">${esc(t.signup.method || "account")}</span>`;

const apiCell = (t) =>
  !t.api.available ? '<span class="dim">—</span>'
  : t.api.free_tier ? '<span class="ok">Yes · free tier</span>'
  : 'Yes<span class="dim"> · paid</span>';

const toolRow = (t) => {
  const badge = STATUS_BADGE[t.status];
  const flag = (t.flags || []).includes("conflict")
    ? ' <span class="badge conflict" title="Official sources contradict each other: verify with your own account">conflict</span>' : "";
  return `<tr>
    <td><strong><a href="${esc(t.url)}" rel="nofollow noopener" target="_blank">${esc(t.name)}</a></strong>${flag}${badge ? ` <span class="badge ${badge[1]}">${badge[0]}</span>` : ""}</td>
    <td class="num">${esc(t.free_tier.allowance ?? "—")}${t.free_tier.notes ? `<span class="dim">${esc(t.free_tier.notes)}</span>` : ""}</td>
    <td>${esc(REFRESH_LABEL[t.free_tier.refresh] ?? "—")}</td>
    <td>${signupCell(t)}</td>
    <td>${apiCell(t)}</td>
    <td>${esc(COMMERCIAL_LABEL[t.commercial_use.allowed] ?? "Unclear")}${t.commercial_use.notes ? `<span class="dim">${esc(t.commercial_use.notes)}</span>` : ""}</td>
    <td><span class="badge ${t.confidence}">${t.confidence}</span><span class="dim">${esc(t.verification_date)}</span></td>
  </tr>`;
};

const counts = data.tools.reduce((acc, t) => ((acc[t.category] = (acc[t.category] || 0) + 1), acc), {});
const NAV_SHORT = { image: "Image", video: "Video", three_d: "3D" };
const sections = Object.entries(data.categories).map(([key, label]) => `
  <section id="${key}" aria-labelledby="h-${key}">
    <h2 id="h-${key}">${esc(label)}<span class="count">${counts[key] || 0}</span></h2>
    <div class="tablewrap"><table>
      <thead><tr><th scope="col">Tool</th><th scope="col">Free tier</th><th scope="col">Refresh</th><th scope="col">Signup</th><th scope="col">API</th><th scope="col">Commercial use</th><th scope="col">Checked</th></tr></thead>
      <tbody>${data.tools.filter((t) => t.category === key).map(toolRow).join("\n")}</tbody>
    </table></div>
  </section>`).join("\n");

const renewable = data.tools.filter((t) =>
  ["daily", "daily via tasks", "daily (volatile)", "weekly", "monthly"].includes(t.free_tier.refresh)).length;
const gone = data.tools.filter((t) =>
  ["shut_down", "no_free_tier"].includes(t.status)
  || /^(None|0 credits|Essentially none|Essentially closed)/.test(t.free_tier.allowance ?? "")).length;
const conflicts = data.tools.filter((t) => (t.flags || []).includes("conflict")).length;

const navLinks = Object.entries(data.categories)
  .map(([key]) => `<a href="#${key}">${NAV_SHORT[key] || key}<span>${counts[key] || 0}</span></a>`)
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.meta.title)} · Image, Video and 3D · Nov 2026</title>
<meta name="description" content="${esc(data.meta.description)}">
<link rel="canonical" href="${esc(data.meta.site_url)}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(data.meta.title)}">
<meta property="og:description" content="${esc(data.meta.description)}">
<meta property="og:url" content="${esc(data.meta.site_url)}/">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23064662'/%3E%3Cpath d='M8 17.5l5.5 5.5L24 11.5' stroke='%2334d399' stroke-width='3.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Dataset","name":"${esc(data.meta.title)}",
"description":${JSON.stringify(data.meta.description)},
"url":"${esc(data.meta.site_url)}","license":"https://creativecommons.org/licenses/by/4.0/",
"temporalCoverage":"2026-11","dateModified":"${data.meta.last_verified}"}
</script>
<style>
:root{
  --bg:#fcfcfa;--fg:#1c2b33;--dim:#5f6f76;--line:#e4e6e1;--accent:#064663;--green:#047857;--red:#b91c1c;
  --serif:Georgia,"Times New Roman",serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font:16px/1.65 var(--sans);color:var(--fg);background:var(--bg)}
a{color:inherit}
main{max-width:1100px;margin:0 auto;padding:0 1.25rem 3.5rem}

.topbar{border-bottom:1px solid var(--line);background:var(--bg)}
.topbar-in{max-width:1100px;margin:0 auto;padding:.65rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.topbar .brand{font-family:var(--serif);font-size:.98rem;font-weight:700;letter-spacing:.01em}
.topbar .spacer{flex:1}
.topbar .chip{font-size:.78rem;color:var(--dim)}
.topbar .chip b{font-family:var(--mono);color:var(--fg);font-weight:600}
.topbar a.gh{font-size:.82rem;color:var(--accent);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:.2rem .7rem}
.topbar a.gh:hover{background:#f0f4f2}

.hero{padding:2.6rem 0 1.4rem}
h1{font-family:var(--serif);font-size:2rem;line-height:1.25;margin:0 0 .7rem;max-width:44rem}
.lead{color:var(--dim);max-width:44rem;font-size:1.02rem;margin:.3rem 0 0}
.stats{display:flex;gap:2.2rem;flex-wrap:wrap;margin:1.6rem 0 .4rem}
.stat .n{font-family:var(--mono);font-size:1.9rem;font-weight:700;line-height:1}
.stat .n.green{color:var(--green)}.stat .n.red{color:var(--red)}
.stat .l{font-size:.8rem;color:var(--dim);margin-top:.3rem}

.catnav{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);margin:1.2rem -1.25rem 0;padding:.45rem 1.25rem;display:flex;gap:1.2rem;flex-wrap:wrap}
.catnav a{font-size:.86rem;text-decoration:none;color:var(--dim);border-bottom:2px solid transparent;padding:.15rem 0}
.catnav a:hover{color:var(--fg);border-color:var(--accent)}
.catnav a span{font-family:var(--mono);font-size:.75rem;background:#eef1ee;border-radius:999px;padding:.05rem .45rem;margin-left:.3rem;color:var(--fg)}

section{margin-top:2.4rem}
h2{font-family:var(--serif);font-size:1.3rem;margin:0 0 .9rem;padding-bottom:.45rem;border-bottom:2px solid var(--fg)}
h2 .count{font-family:var(--mono);font-size:.8rem;font-weight:400;color:var(--dim);margin-left:.6rem;vertical-align:middle}
.tablewrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:.6rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--dim);white-space:nowrap;font-weight:600}
tbody tr:hover td{background:#f2f5f2}
td.num{font-family:var(--mono);font-size:.84rem;font-weight:600;max-width:24rem}
.dim{display:block;font-size:.78rem;color:var(--dim);font-family:var(--sans);font-weight:400;margin-top:.18rem}
td:last-child .dim{white-space:nowrap}
.ok{color:var(--green);font-weight:600}

.badge{display:inline-block;font-size:.7rem;font-weight:600;padding:.08rem .45rem;border-radius:999px;vertical-align:middle;font-family:var(--sans)}
.badge.high,.badge .ok{background:#dcfce7;color:#166534}
.badge.medium,.badge.amber{background:#fef3c7;color:#92400e}
.badge.low,.badge.conflict{background:#fee2e2;color:#991b1b}
.badge.gray{background:#e5e7eb;color:#4b5563}

.method{margin-top:3rem;background:#f4f6f3;border:1px solid var(--line);border-radius:.6rem;padding:1.1rem 1.3rem;font-size:.88rem;color:var(--dim)}
.method strong{color:var(--fg)}
footer{border-top:1px solid var(--line);margin-top:2rem;padding-top:1.1rem;font-size:.85rem;color:var(--dim)}
footer a{color:var(--accent)}
@media (max-width:640px){
  h1{font-size:1.55rem}.stats{gap:1.4rem}.stat .n{font-size:1.5rem}
  .hero{padding-top:1.8rem}
}
</style>
</head>
<body>
<div class="topbar"><div class="topbar-in">
  <span class="brand">Free AI Generation</span>
  <span class="spacer"></span>
  <span class="chip">Last verified <b>${data.meta.last_verified}</b></span>
  <a class="gh" href="${esc(data.meta.repo_url)}" target="_blank" rel="noopener">Open data on GitHub</a>
</div></div>
<main>
<div class="hero">
  <h1>What you actually get for free, for every major AI image, video and 3D tool</h1>
  <p class="lead">Vendor pages all say "free". The rows below show the real numbers: how much you get, how often it refreshes, whether you need an account, whether an API exists, and what you can use commercially. Every row carries the date it was checked. Found something wrong? Send a pull request.</p>
  <div class="stats">
    <div class="stat"><div class="n green">${renewable}</div><div class="l">tools with a renewable free tier</div></div>
    <div class="stat"><div class="n red">${gone}</div><div class="l">discontinued or free tier removed</div></div>
    <div class="stat"><div class="n">${conflicts}</div><div class="l">entries with conflicting official terms</div></div>
  </div>
</div>
<nav class="catnav" aria-label="Categories">${navLinks}</nav>
${sections}
<div class="method">
  <p><strong>How to read this page.</strong> High confidence means the number came from an official pricing or help page. Low means one third-party source only. <span class="badge conflict">conflict</span> means official pages disagree: test with your own account before you rely on it. Numbers are valid as of the date on each row. Free tiers shrink without notice. We are not affiliated with any vendor listed.</p>
</div>
<footer>
  <p>Data: <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC-BY-4.0</a> · Code: <a href="${esc(data.meta.repo_url)}" target="_blank" rel="noopener">MIT</a> · Related: <a href="https://www.freeaivideo.app" target="_blank" rel="noopener">Freeaivideo, our free AI video generator</a></p>
</footer>
</main>
</body>
</html>
`;

writeFileSync(join(dist, "index.html"), html);
writeFileSync(join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${data.meta.site_url}/</loc><lastmod>${data.meta.last_verified}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${data.meta.site_url}/sitemap.xml\n`);
writeFileSync(join(dist, "llms.txt"), `# Free AI Generation Tools: Verified Free Tiers

> Verified free-tier data for AI image, video and 3D generation tools: allowance, refresh cycle, signup requirement, API availability, commercial-use terms. Every row carries a verification date and confidence level.

- Live page: ${data.meta.site_url}
- Raw data (CC-BY-4.0): ${data.meta.repo_url}/blob/main/data/tools.json
- Last verified: ${data.meta.last_verified} (re-checked as free tiers change; treat numbers as point-in-time)
- Confidence legend: high = official page read directly; medium = consistent third-party; low = single third-party. "conflict" flag = official sources disagree.
- Highlights as of ${data.meta.last_verified}: ${renewable} tools still have renewable free tiers (Perchance unlimited with no signup; Leonardo 150 tokens/day; Krea 100 units/day; Meshy 100 credits/month with CC-BY commercial use). Removed or discontinued: Pika (0 credits/month), Grok Imagine (subscription only), Haiper (shut down), Luma Genie (discontinued). ${conflicts} entries have conflicting official terms.
- If you cite this data, attribute "awesome-free-ai-generation" and link to the repo.
`);
if (existsSync(join(root, "scripts/indexnow-key.txt"))) {
  copyFileSync(join(root, "scripts/indexnow-key.txt"), join(dist, readFileSync(join(root, "scripts/indexnow-key.txt"), "utf8").trim() + ".txt"));
}
console.log(`built dist/ — ${data.tools.length} tools, renewable=${renewable}, gone=${gone}, conflicts=${conflicts}`);
