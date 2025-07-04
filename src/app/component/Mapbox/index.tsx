'use client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import SearchableDropdown from '../SearchableDropdown';
import { ArrowPathIcon } from '@heroicons/react/20/solid';

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VuZXJhbGtodW4iLCJhIjoiY2t0bGl5NXduMXdmaTJ2bXA3NXgyMXR4aiJ9.dBaNof7U4QoJImXeDk1QXg';

export default function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);



  const handleAddCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        // Move the map
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });

        // Add or update marker
        if (marker) {
          marker.setLngLat([lng, lat]);
        } else {
          const newMarker = new mapboxgl.Marker({ color: 'red' })
            .setLngLat([lng, lat])
            .addTo(mapRef.current!);
          setMarker(newMarker);
        }
      },
      (error) => {
        alert('Error getting location: ' + error.message);
      }
    );
  },[]);
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [100.523186, 13.736717], // Bangkok, Thailand
      zoom: 10,
    });

    mapRef.current = map;
    handleAddCurrentLocation()
    return () => map.remove();
  }, [handleAddCurrentLocation]);
  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainerRef} className="w-full h-full" />

    <div className="absolute top-4 left-4 flex gap-2 items-center">
    {/* Dropdown for selecting a location */}
<button
  onClick={handleAddCurrentLocation}
  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded shadow-md"
>
  <ArrowPathIcon className="w-5 h-5" />
  Refresh Current Location
</button>
        {/* <select className="border px-3 py-2 rounded w-[400px] bg-white" onChange={(e) => console.log(e.target.value)}>
            <option value="">Select a location</option>
            {MockupLocation.map((store) => {
                return (
                    <option key={store.id} value={store.id}>
                        {store.name}
                    </option>
                )
            })}
        </select> */}
        <SearchableDropdown/>
    </div>
    </div>
  );
}
