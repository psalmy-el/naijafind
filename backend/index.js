require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────
// SHARED MAILER — explicit SMTP, IPv4 forced (fixes WSL/Windows timeout)
// ─────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.NOTIFY_EMAIL,
      pass: process.env.NOTIFY_EMAIL_PASS, // 16-char App Password, no spaces
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: false },
    family: 4, // Force IPv4 — prevents WSL IPv6 timeout
  });
}

// ─────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired session' });
  req.user = user;
  next();
};

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

// ─────────────────────────────────────────
// GEOCODING
// ─────────────────────────────────────────
async function geocodeWithNominatim(address) {
  try {
    const query = encodeURIComponent(`${address}, Nigeria`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ng&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NaijaFind/1.0 (your-email@domain.com)',
        'Referer': 'https://your-naijafind-domain.com'
      }
    });
    if (!response.ok) throw new Error(`Nominatim error: ${response.statusText}`);
    const data = await response.json();
    if (data.length === 0) return null;
    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

// ──────────────────────────────────────────
// AUTH ROUTES
// ──────────────────────────────────────────

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'User created successfully', user: data.user, session: data.session });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({
    message: 'Logged in successfully',
    user: data.user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});

app.post('/api/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { error } = await userSupabase.auth.signOut();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Logged out successfully' });
});

// ──────────────────────────────────────────
// PLACES ROUTES
// ──────────────────────────────────────────

app.post('/api/add-place', requireAuth, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  const {
    name, category, shortDesc, fullDesc, services, prices,
    onlineBooking, address, phone, website, operatingHours,
    socialMedia, package: selectedPackage = 'free'
  } = req.body;

  if (!name || !category || !address) return res.status(400).json({ message: 'Missing required fields' });

  try {
    const userId = req.user.id;
    const coords = await geocodeWithNominatim(address);
    let location = coords ? `POINT(${coords.lng} ${coords.lat})` : 'POINT(3.465 6.428)';
    if (!coords) console.warn(`Geocoding failed for: ${address}. Using fallback.`);

    let mainImageUrl = null;
    const mainImageFile = req.files?.mainImage?.[0];
    if (mainImageFile) {
      const fileExt = mainImageFile.mimetype.split('/')[1];
      const fileName = `places/${userId}/main_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, mainImageFile.buffer, { contentType: mainImageFile.mimetype });
      if (error) throw error;
      mainImageUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
    }

    const galleryUrls = [];
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const fileExt = file.mimetype.split('/')[1];
        const fileName = `places/${userId}/gallery_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('images').upload(fileName, file.buffer, { contentType: file.mimetype });
        if (error) { console.error('Gallery upload error:', error); continue; }
        galleryUrls.push(supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl);
      }
    }

    const { data, error } = await supabase.from('places').insert([{
      user_id: userId, name, category,
      short_desc: shortDesc || null, full_desc: fullDesc || null,
      services: services ? services.split(',').map(s => s.trim()) : [],
      prices: prices || null,
      online_booking: onlineBooking === 'true' || onlineBooking === true,
      address, location,
      phone: phone || null, website: website || null,
      operating_hours: operatingHours || null, social_media: socialMedia || null,
      image_url: mainImageUrl, gallery_urls: galleryUrls,
      priority: 0, approved: false, package: selectedPackage
    }]).select();

    if (error) throw error;
    res.status(201).json({ message: 'Business registered successfully', place: data[0] });
  } catch (err) {
    console.error('Add place error:', err);
    res.status(500).json({ message: 'Failed to register business', error: err.message });
  }
});

