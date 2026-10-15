'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // without the stylesheet the tiles render as a scrambled grid

// Loaded only in the browser (next/dynamic with ssr:false in TrackLive.jsx).
// The container has an explicit height in CSS (.delivery-map): Leaflet measures
// its container, and a 0-px-tall div gives a blank map.

// Markers are small inline SVGs (divIcon), not Leaflet's default PNG pins,
// whose image paths break under bundlers. Each marker also gets a permanent
// text label, so it's identified by words and not only by shape or colour.
const courierIcon = L.divIcon({
  className: 'map-pin map-pin-courier',
  html: '<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#b3261e" stroke="#fff" stroke-width="3"/><path d="M10 19h12M12 19l2-6h4l2 6M14 13l1-3h3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
const homeIcon = L.divIcon({
  className: 'map-pin map-pin-home',
  html: '<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true"><path d="M16 39s13-14 13-23a13 13 0 1 0-26 0c0 9 13 23 13 23z" fill="#231a15" stroke="#fff" stroke-width="2"/><path d="M10 17l6-5 6 5v6h-4v-4h-4v4h-4z" fill="#fff"/></svg>',
  iconSize: [32, 40],
  iconAnchor: [16, 39],
});

const toLatLng = (p) => [p.lat, p.lng];

export default function DeliveryMap({ courier, destination, kitchen, final }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const courierRef = useRef(null);
  const firstProps = useRef({ courier, destination, kitchen }); // the map is built once, from the first snapshot

  // Build the map once.
  useEffect(() => {
    const { courier: c, destination: d, kitchen: k } = firstProps.current;
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true });
    // Attribution as plain text on the map (tiny links there are impossible to tap);
    // the tappable link to the OpenStreetMap licence is right under the map (TrackLive).
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // The route, kitchen → door, as a quiet dashed line.
    L.polyline([toLatLng(k), toLatLng(d)], { color: '#5c514a', weight: 2, dashArray: '6 6', opacity: 0.7, interactive: false }).addTo(map);

    L.marker(toLatLng(d), { icon: homeIcon, keyboard: false, title: 'Delivery address' })
      .bindTooltip('Delivery address', { permanent: true, direction: 'top', offset: [0, -40], className: 'map-label' })
      .addTo(map);
    courierRef.current = L.marker(toLatLng(c), { icon: courierIcon, keyboard: false, title: 'Courier', zIndexOffset: 1000 })
      .bindTooltip('Courier', { permanent: true, direction: 'bottom', offset: [0, 16], className: 'map-label' })
      .addTo(map);

    // Fit the view to BOTH markers, with room for the labels.
    map.fitBounds(L.latLngBounds([toLatLng(c), toLatLng(d)]), { padding: [56, 56], maxZoom: 16 });
    mapRef.current = map;

    return () => {
      map.remove(); // unmount: free Leaflet's listeners and DOM
      mapRef.current = null;
      courierRef.current = null;
    };
  }, []);

  // Every new snapshot: move the courier. Re-fit only if it has left the view,
  // so the map doesn't jump around under someone who has panned or zoomed.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !courierRef.current) return;
    courierRef.current.setLatLng(toLatLng(courier));
    if (!map.getBounds().pad(-0.1).contains(toLatLng(courier))) {
      map.fitBounds(L.latLngBounds([toLatLng(courier), toLatLng(destination)]), { padding: [56, 56], maxZoom: 16 });
    }
  }, [courier, destination]);

  return (
    <div
      ref={containerRef}
      className={`delivery-map${final ? ' is-final' : ''}`}
      role="region"
      aria-label="Map of the courier and the delivery address. The same information is in the delivery details."
    />
  );
}
