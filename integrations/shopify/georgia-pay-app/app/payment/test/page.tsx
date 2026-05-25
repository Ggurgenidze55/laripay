'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface SessionInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_reference_id: string | null;
}

function TestPaymentContent() {
  const params = useSearchParams();
  const sessionId = params.get('session') || 'unknown';
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'done' | 'error'>('loading');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    fetch(`/api/payment/test-session?id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus('error');
          setResult({ status: 'error', message: data.error });
        } else if (data.status === 'complete') {
          setStatus('done');
          setResult({ status: 'approved', message: 'This payment has already been completed.' });
        } else {
          setSession(data);
          setStatus('ready');
        }
      })
      .catch((err) => {
        setStatus('error');
        setResult({ status: 'error', message: String(err) });
      });
  }, [sessionId]);

  const simulatePayment = async (action: 'approve' | 'decline') => {
    setStatus('processing');
    try {
      const res = await fetch('/api/payment/test-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action }),
      });
      const data = await res.json();

      if (action === 'approve') {
        setResult({ status: 'approved', message: 'Payment approved! Redirecting to order page...' });
        setStatus('done');
        if (data.successUrl) {
          setTimeout(() => window.location.assign(data.successUrl), 2500);
        }
      } else {
        setResult({ status: 'declined', message: 'Payment declined. Order has been cancelled.' });
        setStatus('done');
        if (data.cancelUrl) {
          setTimeout(() => window.location.assign(data.cancelUrl), 3000);
        }
      }
    } catch (err) {
      setStatus('error');
      setResult({ status: 'error', message: String(err) });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 20,
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
        color: '#e2e8f0',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          background: '#f59e0b',
          color: '#0f172a',
          padding: '4px 14px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          display: 'inline-block',
          marginBottom: 24,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Test Mode
        </div>

        <div style={{ marginBottom: 8 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto' }}>
            <rect width="48" height="48" rx="12" fill="#3b82f6" fillOpacity="0.15"/>
            <path d="M14 20h20v14a2 2 0 01-2 2H16a2 2 0 01-2-2V20z" fill="#3b82f6" fillOpacity="0.3"/>
            <rect x="14" y="14" width="20" height="6" rx="2" fill="#3b82f6"/>
            <path d="M20 28h8M20 32h5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#f1f5f9' }}>
          LariPay Payment
        </h1>

        {status === 'loading' && (
          <p style={{ color: '#94a3b8', marginTop: 20 }}>Loading payment details...</p>
        )}

        {status === 'ready' && session && (
          <>
            <div style={{
              background: '#0f172a',
              borderRadius: 12,
              padding: '20px 24px',
              margin: '20px 0 24px',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Amount</span>
                <span style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700 }}>
                  {session.amount.toFixed(2)} {session.currency}
                </span>
              </div>
              {session.client_reference_id && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Order</span>
                  <span style={{ color: '#60a5fa', fontSize: 13 }}>
                    {session.client_reference_id.replace('shopify_order_', '#')}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => simulatePayment('approve')}
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 36px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'transform 0.1s',
                }}
              >
                Pay Now
              </button>
              <button
                onClick={() => simulatePayment('decline')}
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: 12,
                  padding: '14px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {status === 'processing' && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #334155',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}/>
            <p style={{ color: '#94a3b8' }}>Processing payment...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {status === 'done' && result && (
          <div style={{ marginTop: 24 }}>
            {result.status === 'approved' ? (
              <div style={{ color: '#22c55e' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <circle cx="24" cy="24" r="22" fill="#22c55e" fillOpacity="0.15"/>
                  <path d="M16 24l6 6 10-12" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <p style={{ fontWeight: 600, fontSize: 18 }}>{result.message}</p>
              </div>
            ) : result.status === 'declined' ? (
              <div style={{ color: '#ef4444' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <circle cx="24" cy="24" r="22" fill="#ef4444" fillOpacity="0.15"/>
                  <path d="M18 18l12 12M30 18L18 30" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none"/>
                </svg>
                <p style={{ fontWeight: 600, fontSize: 18 }}>{result.message}</p>
              </div>
            ) : (
              <p style={{ color: '#f59e0b' }}>{result.message}</p>
            )}
          </div>
        )}

        {status === 'error' && result && (
          <div style={{ marginTop: 24, color: '#ef4444' }}>
            <p>{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#94a3b8',
      }}>
        Loading...
      </div>
    }>
      <TestPaymentContent />
    </Suspense>
  );
}
