#!/usr/bin/env node
// 从 data/tools.json 生成 dist/index.html + sitemap.xml + robots.txt。零依赖。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
  "daily via tasks": "Daily (tasks)", "daily (volatile)": "Daily (volatile)", "unknown": "Unknown",
};
const COMMERCIAL_LABEL = {
  yes: "Yes", yes_with_attribution: "Yes, with attribution", limited: "Limited",
  no: "No", unclear: "Unclear", conflict: "⚠ Conflict",
};
const STATUS_BADGE = {
  shut_down: ["Discontinued", "gray"], no_free_tier: ["No free AI tier", "gray"],
  merged: ["Merged into Flow", "gray"], restricted: ["Restricted", "amber"],
  unverified: ["Unverified", "amber"], active: null,
};
const CONF_BADGE = { high: "high", medium: "medium", low: "low" };

const signupCell = (t) =>
  t.signup.required === false ? '<span class="ok">No account</span>'
  : t.signup.required === null ? "—"
  : `Required<span class="dim"> · ${esc(t.signup.method || "account")}</span>`;

const apiCell = (t) =>
  !t.api.available ? '<span class="dim">—</span>'
  : t.api.free_tier ? '<span class="ok">Yes · free tier</span>'
  : "Yes<span class=\"dim\"> · paid</span>";

const toolRow = (t) => {
  const badge = STATUS_BADGE[t.status];
  const flag = (t.flags || []).includes("conflict")
    ? ' <span class="badge conflict" title="Official sources contradict each other — verify with your own account">⚠ conflict</span>' : "";
  return `<tr>
    <td><strong><a href="${esc(t.url)}" rel="nofollow noopener" target="_blank">${esc(t.name)}</a></strong>${flag}${badge ? ` <span class="badge ${badge[1]}">${badge[0]}</span>` : ""}</td>
    <td>${esc(t.free_tier.allowance ?? "—")}${t.free_tier.notes ? `<span class="dim">${esc(t.free_tier.notes)}</span>` : ""}</td>
    <td>${esc(REFRESH_LABEL[t.free_tier.refresh] ?? "—")}</td>
    <td>${signupCell(t)}</td>
    <td>${apiCell(t)}</td>
    <td>${esc(COMMERCIAL_LABEL[t.commercial_use.allowed] ?? "Unclear")}${t.commercial_use.notes ? `<span class="dim">${esc(t.commercial_use.notes)}</span>` : ""}</td>
    <td><span class="badge ${CONF_BADGE[t.confidence]}">${t.confidence}</span></td>
  </tr>`;
};

const counts = data.tools.reduce((acc, t) => ((acc[t.category] = (acc[t.category] || 0) + 1), acc), {});
const sections = Object.entries(data.categories).map(([key, label]) => `
  <section id="${key}">
    <h2>${esc(label)} <span class="count">${counts[key] || 0}</span></h2>
    <div class="tablewrap"><table>
      <thead><tr><th>Tool</th><th>Free tier</th><th>Refresh</th><th>Signup</th><th>API</th><th>Commercial use</th><th>Confidence</th></tr></thead>
      <tbody>${data.tools.filter((t) => t.category === key).map(toolRow).join("\n")}</tbody>
    </table></div>
  </section>`).join("\n");

const stillFree = data.tools.filter((t) =>
  ["daily", "daily via tasks", "daily (volatile)"].includes(t.free_tier.refresh)).length;
