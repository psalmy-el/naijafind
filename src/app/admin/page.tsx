// 'use client';
// import Header from '@/components/Header';
// import { useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabaseClient';

// export default function AdminDashboard() {
//   const router = useRouter();
//   const [companies, setCompanies] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   // Modal state
//   const [selectedCompany, setSelectedCompany] = useState<any>(null);
//   const [declineReason, setDeclineReason] = useState('');
//   const [showDeclineField, setShowDeclineField] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);

//   useEffect(() => {
//     console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
//     console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 30));
//     const init = async () => {
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session) {
//           router.push('/login');
//           return;
//         }

//         const isAdmin = session.user.user_metadata?.is_admin === true;
//         if (!isAdmin) {
//           setError('Access denied - Admins only');
//           setLoading(false);
//           setTimeout(() => router.push('/'), 1500);
//           return;
//         }

//         const { data, error: fetchError } = await supabase
//           .from('places')
//           .select('*')
//           .order('created_at', { ascending: false });

//         if (fetchError) {
//           console.error('Supabase error:', fetchError.message, '| code:', fetchError.code, '| hint:', fetchError.hint);
//           setError('Failed to load companies: ' + fetchError.message);
//           setLoading(false);
//           return;
//         }
//         setCompanies(data || []);
//       } catch (err: any) {
//         const msg = err?.message || err?.toString() || JSON.stringify(err);
//         console.error('Admin dashboard error:', msg);
//         setError('Failed to load companies: ' + msg);
//       } finally {
//         setLoading(false);
//       }
//     };

//     init();
//   }, [router]);

//   const updateApproval = async (id: string, approved: boolean, reason?: string) => {
//     setActionLoading(true);
//     try {
//       const updateData: any = { approved };
//       if (!approved && reason) {
//         updateData.decline_reason = reason;
//       }

//       const { error } = await supabase
//         .from('places')
//         .update(updateData)
//         .eq('id', id);

//       if (error) throw error;

//       setCompanies((prev: any[]) =>
//         prev.map((comp) =>
//           comp.id === id ? { ...comp, approved, decline_reason: reason || null } : comp
//         )
//       );

//       // Update selectedCompany to reflect new status in modal
//       setSelectedCompany((prev: any) =>
//         prev ? { ...prev, approved, decline_reason: reason || null } : prev
//       );

//       setShowDeclineField(false);
//       setDeclineReason('');
//     } catch (err) {
//       console.error('Update failed:', err);
//       alert('Failed to update status');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleApprove = () => {
//     if (!selectedCompany) return;
//     updateApproval(selectedCompany.id, true);
//   };

//   const handleDeclineSubmit = () => {
//     if (!selectedCompany) return;
//     if (!declineReason.trim()) {
//       alert('Please enter a reason for declining.');
//       return;
//     }
//     updateApproval(selectedCompany.id, false, declineReason.trim());
//   };

//   const closeModal = () => {
//     setSelectedCompany(null);
//     setShowDeclineField(false);
//     setDeclineReason('');
//   };

//   const filteredCompanies = companies.filter((comp: any) => {
//     const nameMatch = comp.name.toLowerCase().includes(searchTerm.toLowerCase());
//     const statusMatch =
//       filterStatus === 'all' ||
//       (filterStatus === 'pending' && !comp.approved) ||
//       (filterStatus === 'approved' && comp.approved);
//     return nameMatch && statusMatch;
//   });

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-600 font-medium">Verifying access...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <p className="text-red-600 text-xl font-semibold">{error}</p>
//           <p className="text-gray-500 mt-2">Redirecting you home...</p>
//         </div>
//       </div>
//     );
//   }

//   const totalCompanies = companies.length;
//   const pendingCount = companies.filter((comp: any) => !comp.approved).length;
//   const approvedCount = companies.filter((comp: any) => comp.approved).length;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Admin-only header: logo + logout only */}
//       <Header adminMode />

//       <div className="max-w-7xl mx-auto px-4 py-12 pt-32">
//         <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Admin Dashboard</h1>

//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
//           {/* Stats */}
//           <div className="grid md:grid-cols-3 gap-6 mb-8">
//             <div className="p-6 bg-blue-50 rounded-lg text-center">
//               <h3 className="text-xl font-semibold text-blue-600">Total Companies</h3>
//               <p className="text-3xl font-bold mt-2">{totalCompanies}</p>
//             </div>
//             <div className="p-6 bg-yellow-50 rounded-lg text-center">
//               <h3 className="text-xl font-semibold text-yellow-600">Pending Approval</h3>
//               <p className="text-3xl font-bold mt-2">{pendingCount}</p>
//             </div>
//             <div className="p-6 bg-green-50 rounded-lg text-center">
//               <h3 className="text-xl font-semibold text-green-600">Approved</h3>
//               <p className="text-3xl font-bold mt-2">{approvedCount}</p>
//             </div>
//           </div>

//           {/* Filters */}
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <input
//               type="text"
//               placeholder="Search by name..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="flex-1 p-4 rounded-lg border bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:outline-none"
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="p-4 rounded-lg border bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:outline-none"
//             >
//               <option value="all">All Status</option>
//               <option value="pending">Pending</option>
//               <option value="approved">Approved</option>
//             </select>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full table-auto border-collapse text-left">
//               <thead>
//                 <tr className="bg-gray-100 text-gray-700">
//                   <th className="p-4 border-b font-semibold">Name</th>
//                   <th className="p-4 border-b font-semibold">Owner</th>
//                   <th className="p-4 border-b font-semibold">Category</th>
//                   <th className="p-4 border-b font-semibold">Address</th>
//                   <th className="p-4 border-b font-semibold">Package</th>
//                   <th className="p-4 border-b font-semibold">Status</th>
//                   <th className="p-4 border-b font-semibold">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredCompanies.length > 0 ? (
//                   filteredCompanies.map((comp: any) => (
//                     <tr key={comp.id} className="hover:bg-gray-50 transition">
//                       <td className="p-4 border-b">{comp.name}</td>
//                       <td className="p-4 border-b">{comp.owner_email || 'Unknown'}</td>
//                       <td className="p-4 border-b">{comp.category}</td>
//                       <td className="p-4 border-b">{comp.address}</td>
//                       <td className="p-4 border-b">{comp.package}</td>
//                       <td className="p-4 border-b">
//                         {comp.approved ? (
//                           <span className="text-green-600 font-medium">Approved</span>
//                         ) : (
//                           <span className="text-yellow-600 font-medium">Pending</span>
//                         )}
//                       </td>
//                       <td className="p-4 border-b">
//                         <button
//                           onClick={() => {
//                             setSelectedCompany(comp);
//                             setShowDeclineField(false);
//                             setDeclineReason('');
//                           }}
//                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
//                         >
//                           View
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={7} className="p-4 text-center text-gray-500">
//                       No companies match your search/filter.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* ── Company Detail Modal ── */}
//       {selectedCompany && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
//           onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
//         >
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-8 py-5 border-b">
//               <h2 className="text-2xl font-bold text-gray-800">{selectedCompany.name}</h2>
//               <button
//                 onClick={closeModal}
//                 className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
//               >
//                 &times;
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="px-8 py-6 space-y-5">

//               {/* Main Image */}
//               {selectedCompany.image_url && (
//                 <div className="w-full h-56 rounded-xl overflow-hidden bg-gray-100">
//                   <img
//                     src={selectedCompany.image_url}
//                     alt={selectedCompany.name}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//               )}

//               {/* Gallery Images */}
//               {selectedCompany.gallery_urls?.length > 0 && (
//                 <div>
//                   <p className="text-sm font-semibold text-gray-500 mb-2">Gallery</p>
//                   <div className="grid grid-cols-3 gap-2">
//                     {selectedCompany.gallery_urls.map((url: string, i: number) => (
//                       <div key={i} className="h-24 rounded-lg overflow-hidden bg-gray-100">
//                         <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Status Badge */}
//               <div className="flex items-center gap-3">
//                 <span className="text-gray-500 font-medium w-36 shrink-0">Status:</span>
//                 {selectedCompany.approved ? (
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Approved</span>
//                 ) : (
//                   <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Pending</span>
//                 )}
//               </div>

//               {/* Core Details */}
//               {[
//                 { label: 'Owner Email', value: selectedCompany.owner_email || '—' },
//                 { label: 'Category', value: selectedCompany.category || '—' },
//                 { label: 'Address', value: selectedCompany.address || '—' },
//                 { label: 'Package', value: selectedCompany.package || '—' },
//                 { label: 'Phone', value: selectedCompany.phone || '—' },
//                 { label: 'Website', value: selectedCompany.website || '—' },
//                 { label: 'Online Booking', value: selectedCompany.online_booking ? 'Yes' : 'No' },
//                 { label: 'Short Description', value: selectedCompany.short_desc || '—' },
//                 { label: 'Full Description', value: selectedCompany.full_desc || '—' },
//                 { label: 'Prices', value: selectedCompany.prices || '—' },
//                 { label: 'Operating Hours', value: selectedCompany.operating_hours || '—' },
//                 { label: 'Social Media', value: selectedCompany.social_media || '—' },
//                 { label: 'Package Expires', value: selectedCompany.package_expires_at ? new Date(selectedCompany.package_expires_at).toLocaleDateString() : '—' },
//               ].map(({ label, value }) => (
//                 <div key={label} className="flex gap-3">
//                   <span className="text-gray-500 font-medium w-36 shrink-0">{label}:</span>
//                   <span className="text-gray-800 break-words">{value}</span>
//                 </div>
//               ))}

//               {/* Services */}
//               {selectedCompany.services?.length > 0 && (
//                 <div className="flex gap-3">
//                   <span className="text-gray-500 font-medium w-36 shrink-0">Services:</span>
//                   <div className="flex flex-wrap gap-2">
//                     {selectedCompany.services.map((s: string, i: number) => (
//                       <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{s}</span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Previous decline reason (if any) */}
//               {!selectedCompany.approved && selectedCompany.decline_reason && (
//                 <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
//                   <p className="text-sm font-semibold text-red-600 mb-1">Previous Decline Reason:</p>
//                   <p className="text-red-700 text-sm">{selectedCompany.decline_reason}</p>
//                 </div>
//               )}
//             </div>

//             {/* Modal Footer – Actions */}
//             <div className="px-8 py-5 border-t bg-gray-50 rounded-b-2xl space-y-4">
//               {!showDeclineField ? (
//                 <div className="flex gap-3">
//                   <button
//                     onClick={handleApprove}
//                     disabled={actionLoading || selectedCompany.approved}
//                     className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
//                   >
//                     {actionLoading ? 'Updating...' : selectedCompany.approved ? 'Already Approved' : 'Approve'}
//                   </button>
//                   <button
//                     onClick={() => setShowDeclineField(true)}
//                     disabled={actionLoading}
//                     className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
//                   >
//                     Decline
//                   </button>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   <label className="block text-sm font-semibold text-gray-700">
//                     Reason for declining <span className="text-red-500">*</span>
//                   </label>
//                   <textarea
//                     value={declineReason}
//                     onChange={(e) => setDeclineReason(e.target.value)}
//                     rows={4}
//                     placeholder="Explain why this business is being declined..."
//                     className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:border-red-400 resize-none"
//                   />
//                   <div className="flex gap-3">
//                     <button
//                       onClick={handleDeclineSubmit}
//                       disabled={actionLoading}
//                       className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
//                     >
//                       {actionLoading ? 'Submitting...' : 'Confirm Decline'}
//                     </button>
//                     <button
//                       onClick={() => { setShowDeclineField(false); setDeclineReason(''); }}
//                       className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Tab = 'overview' | 'places' | 'messages';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  reply?: string | null;
  replied_at?: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [companies, setCompanies] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [token, setToken] = useState<string | null>(null);

  // Places modal state
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineField, setShowDeclineField] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Messages state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'read'>('all');

  // ── Auth & initial load ──
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) { router.push('/login'); return; }

        const isAdmin = session.user.user_metadata?.is_admin === true;
        if (!isAdmin) {
          setError('Access denied – Admins only');
          setLoading(false);
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        setToken(session.access_token);

        const { data, error: fetchError } = await supabase
          .from('places')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) { setError('Failed to load companies: ' + fetchError.message); setLoading(false); return; }
        setCompanies(data || []);
      } catch (err: any) {
        setError('Failed to load: ' + (err?.message || String(err)));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // ── Load messages when tab switches ──
  useEffect(() => {
    if (activeTab === 'messages' && token) fetchMessages();
  }, [activeTab, token]);

  const fetchMessages = async () => {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data);
    } catch (err: any) {
      console.error('Messages fetch error:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ── Mark as read ──
  const markAsRead = async (id: string) => {
    if (!token) return;
    await fetch(`${API_URL}/api/admin/contact-messages/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  // ── Send reply ──
  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim() || !token) return;
    setReplyLoading(true);
    setReplySuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/contact-messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Reply failed');
      const now = new Date().toISOString();
      const updated = { ...selectedMessage, reply: replyText.trim(), replied_at: now, read: true };
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? updated : m));
      setSelectedMessage(updated);
      setReplyText('');
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 3000);
    } catch (err) {
      console.error('Reply error:', err);
      alert('Failed to send reply. Check your backend /api/admin/contact-messages/:id/reply route.');
    } finally {
      setReplyLoading(false);
    }
  };

  // ── Places actions ──
  const updateApproval = async (id: string, approved: boolean, reason?: string) => {
    setActionLoading(true);
    try {
      const updateData: any = { approved };
      if (!approved && reason) updateData.decline_reason = reason;
      const { error } = await supabase.from('places').update(updateData).eq('id', id);
      if (error) throw error;
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, approved, decline_reason: reason || null } : c));
      setSelectedCompany((prev: any) => prev ? { ...prev, approved, decline_reason: reason || null } : prev);
      setShowDeclineField(false);
      setDeclineReason('');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => { setSelectedCompany(null); setShowDeclineField(false); setDeclineReason(''); };

  // ── Derived data ──
  const totalCompanies = companies.length;
  const pendingCount = companies.filter(c => !c.approved).length;
  const approvedCount = companies.filter(c => c.approved).length;
  const unreadCount = messages.filter(m => !m.read).length;

  const filteredCompanies = companies.filter(c => {
    const nameMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || (filterStatus === 'pending' && !c.approved) || (filterStatus === 'approved' && c.approved);
    return nameMatch && statusMatch;
  });

  const filteredMessages = messages.filter(m => {
    const q = msgSearch.toLowerCase();
    const textMatch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
    const statusMatch = msgFilter === 'all' || (msgFilter === 'unread' && !m.read) || (msgFilter === 'read' && m.read);
    return textMatch && statusMatch;
  });

  // ── States ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Verifying access...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        <p className="text-red-400 text-xl font-semibold">{error}</p>
        <p className="text-gray-500 mt-2">Redirecting you home...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans">
      <Header adminMode />

      <div className="max-w-7xl mx-auto px-4 py-10 pt-28">

        {/* ── Page Title ── */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage listings, review contact messages, and keep NaijaFind running.</p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Spots', value: totalCompanies, color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400' },
            { label: 'Pending', value: pendingCount, color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
            { label: 'Approved', value: approvedCount, color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/20', text: 'text-green-400' },
            { label: 'Unread Messages', value: unreadCount, color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-[#1a1d27] border border-white/5 rounded-xl p-1 mb-6 w-fit">
          {([
            { id: 'overview', label: '📊 Overview' },
            { id: 'places', label: `🏢 Listings ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}` },
            { id: 'messages', label: `💬 Messages ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
          ] as { id: Tab; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#f97316] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Recent listings */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Recent Listings</h3>
              <div className="space-y-3">
                {companies.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.category} · {c.address?.slice(0, 30)}...</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.approved ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                      {c.approved ? 'Live' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('places')} className="mt-4 text-[#f97316] text-sm font-semibold hover:underline">
                View all listings →
              </button>
            </div>

            {/* Recent messages */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Recent Messages</h3>
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-start justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!m.read && <span className="w-2 h-2 bg-orange-400 rounded-full shrink-0" />}
                          <p className="font-medium text-sm truncate">{m.name}</p>
                        </div>
                        <p className="text-gray-500 text-xs truncate">{m.message.slice(0, 50)}...</p>
                      </div>
                      <button
                        onClick={() => { setActiveTab('messages'); setTimeout(() => { setSelectedMessage(m); if (!m.read) markAsRead(m.id); }, 100); }}
                        className="text-xs text-[#f97316] shrink-0 hover:underline font-semibold"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setActiveTab('messages')} className="mt-4 text-[#f97316] text-sm font-semibold hover:underline">
                View all messages →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: PLACES / LISTINGS
        ══════════════════════════════════════════ */}
        {activeTab === 'places' && (
          <div className="bg-[#1a1d27] border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f97316]/50"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#f97316]/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Name', 'Category', 'Address', 'Package', 'Status', 'Actions'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-gray-500 font-semibold uppercase text-xs tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length > 0 ? filteredCompanies.map(comp => (
                    <tr key={comp.id} className="border-b border-white/5 hover:bg-white/2 transition">
                      <td className="py-3 pr-4 font-medium">{comp.name}</td>
                      <td className="py-3 pr-4 text-gray-400">{comp.category}</td>
                      <td className="py-3 pr-4 text-gray-400 max-w-[180px] truncate">{comp.address}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-1 bg-white/5 rounded-full text-xs capitalize">{comp.package || 'free'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${comp.approved ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                          {comp.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => { setSelectedCompany(comp); setShowDeclineField(false); setDeclineReason(''); }}
                          className="px-3 py-1.5 bg-[#f97316]/15 hover:bg-[#f97316]/25 text-[#f97316] rounded-lg text-xs font-semibold transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500">No listings match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: MESSAGES
        ══════════════════════════════════════════ */}
        {activeTab === 'messages' && (
          <div className="grid lg:grid-cols-[350px_1fr] gap-5 h-[600px]">

            {/* Message list */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 space-y-3">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={msgSearch}
                  onChange={e => setMsgSearch(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f97316]/50"
                />
                <div className="flex gap-1">
                  {(['all', 'unread', 'read'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setMsgFilter(f)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${msgFilter === f ? 'bg-[#f97316] text-black' : 'text-gray-400 hover:text-white bg-white/5'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">No messages found.</div>
                ) : filteredMessages.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMessage(m); setReplyText(''); setReplySuccess(false); if (!m.read) markAsRead(m.id); }}
                    className={`w-full text-left px-4 py-3.5 hover:bg-white/3 transition ${selectedMessage?.id === m.id ? 'bg-[#f97316]/8 border-l-2 border-[#f97316]' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!m.read && <span className="w-2 h-2 bg-orange-400 rounded-full shrink-0" />}
                      <p className={`text-sm font-semibold truncate ${!m.read ? 'text-white' : 'text-gray-300'}`}>{m.name}</p>
                      <span className="ml-auto text-gray-600 text-xs shrink-0">
                        {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">{m.subject || '(No subject)'}</p>
                    <p className="text-gray-600 text-xs truncate mt-0.5">{m.message.slice(0, 60)}...</p>
                    {m.reply && (
                      <span className="inline-block mt-1 text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Replied</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Message detail + reply */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              {!selectedMessage ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <span className="text-5xl mb-4">💬</span>
                  <h3 className="text-lg font-bold mb-2">Select a message</h3>
                  <p className="text-gray-500 text-sm">Click any message on the left to read and reply to it.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg leading-tight truncate">{selectedMessage.subject || '(No subject)'}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">
                        From <span className="text-white font-medium">{selectedMessage.name}</span>
                        {' · '}<a href={`mailto:${selectedMessage.email}`} className="text-[#f97316] hover:underline">{selectedMessage.email}</a>
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {new Date(selectedMessage.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {selectedMessage.read
                        ? <span className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-full">Read</span>
                        : <span className="px-2 py-1 bg-orange-500/15 text-orange-400 text-xs rounded-full font-semibold">Unread</span>
                      }
                      {selectedMessage.reply && (
                        <span className="px-2 py-1 bg-green-500/15 text-green-400 text-xs rounded-full font-semibold">Replied</span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Original message */}
                    <div className="bg-[#0f1117] border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Message</p>
                      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>

                    {/* Previous reply */}
                    {selectedMessage.reply && (
                      <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-5">
                        <p className="text-xs text-green-400 uppercase tracking-wider mb-3 font-semibold">
                          Your reply · {selectedMessage.replied_at ? new Date(selectedMessage.replied_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                        </p>
                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Reply box */}
                  <div className="px-6 py-4 border-t border-white/5 space-y-3">
                    {replySuccess && (
                      <div className="bg-green-500/15 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-2.5 text-center font-medium">
                        ✅ Reply sent successfully!
                      </div>
                    )}
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={selectedMessage.reply ? 'Send another reply...' : `Reply to ${selectedMessage.name}...`}
                      className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f97316]/50 resize-none"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-gray-600 text-xs">
                        Reply will be sent to <span className="text-gray-400">{selectedMessage.email}</span>
                      </p>
                      <button
                        onClick={sendReply}
                        disabled={replyLoading || !replyText.trim()}
                        className="px-6 py-2.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-black font-bold rounded-xl text-sm transition"
                      >
                        {replyLoading ? 'Sending...' : 'Send Reply →'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          PLACES DETAIL MODAL
      ══════════════════════════════════════════ */}
      {selectedCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
              <h2 className="text-xl font-bold">{selectedCompany.name}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white text-3xl leading-none">&times;</button>
            </div>

            <div className="px-8 py-6 space-y-5">
              {selectedCompany.image_url && (
                <div className="w-full h-52 rounded-xl overflow-hidden">
                  <img src={selectedCompany.image_url} alt={selectedCompany.name} className="w-full h-full object-cover" />
                </div>
              )}
              {selectedCompany.gallery_urls?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Gallery</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCompany.gallery_urls.map((url: string, i: number) => (
                      <div key={i} className="h-24 rounded-xl overflow-hidden">
                        <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium w-36 shrink-0 text-sm">Status:</span>
                {selectedCompany.approved
                  ? <span className="px-3 py-1 bg-green-500/15 text-green-400 rounded-full text-xs font-semibold">Approved</span>
                  : <span className="px-3 py-1 bg-yellow-500/15 text-yellow-400 rounded-full text-xs font-semibold">Pending</span>
                }
              </div>

              {[
                { label: 'Category', value: selectedCompany.category },
                { label: 'Address', value: selectedCompany.address },
                { label: 'Package', value: selectedCompany.package },
                { label: 'Phone', value: selectedCompany.phone },
                { label: 'Website', value: selectedCompany.website },
                { label: 'Online Booking', value: selectedCompany.online_booking ? 'Yes' : 'No' },
                { label: 'Short Desc', value: selectedCompany.short_desc },
                { label: 'Full Desc', value: selectedCompany.full_desc },
                { label: 'Prices', value: selectedCompany.prices },
                { label: 'Hours', value: selectedCompany.operating_hours },
                { label: 'Social Media', value: selectedCompany.social_media },
              ].filter(i => i.value).map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-36 shrink-0">{label}:</span>
                  <span className="text-gray-200 break-words">{value}</span>
                </div>
              ))}

              {selectedCompany.services?.length > 0 && (
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-36 shrink-0">Services:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCompany.services.map((s: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {!selectedCompany.approved && selectedCompany.decline_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
                  <p className="text-red-400 font-semibold mb-1">Previous Decline Reason:</p>
                  <p className="text-red-300">{selectedCompany.decline_reason}</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-white/5 space-y-3">
              {!showDeclineField ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateApproval(selectedCompany.id, true)}
                    disabled={actionLoading || selectedCompany.approved}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
                  >
                    {actionLoading ? 'Updating...' : selectedCompany.approved ? 'Already Approved ✓' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setShowDeclineField(true)}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300">Reason for declining <span className="text-red-400">*</span></label>
                  <textarea
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this listing is being declined..."
                    className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { if (!declineReason.trim()) { alert('Please enter a reason.'); return; } updateApproval(selectedCompany.id, false, declineReason.trim()); }}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
                    >
                      {actionLoading ? 'Submitting...' : 'Confirm Decline'}
                    </button>
                    <button
                      onClick={() => { setShowDeclineField(false); setDeclineReason(''); }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}