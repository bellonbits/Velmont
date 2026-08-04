// Generates public/sitemap.xml at build time from the known product catalog
// (seed.js) plus the app's public, indexable routes. Vite copies public/ into
// dist/ verbatim, so this must run before `vite build`.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { seedProducts } from "../server/seedData.js";

const SITE_URL = "https://velmonts.vercel.app";
const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/home", changefreq: "daily", priority: "0.9" },
  { path: "/stores", changefreq: "monthly", priority: "0.6" },
  { path: "/chat", changefreq: "monthly", priority: "0.3" },
];

const productRoutes = seedProducts.map((p) => ({
  path: `/product/${p.id}`,
  changefreq: "weekly",
  priority: "0.8",
}));

const urls = [...staticRoutes, ...productRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), "../public/sitemap.xml");
writeFileSync(outPath, xml);
console.log(`Wrote sitemap.xml with ${urls.length} URLs.`);
