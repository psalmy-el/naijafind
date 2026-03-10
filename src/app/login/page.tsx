'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Check if admin and redirect accordingly
    const isAdmin = data.user?.user_metadata?.is_admin === true;
    router.push(isAdmin ? '/admin' : '/');
  };

  return (
    <div className="min-h-screen pt-32 bg-black flex items-center justify-center">
      <div className="bg-blue p-8 rounded-xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mb-4 rounded-lg border"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mb-6 rounded-lg border"
            required
          />
          <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Login
          </button>
        </form>
        <p className="mt-4 text-center">
          No account? <Link href="/signup" className="text-blue-600">Sign up</Link>
        </p>
      </div>
    </div>
  );
}