app.post('/api/create-subscription-session', requireAuth, async (req, res) => {
  const { package: selectedPackage, businessData } = req.body;
  if (!selectedPackage || !['basic', 'pro'].includes(selectedPackage)) return res.status(400).json({ message: 'Invalid package' });
  const priceMap = { basic: process.env.STRIPE_BASIC_PRICE_ID, pro: process.env.STRIPE_PRO_PRICE_ID };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceMap[selectedPackage], quantity: 1 }],
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/register-business?cancelled=true`,
      metadata: { userId: req.userId, package: selectedPackage, ...businessData }
    });
    res.json({ sessionUrl: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, package: selectedPackage, name, category, shortDesc, fullDesc, services, prices, onlineBooking, address, phone, website, operatingHours, socialMedia } = session.metadata;
    const coords = await geocodeWithNominatim(address);
    const location = coords ? `POINT(${coords.lng} ${coords.lat})` : 'POINT(3.465 6.428)';
    const { error } = await supabase.from('places').insert([{
      user_id: userId, name, category, short_desc: shortDesc, full_desc: fullDesc,
      services: services ? services.split(',').map(s => s.trim()) : [],
      prices, online_booking: onlineBooking === 'true', address, location, phone, website,
      operating_hours: operatingHours, social_media: socialMedia,
      image_url: null, gallery_urls: [],
      priority: selectedPackage === 'pro' ? 2 : 1, approved: false, package: selectedPackage
    }]);
    if (error) console.error('Webhook DB insert error:', error);
  }
  res.json({ received: true });
});

app.get('/api/my-business', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('places').select('*').eq('user_id', req.user.id).single();
  if (error || !data) return res.status(404).json({ message: 'No business found' });
  res.json(data);
});

app.put('/api/update-business', requireAuth, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  const { name, category, shortDesc, fullDesc, services, prices, onlineBooking, address, phone, website, operatingHours, socialMedia } = req.body;
  const userId = req.user.id;
  try {
    const { data: existingBusiness } = await supabase.from('places').select('image_url, gallery_urls').eq('user_id', userId).single();
    let mainImageUrl = existingBusiness?.image_url;
    let galleryUrls = existingBusiness?.gallery_urls || [];
    const mainImageFile = req.files?.mainImage?.[0];
    if (mainImageFile) {
      const fileExt = mainImageFile.mimetype.split('/')[1];
      const fileName = `places/${userId}/main_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, mainImageFile.buffer, { contentType: mainImageFile.mimetype });
      if (!error) mainImageUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
    }
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const fileExt = file.mimetype.split('/')[1];
        const fileName = `places/${userId}/gallery_${Date.now()}_${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('images').upload(fileName, file.buffer, { contentType: file.mimetype });
        if (!error) galleryUrls.push(supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl);
      }
    }
    const { error } = await supabase.from('places').update({
      name, category, short_desc: shortDesc, full_desc: fullDesc,
      services: services ? services.split(',').map(s => s.trim()) : [],
      prices, online_booking: onlineBooking === 'true' || onlineBooking === true,
      address, phone, website, operating_hours: operatingHours, social_media: socialMedia,
      image_url: mainImageUrl, gallery_urls: galleryUrls
    }).eq('user_id', userId);
    if (error) throw error;
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ──────────────────────────────────────────
// CLIENT MESSAGE ROUTES (for logged-in users)
// ──────────────────────────────────────────

// GET /api/my-messages — fetch all messages belonging to this user's email
// ──────────────────────────────────────────
// CLIENT MESSAGE ROUTES (for logged-in users)
// ──────────────────────────────────────────

// GET /api/my-messages
// Fetches all contact_messages WHERE email = logged-in user's email
app.get('/api/my-messages', requireAuth, async (req, res) => {
  try {
    const email = req.user.email;

    const { data, error } = await supabase
      .from('contact_messages')
      .select(`
        id,
        name,
        email,
        subject,
        message,
        reply,
        replied_at,
        user_reply,
        user_replied_at,
        user_has_read_reply,
        created_at
      `)
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Normalise: if user_has_read_reply column doesn't exist yet (NULL),
    // treat a message as "unread" if it has a reply but user_has_read_reply is null/false
    const normalised = (data || []).map(m => ({
      ...m,
      user_has_read_reply: m.user_has_read_reply === true ? true : false,
    }));

    res.json(normalised);
  } catch (err) {
    console.error('my-messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/my-messages/unread-count
// Returns count of messages where admin replied but user hasn't seen it yet
app.get('/api/my-messages/unread-count', requireAuth, async (req, res) => {
  try {
    const email = req.user.email;

    const { data, error } = await supabase
      .from('contact_messages')
      .select('id, reply, user_has_read_reply')
      .eq('email', email)
      .not('reply', 'is', null); // only messages that have a reply

    if (error) throw error;

    // Count those where user hasn't read the reply yet
    const count = (data || []).filter(m => !m.user_has_read_reply).length;

    res.json({ count });
  } catch (err) {
    console.error('unread-count error:', err);
    res.status(500).json({ error: err.message, count: 0 });
  }
});

// PATCH /api/my-messages/:id/read
// Called when user opens a message — marks admin reply as seen
app.patch('/api/my-messages/:id/read', requireAuth, async (req, res) => {
  try {
    const email = req.user.email;

    const { error } = await supabase
      .from('contact_messages')
      .update({ user_has_read_reply: true })
      .eq('id', req.params.id)
      .eq('email', email); // security: only their own messages

    if (error) throw error;
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('mark-read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/my-messages/:id/reply
// User sends a follow-up reply to the admin
app.post('/api/my-messages/:id/reply', requireAuth, async (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;
  const email = req.user.email;

  if (!reply || !reply.trim()) return res.status(400).json({ error: 'Reply text required.' });

  try {
    // Verify this message belongs to this user by email
    const { data: msg, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .eq('email', email)
      .single();

    if (fetchError || !msg) return res.status(404).json({ error: 'Message not found.' });

    // Save user reply to DB
    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({
        user_reply: reply.trim(),
        user_replied_at: new Date().toISOString(),
        user_reply_read: false, // admin hasn't read this yet
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Notify admin by email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `NaijaFind <${process.env.NOTIFY_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `💬 ${msg.name} replied to your message on NaijaFind`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #f97316;">User Reply — NaijaFind</h2>
          <p><strong>From:</strong> ${msg.name} (${email})</p>
          <p><strong>Subject:</strong> ${msg.subject || 'N/A'}</p>
          <div style="background: #fff; border-radius: 8px; padding: 16px; margin-top: 12px; border-left: 4px solid #22c55e;">
            <p style="color: #888; font-size: 12px; margin: 0 0 6px; text-transform: uppercase;">Their reply:</p>
            <p style="white-space: pre-wrap; color: #333; margin: 0;">${reply.trim()}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px;">View the full conversation in your admin dashboard.</p>
        </div>
      `
    }).catch(err => console.error('Admin notify email error:', err)); // don't fail the request if email fails

    res.json({ message: 'Reply sent.' });
  } catch (err) {
    console.error('User reply error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/contact-messages/:id/reply
// Admin replies to a user — saves reply, sends email with link to /messages
app.post('/api/admin/contact-messages/:id/reply', requireAdmin, async (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;

  if (!reply || !reply.trim()) return res.status(400).json({ error: 'Reply text is required.' });

  try {
    const { data: msg, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !msg) return res.status(404).json({ error: 'Message not found.' });

    const transporter = createTransporter();

    // Email user: reply + big CTA button linking to /messages
    await transporter.sendMail({
      from: `NaijaFind <${process.env.NOTIFY_EMAIL}>`,
      to: msg.email,
      subject: `You have a reply from NaijaFind — Re: ${msg.subject || 'your message'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #f97316; margin-bottom: 4px;">NaijaFind</h2>
          <p style="color: #555; font-size: 14px; margin-bottom: 24px;">You have a new reply 💬</p>

          <p style="color: #333; font-size: 16px; margin-bottom: 6px;">Hey <strong>${msg.name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            The NaijaFind team has replied to your message:
          </p>

          <div style="background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f97316;">
            <p style="color: #333; font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${reply.trim()}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.FRONTEND_URL}/messages"
              style="display: inline-block; background: #22c55e; color: #000; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: 0.01em;">
              View &amp; Reply on NaijaFind →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <div style="background: #f0f0f0; border-radius: 8px; padding: 16px;">
            <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Your original message:</p>
            <p style="color: #555; font-size: 13px; white-space: pre-wrap; margin: 0;">${msg.message}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px; text-align: center;">© NaijaFind · Lagos, Nigeria</p>
        </div>
      `,
    });

    // Save reply to DB + set user_has_read_reply = false so badge triggers
    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({
        reply: reply.trim(),
        replied_at: new Date().toISOString(),
        user_has_read_reply: false, // user hasn't seen this reply yet → badge will show
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error('Admin reply error:', err);
    res.status(500).json({ error: 'Failed to send reply: ' + err.message });
  }
});

// ──────────────────────────────────────────
// ADMIN ROUTES - PLACES
// ──────────────────────────────────────────

app.get('/api/admin/places', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('places').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const placesWithEmail = await Promise.all(
    data.map(async (place) => {
      const { data: userData } = await supabase.auth.admin.getUserById(place.user_id);
      return { ...place, owner_email: userData?.user?.email || 'Unknown' };
    })
  );
  res.json(placesWithEmail);
});

app.patch('/api/admin/places/:id', requireAdmin, async (req, res) => {
  const { approved } = req.body;
  const { error } = await supabase.from('places').update({ approved }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Updated successfully' });
});

// ──────────────────────────────────────────
// ADMIN ROUTES - CONTACT MESSAGES
// ──────────────────────────────────────────

app.get('/api/admin/contact-messages', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/admin/contact-messages/:id', requireAdmin, async (req, res) => {
  const { read } = req.body;
  const { error } = await supabase.from('contact_messages').update({ read: read ?? true }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Updated successfully' });
});

// POST /api/admin/contact-messages/:id/reply — admin replies to a user message
app.post('/api/admin/contact-messages/:id/reply', requireAdmin, async (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;

  if (!reply || !reply.trim()) return res.status(400).json({ error: 'Reply text is required.' });

  try {
    const { data: msg, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !msg) return res.status(404).json({ error: 'Message not found.' });

    const transporter = createTransporter();

    // ✅ Email to user: reply content + link to /messages page
    await transporter.sendMail({
      from: `NaijaFind <${process.env.NOTIFY_EMAIL}>`,
      to: msg.email,
      subject: `Re: ${msg.subject || 'Your message to NaijaFind'} — NaijaFind replied`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #f97316; margin-bottom: 4px;">NaijaFind</h2>
          <p style="color: #555; font-size: 14px; margin-bottom: 24px;">You have a new reply from our team</p>

          <p style="color: #333; font-size: 16px;">Hey <strong>${msg.name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Our team has replied to your message. Here's what they said:
          </p>

          <div style="background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #f97316;">
            <p style="color: #333; font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${reply.trim()}</p>
          </div>

          <!-- CTA button to open messages page -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.FRONTEND_URL}/messages"
              style="display: inline-block; background: #22c55e; color: #000; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
              View & Reply on NaijaFind →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <div style="background: #f0f0f0; border-radius: 8px; padding: 16px;">
            <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Your original message:</p>
            <p style="color: #555; font-size: 13px; white-space: pre-wrap; margin: 0;">${msg.message}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px; text-align: center;">© NaijaFind · Lagos, Nigeria</p>
        </div>
      `,
    });

    // Save reply + mark as read, reset read=false so user sees the badge
    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({
        reply: reply.trim(),
        replied_at: new Date().toISOString(),
        read: false // reset so the user sees an unread badge in the header
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Failed to send reply: ' + err.message });
  }
});

