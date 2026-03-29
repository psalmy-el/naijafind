'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Accept optional adminMode prop (used on admin dashboard)
export default function Header({ adminMode }: { adminMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const hideSearchOn = [
    '/register-business',
    '/profile',
    '/business-profile',
    '/edit-business',
    '/about',
    '/contact',
    '/messages',
  ];

  const shouldShowSearch = !hideSearchOn.includes(pathname) && !adminMode;

  const [showServices, setShowServices] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [dbPlaces, setDbPlaces] = useState<{
    name: string;
    services: string[];
    category: string;
    address: string;
    short_desc: string;
  }[]>([]);

  // ── Message notification state ──
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Refs for click-outside detection
  const servicesRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Fetch places from API for autocomplete
  useEffect(() => {
    if (!adminMode) {
      fetch(`${API_URL}/api/places`)
        .then(res => res.json())
        .then(data => setDbPlaces(data))
        .catch(() => {});
    }
  }, [adminMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setShowServices(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if (session?.access_token) {
        setUserToken(session.access_token);
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserToken(session?.access_token || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ── Poll for unread message replies every 60s ──
  useEffect(() => {
    if (!userToken || adminMode) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/my-messages/unread-count`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadMessages(data.count || 0);
        }
      } catch {}
    };

    fetchUnread(); // run immediately
    const interval = setInterval(fetchUnread, 60000); // then every 60s
    return () => clearInterval(interval);
  }, [userToken, adminMode]);

  // Reset unread count when user visits /messages
  useEffect(() => {
    if (pathname === '/messages') {
      setUnreadMessages(0);
    }
  }, [pathname]);

  // All autocomplete suggestions
  const allSuggestions = useMemo(() => {
    const names = dbPlaces.map(p => p.name);
    const services = dbPlaces.flatMap(p => p.services ?? []);
    const cats = dbPlaces.map(p => p.category);
    const addresses = dbPlaces.map(p => p.address);
    const descs = dbPlaces.flatMap(p =>
      p.short_desc ? p.short_desc.split(/[\s,]+/).filter(w => w.length > 3) : []
    );
    return Array.from(new Set([...names, ...services, ...cats, ...addresses, ...descs]));
  }, [dbPlaces]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lower = searchQuery.toLowerCase();
    const startsWith = allSuggestions.filter(s => s.toLowerCase().startsWith(lower));
    const wordStartsWith = allSuggestions.filter(s =>
      !s.toLowerCase().startsWith(lower) &&
      s.toLowerCase().split(/\s+/).some(word => word.startsWith(lower))
    );
    const contains = allSuggestions.filter(s =>
      !s.toLowerCase().startsWith(lower) &&
      !s.toLowerCase().split(/\s+/).some(word => word.startsWith(lower)) &&
      s.toLowerCase().includes(lower)
    );
    return [...startsWith, ...wordStartsWith, ...contains].slice(0, 8);
  }, [searchQuery, allSuggestions]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    setUnreadMessages(0);
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-3">
      <div className="max-w-7xl mx-auto px-4">

        {/* ── Top Row: Logo + Nav Icons ── */}
        <div className="flex items-center justify-between gap-2">

          {/* Logo */}
          <Link href="/" className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg flex-shrink-0">
            NaijaFind
          </Link>

          {/* Desktop Search – hidden on mobile */}
          {shouldShowSearch && (
            <div className="relative hidden md:flex flex-1 max-w-lg mx-6" ref={desktopSearchRef}>
              <form
                className="w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    setShowSuggestions(false);
                    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Search by name, location, service..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full px-5 py-2.5 rounded-full bg-white text-gray-800 focus:outline-none shadow-lg text-sm"
                />
              </form>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => {
                        setSearchQuery(s);
                        setShowSuggestions(false);
                        router.push(`/search?query=${encodeURIComponent(s)}`);
                      }}
                      className="w-full text-left px-4 py-2.5 text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-0 text-sm flex items-center gap-2.5"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                      </svg>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right-side Nav */}
          <nav className="flex items-center gap-3 md:gap-5">

            {/* Mobile search toggle */}
            {shouldShowSearch && (
              <button
                className="md:hidden text-white drop-shadow"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                aria-label="Toggle search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </button>
            )}

            {/* Home */}
            <Link href="/" className="hidden sm:inline text-white hover:underline drop-shadow text-sm md:text-base">
              Home
            </Link>

            {/* ── Message Bell Icon (only when logged in, not admin mode) ── */}
            {isLoggedIn && !adminMode && (
              <Link
                href="/messages"
                className="relative text-white drop-shadow hover:text-[#22c55e] transition-colors"
                aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ''}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {/* Unread badge */}
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#22c55e] text-black text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}

            {/* Services Dropdown */}
            {!adminMode && (
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => {
                    setShowServices(!showServices);
                    setShowMenu(false);
                  }}
                  className="text-white hover:underline drop-shadow text-sm md:text-base flex items-center gap-1"
                >
                  Services
                  <svg
                    className={`w-4 h-4 transition-transform ${showServices ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showServices && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl max-h-80 overflow-y-auto z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 sticky top-0 bg-white">
                      <span className="text-sm font-semibold text-gray-600">All Services</span>
                      <button
                        onClick={() => setShowServices(false)}
                        className="text-gray-400 hover:text-gray-700 transition"
                        aria-label="Close services menu"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {servicesList.map((service, i) => (
                      <Link
                        key={i}
                        href={service.link}
                        onClick={() => setShowServices(false)}
                        className="block px-5 py-2.5 text-gray-800 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setShowMenu(!showMenu);
                  setShowServices(false);
                }}
                className="text-white drop-shadow-lg focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="py-1">
                    <Link
                      href="/"
                      onClick={() => setShowMenu(false)}
                      className="sm:hidden block px-5 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 text-sm"
                    >
                      Home
                    </Link>
                    {!adminMode && (
                      <>
                        <Link
                          href="/about"
                          onClick={() => setShowMenu(false)}
                          className="block px-5 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 text-sm"
                        >
                          About
                        </Link>
                        <Link
                          href="/contact"
                          onClick={() => setShowMenu(false)}
                          className="block px-5 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 text-sm"
                        >
                          Contact
                        </Link>
                      </>
                    )}

                    {isLoggedIn ? (
                      <>
                        {/* Messages link in hamburger menu with badge */}
                        {!adminMode && (
                          <Link
                            href="/messages"
                            onClick={() => setShowMenu(false)}
                            className="flex items-center justify-between px-5 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 text-sm"
                          >
                            <span>Messages</span>
                            {unreadMessages > 0 && (
                              <span className="bg-[#22c55e] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {unreadMessages > 9 ? '9+' : unreadMessages}
                              </span>
                            )}
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          onClick={() => setShowMenu(false)}
                          className="block px-5 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 text-sm"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/business-profile"
                          onClick={() => setShowMenu(false)}
                          className="block px-5 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-100 text-sm"
                        >
                          Business Profile
                        </Link>
                        {!isOnRegisterPage && !adminMode && (
                          <Link
                            href="/register-business"
                            onClick={() => setShowMenu(false)}
                            className="block px-5 py-3 text-yellow-600 font-semibold hover:bg-gray-100 border-b border-gray-100 text-sm"
                          >
                            Register Your Business
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-5 py-3 text-red-600 hover:bg-gray-100 text-sm"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setShowMenu(false)}
                        className="block px-5 py-3 text-gray-800 font-semibold hover:bg-gray-100 text-sm"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* ── Mobile Search Row (toggled) ── */}
        {shouldShowSearch && showMobileSearch && (
          <div className="mt-2 md:hidden relative" ref={mobileSearchRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setShowMobileSuggestions(false);
                  router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
                  setShowMobileSearch(false);
                }
              }}
            >
              <input
                type="text"
                placeholder="Search by name, location, service..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowMobileSuggestions(true); }}
                onFocus={() => setShowMobileSuggestions(true)}
                autoFocus
                className="w-full px-5 py-2.5 rounded-full bg-white text-gray-800 focus:outline-none shadow-lg text-sm"
              />
            </form>
            {showMobileSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => {
                      setSearchQuery(s);
                      setShowMobileSuggestions(false);
                      setShowMobileSearch(false);
                      router.push(`/search?query=${encodeURIComponent(s)}`);
                    }}
                    className="w-full text-left px-4 py-2.5 text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-0 text-sm flex items-center gap-2.5"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}