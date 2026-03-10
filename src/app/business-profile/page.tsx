'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';

export default function BusinessProfile() {
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSessionAndFetchBusiness = async () => {
      // Check session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      // Fetch business data
      try {
        const res = await fetch('http://localhost:5000/api/my-business', {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to load business');
        }

        const data = await res.json();
        setBusiness(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchBusiness();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!currentSession) {
        router.replace('/login');
      } else {
        setSession(currentSession);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-black pt-32 text-center text-gray-400">
        Loading your business profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-32 text-center text-red-500">{error}</div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-black pt-32 text-center text-white">
        No business registered yet.{' '}
        <Link href="/register-business" className="text-blue-400 underline hover:text-blue-300">
          Register one now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-12 pt-32">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Your Business Profile</h1>

        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header Section with Edit Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 border-b border-gray-800 gap-4">
            <h2 className="text-3xl font-bold">{business.name}</h2>
            <button
              onClick={() => router.push('/edit-business')}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Edit Business
            </button>
          </div>

          {/* Main Image Section */}
          {business.gallery_urls && business.gallery_urls.length > 0 && (
            <div className="relative w-full h-96 overflow-hidden">
              <img
                src={business.gallery_urls[0]}
                alt={`${business.name} main image`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium">Main Image</span>
              </div>
            </div>
          )}

          {/* Business Details */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Category</p>
                  <p className="text-lg font-medium">{business.category}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Short Description</p>
                  <p className="text-lg">{business.short_desc || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Full Description</p>
                  <p className="text-lg">{business.full_desc || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Services</p>
                  <p className="text-lg">{business.services?.join(', ') || 'None listed'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Price Range</p>
                  <p className="text-lg font-semibold text-blue-400">{business.prices || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Address</p>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-lg">{business.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-lg">{business.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Website</p>
                  <p className="text-lg">
                    {business.website ? (
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">
                        {business.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Operating Hours</p>
                  <p className="text-lg">{business.operating_hours || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Social Media</p>
                  <p className="text-lg">{business.social_media || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Package</p>
                  <p className="text-lg">
                    <span className="font-bold text-purple-400">{business.package?.toUpperCase() || 'Free'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <p className="text-lg">
                    {business.approved ? (
                      <span className="text-green-400 font-medium flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Approved
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-medium flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Pending Approval
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

                        {/* Gallery */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Gallery</h2>

              {business.gallery_urls && business.gallery_urls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {business.gallery_urls.map((url, index) => (
                    <div key={index} className="group relative overflow-hidden rounded-xl shadow-md bg-gray-200">
                      <img
                        src={url}
                        alt={`Gallery image ${index + 1} - ${business.name}`}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg'; // Add a fallback in /public
                          console.error('Failed to load gallery image:', url);
                        }}
                        loading="lazy" // Faster page load
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No gallery images uploaded yet.</p>
              )}
            </section>
            
          </div>
        </div>
      </div>
    </div>
  );
}