// ──────────────────────────────────────────
// PUBLIC ROUTES
// ──────────────────────────────────────────

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address.' });

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{ name, email, subject: subject || null, message }])
      .select()
      .single();

    if (error) throw error;

    const transporter = createTransporter();

    // Notify admin
    await transporter.sendMail({
      from: `NaijaFind <${process.env.NOTIFY_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `NaijaFind Contact: ${subject || 'New message'} — from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #f97316;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
          <div style="background: #fff; border-radius: 8px; padding: 16px; margin-top: 12px; border-left: 4px solid #f97316;">
            <p style="white-space: pre-wrap; color: #333;">${message}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px;">Reply from your admin dashboard at NaijaFind.</p>
        </div>
      `
    });

    // Confirmation to user
    await transporter.sendMail({
      from: `NaijaFind <${process.env.NOTIFY_EMAIL}>`,
      to: email,
      subject: `We received your message, ${name}! 👋`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #22c55e; margin-bottom: 4px;">NaijaFind</h2>
          <p style="color: #555; font-size: 14px; margin-bottom: 24px;">Message received ✅</p>
          <p style="color: #333; font-size: 16px;">Hey <strong>${name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Thanks for reaching out! We've received your message and our team will get back to you <strong>within 24 hours</strong>.
          </p>
          <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p style="color: #888; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your message</p>
            <p style="color: #555; font-size: 13px; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
          <p style="color: #555; font-size: 14px;">
            In the meantime, feel free to explore
            <a href="${process.env.FRONTEND_URL}" style="color: #22c55e; text-decoration: none;">NaijaFind</a>
            and discover amazing spots around you.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">© NaijaFind · Lagos, Nigeria</p>
        </div>
      `
    });

    res.status(201).json({ message: "Message received! We'll get back to you shortly." });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

