'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Place {
  id: string;
  name: string;
  category: string;
  short_desc: string;
  image_url: string;
  prices: string;
  address: string;
  services: string[];
  online_booking: boolean;
}

const CATEGORIES = [
  'Food & Restaurants',
    'Hotels & Accommodation',
    'Barbers & Hair Stylists',
    'Tailoring & Fashion',
    'Carpentry & Furniture',
    'Catering',
    'Beauty & Spa',
    'Medical & Healthcare',
    'Transportation',
    'Event Halls',
    'Schools & Education',
    'Churches',
    'Laundry & Cleaning',
    'Plumbing & Electrical',
    'Car Repair',
    'Phone & Electronics Repair',
    'Parks & Entertainment',
    'Legal Services',
];

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const serviceParam = searchParams.get('service') || '';
  const searchTerm = query || serviceParam || 'All Services';

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(serviceParam || 'All');
  const [openNow, setOpenNow] = useState(false);

  // Fetch all places from API
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await fetch(`${API_URL}/api/places`);
        const data = await res.json();
        setPlaces(data);
      } catch (err) {
        console.error('Failed to fetch places:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  // Reset category when serviceParam changes
  useEffect(() => {
    if (serviceParam) setSelectedCategory(serviceParam);
  }, [serviceParam]);

  const locations = useMemo(() => Array.from(new Set(places.map(p => p.address))), [places]);

  const relevantServices = useMemo(() => {
    if (selectedCategory === 'All') return Array.from(new Set(places.flatMap(p => p.services)));
    return Array.from(new Set(places.filter(p => p.category === selectedCategory).flatMap(p => p.services)));
  }, [selectedCategory, places]);

 const filteredPlaces = useMemo(() => {
  return places.filter((p) => {
    const lowerTerm = searchTerm === 'All Services' ? '' : searchTerm.toLowerCase();

    const matchesSearch =
        !lowerTerm ||
        p.name.toLowerCase().includes(lowerTerm) ||
        p.address.toLowerCase().includes(lowerTerm) ||
        p.short_desc?.toLowerCase().includes(lowerTerm) ||
        p.category.toLowerCase().includes(lowerTerm) ||
        p.services.some(s => s.toLowerCase().includes(lowerTerm)) ||
        p.prices?.toLowerCase().includes(lowerTerm);

      const matchesLocation =
        selectedLocation === 'All' || p.address === selectedLocation;

      const matchesServices =
        selectedServices.length === 0 ||
        selectedServices.some(s => p.services.includes(s));

      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      return matchesSearch && matchesLocation && matchesServices && matchesCategory;
    });
  }, [places, searchTerm, selectedLocation, selectedServices, selectedCategory]);

  const FilterSidebar = () => (
    <aside className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Refine Results</h2>

      <div className="bg-gray-900 p-4 sm:p-5 rounded-xl">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Category</h3>
        <select
          className="w-full bg-gray-800 p-2.5 rounded-lg text-white text-sm"
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setSelectedServices([]); }}
        >
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 p-4 sm:p-5 rounded-xl">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Services</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {relevantServices.length === 0 ? (
            <p className="text-gray-500 text-xs">No services in this category yet</p>
          ) : (
            relevantServices.map(s => (
              <label key={s} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(s)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedServices([...selectedServices, s]);
                    else setSelectedServices(selectedServices.filter(ss => ss !== s));
                  }}
                  className="mr-2.5"
                />
                <span className="text-xs sm:text-sm">{s}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-4 sm:p-5 rounded-xl">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Price Range</h3>
        <input type="range" min="0" max="100000" step="5000"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full"
        />
        <p className="text-xs sm:text-sm mt-2">Up to ₦{priceRange[1].toLocaleString()}</p>
      </div>

      <div className="bg-gray-900 p-4 sm:p-5 rounded-xl">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Location</h3>
        <select
          className="w-full bg-gray-800 p-2.5 rounded-lg text-white text-sm"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="All">All Locations</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 p-4 sm:p-5 rounded-xl">
        <label className="flex items-center cursor-pointer gap-2.5">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
          <span className="font-semibold text-sm sm:text-base">Open Now</span>
        </label>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-black pt-20 sm:pt-28 text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
            </svg>
            {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-10">

          <div className={`lg:w-72 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar />
          </div>

          <section className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 leading-tight">
              Results for <span className="text-blue-400">"{searchTerm}"</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
              {loading ? 'Loading...' : `${filteredPlaces.length} spot${filteredPlaces.length !== 1 ? 's' : ''} found`}
            </p>

            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-gray-800 rounded-xl h-36 animate-pulse" />
                ))}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-2xl sm:text-3xl mb-3">No spots found 😔</p>
                <p className="text-sm sm:text-base text-gray-400">Adjust filters or try a broader search!</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredPlaces.map((place) => (
                  <Link key={place.id} href={`/places/${place.id}`} className="block group">
                    <div className="bg-white text-black rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-44 md:w-56 h-40 sm:h-auto overflow-hidden flex-shrink-0">
                        <img
                          src={place.image_url || '/placeholder.jpg'}
                          alt={place.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {place.category}
                        </div>
                      </div>
                      <div className="flex-1 p-3 sm:p-5 min-w-0">
                        <h3 className="text-base sm:text-xl font-bold mb-1 group-hover:text-blue-600 transition leading-tight">
                          {place.name}
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-2">{place.short_desc}</p>
                        <p className="text-base sm:text-lg font-semibold text-blue-600 mb-2">{place.prices}</p>
                        <p className="text-xs sm:text-sm mb-2 line-clamp-1">
                          <span className="font-semibold">Services:</span> {place.services?.join(' • ')}
                        </p>
                        <p className="text-xs sm:text-sm mb-2">
                          <span className="font-semibold">Booking:</span>{' '}
                          <span className={place.online_booking ? 'text-green-600' : 'text-red-600'}>
                            {place.online_booking ? 'Available ✓' : 'Walk-in only'}
                          </span>
                        </p>
                        <div className="flex items-center text-gray-500 text-xs sm:text-sm">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="line-clamp-1">{place.address}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}