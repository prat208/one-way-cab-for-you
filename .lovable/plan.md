## Goal
Let customers book from/to **any location** (not just a few dropdown cities) and **see the route on a map** as they type, so it's obvious the trip is understood correctly.

## Setup — Google Maps Platform connector
Link the **Google Maps Platform (Managed by Lovable)** connector once. It gives us:
- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` — for the in-page map and place autocomplete.
- `GOOGLE_MAPS_API_KEY` + `LOVABLE_API_KEY` — for server-side geocoding and driving-distance via the gateway.

No user-supplied API key needed.

## Changes

### 1. Free-text pickup & drop with place autocomplete (`BookingWizard.tsx`, step "Route")
- Replace the two `<select>` dropdowns with `<input type="text">` bound to `pickup` / `drop`.
- Attach Google **Places API (New)** `AutocompleteSuggestion.fetchAutocompleteSuggestions()` (loaded lazily via `google.maps.importLibrary('places')` using the browser key) so users get real place suggestions for any town/village/landmark in India, but can also just type freely.
- Keep the current `MapPin` icon and styling.

### 2. Live route map (`src/components/booking/RouteMap.tsx`, new)
- Lazy-loaded, `<ClientOnly>`-wrapped component sitting right under the Route step (and visible in the summary).
- Loads Maps JS via `https://maps.googleapis.com/maps/api/js?key=…&loading=async&callback=…&channel=…` using the browser key (per Google Maps knowledge; no `mapId`, uses `google.maps.Marker`).
- Shows two markers (pickup, drop) and draws the driving route as a `Polyline` using the encoded polyline returned from the server (see §3).
- Auto-fits bounds; shows "Enter pickup and drop to preview the route" placeholder when either field is empty.

### 3. Server-side route + fare (`src/lib/booking.functions.ts`, `estimateFare`)
Current behaviour silently falls back to a hard-coded 200 km when the pair isn't in the `routes` table — that's why arbitrary locations feel broken.

New behaviour for the one-way / round-trip branch:
1. First look up `(pickup_city, drop_city)` in the `routes` table (fixed pricing preserved).
2. Otherwise call **Google Maps Routes API** via the connector gateway
   (`POST /routes/directions/v2:computeRoutes` with a `X-Goog-FieldMask` of
   `routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline`).
3. Use the returned meters/seconds for `distance` / `duration` (× 2 for round-trip) and reuse the existing per-vehicle fare formula.
4. Return the encoded polyline + pickup/drop lat-lng so the map can draw the exact route.
5. On gateway failure, surface a clear error instead of the silent 200 km default. Handle 403 `PERMISSION_DENIED` per the Google Maps knowledge (referrer / service restrictions).

### 4. Small UX polish
- Show computed distance & drive time under the map ("~312 km · 5 h 40 m driving").
- `canProceed` for step 1 stays: both fields non-empty and different.
- Errors from the estimator surface in the existing `error` banner.

## Out of scope
- No DB schema changes.
- `/rates` page unchanged (it already accepts any location via OSM).
- Admin, notifications, and coupon flows unchanged.

## Technical notes
- Use `google_maps` connector; call `standard_connectors--connect` before wiring code.
- Places API (New) autocomplete only — no legacy `google.maps.places.Autocomplete`.
- Never call Google APIs directly from the browser except for the Maps JS API + Places browser surfaces; server-side geocoding/routes go through `https://connector-gateway.lovable.dev/google_maps/…`.
- Read `LOVABLE_API_KEY` / `GOOGLE_MAPS_API_KEY` inside the `.handler()` body, not at module scope.
