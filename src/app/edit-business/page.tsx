'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function EditBusiness() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    shortDesc: '',
    fullDesc: '',
    services: '',
    prices: '',
    onlineBooking: false,
    address: '',
    phone: '',
    website: '',
    operatingHours: '',
    socialMedia: ''
  });
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [existingMainImage, setExistingMainImage] = useState('');
  const [existingGallery, setExistingGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        // Check session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          router.replace('/login');
          return;
        }

        setSession(currentSession);

        // Fetch business data
        const res = await fetch('http://localhost:5000/api/my-business', {
          headers: { 
            Authorization: `Bearer ${currentSession.access_token}` 
          },
        });

        console.log('API Response Status:', res.status);
        
        if (!res.ok) {
          const errData = await res.json();
          console.error('API Error Response:', errData);
          throw new Error(errData.message || `Failed to load business (Status: ${res.status})`);
        }

        const data = await res.json();
        console.log('Business data loaded:', data);
        
        // Pre-fill form with existing data
        setFormData({
          name: data.name || '',
          category: data.category || '',
          shortDesc: data.short_desc || '',
          fullDesc: data.full_desc || '',
          services: data.services?.join(', ') || '',
          prices: data.prices || '',
          onlineBooking: data.online_booking || false,
          address: data.address || '',
          phone: data.phone || '',
          website: data.website || '',
          operatingHours: data.operating_hours || '',
          socialMedia: data.social_media || '',
        });

        // Set existing images
        setExistingMainImage(data.image_url || '');
        setExistingGallery(data.gallery_urls || []);
      } catch (err) {
        console.error('Error fetching business:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!currentSession) {
        router.replace('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!session) {
        throw new Error('No session found');
      }

      // Create FormData for file uploads
      const form = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });

      // Add main image if new one selected
      if (mainImage) {
        form.append('mainImage', mainImage);
      }

      // Add gallery images if new ones selected
      if (galleryImages.length > 0) {
        galleryImages.forEach((file) => {
          form.append('gallery', file);
        });
      }

      const res = await fetch('http://localhost:5000/api/update-business', {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${session.access_token}` 
        },
        body: form, // Send as FormData instead of JSON
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Update failed');
      }

      alert('Business updated successfully!');
      router.push('/business-profile');
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-32 text-center">
        <Header />
        <p className="text-xl">Loading business data...</p>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-32">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Business</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/business-profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-32">
      <Header />
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Edit Your Business</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-blue-950 p-8 rounded-xl shadow-xl space-y-6">
          
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Business Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Business Name"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select Category</option>
              <option value="Food">Food & Restaurants</option>
              <option value="Hotel">Hotels & Accommodation</option>
              <option value="Barber">Barbers & Hair Stylists</option>
              <option value="Tailoring">Tailoring & Fashion Design</option>
              <option value="Carpentry">Carpentry & Furniture</option>
              <option value="Catering">Catering Services</option>
              <option value="Beauty">Beauty Salons & Spas</option>
              <option value="Parks">Parks & Recreation</option>
              <option value="Schools">Schools & Education</option>
              <option value="Churches">Churches & Religious Centers</option>
              <option value="Event Halls">Event Halls & Venues</option>
              <option value="Medical">Medical & Healthcare</option>
              <option value="Transportation">Transportation & Logistics</option>
              <option value="Laundry">Laundry & Dry Cleaning</option>
              <option value="Plumbing">Plumbing & Electrical</option>
              <option value="Car Repair">Car Repair & Mechanics</option>
              <option value="Phone Repair">Phone & Electronics Repair</option>
              <option value="Banking">Banking & Financial Services</option>
              <option value="Legal">Legal & Consulting</option>
            </select>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Short Description</label>
            <input
              type="text"
              name="shortDesc"
              value={formData.shortDesc}
              onChange={handleChange}
              placeholder="Brief description (e.g., 'Best pizza in Lagos')"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Description</label>
            <textarea
              name="fullDesc"
              value={formData.fullDesc}
              onChange={handleChange}
              placeholder="Detailed description of your business..."
              rows="4"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium mb-2">Services (comma-separated)</label>
            <input
              type="text"
              name="services"
              value={formData.services}
              onChange={handleChange}
              placeholder="e.g., Haircut, Shaving, Beard Trim"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <input
              type="text"
              name="prices"
              value={formData.prices}
              onChange={handleChange}
              placeholder="e.g., ₦5,000 - ₦15,000"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +234 800 000 0000"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourbusiness.com"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Operating Hours */}
          <div>
            <label className="block text-sm font-medium mb-2">Operating Hours</label>
            <input
              type="text"
              name="operatingHours"
              value={formData.operatingHours}
              onChange={handleChange}
              placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Social Media */}
          <div>
            <label className="block text-sm font-medium mb-2">Social Media</label>
            <input
              type="text"
              name="socialMedia"
              value={formData.socialMedia}
              onChange={handleChange}
              placeholder="e.g., @yourbusiness on Instagram, Twitter"
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium mb-2">Main Business Image</label>
            {existingMainImage && (
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Current image:</p>
                <img 
                  src={existingMainImage} 
                  alt="Current main" 
                  className="w-48 h-48 object-cover rounded-lg border border-gray-600"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMainImage(e.target.files[0])}
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-sm text-gray-400 mt-2">Upload a new image to replace the current one</p>
          </div>

          {/* Gallery Images */}
          <div>
            <label className="block text-sm font-medium mb-2">Gallery Images</label>
            {existingGallery.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Current gallery ({existingGallery.length} images):</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingGallery.map((url, i) => (
                    <img 
                      key={i}
                      src={url} 
                      alt={`Gallery ${i + 1}`} 
                      className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    />
                  ))}
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setGalleryImages(Array.from(e.target.files))}
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-sm text-gray-400 mt-2">Upload new images to add to your gallery (max 10)</p>
          </div>

          {/* Online Booking */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="onlineBooking"
              checked={formData.onlineBooking}
              onChange={handleChange}
              className="w-5 h-5 mr-3 rounded bg-gray-800 border-gray-600"
            />
            <label className="text-sm font-medium">Offer Online Booking</label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/business-profile')}
              className="flex-1 p-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}