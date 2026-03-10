require('dotenv').config();

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// CORS - allow frontend (update for production domain later)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

const upload = multer({ storage: multer.memoryStorage() });

// Supabase client (service role for server)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Auth middleware (used on protected routes)
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = user;
  next();
};

// Geocoding function with OSM Nominatim (public instance)
async function geocodeWithNominatim(address) {
  try {
    const query = encodeURIComponent(`${address}, Nigeria`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ng&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NaijaFind/1.0 (your-email@domain.com)', // ← Replace with your real email/contact!
        'Referer': 'https://your-naijafind-domain.com' // Optional, replace with your domain
      }
    });

    if (!response.ok) throw new Error(`Nominatim error: ${response.statusText}`);

    const data = await response.json();
    if (data.length === 0) return null;

    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null; // Fallback: no coords
  }
}

// Routes

// Signup (verify Firebase ID token from client)
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({
    message: 'User created successfully',
    user: data.user,
    session: data.session
  });
});

// Login (same as signup - verify ID token)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.json({
    message: 'Logged in successfully',
    user: data.user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});

// logout route
app.post('/api/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  const token = authHeader.split(' ')[1];
  
  // Create a user-scoped client to sign out the specific session
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { error } = await userSupabase.auth.signOut();
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Logged out successfully' });
});

// Add Place (with image upload + geocoding + packages)
app.post('/api/add-place', requireAuth, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  const {
    name,
    category,
    shortDesc,
    fullDesc,
    services,
    prices,
    onlineBooking,
    address,
    phone,
    website,
    operatingHours,
    socialMedia,
    package: selectedPackage = 'free'
  } = req.body;

  // Basic validation
  if (!name || !category || !address) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const userId = req.user.id;  // ← This is correct – from Supabase auth

    // Geocode address automatically
    const coords = await geocodeWithNominatim(address);
    let location = null;
    if (coords) {
      location = `POINT(${coords.lng} ${coords.lat})`;
    } else {
      location = 'POINT(3.465 6.428)';
      console.warn(`Geocoding failed for address: ${address}. Using fallback.`);
    }

    // Upload main image
    let mainImageUrl = null;
    const mainImageFile = req.files?.mainImage?.[0];
    if (mainImageFile) {
      const fileExt = mainImageFile.mimetype.split('/')[1];
      const fileName = `places/${userId}/main_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, mainImageFile.buffer, { contentType: mainImageFile.mimetype });
      if (error) throw error;
      mainImageUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
    }

    // Upload gallery
    const galleryUrls = [];
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const fileExt = file.mimetype.split('/')[1];
        const fileName = `places/${userId}/gallery_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file.buffer, { contentType: file.mimetype });
        if (error) {
          console.error('Gallery upload error:', error);
          continue;
        }
        galleryUrls.push(supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl);
      }
    }

    // Insert to places table
    const { data, error } = await supabase
      .from('places')
      .insert([{
        user_id: userId,
        name,
        category,
        short_desc: shortDesc || null,
        full_desc: fullDesc || null,
        services: services ? services.split(',').map(s => s.trim()) : [],
        prices: prices || null,
        online_booking: onlineBooking === 'true' || onlineBooking === true,
        address,
        location,
        phone: phone || null,
        website: website || null,
        operating_hours: operatingHours || null,
        social_media: socialMedia || null,
        image_url: mainImageUrl,
        gallery_urls: galleryUrls,
        priority: 0,
        approved: false,
        package: selectedPackage
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Business registered successfully', place: data[0] });
  } catch (error) {
    console.error('Add place error:', error);
    res.status(500).json({ message: 'Failed to register business', error: error.message });
  }
});

