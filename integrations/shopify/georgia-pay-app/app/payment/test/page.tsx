'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface BankOption {
  id: string;
  name: string;
  name_en: string;
  name_ka: string;
}

interface SessionInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_reference_id: string | null;
  provider: string;
  payment_mode: string;
  banks: BankOption[];
  default_provider: string;
}

function TestPaymentContent() {
  const params = useSearchParams();
  const sessionId = params.get('session') || 'unknown';
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'done' | 'error'>('loading');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankSaving, setBankSaving] = useState(false);
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
          setSelectedBank(data.provider || data.default_provider || data.banks?.[0]?.id || 'tbc');
          setStatus('ready');
        }
      })
      .catch((err) => {
        setStatus('error');
        setResult({ status: 'error', message: String(err) });
      });
  }, [sessionId]);

  const saveBankChoice = async (bankId: string) => {
    setBankSaving(true);
    try {
      const res = await fetch('/api/payment/set-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, provider: bankId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to save bank choice');
      }
      setSelectedBank(data.provider);
      setSession((prev) => (prev ? { ...prev, provider: data.provider } : prev));
    } catch (err) {
      setResult({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      setStatus('error');
    } finally {
      setBankSaving(false);
    }
  };

  const handleBankChange = async (bankId: string) => {
    setSelectedBank(bankId);
    await saveBankChoice(bankId);
  };

  const simulatePayment = async (action: 'approve' | 'decline') => {
    setStatus('processing');
    try {
      if (action === 'approve' && session && selectedBank !== session.provider) {
        await saveBankChoice(selectedBank);
      }

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
          setTimeout(() => window.location.assign(data.successUrl), 800);
        }
      } else {
        setResult({ status: 'declined', message: 'Payment declined. Order has been cancelled.' });
        setStatus('done');
        if (data.cancelUrl) {
          setTimeout(() => window.location.assign(data.cancelUrl), 800);
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
        maxWidth: 480,
        width: '100%',
        textAlign: 'center' as const,
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
              margin: '20px 0 16px',
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

            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px' }}>
                Choose your bank
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {session.banks.map((bank) => {
                  const active = selectedBank === bank.id;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      disabled={bankSaving}
                      onClick={() => handleBankChange(bank.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: active ? '1px solid #8b5cf6' : '1px solid #334155',
                        background: active ? 'rgba(139, 92, 246, 0.12)' : '#0f172a',
                        color: '#e2e8f0',
                        cursor: bankSaving ? 'wait' : 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>{bank.name}</span>
                      <span style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: active ? '5px solid #8b5cf6' : '2px solid #475569',
                        boxSizing: 'border-box',
                      }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => simulatePayment('approve')}
                disabled={!selectedBank || bankSaving}
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 36px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: !selectedBank || bankSaving ? 'not-allowed' : 'pointer',
                  flex: 1,
                  opacity: !selectedBank || bankSaving ? 0.6 : 1,
                }}
              >
                Pay Now
              </button>
              <button
                onClick={() => simulatePayment('decline')}
                disabled={bankSaving}
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: 12,
                  padding: '14px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: bankSaving ? 'not-allowed' : 'pointer',
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
