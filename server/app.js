import express from "express";
import { seedProductsIfEmpty } from "./seed.js";
import { authRouter } from "./routes/auth.js";
import { locationsRouter } from "./routes/locations.js";
import { favoritesRouter } from "./routes/favorites.js";
import { checkoutRouter } from "./routes/checkout.js";
import { productsRouter } from "./routes/products.js";
import { adminRouter } from "./routes/admin.js";
import { trackRouter } from "./routes/track.js";

await seedProductsIfEmpty();

export const app = express();

app.use(express.json());

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
