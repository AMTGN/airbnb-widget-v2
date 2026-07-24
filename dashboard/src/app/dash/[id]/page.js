"use client";

import { useState, useEffect, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
);

export default function Dashboard(props) {
  const params = use(props.params);
  const userId = params.id;

  const [rows, setRows] = useState([]);
  const [origin, setOrigin] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  
  useEffect(() => {
    setOrigin(window.location.origin);
    
    async function loadData() {
      const { data: listings, error } = await supabase
        .from('listings')
        .select('property_name, airbnb_url')
        .eq('user_id', userId);
        
      if (error) console.error("Fetch error:", error);
        
      let loadedRows = [];
      if (listings && listings.length > 0) {
        // Load existing listings
        loadedRows = listings.map(l => ({ 
          name: l.property_name, 
          url: l.airbnb_url, 
          loading: false,
          theme: 'light',
          saved: true 
        }));
      }
      
      // If they have less than 10, add one empty row for input
      if (loadedRows.length < 10) {
        loadedRows.push({ name: '', url: '', loading: false, theme: 'light', saved: false });
      }
      
      setRows(loadedRows);
      setLoadingData(false);
    }
    
    loadData();
  }, [userId]);

  const copyCode = (index) => {
    const code = getIframeCode(index);
    if (!code) return;
    navigator.clipboard.writeText(code);
    alert('Copied to clipboard!');
  };

  const copyMagicLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Dashboard Link copied! Bookmark this URL to access your widgets later.');
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
        body: JSON.stringify({ url: row.url, name: row.name, userId })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'An error occurred');
        updateRow(index, 'loading', false);
        return;
      }
      
      updateRow(index, 'loading', false);
      updateRow(index, 'timestamp', Date.now());
      updateRow(index, 'saved', true);
      
    } catch (e) {
      console.error(e);
      alert('Failed to contact server');
      updateRow(index, 'loading', false);
    }
  };

  const addNewListingSlot = () => {
    if (rows.length < 10) {
      setRows([...rows, { name: '', url: '', loading: false, theme: 'light', saved: false }]);
    }
  };

  const getIframeCode = (index) => {
    const row = rows[index];
    if (!row.url || !origin) return '';
    let widgetUrl = `${origin}/api/widget?url=${encodeURIComponent(row.url)}`;
    if (row.theme === 'dark') {
      widgetUrl += '&theme=dark';
    }
    return `<iframe src="${widgetUrl}" width="300" height="150" frameborder="0" scrolling="no"></iframe>`;
  };

  const getPreviewUrl = (index) => {
    const row = rows[index];
    if (!row.url || !origin) return '';
    let widgetUrl = `${origin}/api/widget?url=${encodeURIComponent(row.url)}`;
    if (row.theme === 'dark') {
      widgetUrl += '&theme=dark';
    }
    if (row.timestamp) {
      widgetUrl += `&t=${row.timestamp}`;
    }
    return widgetUrl;
  };

  if (loadingData) {
    return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>Loading dashboard...</div>;
  }

  // Check if we can show the "Add Another" button
  // It only shows if the last row is fully saved, and total rows < 10
  const canAddMore = rows.length > 0 && rows.length < 10 && rows[rows.length - 1].saved;

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f7f7f7', minHeight: '100vh' }}>
      <style>{`
        ::placeholder {
          color: #666 !important;
          opacity: 1 !important;
        }
        :-ms-input-placeholder {
          color: #666 !important;
        }
        ::-ms-input-placeholder {
          color: #666 !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ color: '#FF5A5F', margin: 0 }}>My Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Manage up to 10 Airbnb Widgets</p>
        </div>
        <button 
          onClick={copyMagicLink}
          style={{ padding: '12px 20px', background: '#222', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
        >
          Save & Share Dashboard Link 🔗
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
        {/* Column Headers */}
        <div style={{ display: 'flex', gap: '20px', padding: '0 25px' }}>
          <div style={{ flex: 2, display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, fontWeight: 'bold', color: '#444', fontSize: '14px' }}>Property Name</div>
            <div style={{ flex: 2, fontWeight: 'bold', color: '#444', fontSize: '14px' }}>Airbnb URL</div>
          </div>
          <div style={{ flex: 1, fontWeight: 'bold', color: '#444', fontSize: '14px', textAlign: 'center' }}>Live Preview</div>
        </div>

        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 2 }}>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. Cozy Cabin" 
                  value={row.name}
                  onChange={(e) => updateRow(i, 'name', e.target.value)}
                  onBlur={() => row.url && handleUrlSubmit(i)} 
                  style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
                />
                <input 
                  type="text" 
                  placeholder="https://www.airbnb.com/rooms/12345" 
                  value={row.url}
                  onChange={(e) => updateRow(i, 'url', e.target.value)}
                  onBlur={() => handleUrlSubmit(i)} 
                  style={{ flex: 2, padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
                />
              </div>

              {row.loading && <div style={{ color: '#FF5A5F', fontWeight: 'bold' }}>Scraping Airbnb Data...</div>}

              {/* Show Code and Customization only if it's saved/loaded */}
              {row.saved && !row.loading && (
                <div style={{ background: '#fafafa', border: '1px solid #eee', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* Theme Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#444' }}>Theme:</span>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                      <input 
                        type="radio" 
                        name={`theme-${i}`} 
                        checked={row.theme === 'light'} 
                        onChange={() => updateRow(i, 'theme', 'light')} 
                        style={{ cursor: 'pointer' }}
                      /> Light
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', marginLeft: '10px' }}>
                      <input 
                        type="radio" 
                        name={`theme-${i}`} 
                        checked={row.theme === 'dark'} 
                        onChange={() => updateRow(i, 'theme', 'dark')} 
                        style={{ cursor: 'pointer' }}
                      /> Dark (Transparent)
                    </label>
                  </div>

                  {/* Embed Code */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={getIframeCode(i)}
                      style={{ flex: 1, padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', color: '#555' }}
                    />
                    <button 
                      onClick={() => copyCode(i)}
                      style={{ padding: '0 20px', background: '#FF5A5F', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Area */}
            <div style={{ flex: 1, border: '1px solid #eee', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px', background: row.theme === 'dark' ? '#333' : '#fafafa', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' }}>
              {row.saved && !row.loading ? (
                <iframe src={getPreviewUrl(i)} width="100%" height="100%" frameBorder="0" scrolling="no" style={{ position: 'absolute', top: 0, left: 0 }}></iframe>
              ) : (
                <span style={{ color: row.theme === 'dark' ? '#aaa' : '#999', fontSize: '14px' }}>Preview...</span>
              )}
            </div>
          </div>
        ))}
        
        {/* Dynamic Add Button */}
        {canAddMore && (
          <button 
            onClick={addNewListingSlot}
            style={{ padding: '15px', background: 'transparent', color: '#FF5A5F', border: '2px dashed #FF5A5F', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}
          >
            + Add Another Listing
          </button>
        )}
      </div>
    </main>
  );
}
