import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { url, name, userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing Magic Link ID' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!url || !url.includes('airbnb.com')) {
      return new Response(JSON.stringify({ error: 'Invalid Airbnb URL' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if the user is at their 10 listing limit
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // If they already have 10 or more listings, check if they are UPDATING an existing one
    if (count >= 10) {
      const { data: existing } = await supabase
        .from('listings')
        .select('id')
        .eq('airbnb_url', url)
        .eq('user_id', userId)
        .single();
        
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Limit reached: You can only have 10 listings per Magic Link.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 1. Instantly Scrape Airbnb
    let rating = '0.00';
    let reviews_count = '0';
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await res.text();
      
      const ratingMatch = html.match(/Rated ([\d\.]+) out of 5 stars/i) || html.match(/([\d\.]+)\s*out of 5 stars/i);
      const reviewsMatch = html.match(/([\d,]+)\s*reviews/i);
      
      if (ratingMatch) rating = ratingMatch[1];
      if (reviewsMatch) reviews_count = reviewsMatch[1].replace(',', '');
    } catch (scrapeErr) {
      console.error("Direct fetch failed:", scrapeErr);
    }

    // 2. Update Supabase using Service Role Key
    const { error } = await supabase
      .from('listings')
      .upsert(
        { airbnb_url: url, property_name: name || 'Unknown', rating, reviews_count, last_scraped_at: new Date(), user_id: userId },
        { onConflict: 'airbnb_url' }
      );
      
    if (error) {
      console.error("Supabase upsert error:", error.message);
      return new Response(JSON.stringify({ error: 'Failed to save to database' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Return Instant Success
    return new Response(JSON.stringify({ success: true, rating, reviews_count }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
