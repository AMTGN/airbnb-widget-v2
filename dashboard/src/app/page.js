"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [rows, setRows] = useState(Array(10).fill({ name: '', url: '', loading: false }));
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copyCode = (index) => {
    const code = getIframeCode(rows[index].url);
    if (!code) return;
    navigator.clipboard.writeText(code);
    alert('Copied to clipboard!');
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
      // This tells the backend to save the URL and trigger the scraper!
      await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: row.url, name: row.name })
      });
      
      // Wait for a few seconds to let the cloud scraper run before turning off the loading indicator
      setTimeout(() => {
        updateRow(index, 'loading', false);
        // Force iframe refresh by tweaking its source slightly (if you want to force reload)
        // For simplicity, we just rely on standard loading. 
      }, 5000);
      
    } catch (e) {
      console.error(e);
      updateRow(index, 'loading', false);
    }
  };

  const getIframeCode = (url) => {
    if (!url || !origin) return '';
    const widgetUrl = `${origin}/api/widget?url=${encodeURIComponent(url)}`;
    return `<iframe src="${widgetUrl}" width="300" height="150" frameborder="0" scrolling="no"></iframe>`;
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f7f7f7', minHeight: '100vh' }}>
      <h1 style={{ color: '#FF5A5F' }}>Airbnb Widget Manager (V2)</h1>
      <p>Enter your Airbnb URLs below. They will instantly trigger the cloud scraper to fetch the latest data.</p>
      
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
                  style={{ padding: '10px 15px', background: '#FF5A5F', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                <iframe src={`${origin}/api/widget?url=${encodeURIComponent(row.url)}`} width="100%" height="100%" frameBorder="0" scrolling="no" style={{ position: 'absolute', top: 0, left: 0 }}></iframe>
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
