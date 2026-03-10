// =========================================
// /api/add-place - Complete endpoint
// =========================================

app.post('/api/add-place', requireAuth, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('=== NEW BUSINESS REGISTRATION ===');
    console.log('User ID:', req.user.id);

    // 1. Get form fields
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

    // Debug: log exactly what came in
    console.log('Text fields received:', {
      name, category, address, package: selectedPackage,
      services, prices, onlineBooking, phone
    });

    // Required fields validation
    if (!name || !category || !address) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'Missing required fields',
        details: { name: !!name, category: !!category, address: !!address }
      });
    }

    // 2. Geocode address
    let location = null;
    const coords = await geocodeWithNominatim(address);
    if (coords) {
      const lng = Number(coords.lng).toFixed(6);
      const lat = Number(coords.lat).toFixed(6);
      location = `POINT(${lng} ${lat})`;
      console.log('Geocoded location:', location);
    } else {
      location = 'POINT(3.465 6.428)'; // Lagos fallback
      console.warn('Geocoding failed → using fallback');
    }

    // 3. Handle file uploads
    let mainImageUrl = null;
    const galleryUrls = [];

    // Main image
    if (req.files?.mainImage?.[0]) {
      const file = req.files.mainImage[0];
      const fileExt = file.mimetype.split('/')[1];
      const fileName = `places/${req.user.id}/main_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) {
        console.error('Main image upload error:', error);
      } else {
        mainImageUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        console.log('Main image uploaded:', mainImageUrl);
      }
    }

    // Gallery images
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const fileExt = file.mimetype.split('/')[1];
        const fileName = `places/${req.user.id}/gallery_${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) {
          console.error('Gallery upload error:', error);
          continue;
        }

        const url = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        galleryUrls.push(url);
      }
      console.log('Gallery images uploaded:', galleryUrls.length);
    }

    // 4. Calculate expiration for paid packages
    let expiresAt = null;
    if (selectedPackage !== 'free') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days
      console.log('Package expiration set:', expiresAt);
    }

    // 5. Insert into database
    const { data, error } = await supabase
      .from('places')
      .insert([{
        user_id: req.user.id,
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
        priority: selectedPackage === 'pro' ? 2 : selectedPackage === 'basic' ? 1 : 0,
        approved: false,
        package: selectedPackage,
        package_expires_at: expiresAt
      }])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Business created successfully:', data.id);

    res.status(201).json({
      message: 'Business registered successfully',
      place: data
    });

  } catch (err) {
    console.error('Full error in /api/add-place:', err);
    res.status(500).json({
      message: 'Failed to register business',
      error: err.message
    });
  }
});