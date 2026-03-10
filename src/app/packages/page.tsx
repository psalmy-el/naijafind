'use client';
import Header from '@/components/Header';

export default function Packages() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-12">Choose or Upgrade Your Plan</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-200">
            <h2 className="text-3xl font-bold mb-4">Free</h2>
            <p className="text-4xl font-bold mb-6">₦0 <span className="text-lg">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li>✓ Basic listing</li>
              <li>✓ Search visibility</li>
              <li>✗ Featured placement</li>
              <li>✗ Analytics</li>
            </ul>
            <button className="w-full py-4 bg-gray-300 text-gray-800 rounded-lg font-bold cursor-not-allowed">Current Plan</button>
          </div>

          {/* Basic Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-blue-500 relative">
            <div className="absolute top-0 right-4 bg-blue-600 text-white px-4 py-1 rounded-b-lg font-bold">Recommended</div>
            <h2 className="text-3xl font-bold mb-4">Basic</h2>
            <p className="text-4xl font-bold mb-6">₦5,000 <span className="text-lg">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li>✓ Everything in Free</li>
              <li>✓ Featured in search</li>
              <li>✓ Priority support</li>
              <li>✗ Advanced analytics</li>
            </ul>
            <button className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
              Upgrade to Basic
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-purple-500">
            <h2 className="text-3xl font-bold mb-4">Pro</h2>
            <p className="text-4xl font-bold mb-6">₦15,000 <span className="text-lg">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li>✓ Everything in Basic</li>
              <li>✓ Top placement</li>
              <li>✓ Analytics dashboard</li>
              <li>✓ Priority listing</li>
            </ul>
            <button className="w-full py-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}