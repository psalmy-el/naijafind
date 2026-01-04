'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { places } from '@/data/places';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const suggestions = Array.from(new Set([
    ...places.map(p => p.name),
    ...places.map(p => p.address),
    ...places.flatMap(p => p.services),
    ...places.map(p => p.category),
  ]));

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const servicesList = [
    { name: 'Food & Restaurants', link: '/search?service=Food' },
    { name: 'Hotels & Accommodation', link: '/search?service=Hotel' },
    { name: 'Barbers & Hair Stylists', link: '/search?service=Barber' },
    { name: 'Tailoring & Fashion Design', link: '/search?service=Tailoring' },
    { name: 'Carpentry & Furniture', link: '/search?service=Carpentry' },
    { name: 'Catering Services', link: '/search?service=Catering' },
    { name: 'Beauty Salons & Spas', link: '/search?service=Beauty' },
    { name: 'Parks & Recreation', link: '/search?service=Parks' },
    { name: 'Schools & Education', link: '/search?service=Schools' },
    { name: 'Churches & Religious Centers', link: '/search?service=Churches' },
    { name: 'Event Halls & Venues', link: '/search?service=Event Halls' },
    { name: 'Medical & Healthcare', link: '/search?service=Medical' },
    { name: 'Transportation & Logistics', link: '/search?service=Transportation' },
    { name: 'Laundry & Dry Cleaning', link: '/search?service=Laundry' },
    { name: 'Plumbing & Electrical', link: '/search?service=Plumbing' },
    { name: 'Car Repair & Mechanics', link: '/search?service=Car Repair' },
    { name: 'Phone & Electronics Repair', link: '/search?service=Phone Repair' },
    { name: 'Banking & Financial Services', link: '/search?service=Banking' },
    { name: 'Legal & Consulting', link: '/search?service=Legal' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-white drop-shadow-lg">
          NaijaFind
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by name, location, service..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(searchQuery.length > 0)}
              className="w-full px-6 py-3 rounded-full bg-white text-gray-800 focus:outline-none shadow-lg"
            />
          </form>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute w-full mt-2 bg-white rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 border border-gray-200">
              {filteredSuggestions.map((sug, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                    router.push(`/search?query=${encodeURIComponent(sug)}`);
                  }}
                  className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-black text-lg border-b border-gray-100 last:border-0"
                >
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav with Auth */}
        <nav className="flex gap-6 text-lg items-center">
          <Link href="/" className="text-white hover:underline drop-shadow">Home</Link>
          <Link href="/about" className="text-white hover:underline drop-shadow">About</Link>

          {/* Services Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowServices(!showServices)}
              className="text-white hover:underline drop-shadow"
            >
              Services
            </button>
            {showServices && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                {servicesList.map((service, i) => (
                  <Link
                    key={i}
                    href={service.link}
                    onClick={() => setShowServices(false)}
                    className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/contact" className="text-white hover:underline drop-shadow">Contact</Link>

          {/* Auth Section */}
          {typeof window !== 'undefined' && localStorage.getItem('token') ? (
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/');
              }}
              className="text-white hover:underline drop-shadow"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="text-white hover:underline drop-shadow">Login</Link>
              <Link href="/signup" className="text-white hover:underline drop-shadow">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}