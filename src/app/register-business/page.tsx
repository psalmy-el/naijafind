'use client';
import Header from '@/components/Header';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterBusiness() {
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
    socialMedia: '',
  });

  const [selectedPackage, setSelectedPackage] = useState('free');
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [mainPreview, setMainPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleTextChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      setMainPreview(URL.createObjectURL(file));
    }
  };

  const handleGallery = (e) => {
    const files = Array.from(e.target.files);
    setGallery(files);
    setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please log in first');
    }

    const form = new FormData();

    // Append all fields + force string conversion
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      form.append(key, value == null ? '' : String(value));
    });

    form.append('package', selectedPackage);

    if (mainImage) form.append('mainImage', mainImage);
    gallery.forEach((file) => form.append('gallery', file));

    // DEBUG: see what is being sent (browser console)
    console.log('FormData being sent:');
    for (let [key, value] of form.entries()) {
      console.log(`${key}:`, value);
    }

    const res = await fetch('http://localhost:5000/api/add-place', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: form,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Backend response:', data);
      throw new Error(data.message || 'Failed to register');
    }

    alert('Business registered successfully! (Free plan) Awaiting approval.');
    router.push('/');
  } catch (err) {
    setError(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen pt-32 bg-black text-white">
      <Header />

      <section className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Register Your Business</h1>

        {error && <p className="text-red-600 mb-6 text-center font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="bg-blue-950 p-8 rounded-xl shadow-xl space-y-6">
          {/* Basic Info */}
          <input name="name" placeholder="Business Name *" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" required />
          
          <select name="category" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" required>
            {/* Food & Hospitality */}
            <option>Food & Restaurants</option>
            <option>Fast Food / Bukka</option>
            <option>Bakeries & Confectioneries</option>
            <option>Hotels & Accommodation</option>
            <option>Guest Houses & Lodges</option>
            <option>Event Centers & Halls</option>
            <option>Catering Services</option>
            <option>Bar & Lounge</option>

            {/* Beauty & Personal Care */}
            <option>Barbers & Hair Stylists</option>
            <option>Beauty Salons & Spas</option>
            <option>Nail & Makeup Artists</option>
            <option>Massage & Wellness</option>
            <option>Tailoring & Fashion Design</option>
            <option>Boutiques & Clothing Stores</option>

            {/* Health & Medical */}
            <option>Medical & Healthcare</option>
            <option>Hospitals & Clinics</option>
            <option>Pharmacies & Drug Stores</option>
            <option>Dental Clinics</option>
            <option>Diagnostic Labs</option>

            {/* Education & Training */}
            <option>Schools & Education</option>
            <option>Nurseries & Daycare</option>
            <option>Tutorials & Coaching Centers</option>
            <option>Skill Acquisition / Vocational Training</option>

            {/* Automotive */}
            <option>Car Repair & Mechanics</option>
            <option>Car Wash & Detailing</option>
            <option>Spare Parts & Accessories</option>
            <option>Car Dealers</option>

            {/* Tech & Electronics */}
            <option>Phone & Electronics Repair</option>
            <option>Phone Accessories & Gadgets</option>
            <option>Computer & Laptop Repairs</option>
            <option>Cyber Cafes & Business Centers</option>

            {/* Home & Construction */}
            <option>Plumbing & Electrical Services</option>
            <option>Carpentry & Furniture</option>
            <option>Building Materials & Hardware</option>
            <option>Interior Design & Decoration</option>
            <option>Painting & Home Finishing</option>

            {/* Laundry & Cleaning */}
            <option>Laundry & Dry Cleaning</option>
            <option>House Cleaning & Maid Services</option>

            {/* Transport & Logistics */}
            <option>Transportation & Logistics</option>
            <option>Car Rentals & Taxi Services</option>
            <option>Delivery & Courier Services</option>

            {/* Financial & Legal */}
            <option>Banking & Financial Services</option>
            <option>POS / Money Transfer Agents</option>
            <option>Legal & Consulting Services</option>
            <option>Insurance Agents</option>

            {/* Entertainment & Lifestyle */}
            <option>Parks & Recreation</option>
            <option>Gyms & Fitness Centers</option>
            <option>Photography & Videography</option>
            <option>Event Planning & Decoration</option>

            {/* Religious & Community */}
            <option>Churches & Religious Centers</option>
            <option>Mosques & Islamic Centers</option>
            <option>NGOs & Community Services</option>

            {/* Others */}
            <option>Printing & Graphic Design</option>
            <option>Real Estate & Property Agents</option>
            <option>Security Services</option>
            <option>Others / General Services</option>
          </select>

          <input name="shortDesc" placeholder="Short Description *" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" required />
          <textarea name="fullDesc" placeholder="Full Description *" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 h-32" required />

          <input name="services" placeholder="Services (comma-separated) *" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" required />
          <input name="prices" placeholder="Price Range (e.g., ₦5,000 - ₦20,000)" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" />

          <label className="flex items-center text-gray-300">
            <input type="checkbox" name="onlineBooking" onChange={handleTextChange} className="mr-2" />
            Online Booking Available
          </label>

          {/* New Business Fields */}
          <input name="phone" placeholder="Business Phone (e.g., +234 80x xxx xxxx) *" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" required />
          <input name="website" placeholder="Website or Instagram (optional)" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" />
          <textarea name="operatingHours" placeholder="Operating Hours (e.g., Mon-Sat 8am-6pm)" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600 h-24" />
          <input name="socialMedia" placeholder="Social Media Handles (e.g., @yourhandle)" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" />

          {/* Address – Geocoding happens on backend! */}
          <input name="address" placeholder="Full Address (e.g., Lekki Phase 1, Lagos) *" onChange={handleTextChange} className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600" required />

          {/* Package Selection */}
          <div>
            <label className="block mb-2 font-medium text-gray-300">Choose Package</label>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full p-4 rounded-lg border bg-gray-800 text-white border-gray-600"
              required
            >
              <option value="free">Free (Basic Listing)</option>
              <option value="basic">Basic (₦5,000/month – Featured Listing)</option>
              <option value="pro">Pro (₦15,000/month – Top Placement + Analytics)</option>
            </select>
          </div>

          {/* Images + Previews */}
          <div>
            <label className="block mb-2 font-medium text-gray-300">Main Image *</label>
            <input type="file" name="mainImage" onChange={handleMainImage} accept="image/*" className="w-full p-4 border rounded-lg bg-gray-800 text-white border-gray-600" required />
            {mainPreview && (
              <div className="mt-3">
                <img src={mainPreview} alt="Main Preview" className="w-40 h-40 object-cover rounded border border-gray-600" />
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-300">Gallery Images (multiple, optional)</label>
            <input type="file" name="gallery" onChange={handleGallery} accept="image/*" multiple className="w-full p-4 border rounded-lg bg-gray-800 text-white border-gray-600" />
            {galleryPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {galleryPreviews.map((src, i) => (
                  <img key={i} src={src} alt={`Gallery ${i+1}`} className="w-full h-24 object-cover rounded border border-gray-600" />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Register Business'}
          </button>
        </form>
      </section>
    </div>
  );
}