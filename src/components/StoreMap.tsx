import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/googleMaps";
import { useTheme } from "../context/ThemeContext";
import type { Store } from "../data/stores";

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#333333" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
];

export function StoreMap({
  stores,
  selectedId,
  onSelect,
}: {
  stores: Store[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const bounds = new google.maps.LatLngBounds();
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: stores[0].lat, lng: stores[0].lng },
          zoom: 6,
          disableDefaultUI: true,
          zoomControl: true,
          styles: theme === "dark" ? DARK_MAP_STYLE : undefined,
        });
        mapObjRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        stores.forEach((store) => {
          const position = { lat: store.lat, lng: store.lng };
          const marker = new google.maps.Marker({
            position,
            map,
            title: store.name,
          });
          marker.addListener("click", () => {
            infoWindowRef.current?.setContent(
              `<div style="font-size:13px;font-weight:600;">${store.name}</div>`,
            );
            infoWindowRef.current?.open(map, marker);
            onSelect(store.id);
          });
          markersRef.current.set(store.id, marker);
          bounds.extend(position);
        });

        if (stores.length === 1) {
          map.setCenter({ lat: stores[0].lat, lng: stores[0].lng });
          map.setZoom(15);
        } else {
          map.fitBounds(bounds, 60);
        }
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, onSelect]);

  useEffect(() => {
    mapObjRef.current?.setOptions({ styles: theme === "dark" ? DARK_MAP_STYLE : undefined });
  }, [theme]);

  useEffect(() => {
    const map = mapObjRef.current;
    const marker = selectedId ? markersRef.current.get(selectedId) : null;
    if (map && marker) {
      map.panTo(marker.getPosition()!);
    }
  }, [selectedId]);

  if (failed) {
    return (
      <div className="flex h-48 md:h-96 items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
        Map unavailable
      </div>
    );
  }

  return <div ref={mapRef} className="h-48 md:h-96 w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800" />;
}
