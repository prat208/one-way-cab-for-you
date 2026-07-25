/// <reference types="google.maps" />
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __gmapsInit?: () => void;
    __gmapsReady?: Promise<void>;
  }
}


const KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
  | string
  | undefined;
const CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
  | string
  | undefined;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__gmapsReady) return window.__gmapsReady;
  window.__gmapsReady = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) return resolve();
    if (!KEY) return reject(new Error("Google Maps browser key not configured"));
    window.__gmapsInit = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: KEY,
      loading: "async",
      callback: "__gmapsInit",
      libraries: "geometry,places",
      v: "weekly",
    });
    if (CHANNEL) params.set("channel", CHANNEL);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__gmapsReady;
}

type Props = {
  polyline?: string | null;
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  distanceKm?: number | null;
  durationHours?: number | null;
};

export function RouteMap(props: Props) {
  const { polyline, origin, destination, distanceKm, durationHours } = props;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const line = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        if (!mapObj.current) {
          mapObj.current = new google.maps.Map(mapRef.current, {
            center: { lat: 18.5204, lng: 73.8567 }, // Pune
            zoom: 6,
            disableDefaultUI: true,
            zoomControl: true,
            styles: darkStyle,
            backgroundColor: "#0a0f24",
          });
        }
        render();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapObj.current) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polyline, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  function render() {
    if (!mapObj.current || !window.google?.maps) return;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    if (line.current) {
      line.current.setMap(null);
      line.current = null;
    }
    if (!origin || !destination) return;

    markers.current.push(
      new google.maps.Marker({
        position: origin,
        map: mapObj.current,
        label: { text: "A", color: "#0a0f24", fontWeight: "700" },
      }),
      new google.maps.Marker({
        position: destination,
        map: mapObj.current,
        label: { text: "B", color: "#0a0f24", fontWeight: "700" },
      }),
    );

    let path: google.maps.LatLngLiteral[] = [origin, destination];
    if (polyline && google.maps.geometry?.encoding) {
      const decoded = google.maps.geometry.encoding.decodePath(polyline);
      path = decoded.map((p) => ({ lat: p.lat(), lng: p.lng() }));
    }
    line.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#f4c430",
      strokeOpacity: 0.95,
      strokeWeight: 4,
      map: mapObj.current,
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    mapObj.current.fitBounds(bounds, 48);
  }

  const hasRoute = !!(origin && destination);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <div
        ref={mapRef}
        className="h-64 w-full sm:h-72"
        aria-label="Route preview map"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-muted-foreground">
        {hasRoute ? (
          <>
            <span>
              {distanceKm ? `~${Math.round(distanceKm)} km` : "—"} ·{" "}
              {durationHours
                ? `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m drive`
                : "—"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--gold)]">
              Live route
            </span>
          </>
        ) : (
          <span>Enter pickup and destination to preview the route.</span>
        )}
      </div>
    </div>
  );
}

const darkStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f1530" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f1530" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8892b0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2247" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111a3a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a3672" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1029" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1c264b" }] },
];
