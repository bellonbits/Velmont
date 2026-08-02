import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/googleMaps";

export interface PlaceSelection {
  addressLine: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

function parsePlace(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  formattedAddress: string | undefined,
  location: google.maps.LatLng | null | undefined,
): PlaceSelection {
  const list = components ?? [];
  const streetNumber = list.find((c) => c.types.includes("street_number"))?.long_name ?? "";
  const route = list.find((c) => c.types.includes("route"))?.long_name ?? "";
  const city =
    list.find((c) => c.types.includes("locality"))?.long_name ??
    list.find((c) => c.types.includes("administrative_area_level_1"))?.long_name ??
    "";
  const addressLine = [streetNumber, route].filter(Boolean).join(" ") || formattedAddress || "";

  return {
    addressLine,
    city,
    lat: location?.lat() ?? null,
    lng: location?.lng() ?? null,
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceSelection) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Keep latest callbacks in refs so the widget is only ever created once,
  // regardless of how often the parent re-renders with new function identities.
  const onChangeRef = useRef(onChange);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  onChangeRef.current = onChange;
  onPlaceSelectedRef.current = onPlaceSelected;

  useEffect(() => {
    let cancelled = false;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "ke" },
          fields: ["address_components", "formatted_address", "geometry"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete!.getPlace();
          const selection = parsePlace(
            place.address_components,
            place.formatted_address,
            place.geometry?.location,
          );
          onChangeRef.current(selection.addressLine);
          onPlaceSelectedRef.current(selection);
        });

        geocoderRef.current = new google.maps.Geocoder();
        setReady(true);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  const handleUseCurrentLocation = () => {
    setLocateError(null);

    if (!navigator.geolocation) {
      setLocateError("Location isn't available on this device.");
      return;
    }
    if (!geocoderRef.current) {
      setLocateError("Still loading — try again in a moment.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        geocoderRef.current!.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            setLocating(false);
            if (status !== "OK" || !results?.[0]) {
              setLocateError("Couldn't find an address for your location.");
              return;
            }
            const result = results[0];
            const selection = parsePlace(
              result.address_components,
              result.formatted_address,
              result.geometry?.location,
            );
            onChangeRef.current(selection.addressLine);
            onPlaceSelectedRef.current(selection);
          },
        );
      },
      (err) => {
        setLocating(false);
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied — you can still type your address."
            : "Couldn't detect your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Street address"}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={!ready || locating}
          aria-label="Use my current location"
          title="Use my current location"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-40"
        >
          {locating ? <SpinnerIcon /> : <LocateIcon />}
        </button>
      </div>
      {locateError && <p className="mt-1 text-[11px] text-rose-600">{locateError}</p>}
      {failed && (
        <p className="mt-1 text-[11px] text-neutral-400">
          Address search unavailable — you can still type your address manually.
        </p>
      )}
      {!ready && !failed && (
        <p className="mt-1 text-[11px] text-neutral-400">Loading address search…</p>
      )}
    </div>
  );
}

function LocateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M22 12h-3M5 12H2" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth={2} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
