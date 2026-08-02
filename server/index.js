import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { seedProductsIfEmpty } from "./seed.js";
import { authRouter } from "./routes/auth.js";
import { locationsRouter } from "./routes/locations.js";
import { favoritesRouter } from "./routes/favorites.js";
import { checkoutRouter } from "./routes/checkout.js";
import { productsRouter } from "./routes/products.js";
import { adminRouter } from "./routes/admin.js";
import { trackRouter } from "./routes/track.js";

void db; // ensure schema migrations run before seeding
seedProductsIfEmpty();

const app = express();
const PORT = process.env.PORT || 4000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(cookieParser());
// Uploaded filenames are timestamped per-upload, so a given URL's content
// never changes — safe to let browsers cache it long-term.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), { maxAge: "7d", immutable: true }),
);

app.use("/api/auth", authRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/products", productsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/track", trackRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Velmont API listening on http://localhost:${PORT}`);
});
