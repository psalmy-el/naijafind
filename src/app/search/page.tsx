'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { places } from '@/data/places';
import { useSearchParams } from 'next/navigation';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query')?.toLowerCase() || '';
  const service = searchParams.get('service')?.toLowerCase() || '';

  const filteredPlaces = places.filter(p => {
    if (service) return p.category.toLowerCase() === service || p.services.some(s => s.toLowerCase() === service);
    return p.name.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query) ||
      p.services.some(s => s.toLowerCase().includes(query)) ||
      p.category.toLowerCase().includes(query) ||
      p.fullDesc.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen pt-32 bg-gray-100">
      <Header />
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Search Results for "{query || service}"</h1>
        {filteredPlaces.length === 0 ? (
          <p className="text-xl text-gray-600">No results found. Try another search!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaces.map((place) => (
              <Link key={place.id} href={`/places/${place.id}`} className="block">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all">
                  <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold mb-2">{place.name}</h3>
                    <p className="text-gray-600">{place.shortDesc}</p>
                    <p className="text-sm text-gray-500 mt-2">{place.category} - {place.address}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}