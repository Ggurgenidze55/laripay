'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function TestPaymentContent() {
  const params = useSearchParams();
  const sessionId = params.get('session') || 'unknown';
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const simulatePayment = async (action: 'approve' | 'decline') => {
    setStatus('loading');
    try {
      const res = await fetch('/api/payment/test-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      setStatus('done');

      if (action === 'approve' && data.successUrl) {
        setTimeout(() => window.location.assign(data.successUrl), 2000);
      }
    } catch (err) {
      setResult(String(err));
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 16,
        padding: 40,
        maxWidth: 480,
        width: '90%',
        textAlign: 'center',
        color: '#e2e8f0',
      }}>
        <div style={{
          background: '#f59e0b',
          color: '#0f172a',
          padding: '4px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          display: 'inline-block',
          marginBottom: 20,
        }}>
          TEST MODE
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
          LariPay Test Payment
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px' }}>
          Session: <code style={{ color: '#60a5fa' }}>{sessionId.slice(0, 12)}...</code>
        </p>

        {status === 'idle' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => simulatePayment('approve')}
              style={{
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Approve Payment
            </button>
            <button
              onClick={() => simulatePayment('decline')}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Decline
            </button>
          </div>
        )}

        {status === 'loading' && (
          <p style={{ color: '#f59e0b' }}>Processing...</p>
        )}

        {status === 'done' && (
          <div>
            <p style={{ color: '#22c55e', fontWeight: 600, fontSize: 18 }}>
              Payment simulated! Redirecting...
            </p>
            <pre style={{
              textAlign: 'left',
              background: '#0f172a',
              padding: 12,
              borderRadius: 8,
              fontSize: 11,
              overflow: 'auto',
              marginTop: 12,
            }}>{result}</pre>
          </div>
        )}

        {status === 'error' && (
          <p style={{ color: '#ef4444' }}>Error: {result}</p>
        )}
      </div>
    </div>
  );
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', paddingTop: 100 }}>Loading...</div>}>
      <TestPaymentContent />
    </Suspense>
  );
}
