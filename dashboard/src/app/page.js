"use client";

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const createDashboard = () => {
    // Generate a random UUID for the magic link
    const id = crypto.randomUUID();
    router.push(`/dash/${id}`);
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f7f7f7', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '60px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
        <h1 style={{ color: '#FF5A5F', marginBottom: '20px', fontSize: '32px' }}>Airbnb Widget Manager</h1>
        <p style={{ color: '#555', fontSize: '18px', marginBottom: '40px', lineHeight: '1.5' }}>
          Create your private dashboard instantly. No signup required. You will be given a unique Magic Link to access your 10 widgets.
        </p>
        <button 
          onClick={createDashboard}
          style={{ padding: '16px 32px', fontSize: '18px', background: '#FF5A5F', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(255, 90, 95, 0.3)' }}
        >
          Create My Dashboard
        </button>
      </div>
    </main>
  );
}
