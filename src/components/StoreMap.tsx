import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/googleMaps";
import type { Store } from "../data/stores";

export function StoreMap({
  stores,
  selectedId,
  onSelect,
}: {
  stores: Store[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
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
  }, [stores, onSelect]);

  useEffect(() => {
    const map = mapObjRef.current;
    const marker = selectedId ? markersRef.current.get(selectedId) : null;
    if (map && marker) {
      map.panTo(marker.getPosition()!);
    }
  }, [selectedId]);

  if (failed) {
    return (
      <div className="flex h-48 md:h-96 items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
        Map unavailable
      </div>
    );
  }

  return <div ref={mapRef} className="h-48 md:h-96 w-full overflow-hidden rounded-2xl bg-neutral-100" />;
}