const gone = data.tools.filter((t) => ["shut_down", "no_free_tier"].includes(t.status) || t.free_tier.allowance === "None").length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.meta.title)}: Image, Video and 3D (Nov 2026)</title>
<meta name="description" content="${esc(data.meta.description)}">
<link rel="canonical" href="${esc(data.meta.site_url)}/">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Dataset","name":"${esc(data.meta.title)}",
"description":${JSON.stringify(data.meta.description)},
"url":"${esc(data.meta.site_url)}","license":"https://creativecommons.org/licenses/by/4.0/",
"temporalCoverage":"2026-11","dateModified":"${data.meta.last_verified}"}
</script>
<style>
:root{--bg:#fff;--fg:#1a1a2e;--dim:#6b7280;--line:#e5e7eb;--accent:#2563eb}
*{box-sizing:border-box}body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg)}
main{max-width:1080px;margin:0 auto;padding:2rem 1.25rem 4rem}
h1{font-size:1.7rem;line-height:1.3;margin:.2rem 0 .6rem}h2{font-size:1.25rem;margin:2.2rem 0 .8rem;border-bottom:2px solid var(--line);padding-bottom:.4rem}
.lead{color:var(--dim);max-width:46rem}.meta-line{font-size:.9rem;color:var(--dim);margin-bottom:1rem}
.badge{display:inline-block;font-size:.72rem;font-weight:600;padding:.1rem .45rem;border-radius:999px;vertical-align:middle}
.badge.high,.badge .ok{background:#dcfce7;color:#166534}.badge.medium,.badge.amber{background:#fef3c7;color:#92400e}
.badge.low{background:#fee2e2;color:#991b1b}.badge.gray{background:#e5e7eb;color:#4b5563}
.badge.conflict{background:#fee2e2;color:#991b1b}
.count{font-size:.85rem;color:var(--dim);font-weight:400}
.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:.55rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--dim);white-space:nowrap}
tr:hover td{background:#f8fafc}
.dim{display:block;font-size:.8rem;color:var(--dim);margin-top:.15rem}
.ok{color:#166534;font-weight:600}
.stat{display:inline-block;background:#f1f5f9;border-radius:.5rem;padding:.35rem .8rem;margin:0 .5rem .5rem 0;font-size:.88rem}
.stat b{color:var(--accent)}
footer{border-top:1px solid var(--line);margin-top:3rem;padding-top:1.2rem;font-size:.85rem;color:var(--dim)}
footer a{color:var(--accent)}
a{color:var(--fg)}
</style>
</head>
<body><main>
<h1>${esc(data.meta.title)}</h1>
<p class="meta-line">Image, video and 3D generation. <strong>${data.tools.length} tools</strong>, last verified <strong>${data.meta.last_verified}</strong>. <a href="${esc(data.meta.repo_url)}" target="_blank" rel="noopener">open data on GitHub ↗</a></p>
<p class="lead">Free tiers change monthly, and every vendor page says “free”. The rows below show what you actually get: the allowance, how often it refreshes, whether you need an account, whether an API exists, and what you can use commercially. Every row carries the date it was checked. Found something wrong? Send a pull request.</p>
<p>
<span class="stat"><b>${stillFree}</b> tools with a renewable daily/weekly free tier</span>
<span class="stat"><b>${gone}</b> discontinued or free tier removed</span>
<span class="stat"><b>${data.tools.filter((t) => (t.flags || []).includes("conflict")).length}</b> entries with conflicting official terms</span>
</p>
${sections}
<footer>
<p><strong>How to read this page:</strong> High confidence means the number came from an official pricing or help page. Low means one third-party source only. <span class="badge conflict">⚠ conflict</span> means official pages disagree: test with your own account before you rely on it. Numbers are valid as of the date on each row. Free tiers shrink without notice. We are not affiliated with any vendor listed.</p>
<p>Data: <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC-BY-4.0</a> · Code: <a href="${esc(data.meta.repo_url)}" target="_blank" rel="noopener">MIT</a> · Related: <a href="https://www.freeaivideo.app" target="_blank" rel="noopener">Freeaivideo, our free AI video generator</a></p>
</footer>
</main></body></html>
`;

writeFileSync(join(dist, "index.html"), html);
writeFileSync(join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${data.meta.site_url}/</loc><lastmod>${data.meta.last_verified}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${data.meta.site_url}/sitemap.xml\n`);
console.log(`built dist/ — ${data.tools.length} tools, ${Object.keys(counts).length} categories`);
