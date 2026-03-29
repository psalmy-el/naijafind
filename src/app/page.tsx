'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Food', 'Hotel', 'Barber', 'Entertainment', 'Beauty', 'Medical', 'Education'];

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

  const filteredPlaces = selectedCategory === 'All'
    ? places
    : places.filter(p => p.category === selectedCategory);

  const featuredPlaces = places.slice(0, 4);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section
        className="relative h-[60vh] sm:h-[80vh] md:min-h-screen bg-cover bg-center flex flex-col justify-end pb-10 sm:pb-20 text-white"
        style={{ backgroundImage: 'url(https://thumbs.dreamstime.com/b/golden-hour-lagos-nigeria-skyline-victoria-island-golden-hour-lagos-nigeria-skyline-victoria-island-city-landscape-340386341.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-2 sm:mb-4 drop-shadow-2xl leading-tight">NaijaFind</h1>
          <p className="text-sm sm:text-xl md:text-3xl mb-6 sm:mb-8 drop-shadow-xl leading-snug px-2">
            Discover authentic Lagos essentials – food, hotels, barbers & fun places
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition shadow-xl ${
                  selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-800 hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Tourist Favorites */}
        <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Tourist Favorites</h2>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex-shrink-0 w-56 sm:w-72 bg-gray-200 rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-5 pb-3 snap-x snap-mandatory">
            {featuredPlaces.map((place) => (
              <Link key={place.id} href={`/places/${place.id}`} className="snap-center flex-shrink-0 w-56 sm:w-72">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition-transform">
                  <img src={place.image_url || '/placeholder.jpg'} alt={place.name} className="w-full h-36 sm:h-48 object-cover" />
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-bold leading-tight">{place.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">{place.short_desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All Spots */}
        <h2 className="text-xl sm:text-3xl font-bold mt-8 sm:mt-12 mb-4 sm:mb-6 text-center">All Spots in Lagos</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-gray-200 rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No places found in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredPlaces.map((place) => (
              <Link key={place.id} href={`/places/${place.id}`} className="block">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <img src={place.image_url || '/placeholder.jpg'} alt={place.name} className="w-full h-32 sm:h-48 object-cover" />
                  <div className="p-3 sm:p-5">
                    <h3 className="text-sm sm:text-xl font-semibold leading-tight mb-1">{place.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2">{place.short_desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section className="bg-gray-100 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">About NaijaFind</h2>
          <p className="text-sm sm:text-lg text-gray-700 leading-relaxed">
            NaijaFind is your trusted guide for discovering reliable services in Lagos and beyond.
            Built by locals for tourists and visitors – get real cultural tips, verified spots, and easy directions.
            No more guesswork when you're new in town!
          </p>
        </div>
      </section>
    </div>
  );
}