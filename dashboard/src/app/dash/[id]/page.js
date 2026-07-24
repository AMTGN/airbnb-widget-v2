"use client";

import { useState, useEffect, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
);

export default function Dashboard(props) {
  // Unwrap the params promise (Next.js 16 pattern)
  const params = use(props.params);
  const userId = params.id;

  const [rows, setRows] = useState([]);
  const [origin, setOrigin] = useState('');
  
  useEffect(() => {
    setOrigin(window.location.origin);
    
    async function loadData() {
      // Fetch user's existing listings by their Magic Link UUID
      const { data: listings, error } = await supabase
        .from('listings')
        .select('property_name, airbnb_url')
        .eq('user_id', userId);
        
      if (error) console.error("Fetch error:", error);
        
      let loadedRows = [];
      if (listings && listings.length > 0) {
        loadedRows = listings.map(l => ({ name: l.property_name, url: l.airbnb_url, loading: false }));
      }
      
      // Pad the array to exactly 10 rows
      while (loadedRows.length < 10) {
        loadedRows.push({ name: '', url: '', loading: false });
      }
      
      setRows(loadedRows.slice(0, 10));
    }
    
    loadData();
  }, [userId]);

  const copyCode = (index) => {
    const code = getIframeCode(rows[index].url);
    if (!code) return;
    navigator.clipboard.writeText(code);
    alert('Copied to clipboard!');
  };

  const copyMagicLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Magic Link copied! Bookmark this URL to access your dashboard later.');
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleUrlSubmit = async (index) => {
    const row = rows[index];
    if (!row.url || !row.url.includes('airbnb.com')) return;
    
    updateRow(index, 'loading', true);
    
    try {
      const res = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: row.url, name: row.name, userId }) // Pass the Magic Link UUID
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'An error occurred');
        updateRow(index, 'loading', false);
        return;
      }
      
      updateRow(index, 'loading', false);
      updateRow(index, 'timestamp', Date.now());
      
    } catch (e) {
      console.error(e);
      alert('Failed to contact server');
      updateRow(index, 'loading', false);
    }
  };

  const getIframeCode = (url) => {
    if (!url || !origin) return '';
    const widgetUrl = `${origin}/api/widget?url=${encodeURIComponent(url)}`;
    return `<iframe src="${widgetUrl}" width="300" height="150" frameborder="0" scrolling="no"></iframe>`;
  };

  if (rows.length === 0) {
    return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>Loading dashboard...</div>;
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f7f7f7', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ color: '#FF5A5F', margin: 0 }}>My Private Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>ID: {userId}</p>
        </div>
        <button 
          onClick={copyMagicLink}
          style={{ padding: '10px 15px', background: '#222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Copy My Magic Link 🔗
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 2 }}>
              <input 
                type="text" 
                placeholder="Property Name (e.g., Cozy Cabin)" 
                value={row.name}
                onChange={(e) => updateRow(i, 'name', e.target.value)}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Paste Airbnb URL here..." 
                  value={row.url}
                  onChange={(e) => updateRow(i, 'url', e.target.value)}
                  onBlur={() => handleUrlSubmit(i)} 
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button 
                  onClick={() => handleUrlSubmit(i)}
                  disabled={row.loading}
                  style={{ padding: '10px 15px', background: row.loading ? '#ccc' : '#FF5A5F', color: 'white', border: 'none', borderRadius: '4px', cursor: row.loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                >
                  {row.loading ? 'Scraping...' : 'Generate Widget'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={getIframeCode(row.url)}
                  placeholder="Iframe code will appear here..." 
                  style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '4px', fontFamily: 'monospace' }}
                />
                <button 
                  onClick={() => copyCode(i)}
                  style={{ padding: '10px 20px', background: '#222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Copy Code
                </button>
              </div>
            </div>
            <div style={{ flex: 1, border: '1px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px', background: '#fafafa', position: 'relative', overflow: 'hidden' }}>
              {row.url ? (
                <iframe src={`${origin}/api/widget?url=${encodeURIComponent(row.url)}${row.timestamp ? '&t='+row.timestamp : ''}`} width="100%" height="100%" frameBorder="0" scrolling="no" style={{ position: 'absolute', top: 0, left: 0 }}></iframe>
              ) : (
                <span style={{ color: '#999', fontSize: '14px' }}>Preview...</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
