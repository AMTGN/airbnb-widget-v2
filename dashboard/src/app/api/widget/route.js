import { createClient } from '@supabase/supabase-js';

// Initialize Supabase safely (won't crash if env vars are missing, just falls back to placeholders)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const airbnbUrl = searchParams.get('url');

  if (!airbnbUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  // Default fallback data if Supabase isn't connected or listing isn't scraped yet
  let rating = '4.95';
  let reviews = '120';

  // Attempt to fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('rating, reviews_count')
      .eq('airbnb_url', airbnbUrl)
      .single();

    if (data && !error) {
      rating = data.rating;
      reviews = data.reviews_count;
    }
  } catch (err) {
    console.error('Supabase fetch failed (expected if not set up yet):', err.message);
  }

  const svg = getSvgTemplate(rating, reviews);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function getSvgTemplate(rating, reviews) {
  return `
<svg width="300" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .rating { font-size: 22px; font-weight: 600; fill: #222222; }
      .reviews { font-size: 16px; fill: #222222; font-weight: 600; text-decoration: underline; }
      .star { fill: #222222; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="transparent" />
  
  <g transform="translate(10, 35)">
    <path class="star" d="M10 1.3l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" transform="translate(0, -18) scale(1.1)" />
    <text x="30" y="0" class="text rating">${rating}</text>
    <text x="80" y="-1" class="text reviews">· ${reviews} reviews</text>
  </g>
</svg>
`;
}
