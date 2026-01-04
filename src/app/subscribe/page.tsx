'use client';

import Header from '@/components/Header';

export default function Subscribe() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32">
      <Header />
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-12">Boost Your Business Visibility</h1>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Free</h2>
            <p className="text-5xl font-bold mb-6">₦0<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 text-left">
              <li>✓ Basic listing</li>
              <li>✓ Standard search position</li>
              <li>✗ Featured spot</li>
              <li>✗ Priority support</li>
            </ul>
            <button className="w-full py-4 bg-gray-300 rounded-lg">Current Plan</button>
          </div>

          {/* Basic */}
          <div className="bg-blue-600 text-white rounded-2xl shadow-2xl p-8 text-center transform scale-105">
            <h2 className="text-3xl font-bold mb-4">Basic</h2>
            <p className="text-5xl font-bold mb-6">₦5,000<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 text-left">
              <li>✓ Top search position</li>
              <li>✓ Featured badge</li>
              <li>✓ Gallery photos</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="w-full py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-bold">Subscribe Now</button>
          </div>

          {/* Premium */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Premium</h2>
            <p className="text-5xl font-bold mb-6">₦15,000<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 text-left">
              <li>✓ #1 in category</li>
              <li>✓ Homepage feature</li>
              <li>✓ Unlimited gallery</li>
              <li>✓ Analytics dashboard</li>
              <li>✓ Dedicated support</li>
            </ul>
            <button className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Subscribe Now</button>
          </div>
        </div>
      </section>
    </div>
  );
}