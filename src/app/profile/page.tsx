'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 text-center text-gray-600">
        Loading your profile...
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12 pt-32">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Profile</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-4">
            <div>
              <label className="text-gray-600 font-medium">Email</label>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="text-gray-600 font-medium">User ID</label>
              <p className="text-sm text-gray-500 font-mono">{user.id}</p>
            </div>

            <div>
              <label className="text-gray-600 font-medium">Account Created</label>
              <p className="text-lg text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Add more profile fields as needed */}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/edit-profile')}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}