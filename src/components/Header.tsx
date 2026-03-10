// 'use client';
// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { places } from '@/data/places';
// import { supabase } from '@/lib/supabaseClient';

// export default function Header() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [showServices, setShowServices] = useState(false);
//   const [showMenu, setShowMenu] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const router = useRouter();
//   const pathname = usePathname();

//   // Check Supabase session (no localStorage)
//   useEffect(() => {
//     const checkSession = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       setIsLoggedIn(!!session);
//     };
//     checkSession();

//     // Listen for auth changes (real-time)
//     const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
//       setIsLoggedIn(!!session);
//     });

//     return () => {
//       authListener.subscription.unsubscribe();
//     };
//   }, []);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     setShowMenu(false);
//     router.push('/');
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (searchQuery.trim()) {
//       router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
//       setShowSuggestions(false);
//     }
//   };

//   const suggestions = Array.from(
//     new Set([
//       ...places.map((p) => p.name),
//       ...places.map((p) => p.address),
//       ...places.flatMap((p) => p.services),
//       ...places.map((p) => p.category),
//     ])
//   );

//   const filteredSuggestions = suggestions.filter((s) =>
//     s.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const servicesList = [
//     { name: 'Food & Restaurants', link: '/search?service=Food' },
//     { name: 'Hotels & Accommodation', link: '/search?service=Hotel' },
//     { name: 'Barbers & Hair Stylists', link: '/search?service=Barber' },
//     { name: 'Tailoring & Fashion Design', link: '/search?service=Tailoring' },
//     { name: 'Carpentry & Furniture', link: '/search?service=Carpentry' },
//     { name: 'Catering Services', link: '/search?service=Catering' },
//     { name: 'Beauty Salons & Spas', link: '/search?service=Beauty' },
//     { name: 'Parks & Recreation', link: '/search?service=Parks' },
//     { name: 'Schools & Education', link: '/search?service=Schools' },
//     { name: 'Churches & Religious Centers', link: '/search?service=Churches' },
//     { name: 'Event Halls & Venues', link: '/search?service=Event Halls' },
//     { name: 'Medical & Healthcare', link: '/search?service=Medical' },
//     { name: 'Transportation & Logistics', link: '/search?service=Transportation' },
//     { name: 'Laundry & Dry Cleaning', link: '/search?service=Laundry' },
//     { name: 'Plumbing & Electrical', link: '/search?service=Plumbing' },
//     { name: 'Car Repair & Mechanics', link: '/search?service=Car Repair' },
//     { name: 'Phone & Electronics Repair', link: '/search?service=Phone Repair' },
//     { name: 'Banking & Financial Services', link: '/search?service=Banking' },
//     { name: 'Legal & Consulting', link: '/search?service=Legal' },
//   ];

//   const isOnRegisterPage = pathname === '/register-business';

//   return (
//     <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
//       <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
//         {/* Logo */}
//         <Link href="/" className="text-3xl font-bold text-white drop-shadow-lg">
//           NaijaFind
//         </Link>

//         {/* Search */}
//         <div className="relative flex-1 max-w-lg mx-8">
//           <form onSubmit={handleSearch}>
//             <input
//               type="text"
//               placeholder="Search by name, location, service..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setShowSuggestions(e.target.value.length > 0);
//               }}
//               onFocus={() => setShowSuggestions(searchQuery.length > 0)}
//               className="w-full px-6 py-3 rounded-full bg-white text-gray-800 focus:outline-none shadow-lg"
//             />
//           </form>

//           {showSuggestions && filteredSuggestions.length > 0 && (
//             <div className="absolute w-full mt-2 bg-white rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 border border-gray-200">
//               {filteredSuggestions.map((sug, i) => (
//                 <div
//                   key={i}
//                   onClick={() => {
//                     setSearchQuery(sug);
//                     setShowSuggestions(false);
//                     router.push(`/search?query=${encodeURIComponent(sug)}`);
//                   }}
//                   className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-black text-lg border-b border-gray-100 last:border-0"
//                 >
//                   {sug}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Navigation */}
//         <nav className="flex gap-6 text-lg items-center">
//           {/* Home Link */}
//           <Link href="/" className="text-white hover:underline drop-shadow">
//             Home
//           </Link>

//           {/* Services Dropdown */}
//           <div className="relative">
//             <button
//               onClick={() => setShowServices(!showServices)}
//               className="text-white hover:underline drop-shadow"
//             >
//               Services
//             </button>
//             {showServices && (
//               <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
//                 {servicesList.map((service, i) => (
//                   <Link
//                     key={i}
//                     href={service.link}
//                     onClick={() => setShowServices(false)}
//                     className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-0"
//                   >
//                     {service.name}
//                   </Link>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Hamburger Menu Button */}
//           <button
//             onClick={() => setShowMenu(!showMenu)}
//             className="text-white drop-shadow-lg focus:outline-none"
//             aria-label="Toggle menu"
//           >
//             <svg
//               className="w-8 h-8"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               {showMenu ? (
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M6 18L18 6M6 6l12 12"
//                 />
//               ) : (
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 6h16M4 12h16M4 18h16"
//                 />
//               )}
//             </svg>
//           </button>
//         </nav>
//       </div>

//       {/* Toggle Menu Dropdown */}
//       {showMenu && (
//         <div className="absolute right-4 mt-2 w-72 bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
//           <div className="py-2">
//             <Link
//               href="/about"
//               onClick={() => setShowMenu(false)}
//               className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
//             >
//               About
//             </Link>

//             <Link
//               href="/contact"
//               onClick={() => setShowMenu(false)}
//               className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
//             >
//               Contact
//             </Link>

//             {isLoggedIn ? (
//               <>
//                 <Link
//                   href="/profile"
//                   onClick={() => setShowMenu(false)}
//                   className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
//                 >
//                   Profile
//                 </Link>

//                 <Link
//                   href="/business-profile"
//                   onClick={() => setShowMenu(false)}
//                   className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
//                 >
//                   Business Profile
//                 </Link>

//                 {!isOnRegisterPage && (
//                   <Link
//                     href="/register-business"
//                     onClick={() => setShowMenu(false)}
//                     className="block px-6 py-3 text-yellow-600 font-semibold hover:bg-gray-100 border-b border-gray-100"
//                   >
//                     Register Your Business
//                   </Link>
//                 )}

//                 <button
//                   onClick={handleLogout}
//                   className="block w-full text-left px-6 py-3 text-red-600 hover:bg-gray-100"
//                 >
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <Link
//                 href="/login"
//                 onClick={() => setShowMenu(false)}
//                 className="block px-6 py-3 text-gray-800 font-semibold hover:bg-gray-100"
//               >
//                 Login
//               </Link>
//             )}
//           </div>
//         </div>
//       )}
//     </header>
//   );
// }

'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Pages where search bar should be HIDDEN
  const hideSearchOn = [
    '/register-business',
    '/profile',
    '/business-profile',
    '/edit-business',
    '/about',
    '/contact',
  ];

  const shouldShowSearch = !hideSearchOn.includes(pathname);

  const [showServices, setShowServices] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push('/');
  };

  const servicesList = [
    { name: 'Food & Restaurants', link: '/search?service=Food' },
    { name: 'Hotels & Accommodation', link: '/search?service=Hotel' },
    { name: 'Barbers & Hair Stylists', link: '/search?service=Barber' },
    { name: 'Tailoring & Fashion Design', link: '/search?service=Tailoring' },
    { name: 'Carpentry & Furniture', link: '/search?service=Carpentry' },
    { name: 'Catering Services', link: '/search?service=Catering' },
    { name: 'Beauty Salons & Spas', link: '/search?service=Beauty' },
    { name: 'Parks & Recreation', link: '/search?service=Parks' },
    { name: 'Schools & Education', link: '/search?service=Schools' },
    { name: 'Churches & Religious Centers', link: '/search?service=Churches' },
    { name: 'Event Halls & Venues', link: '/search?service=Event Halls' },
    { name: 'Medical & Healthcare', link: '/search?service=Medical' },
    { name: 'Transportation & Logistics', link: '/search?service=Transportation' },
    { name: 'Laundry & Dry Cleaning', link: '/search?service=Laundry' },
    { name: 'Plumbing & Electrical', link: '/search?service=Plumbing' },
    { name: 'Car Repair & Mechanics', link: '/search?service=Car Repair' },
    { name: 'Phone & Electronics Repair', link: '/search?service=Phone Repair' },
    { name: 'Banking & Financial Services', link: '/search?service=Banking' },
    { name: 'Legal & Consulting', link: '/search?service=Legal' },
  ];

  const isOnRegisterPage = pathname === '/register-business';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-white drop-shadow-lg">
          NaijaFind
        </Link>

        {/* Search bar – only shown on allowed pages */}
        {shouldShowSearch && (
          <div className="relative flex-1 max-w-lg mx-8">
            <form onSubmit={(e) => {
              e.preventDefault();
                if (searchQuery.trim()) {
                router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}>
              <input
                type="text"
                placeholder="Search by name, location, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 rounded-full bg-white text-gray-800 focus:outline-none shadow-lg"
              />
            </form>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex gap-6 text-lg items-center">
          {/* Home Link – always visible */}
          <Link href="/" className="text-white hover:underline drop-shadow">
            Home
          </Link>

          {/* Services Dropdown – always visible */}
          <div className="relative">
            <button
              onClick={() => setShowServices(!showServices)}
              className="text-white hover:underline drop-shadow"
            >
              Services
            </button>
            {showServices && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                {servicesList.map((service, i) => (
                  <Link
                    key={i}
                    href={service.link}
                    onClick={() => setShowServices(false)}
                    className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-white drop-shadow-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {showMenu ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Toggle Menu Dropdown */}
      {showMenu && (
        <div className="absolute right-4 mt-2 w-72 bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="py-2">
            <Link
              href="/about"
              onClick={() => setShowMenu(false)}
              className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setShowMenu(false)}
              className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
            >
              Contact
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
                >
                  Profile
                </Link>
                <Link
                  href="/business-profile"
                  onClick={() => setShowMenu(false)}
                  className="block px-6 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100"
                >
                  Business Profile
                </Link>
                {!isOnRegisterPage && (
                  <Link
                    href="/register-business"
                    onClick={() => setShowMenu(false)}
                    className="block px-6 py-3 text-yellow-600 font-semibold hover:bg-gray-100 border-b border-gray-100"
                  >
                    Register Your Business
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-6 py-3 text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setShowMenu(false)}
                className="block px-6 py-3 text-gray-800 font-semibold hover:bg-gray-100"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}