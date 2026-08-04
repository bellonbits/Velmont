import { useState } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "../components/BottomNav";
import { ThemeToggle } from "../components/ThemeToggle";
import { StoreMap } from "../components/StoreMap";
import { stores } from "../data/stores";
import { useSEO } from "../lib/seo";

function mapsLink(store: (typeof stores)[number]) {
  const query = encodeURIComponent(`${store.name}, ${store.addressLine}, ${store.city}, Kenya`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function telLink(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cell = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
} as const;

export function Stores() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useSEO({
    title: "Watch Shops Near You in Nairobi, Kenya | Velmont Stores",
    description:
      "Visit Velmont in person to try on watches before you buy. Find our Nairobi store address, opening hours, and directions.",
    structuredData: stores.map((s) => ({
      "@context": "https://schema.org",
      "@type": "Store",
      name: s.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: s.addressLine,
        addressLocality: s.city,
        addressCountry: "KE",
      },
      telephone: s.phone,
      openingHours: s.hours,
      geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
    })),
  });

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-8 pt-8 md:max-w-5xl md:px-8 md:pt-28">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">Nearby Stores</h1>
          <ThemeToggle className="md:hidden" />
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Visit us in person to try on watches before you buy.
        </p>

        <div className="mt-5 md:grid md:grid-cols-5 md:items-start md:gap-8">
          <div className="md:col-span-3 md:sticky md:top-28">
            <StoreMap stores={stores} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <motion.div
            variants={grid}
            initial="hidden"
            animate="show"
            className="mt-4 flex flex-col gap-3 md:col-span-2 md:mt-0"
          >
            {stores.map((store) => (
              <motion.button
                key={store.id}
                variants={cell}
                onClick={() => setSelectedId(store.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedId === store.id
                    ? "border-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{store.name}</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{store.addressLine}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{store.city}, Kenya</p>
                <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">{store.hours}</p>

                <div className="mt-3 flex gap-2">
                  <a
                    href={mapsLink(store)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded-full bg-neutral-900 py-2.5 text-center text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    Get directions
                  </a>
                  <a
                    href={telLink(store.phone)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded-full border border-neutral-200 py-2.5 text-center text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                  >
                    Call {store.phone}
                  </a>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
