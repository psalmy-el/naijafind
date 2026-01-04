export interface Place {
  id: string;
  name: string;
  category: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  services: string[];
  prices: string;
  onlineBooking: boolean;
  location: { lat: number; lng: number };
  address: string;
  gallery: string[]; // New: array of additional images
}

export interface Place {
  id: string;
  name: string;
  category: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  services: string[];
  prices: string;
  onlineBooking: boolean;
  location: { lat: number; lng: number };
  address: string;
  gallery: string[]; // New: array of additional images
}

export const places: Place[] = [
  {
    id: '1',
    name: 'Nok by Alara',
    category: 'Food',
    image: 'https://images.ft.com/v3/image/raw/ftcms%3A7b72aa9b-6051-4cf6-ab95-b82c2b7d704c?source=next-article&fit=scale-down&quality=highest&width=1440&dpr=1',
    shortDesc: 'Contemporary African fine dining in Lekki.',
    fullDesc: 'Elegant spot for modern Nigerian dishes with great ambiance.',
    services: ['Dine-in', 'Bar', 'Events'],
    prices: '₦10,000 - ₦30,000',
    onlineBooking: true,
    location: { lat: 6.4281, lng: 3.4219 },
    address: 'Lekki Phase 1, Lagos',
    gallery: [
      'https://images.squarespace-cdn.com/content/v1/567409e1c21b86d850440d99/1471362899673-RGHCANPR4RVP8J7AGYWL/Nok+22.jpg?format=2500w',
      'https://www.top25restaurants.com/media/img/2025/03/nok-by-alara-nigeria.jpg',
      'https://static01.nyt.com/images/2017/10/22/travel/22bites1/22bites1-articleLarge.jpg?quality=75&auto=webp&disable=upscale',
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidRnhSja1q5j6MFYFupW6PCFW1KZxmwEh5TNxF8TNfbPLNB4cCZDskvEIkGhINbGQmUOJpbWm_boMN8JTJT0wGcDFEgTzTdvEQ4KA35XHOK97JUSwFMpMFnp_0prLD8jyufUUXMxhAAw/s1600/Tuke+Morgan%2527s+pictures+of+Nok+by+Alara+Lagos+%252824+of+39%2529.jpg',
    ],
  },
  {
    id: '2',
    name: 'Lagos Marriott Hotel',
    category: 'Hotel',
    image: 'https://ik.imgkit.net/3vlqs5axxjf/external/ik-seo/https://www.cfmedia.vfmleonardo.com/imageRepo/7/0/154/46/457/loslg-exterior-9338-hor-clsc_O/Marriott-Lagos-Hotel-Ikeja-Exterior.jpg?tr=w-780%2Ch-437%2Cfo-auto',
    shortDesc: 'Luxury international hotel in Ikeja.',
    fullDesc: 'Modern rooms, pool, and conference facilities near the airport.',
    services: ['Rooms', 'Pool', 'Restaurant'],
    prices: '₦80,000+ per night',
    onlineBooking: true,
    location: { lat: 6.5950, lng: 3.3433 },
    address: 'Ikeja GRA, Lagos',
    gallery: [
      'https://images.trvl-media.com/lodging/68000000/67300000/67292300/67292293/c839f7be.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill',
      'https://pix10.agoda.net/hotelImages/24333640/0/853c632b3e7c1059d9821788046c3eed.jpeg?ce=2&s=414x232',
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1d/33/b1/8b/outdoor-pool.jpg?w=700&h=-1&s=1',
      'https://images.trvl-media.com/lodging/68000000/67300000/67292300/67292293/8191a79c.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill',
      'https://images.trvl-media.com/lodging/68000000/67300000/67292300/67292293/a571172c.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill',
      'https://q-xx.bstatic.com/xdata/images/hotel/max500/484953706.jpg?k=e0476ff4566565b755c54b00d89b32c71eca44e70acf198c5356f38fb7ca6c71&o=',
    ],
  },
  {
    id: '3',
    name: 'Groomed by Elereka',
    category: 'Barber',
    image: 'https://images.fresha.com/locations/location-profile-images/796214/4204578/7943f5a7-22ba-44f8-9978-23d5468c1dd6-GroomedbyElerekaIkoyi-NG-Lagos-Lagos-Ikoyi-Fresha.jpg?class=venue-gallery-large&f_width=3840',
    shortDesc: 'Premium grooming and barber services in Ikoyi.',
    fullDesc: 'Trendy spot for sharp cuts, shaves, and luxury treatments.',
    services: ['Haircuts', 'Shaves', 'Facials'],
    prices: '₦5,000 - ₦15,000',
    onlineBooking: true,
    location: { lat: 6.4500, lng: 3.4667 },
    address: 'Ikoyi, Lagos',
    gallery: [
      'https://groomedbyelereka.com/images/gallery/gallery-35.jpg',
      'https://groomedbyelereka.com/_next/image?url=%2Fimages%2Ftestimonial-cover.jpg&w=3840&q=75',
      'https://www.beautyinlagos.com/wp-content/uploads/2024/10/PHOTO-2024-10-14-23-40-27-750x575.jpg',
      'https://images.fresha.com/locations/location-profile-images/796214/4204578/7943f5a7-22ba-44f8-9978-23d5468c1dd6-GroomedbyElerekaIkoyi-NG-Lagos-Lagos-Ikoyi-Fresha.jpg?class=venue-gallery-mobile&f_width=3840',
    ],
  },
  
  {
    id: '5',
    name: 'The Art Hotel Lagos',
    category: 'Hotel',
    image: 'https://ik.imgkit.net/3vlqs5axxjf/external/ik-seo/https://media.iceportal.com/150622/photos/74167192_XL/The-Art-Hotel-Exterior.jpg?tr=w-780%2Ch-437%2Cfo-auto',
    shortDesc: 'Boutique art-inspired hotel in Victoria Island.',
    fullDesc: 'Creative design, rooftop bar, and central location.',
    services: ['Rooms', 'Bar', 'Art Gallery'],
    prices: '₦50,000+ per night',
    onlineBooking: true,
    location: { lat: 6.4260, lng: 3.4240 },
    address: 'Victoria Island, Lagos',
    gallery: []
  },

  {
    id: '6',
    name: 'Tarkwa Bay Beach',
    category: 'Entertainment',
    image: 'https://a.travel-assets.com/findyours-php/viewfinder/images/res70/61000/61225-Lagos.jpg',
    shortDesc: 'Beautiful beach escape from the city hustle.',
    fullDesc: 'Relaxing spot for swimming, picnics, and water sports.',
    services: ['Beach Access', 'Boat Ride'],
    prices: 'Free entry (boat fee ~₦2,000)',
    onlineBooking: false,
    location: { lat: 6.4167, lng: 3.4167 },
    address: 'Tarkwa Bay, Lagos',
    gallery: []
  },
  // Add more as you grow!
];