app.get('/api/places', async (req, res) => {
  try {
    const { query, service, category } = req.query;
    let dbQuery = supabase
      .from('places')
      .select('id, name, category, short_desc, image_url, prices, address, services, online_booking, location, priority')
      .eq('approved', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (category && category !== 'All') dbQuery = dbQuery.ilike('category', `%${category}%`);
    if (service && service !== 'All') dbQuery = dbQuery.ilike('category', `%${service}%`);

    const { data, error } = await dbQuery;
    if (error) throw error;

    let results = data;
    if (query) {
      const lower = query.toLowerCase();
      results = data.filter(p =>
        p.name?.toLowerCase().includes(lower) ||
        p.address?.toLowerCase().includes(lower) ||
        p.category?.toLowerCase().includes(lower) ||
        p.services?.some(s => s.toLowerCase().includes(lower))
      );
    }

    results = results.map(p => ({ ...p, location: parseLocation(p.location) }));
    res.json(results);
  } catch (err) {
    console.error('Get places error:', err);
    res.status(500).json({ message: 'Failed to fetch places', error: err.message });
  }
});

app.get('/api/places/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('places').select('*').eq('id', req.params.id).eq('approved', true).single();
    if (error || !data) return res.status(404).json({ message: 'Place not found' });
    res.json({ ...data, location: parseLocation(data.location) });
  } catch (err) {
    console.error('Get place error:', err);
    res.status(500).json({ message: 'Failed to fetch place', error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [placesResult, categoriesResult] = await Promise.all([
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('approved', true),
      supabase.from('places').select('category').eq('approved', true),
    ]);
    const totalPlaces = placesResult.count || 0;
    const uniqueCategories = new Set((categoriesResult.data || []).map(p => p.category)).size;
    res.json({ spots: totalPlaces, categories: uniqueCategories });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ──────────────────────────────────────────
// HELPERS & SERVER
// ──────────────────────────────────────────

function parseLocation(locationStr) {
  if (!locationStr) return { lat: 6.428, lng: 3.465 };
  try {
    const match = locationStr.match(/POINT\(([^ ]+) ([^ )]+)\)/);
    if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  } catch (e) {}
  return { lat: 6.428, lng: 3.465 };
}

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('- Supabase URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.log('- Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? '✓' : '✗');
  console.log('- Notify Email:', process.env.NOTIFY_EMAIL ? '✓' : '✗');
});