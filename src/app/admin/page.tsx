'use client';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true); // stays true until auth check is done
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

useEffect(() => {
  const init = async () => {
    try {
      // Step 1: Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      // Step 2: Check admin flag
      const isAdmin = session.user.user_metadata?.is_admin === true;
      if (!isAdmin) {
        setError('Access denied - Admins only');
        setLoading(false);
        setTimeout(() => router.push('/'), 1500);
        return;
      }

      // Step 3: Fetch companies from backend (includes owner_email)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/places`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });

    if (!response.ok) throw new Error('Failed to load companies');
    const data = await response.json();
    setCompanies(data || []);
        } catch (err) {
          console.error('Admin dashboard error:', err?.message || err || 'Unknown error');
          setError('Failed to load companies. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      init();
    }, [router]);

  const updateApproval = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('places')
        .update({ approved })
        .eq('id', id);

      if (error) throw error;

      setCompanies((prev: any[]) =>
        prev.map((comp) => (comp.id === id ? { ...comp, approved } : comp))
      );
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status');
    }
  };

  const filteredCompanies = companies.filter((comp: any) => {
    const nameMatch = comp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && !comp.approved) ||
      (filterStatus === 'approved' && comp.approved);
    return nameMatch && statusMatch;
  });

  // Show a full-page spinner while auth is being verified — prevents flash redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-xl font-semibold">{error}</p>
          <p className="text-gray-500 mt-2">Redirecting you home...</p>
        </div>
      </div>
    );
  }

  const totalCompanies = companies.length;
  const pendingCount = companies.filter((comp: any) => !comp.approved).length;
  const approvedCount = companies.filter((comp: any) => comp.approved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-12 pt-32">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Admin Dashboard</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-blue-50 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-blue-600">Total Companies</h3>
              <p className="text-3xl font-bold mt-2">{totalCompanies}</p>
            </div>
            <div className="p-6 bg-yellow-50 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-yellow-600">Pending Approval</h3>
              <p className="text-3xl font-bold mt-2">{pendingCount}</p>
            </div>
            <div className="p-6 bg-green-50 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-green-600">Approved</h3>
              <p className="text-3xl font-bold mt-2">{approvedCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-4 rounded-lg border bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-4 rounded-lg border bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          {/* Companies Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-4 border-b font-semibold">Name</th>
                  <th className="p-4 border-b font-semibold">Owner</th>
                  <th className="p-4 border-b font-semibold">Category</th>
                  <th className="p-4 border-b font-semibold">Address</th>
                  <th className="p-4 border-b font-semibold">Package</th>
                  <th className="p-4 border-b font-semibold">Status</th>
                  <th className="p-4 border-b font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((comp: any) => (
                    <tr key={comp.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 border-b">{comp.name}</td>
                      <td className="p-4 border-b">{comp.owner_email || 'Unknown'}</td>
                      <td className="p-4 border-b">{comp.category}</td>
                      <td className="p-4 border-b">{comp.address}</td>
                      <td className="p-4 border-b">{comp.package}</td>
                      <td className="p-4 border-b">
                        {comp.approved ? (
                          <span className="text-green-600 font-medium">Approved</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">Pending</span>
                        )}
                      </td>
                      <td className="p-4 border-b">
                        <button
                          onClick={() => updateApproval(comp.id, true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateApproval(comp.id, false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No companies match your search/filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}