// Create Stripe Subscription Session (for paid packages)
app.post('/api/create-subscription-session', requireAuth, async (req, res) => {
  const { package: selectedPackage, businessData } = req.body;

  if (!selectedPackage || !['basic', 'pro'].includes(selectedPackage)) { // Adjust tiers
    return res.status(400).json({ message: 'Invalid package' });
  }

  const priceMap = {
    basic: process.env.STRIPE_BASIC_PRICE_ID, // ← Set these in .env (create in Stripe dashboard)
    pro: process.env.STRIPE_PRO_PRICE_ID,
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceMap[selectedPackage], quantity: 1 }],
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/register-business?cancelled=true`,
      metadata: {
        userId: req.userId,
        package: selectedPackage,
        ...businessData // ← All form data here for webhook save (name, address, etc.)
      }
    });

    res.json({ sessionUrl: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Stripe Webhook (for post-payment save) – Add this endpoint + secure it
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // ← Set in .env (from Stripe dashboard)
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, package: selectedPackage, name, category, shortDesc, fullDesc, services, prices, onlineBooking, address, phone, website, operatingHours, socialMedia } = session.metadata;

    // Geocode address
    const coords = await geocodeWithNominatim(address);
    let location = null;
    if (coords) {
      location = `POINT(${coords.lng} ${coords.lat})`;
    } else {
      location = 'POINT(3.465 6.428)'; // Fallback
    }

    // Insert to DB (similar to add-place, but no images here – assume handled separately or add if needed)
    const { error } = await supabase
      .from('places')
      .insert([{
        user_id: userId,
        name,
        category,
        short_desc: shortDesc,
        full_desc: fullDesc,
        services: services ? services.split(',').map(s => s.trim()) : [],
        prices,
        online_booking: onlineBooking === 'true',
        address,
        location,
        phone,
        website,
        operating_hours: operatingHours,
        social_media: socialMedia,
        image_url: null, // Handle images post-payment if needed
        gallery_urls: [],
        priority: selectedPackage === 'pro' ? 2 : 1, // Example: higher for paid
        approved: false,
        package: selectedPackage
      }]);

    if (error) console.error('Webhook DB insert error:', error);
  }

  res.json({ received: true });
});

// Get My Business
app.get('/api/my-business', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('user_id', req.user.id)  // ← Change req.userId to req.user.id
    .single();

  if (error || !data) return res.status(404).json({ message: 'No business found' });
  res.json(data);
});

// Update Business
app.put('/api/update-business', requireAuth, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  const { 
    name, category, shortDesc, fullDesc, services, prices, 
    onlineBooking, address, phone, website, operatingHours, socialMedia 
  } = req.body;
  const userId = req.user.id;

  try {
    // Get existing business to preserve current images
    const { data: existingBusiness } = await supabase
      .from('places')
      .select('image_url, gallery_urls')
      .eq('user_id', userId)
      .single();

    let mainImageUrl = existingBusiness?.image_url;
    let galleryUrls = existingBusiness?.gallery_urls || [];

    // Upload new main image if provided
    const mainImageFile = req.files?.mainImage?.[0];
    if (mainImageFile) {
      const fileExt = mainImageFile.mimetype.split('/')[1];
      const fileName = `places/${userId}/main_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, mainImageFile.buffer, { contentType: mainImageFile.mimetype });
      if (!error) {
        mainImageUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
      }
    }

    // Upload new gallery images if provided
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const fileExt = file.mimetype.split('/')[1];
        const fileName = `places/${userId}/gallery_${Date.now()}_${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file.buffer, { contentType: file.mimetype });
        if (!error) {
          galleryUrls.push(supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl);
        }
      }
    }

    // Update database
    const { error } = await supabase
      .from('places')
      .update({
        name, 
        category, 
        short_desc: shortDesc, 
        full_desc: fullDesc,
        services: services ? services.split(',').map(s => s.trim()) : [],
        prices, 
        online_booking: onlineBooking === 'true' || onlineBooking === true,
        address, 
        phone, 
        website, 
        operating_hours: operatingHours, 
        social_media: socialMedia,
        image_url: mainImageUrl,
        gallery_urls: galleryUrls
      })
      .eq('user_id', userId);

    if (error) throw error;
    
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: err.message });
  }
});

//Admin code 
// Admin middleware
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });
  if (user.user_metadata?.is_admin !== true) return res.status(403).json({ error: 'Admins only' });
  
  req.user = user;
  next();
};

// Get all places for admin
app.get('/api/admin/places', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Fetch emails from auth.users for each place
  const placesWithEmail = await Promise.all(
    data.map(async (place) => {
      const { data: userData } = await supabase.auth.admin.getUserById(place.user_id);
      return { ...place, owner_email: userData?.user?.email || 'Unknown' };
    })
  );

  res.json(placesWithEmail);
});

// Approve/decline a place
app.patch('/api/admin/places/:id', requireAdmin, async (req, res) => {
  const { approved } = req.body;
  const { error } = await supabase
    .from('places')
    .update({ approved })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Updated successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- JWT Secret:', process.env.JWT_SECRET ? '✓' : '✗');
  console.log('- Supabase URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.log('- Supabase Key:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
  console.log('- Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? '✓' : '✗'); // ← Updated from PUB to SECRET
  console.log('- Stripe Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET ? '✓' : '✗'); // ← New
  console.log('- Stripe Basic Price ID:', process.env.STRIPE_BASIC_PRICE_ID ? '✓' : '✗'); // ← New
  console.log('- Stripe Pro Price ID:', process.env.STRIPE_PRO_PRICE_ID ? '✓' : '✗'); // ← New
});