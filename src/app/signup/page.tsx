'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // ← Added
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName } // ← Store full name in user metadata
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Send custom confirmation email
    const confirmationLink = data.session?.access_token 
      ? `${window.location.origin}/auth/confirm?token=${data.session.access_token}`
      : null;

    if (confirmationLink) {
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, confirmationLink })
      });
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen pt-32 bg-black flex items-center justify-center">
      <div className="bg-blue p-8 rounded-xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Sign Up</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Success!</strong> Check your email for confirmation link.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-4 mb-4 rounded-lg border bg-gray-800 text-white border-gray-600"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mb-4 rounded-lg border bg-gray-800 text-white border-gray-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mb-6 rounded-lg border bg-gray-800 text-white border-gray-600"
            required
          />
          <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-center">
          Have an account? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}