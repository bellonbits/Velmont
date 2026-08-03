import express from "express";
import cors from "cors";
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

// The web build calls the API same-origin, but the Capacitor iOS/Android
// builds load from capacitor://localhost / https://localhost and call this
// API cross-origin. Auth is Bearer-token only (no cookies), so an open CORS
// policy doesn't expose any session to other sites.
app.use(cors());
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
