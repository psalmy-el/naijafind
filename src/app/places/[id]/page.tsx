'use client';

import { places } from '@/data/places';
import { useRouter } from 'next/navigation';
import React, { use } from 'react'; // Import use from react

export default function PlaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Properly unwrap the Promise
  const place = places.find((p) => p.id === id);

  const router = useRouter();

  if (!place) {
    return (
      <div className="min-h-screen pt-20 text-center">
        <p className="text-2xl">Place not found</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 underline">
          Go back
        </button>
      </div>
    );
  }

  const handleDirections = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const destLat = place.location.lat;
          const destLng = place.location.lng;
          // Opens in Google Maps (works perfectly on mobile & desktop)
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`
          );
        },
        () => {
          alert('Location access denied. Opening map to the place directly.');
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`
          );
        }
      );
    } else {
      // Fallback if geolocation not supported
      window.open(`https://www.google.com/maps/search/?api=1&query=${place.name}+Lagos`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 md:h-screen max-h-96 overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover"
        />
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

          {/* Use Map Button */}
          <div className="text-center">
            <button
              onClick={handleDirections}
              className="px-10 py-5 bg-blue-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
            >
              Use Map for Directions from My Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}