'use client';

import Header from '@/components/Header';
import { places } from '@/data/places';
import { use } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';

// Your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FtbXkwMTAiLCJhIjoiY21qeW93NnFzNXdhcDNncXhhaDc2bnBnaiJ9.8WCyIGn5poxEjWkSQ2HEPg';

export default function PlaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const place = places.find((p) => p.id === id);
  if (!place) return <p className="text-center pt-20 text-2xl">Place not found</p>;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDirections = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          setUserLocation([lng, lat]);
          setShowMap(true);
          setLoading(false);
        },
        () => {
          alert('Location access denied. Map centered on the place.');
          setShowMap(true);
          setLoading(false);
        }
      );
    } else {
      setShowMap(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showMap || !mapContainer.current) return;

    if (map.current) map.current.remove();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userLocation || [place.location.lng, place.location.lat],
      zoom: userLocation ? 13 : 15,
    });

    // User's location marker
    if (userLocation) {
      new mapboxgl.Marker({ color: '#00ff00' })
        .setLngLat(userLocation)
        .setPopup(new mapboxgl.Popup().setHTML('<h3 class="font-bold">You are here</h3>'))
        .addTo(map.current!);
    }

    // Place marker
    new mapboxgl.Marker({ color: '#0000ff' })
      .setLngLat([place.location.lng, place.location.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<h3 class="font-bold">${place.name}</h3>`))
      .addTo(map.current!);

    // Draw route if user location available
    if (userLocation) {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${place.location.lng},${place.location.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const route = data.routes[0].geometry;
          map.current!.addSource('route', {
            type: 'geojson',
            data: route
          });
          map.current!.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#3887be', 'line-width': 6 }
          });
        });
    }

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, [showMap, userLocation, place]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="relative h-96 md:h-screen max-h-96 overflow-hidden">
        <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow-2xl">{place.name}</h1>
          <p className="text-xl mt-2 drop-shadow-lg">{place.shortDesc}</p>
        </div>
      </div>

       {/* Details Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4">About</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{place.fullDesc}</p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-2xl font-bold mb-4">Services</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {place.services.map((service) => (
                  <li key={service} className="text-lg">{service}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Pricing</h2>
              <p className="text-2xl font-semibold text-blue-600">{place.prices}</p>

              <h2 className="text-2xl font-bold mt-8 mb-4">Online Booking/Order</h2>
              <p className={`text-xl font-medium ${place.onlineBooking ? 'text-green-600' : 'text-red-600'}`}>
                {place.onlineBooking ? 'Available ✓' : 'Not available (walk-in only)'}
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">Address</h2>
              <p className="text-lg text-gray-700">{place.address}</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4">Cultural Tips for Visitors</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-lg text-gray-800">
                • English is widely spoken here.<br/>
                • Mobile money (OPay, Palmpay) and cards accepted.<br/>
                • Bargaining is common for some services – start at 60% of quoted price.<br/>
                • Best time to visit: weekdays before 6pm to avoid traffic.
              </p>
            </div>
          </section>

          {/* Gallery Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {place.gallery.map((img, index) => (
                <div key={index} className="group relative overflow-hidden rounded-xl shadow-md">
                  <img
                    src={img}
                    alt={`Gallery ${index + 1} - ${place.name}`}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                </div>
              ))}
            </div>
          </section>

          {/* Directions Button + Embedded Map */}
          <div className="mt-12 text-center">
            <button
              onClick={loadDirections}
              disabled={loading}
              className="px-10 py-5 bg-blue-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Loading map...' : 'Show Map & Directions'}
            </button>
          </div>

          {showMap && (
            <div className="mt-8 rounded-xl overflow-hidden shadow-2xl">
              <div ref={mapContainer} className="w-full h-96 md:h-screen max-h-96" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}