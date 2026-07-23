"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [rows, setRows] = useState(Array(10).fill({ name: '', url: '' }));
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

  const getIframeCode = (url) => {
    if (!url || !origin) return '';
    const widgetUrl = `${origin}/api/widget?url=${encodeURIComponent(url)}`;
    return `<iframe src="${widgetUrl}" width="300" height="150" frameborder="0" scrolling="no"></iframe>`;
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f7f7f7', minHeight: '100vh' }}>
      <h1 style={{ color: '#FF5A5F' }}>Airbnb Widget Manager (V2)</h1>
      <p>Enter your Airbnb URLs below. They will instantly generate an iframe. In production, Supabase and the Cloud Scraper handle keeping the numbers fresh!</p>
      
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
              <input 
                type="text" 
                placeholder="Airbnb URL" 
                value={row.url}
                onChange={(e) => updateRow(i, 'url', e.target.value)}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
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
                  Copy
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
