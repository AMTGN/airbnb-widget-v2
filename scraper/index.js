import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeListing(page, url) {
  console.log(`Scraping: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); 
    
    const text = await page.evaluate(() => document.body.innerText);
    
    // Look for various formats of rating and reviews in the page text
    const ratingMatch = text.match(/Rated ([\d\.]+) out of 5 stars/i) || text.match(/([\d\.]+)\n*·\n*\d+\s*reviews/i);
    const reviewsMatch = text.match(/([\d,]+)\s*reviews/i);
    
    if (ratingMatch || reviewsMatch) {
      return {
        rating: ratingMatch ? ratingMatch[1] : 'New',
        reviews_count: reviewsMatch ? reviewsMatch[1].replace(',', '') : '0'
      };
    }
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
  }
  return null;
}

async function main() {
  console.log("Fetching URLs from Supabase...");
  const { data: listings, error } = await supabase.from('listings').select('id, airbnb_url');
  
  if (error) {
    console.error("Failed to fetch listings from Supabase:", error.message);
    return;
  }

  if (!listings || listings.length === 0) {
    console.log("No listings found in the database.");
    return;
  }

  // Use headless for cloud deployment (Render/Railway)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  for (const listing of listings) {
    if (!listing.airbnb_url) continue;

    const result = await scrapeListing(page, listing.airbnb_url);
    
    if (result) {
      console.log(`Success for ${listing.airbnb_url}: Rating ${result.rating}, Reviews ${result.reviews_count}`);
      
      const { error: updateError } = await supabase
        .from('listings')
        .update({ rating: result.rating, reviews_count: result.reviews_count, last_scraped_at: new Date() })
        .eq('id', listing.id);
        
      if (updateError) {
        console.error(`Error updating Supabase for ${listing.id}:`, updateError.message);
      } else {
        console.log(`Updated database successfully.`);
      }
    }
    // Delay between requests to prevent aggressive rate limiting
    await page.waitForTimeout(5000);
  }

  await browser.close();
  console.log("Scraping complete.");
}

main().catch(console.error);
