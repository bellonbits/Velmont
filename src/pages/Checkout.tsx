import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import type { PlaceSelection } from "../components/AddressAutocomplete";
import { api, ApiError } from "../lib/api";
import { formatPrice } from "../lib/format";
import { brands } from "../data/brands";
import { useProducts } from "../context/ProductsContext";
import { useSEO } from "../lib/seo";
import type { Location, Order } from "../lib/apiTypes";

export function Checkout() {
  const { products } = useProducts();
  const { lines, clear } = useCart();

  useSEO({
    title: "Checkout | Velmont",
    description: "Complete your Velmont order.",
    noindex: true,
  });
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.get<{ locations: Location[] }>("/locations").then((res) => {
      setLocations(res.locations);
      const def = res.locations.find((l) => l.isDefault) ?? res.locations[0];
      if (def) setSelectedLocationId(def.id);
      if (res.locations.length === 0) setShowLocationForm(true);
    });
  }, []);

  const cartLines = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? { line, product } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const subtotal = cartLines.reduce((sum, l) => sum + l.product.price * l.line.quantity, 0);

  const handleAddLocation = async (data: {
    label: string;
    addressLine: string;
    city: string;
    lat: number | null;
    lng: number | null;
  }) => {
    const res = await api.post<{ location: Location }>("/locations", {
      ...data,
      isDefault: true,
    });
    setLocations((prev) => [res.location, ...(prev ?? [])]);
    setSelectedLocationId(res.location.id);
    setShowLocationForm(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedLocationId) {
      setError("Choose a delivery location.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const res = await api.post<{ order: Order }>("/checkout", {
        items: lines,
        locationId: selectedLocationId,
      });
      clear();
      setCompletedOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place order.");
    } finally {
      setPlacing(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckIcon />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Order placed!</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Order #{completedOrder.id} · {formatPrice(completedOrder.subtotal)}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/account"
              className="rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              View order history
            </Link>
            <Link to="/home" className="text-sm font-semibold text-amber-700 underline dark:text-amber-500">
              Continue shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartLines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center dark:bg-neutral-950">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Your cart is empty.</p>
        <Link to="/home" className="text-sm font-semibold text-amber-700 underline dark:text-amber-500">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-8 md:max-w-5xl md:px-8 md:pb-16 md:pt-28">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">Checkout</h1>

        <div className="md:grid md:grid-cols-3 md:gap-10 md:items-start">
          <div className="md:col-span-2">
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Delivery Location
                </h2>
                <button
                  onClick={() => setShowLocationForm((v) => !v)}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-500"
                >
                  {showLocationForm ? "Cancel" : "+ Add new"}
                </button>
              </div>

              {showLocationForm && <LocationForm onSubmit={handleAddLocation} />}

              <div className="mt-3 flex flex-col gap-2">
                {locations?.map((loc) => (
                  <label
                    key={loc.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                      selectedLocationId === loc.id
                        ? "border-neutral-900 dark:border-neutral-100"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="location"
                      checked={selectedLocationId === loc.id}
                      onChange={() => setSelectedLocationId(loc.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{loc.label}</p>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {loc.addressLine}, {loc.city}, {loc.country}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Order Summary
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {cartLines.map(({ line, product }) => {
                  const brand = brands.find((b) => b.id === product.brandId);
                  return (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {brand?.name} {product.name}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">Qty {line.quantity}</p>
                      </div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatPrice(product.price * line.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400 md:hidden">{error}</p>}
          </div>

          <div className="hidden md:col-span-1 md:sticky md:top-28 md:mt-6 md:block md:rounded-2xl md:border md:border-neutral-200 md:p-5 dark:md:border-neutral-800">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Total</p>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{formatPrice(subtotal)}</p>
            {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handlePlaceOrder}
              disabled={placing || !selectedLocationId}
              className="mt-4 w-full rounded-full bg-amber-700 py-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {placing ? "Placing order…" : "Place order"}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-neutral-100 bg-white px-5 py-4 dark:border-neutral-900 dark:bg-neutral-950 md:hidden">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Total</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatPrice(subtotal)}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlaceOrder}
            disabled={placing || !selectedLocationId}
            className="flex-1 rounded-full bg-amber-700 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {placing ? "Placing order…" : "Place order"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function LocationForm({
  onSubmit,
}: {
  onSubmit: (data: {
    label: string;
    addressLine: string;
    city: string;
    lat: number | null;
    lng: number | null;
  }) => void;
}) {
  const [label, setLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const handlePlaceSelected = (place: PlaceSelection) => {
    if (place.city) setCity(place.city);
    setCoords({ lat: place.lat, lng: place.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ label, addressLine, city, lat: coords.lat, lng: coords.lng });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
      <input
        required
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (e.g. Home, Office)"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:text-neutral-100"
      />
      <AddressAutocomplete
        required
        value={addressLine}
        onChange={setAddressLine}
        onPlaceSelected={handlePlaceSelected}
        placeholder="Start typing your street address…"
      />
      <input
        required
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:text-neutral-100"
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-neutral-900 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? "Saving…" : "Save & use this address"}
      </button>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
