import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ApiError } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import type { PlaceSelection } from "../components/AddressAutocomplete";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import { SECURITY_QUESTIONS } from "../data/securityQuestions";
import type { Location, Order } from "../lib/apiTypes";

export function Account() {
  const { user, signOut, updateProfile, uploadAvatar, updateSecurityQuestion } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingSecurity, setEditingSecurity] = useState(false);
  const [securityQuestionDraft, setSecurityQuestionDraft] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswerDraft, setSecurityAnswerDraft] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ locations: Location[] }>("/locations"),
      api.get<{ orders: Order[] }>("/checkout/orders"),
    ])
      .then(([l, o]) => {
        setLocations(l.locations);
        setOrders(o.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddLocation = async (data: {
    label: string;
    addressLine: string;
    city: string;
    isDefault: boolean;
    lat: number | null;
    lng: number | null;
  }) => {
    const res = await api.post<{ location: Location }>("/locations", data);
    setLocations((prev) =>
      res.location.isDefault
        ? [res.location, ...prev.map((l) => ({ ...l, isDefault: false }))]
        : [res.location, ...prev],
    );
    setShowLocationForm(false);
  };

  const handleDeleteLocation = async (id: number) => {
    await api.del(`/locations/${id}`);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/home");
  };

  const handleSaveName = async () => {
    setProfileError(null);
    setSavingName(true);
    try {
      await updateProfile(nameDraft);
      setEditingName(false);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Could not save name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSecurityError(null);
    setSavingSecurity(true);
    try {
      await updateSecurityQuestion(securityQuestionDraft, securityAnswerDraft);
      setEditingSecurity(false);
      setSecurityAnswerDraft("");
    } catch (err) {
      setSecurityError(err instanceof ApiError ? err.message : "Could not save security question.");
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileError(null);
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Could not upload photo.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-8 pt-8 md:max-w-4xl md:px-8 md:pt-28">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">Account</h1>
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-lg font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition hover:opacity-100">
              {uploadingAvatar ? "…" : "Edit"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:text-neutral-100"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-500"
                >
                  {savingName ? "…" : "Save"}
                </button>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {user?.name}
                <button
                  onClick={() => {
                    setNameDraft(user?.name ?? "");
                    setEditingName(true);
                  }}
                  className="text-xs font-medium text-neutral-400 underline dark:text-neutral-500"
                >
                  Edit
                </button>
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
          </div>
        </div>
        {profileError && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{profileError}</p>}

        <section className="mt-6 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Security Question
            </h2>
            {!editingSecurity && (
              <button
                onClick={() => {
                  setSecurityQuestionDraft(user?.securityQuestion ?? SECURITY_QUESTIONS[0]);
                  setSecurityAnswerDraft("");
                  setSecurityError(null);
                  setEditingSecurity(true);
                }}
                className="text-xs font-semibold text-amber-700 dark:text-amber-500"
              >
                {user?.securityQuestion ? "Change" : "Set up"}
              </button>
            )}
          </div>

          {editingSecurity ? (
            <div className="mt-3 flex flex-col gap-2">
              <select
                value={securityQuestionDraft}
                onChange={(e) => setSecurityQuestionDraft(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:text-neutral-100"
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                minLength={2}
                value={securityAnswerDraft}
                onChange={(e) => setSecurityAnswerDraft(e.target.value)}
                placeholder="Answer"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:text-neutral-100"
              />
              {securityError && <p className="text-xs text-rose-600 dark:text-rose-400">{securityError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSecurity}
                  disabled={savingSecurity || securityAnswerDraft.trim().length < 2}
                  className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  {savingSecurity ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditingSecurity(false)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {user?.securityQuestion ?? "Not set up yet — used to reset your password if you forget it."}
            </p>
          )}
        </section>

        <div className="md:grid md:grid-cols-2 md:gap-8">
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Delivery Locations
            </h2>
            <button
              onClick={() => setShowLocationForm((v) => !v)}
              className="text-xs font-semibold text-amber-700 dark:text-amber-500"
            >
              {showLocationForm ? "Cancel" : "+ Add new"}
            </button>
          </div>

          {showLocationForm && (
            <LocationForm onSubmit={handleAddLocation} />
          )}

          <div className="mt-3 flex flex-col gap-2">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-start justify-between rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {loc.label}
                    {loc.isDefault && (
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {loc.addressLine}, {loc.city}, {loc.country}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteLocation(loc.id)}
                  aria-label="Delete location"
                  className="text-xs text-neutral-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            ))}
            {!loading && locations.length === 0 && !showLocationForm && (
              <p className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
                No saved locations yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Order History
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Order #{order.id}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatPrice(order.subtotal)}
                </p>
              </div>
            ))}
            {!loading && orders.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">No orders yet.</p>
            )}
          </div>
        </section>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="mt-8 w-full rounded-full border border-neutral-200 py-3 text-sm font-semibold text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
        >
          Sign Out
        </motion.button>
      </div>
      <BottomNav />
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
    isDefault: boolean;
    lat: number | null;
    lng: number | null;
  }) => void;
}) {
  const [label, setLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
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
    await onSubmit({ label, addressLine, city, isDefault, lat: coords.lat, lng: coords.lng });
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
      <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        Set as default
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-neutral-900 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? "Saving…" : "Save location"}
      </button>
    </form>
  );
}
