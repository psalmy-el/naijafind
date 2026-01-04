'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { places } from '@/data/places';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const serviceParam = searchParams.get('service') || '';

  const searchTerm = query || serviceParam || 'All Services';

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(serviceParam || 'All');
  const [openNow, setOpenNow] = useState(false);

  // Expanded + dynamic categories (from data + common Nigerian services)
  const categories = Array.from(new Set([
    'All',
    ...places.map(p => p.category),
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
  ]));

  const locations = Array.from(new Set(places.map(p => p.address)));

  // Relevant services based on selected category
  const relevantServices = useMemo(() => {
    if (selectedCategory === 'All') return Array.from(new Set(places.flatMap(p => p.services)));
    return Array.from(new Set(
      places
        .filter(p => p.category === selectedCategory)
        .flatMap(p => p.services)
    ));
  }, [selectedCategory]);

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const lowerTerm = searchTerm.toLowerCase();
      const matchesSearch = serviceParam
        ? p.category.toLowerCase().includes(lowerTerm) || p.services.some(s => s.toLowerCase().includes(lowerTerm))
        : p.name.toLowerCase().includes(lowerTerm) ||
          p.address.toLowerCase().includes(lowerTerm) ||
          p.services.some(s => s.toLowerCase().includes(lowerTerm)) ||
          p.category.toLowerCase().includes(lowerTerm);

      const matchesLocation = selectedLocation === 'All' || p.address === selectedLocation;
      const matchesServices = selectedServices.length === 0 || selectedServices.some(s => p.services.includes(s));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

      return matchesSearch && matchesLocation && matchesServices && matchesCategory;
    });
  }, [searchTerm, serviceParam, selectedLocation, selectedServices, selectedCategory]);

  return (
    <div className="min-h-screen bg-black pt-32 text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* Filter Sidebar */}
        <aside className="lg:w-80 space-y-8">
          <h2 className="text-3xl font-bold mb-6">Refine Results</h2>

          {/* Category First */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="font-semibold mb-4 text-lg">Category</h3>
            <select 
              className="w-full bg-gray-800 p-3 rounded-lg text-white"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedServices([]); // Reset services when category changes
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Services (updates based on category) */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="font-semibold mb-4 text-lg">Services</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {relevantServices.length === 0 ? (
                <p className="text-gray-500 text-sm">No services in this category yet</p>
              ) : (
                relevantServices.map(s => (
                  <label key={s} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedServices.includes(s)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedServices([...selectedServices, s]);
                        else setSelectedServices(selectedServices.filter(ss => ss !== s));
                      }}
                      className="mr-3" 
                    />
                    <span className="text-sm">{s}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="font-semibold mb-4 text-lg">Price Range</h3>
            <input 
              type="range" 
              min="0" 
              max="100000" 
              step="5000" 
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full" 
            />
            <p className="text-sm mt-3">Up to ₦{priceRange[1].toLocaleString()}</p>
          </div>

          {/* Location */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="font-semibold mb-4 text-lg">Location</h3>
            <select 
              className="w-full bg-gray-800 p-3 rounded-lg text-white"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="All">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Open Now */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                className="mr-3" 
              />
              <span className="font-semibold">Open Now</span>
            </label>
          </div>
        </aside>

        {/* Results – Keep your compact horizontal cards */}
        <section className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Results for <span className="text-blue-400">"{searchTerm}"</span>
          </h1>
          <p className="text-xl mb-12">{filteredPlaces.length} spots found</p>

          {filteredPlaces.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl mb-4">No spots found 😔</p>
              <p className="text-lg">Adjust filters or try a broader search!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredPlaces.map((place) => (
                <Link key={place.id} href={`/places/${place.id}`} className="block group">
                  <div className="bg-white text-black rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row">
                    <div className="relative w-full md:w-64 h-48 overflow-hidden">
                      <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        {place.category}
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition">{place.name}</h3>
                      <p className="text-gray-600 mb-3">{place.shortDesc}</p>
                      <p className="text-xl font-semibold text-blue-600 mb-3">{place.prices}</p>
                      <p className="mb-3"><span className="font-semibold">Services:</span> {place.services.join(' • ')}</p>
                      <p className="mb-3">
                        <span className="font-semibold">Online Booking:</span>{' '}
                        <span className={place.onlineBooking ? 'text-green-600' : 'text-red-600'}>
                          {place.onlineBooking ? 'Available ✓' : 'Walk-in only'}
                        </span>
                      </p>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {place.address}
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
  );
}