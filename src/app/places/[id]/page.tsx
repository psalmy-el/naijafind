'use client';
import Header from '@/components/Header';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState, use } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Place {
  id: string;
  name: string;
  category: string;
  short_desc: string;
  full_desc: string;
  image_url: string;
  gallery_urls: string[];
  services: string[];
  prices: string;
  online_booking: boolean;
  address: string;
  phone: string;
  website: string;
  location: { lat: number; lng: number };
}

export default function PlaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const res = await fetch(`${API_URL}/api/places/${id}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setPlace(data);
      } catch (err) {
        console.error('Failed to fetch place:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPlace();
  }, [id]);

  const loadDirections = () => {
    setMapLoading(true);
    setErrorMsg(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          setShowMap(true);
          setMapLoading(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setErrorMsg('Could not get your location. Showing place only.');
          setShowMap(true);
          setMapLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setErrorMsg('Geolocation not supported by your browser.');
      setShowMap(true);
      setMapLoading(false);
    }
  };

  useEffect(() => {
    if (!showMap || !mapContainer.current || map.current || !place) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userLocation || [place.location.lng, place.location.lat],
      zoom: userLocation ? 13 : 15,
    });

    return () => {
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, [showMap, userLocation, place]);

  useEffect(() => {
    if (!map.current || !showMap || !place) return;
    const mapInstance = map.current;

    mapInstance.on('load', () => {
      new mapboxgl.Marker({ color: '#0000ff' })
        .setLngLat([place.location.lng, place.location.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3 class="font-bold">${place.name}</h3>`))
        .addTo(mapInstance);

      if (userLocation) {
        new mapboxgl.Marker({ color: '#00ff00' })
          .setLngLat(userLocation)
          .setPopup(new mapboxgl.Popup().setHTML('<h3 class="font-bold">You are here</h3>'))
          .addTo(mapInstance);

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${place.location.lng},${place.location.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        fetch(url).then(r => r.json()).then(data => {
          if (data.routes?.length > 0) {
            mapInstance.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: data.routes[0].geometry } });
            mapInstance.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#3887be', 'line-width': 5 } });
          }
        }).catch(err => console.error('Directions error:', err));
      }
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });
  }, [showMap, userLocation, place]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-32 space-y-4 animate-pulse">
        <div className="h-52 sm:h-72 bg-gray-200 rounded-xl" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );

  if (notFound || !place) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Header />
      <p className="text-lg text-red-600 pt-20">Place not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative h-52 sm:h-80 md:h-[55vh] overflow-hidden">
        <img src={place.image_url || '/placeholder.jpg'} alt={place.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 text-white pr-4">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold drop-shadow-2xl leading-tight">{place.name}</h1>
          <p className="text-sm sm:text-lg mt-1 sm:mt-2 drop-shadow-lg line-clamp-2">{place.short_desc}</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10 -mt-6 sm:-mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 md:p-12">

          {/* About */}
          <section className="mb-7 sm:mb-10">
            <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4">About</h2>
            <p className="text-sm sm:text-lg text-gray-700 leading-relaxed">{place.full_desc}</p>
          </section>

          {/* Services & Info */}
          <section className="grid sm:grid-cols-2 gap-5 sm:gap-8 mb-7 sm:mb-10">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Services</h2>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-gray-700">
                {place.services?.map((service) => (
                  <li key={service} className="text-sm sm:text-lg">{service}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Pricing</h2>
              <p className="text-lg sm:text-2xl font-semibold text-blue-600">{place.prices}</p>

              <h2 className="text-lg sm:text-2xl font-bold mt-5 sm:mt-8 mb-2 sm:mb-4">Online Booking</h2>
              <p className={`text-base sm:text-xl font-medium ${place.online_booking ? 'text-green-600' : 'text-red-600'}`}>
                {place.online_booking ? 'Available ✓' : 'Not available (walk-in only)'}
              </p>

              <h2 className="text-lg sm:text-2xl font-bold mt-5 sm:mt-8 mb-2 sm:mb-4">Address</h2>
              <p className="text-sm sm:text-lg text-gray-700">{place.address}</p>

              {place.phone && (
                <>
                  <h2 className="text-lg sm:text-2xl font-bold mt-5 sm:mt-8 mb-2 sm:mb-4">Phone</h2>
                  <a href={`tel:${place.phone}`} className="text-sm sm:text-lg text-blue-600 hover:underline">{place.phone}</a>
                </>
              )}

              {place.website && (
                <>
                  <h2 className="text-lg sm:text-2xl font-bold mt-5 sm:mt-8 mb-2 sm:mb-4">Website</h2>
                  <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm sm:text-lg text-blue-600 hover:underline">{place.website}</a>
                </>
              )}
            </div>
          </section>

          {/* Cultural Tips */}
          <section className="mb-7 sm:mb-10">
            <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">Cultural Tips for Visitors</h2>
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg space-y-1">
              {[
                'English is widely spoken here.',
                'Mobile money (OPay, Palmpay) and cards accepted.',
                'Bargaining is common for some services – start at 60% of quoted price.',
                'Best time to visit: weekdays before 6pm to avoid traffic.',
              ].map((tip, i) => (
                <p key={i} className="text-xs sm:text-base text-gray-800 flex gap-2">
                  <span>•</span><span>{tip}</span>
                </p>
              ))}
            </div>
          </section>

          {/* Gallery */}
          {place.gallery_urls?.length > 0 && (
            <section className="mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-6">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {place.gallery_urls.map((img, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-lg shadow-md">
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-24 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Map */}
          <div className="text-center">
            <button
              onClick={loadDirections}
              disabled={mapLoading}
              className="px-6 sm:px-10 py-3 sm:py-5 bg-blue-600 text-white text-base sm:text-xl font-bold rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105 disabled:opacity-50"
            >
              {mapLoading ? 'Loading map...' : 'Show Map & Directions'}
            </button>
            {errorMsg && <p className="mt-3 text-red-600 text-sm font-medium">{errorMsg}</p>}
          </div>

          {showMap && (
            <div className="mt-6 sm:mt-8 rounded-xl overflow-hidden shadow-xl border border-gray-200">
              <div ref={mapContainer} className="w-full h-64 sm:h-96 md:h-[500px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}