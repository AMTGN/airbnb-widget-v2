import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const githubToken = process.env.GITHUB_TOKEN; // Needed to trigger the action

export async function POST(request) {
  try {
    const { url, name } = await request.json();

    if (!url || !url.includes('airbnb.com')) {
      return new Response('Invalid Airbnb URL', { status: 400 });
    }

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Insert the URL into the database (ignore error if it already exists because it's marked UNIQUE)
      const { error } = await supabase
        .from('listings')
        .insert([{ airbnb_url: url, property_name: name || 'Unknown' }])
        .select();
        
      if (error && error.code !== '23505') { // 23505 is unique violation (already exists)
        console.error("Supabase insert error:", error.message);
      }
    }

    // Trigger the GitHub Action Scraper
    if (githubToken) {
      const githubRes = await fetch('https://api.github.com/repos/AMTGN/airbnb-widget-v2/actions/workflows/scraper.yml/dispatches', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'Airbnb-Widget-App'
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (!githubRes.ok) {
        console.error("Failed to trigger GitHub Action:", await githubRes.text());
      }
    } else {
      console.log("No GITHUB_TOKEN provided, skipping scraper trigger.");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
