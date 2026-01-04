'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For search navigation
import { places } from '@/data/places';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showServices, setShowServices] = useState(false); // For dropdown
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  // Suggestions list (from places, locations, services – expand as you add data)
  const suggestions = [
    ...places.map(p => p.name), // Names
    ...places.map(p => p.address.split(', ')[0]), // Locations like 'Lekki'
    ...places.flatMap(p => p.services), // Services like 'Dine-in'
    'Food', 'Hotel', 'Barber', 'Tailoring', 'Carpentry', 'Catering', // Categories
  ].filter((value, index, self) => self.indexOf(value) === index); // Unique

  const filteredSuggestions = suggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  // Comprehensive Nigerian services list for dropdown
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
    // Add more as needed – covers daily/tourist needs in Nigeria
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-white drop-shadow-lg">NaijaFind</Link>

        {/* Search Bar with Dropdown Suggestions */}
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
            <div className="absolute w-full mt-2 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
              {filteredSuggestions.map((sug, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                    router.push(`/search?query=${encodeURIComponent(sug)}`);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav with Services Dropdown */}
        <nav className="flex gap-6 text-lg">
          <Link href="/" className="text-white hover:underline drop-shadow">Home</Link>
          <Link href="/about" className="text-white hover:underline drop-shadow">About</Link>
          <div className="relative"
            onMouseEnter={() => setShowServices(true)}
            onMouseLeave={() => setShowServices(false)}
          >
            <button className="text-white hover:underline drop-shadow">Services</button>
            {showServices && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
                {servicesList.map((service, index) => (
                  <Link
                    key={index}
                    href={service.link}
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/filter" className="text-white hover:underline drop-shadow">Filter</Link>
          <Link href="/contact" className="text-white hover:underline drop-shadow">Contact</Link>
        </nav>
      </div>
    </header>
  );
}