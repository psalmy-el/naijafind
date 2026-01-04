'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { places } from '@/data/places';
import { useState } from 'react';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Food', 'Hotel', 'Barber', 'Entertainment'];

  const filteredPlaces = selectedCategory === 'All' 
    ? places 
    : places.filter(p => p.category === selectedCategory);

  const featuredPlaces = places.slice(0, 4); // Top picks

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero with Light Overlay – Image Visible! */}
      <section className="relative h-screen bg-cover bg-center flex flex-col justify-end pb-32 text-white"
        style={{ backgroundImage: 'url(https://thumbs.dreamstime.com/b/golden-hour-lagos-nigeria-skyline-victoria-island-golden-hour-lagos-nigeria-skyline-victoria-island-city-landscape-340386341.jpg)' }}>
        {/* Lighter overlay – fixes black dominance */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">NaijaFind</h1>
          <p className="text-2xl md:text-4xl mb-8 drop-shadow-2xl">Discover authentic Lagos essentials – food, hotels, barbers & fun places</p>
          
          {/* Category Filters - Now on the image */}
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-3 rounded-full font-medium transition shadow-2xl ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/90 text-gray-800 hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="max-w-7xl mx-auto px-4 py-8">

        {/* Featured Carousel */}
        <h2 className="text-3xl font-bold mb-6 text-center">Tourist Favorites</h2>
        <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory">
          {featuredPlaces.map((place) => (
            <Link key={place.id} href={`/places/${place.id}`} className="snap-center flex-shrink-0 w-80">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden hover:scale-105 transition-transform">
                <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
                <div className="p-4">
                  <h3 className="text-xl font-bold">{place.name}</h3>
                  <p className="text-gray-600">{place.shortDesc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Grid */}
        <h2 className="text-3xl font-bold mt-12 mb-6 text-center">All Spots in Lagos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlaces.map((place) => (
            <Link key={place.id} href={`/places/${place.id}`} className="block">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold mb-2">{place.name}</h3>
                  <p className="text-gray-600">{place.shortDesc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About NaijaFind */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">About NaijaFind</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            NaijaFind is your trusted guide for discovering reliable services in Lagos and beyond. 
            Built by locals for tourists and visitors – get real cultural tips, verified spots, and easy directions. 
            No more guesswork when you're new in town!
          </p>
        </div>
      </section>
    </div>
  );
}