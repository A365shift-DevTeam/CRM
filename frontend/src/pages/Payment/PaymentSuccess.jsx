import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const plan = searchParams.get('plan') || 'basic';
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    const isPro = plan === 'pro';
    const accent = isPro ? '#f59e0b' : '#4361EE';
    const accentGrad = isPro
        ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
        : 'linear-gradient(135deg, #4361EE, #8B5CF6)';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary, #eef2f8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            fontFamily: 'var(--font-family, DM Sans)',
        }}>
            <style>{`
                @keyframes psRise   { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
                @keyframes psCheckPop { 0%{transform:scale(0) rotate(-20deg)} 70%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
                @keyframes psGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
                @keyframes psFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
            `}</style>

            <div style={{
                background: 'var(--bg-card, #fff)',
                borderRadius: 24,
                boxShadow: '0 12px 48px rgba(15,23,42,0.1), 0 2px 8px rgba(15,23,42,0.05)',
                padding: '56px 48px',
                maxWidth: 480, width: '100%',
                textAlign: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
                {/* Icon */}
                <div style={{
                    position: 'relative', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 28,
                    animation: 'psFloat 3s ease-in-out infinite',
                }}>
                    <div style={{
                        position: 'absolute', inset: -16,
                        borderRadius: '50%',
                        background: `${accent}18`,
                        animation: 'psGlow 2.5s ease-in-out infinite',
                    }} />
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: accentGrad,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 8px 32px ${accent}40`,
                        animation: 'psCheckPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
                    }}>
                        <CheckCircle2 size={38} color="#fff" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Plan badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: `${accent}12`,
                    border: `1.5px solid ${accent}30`,
                    borderRadius: 999, padding: '4px 14px',
                    marginBottom: 16,
                    animation: 'psRise 0.4s ease 0.3s both',
                }}>
                    <Sparkles size={12} color={accent} />
                    <span style={{
                        fontSize: 12, fontWeight: 700, color: accent,
                        fontFamily: 'var(--font-display, Outfit)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                        {planLabel} Plan
                    </span>
                </div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: 'var(--font-display, Outfit)',
                    fontSize: 28, fontWeight: 800, lineHeight: 1.2,
                    color: 'var(--text-primary, #0f172a)',
                    margin: '0 0 12px',
                    animation: 'psRise 0.4s ease 0.35s both',
                    letterSpacing: '-0.02em',
                }}>
                    Payment Received!
                </h1>

                <p style={{
                    fontSize: 15, color: 'var(--text-secondary, #475569)',
                    lineHeight: 1.6, margin: '0 0 8px',
                    animation: 'psRise 0.4s ease 0.4s both',
                }}>
                    Thank you for upgrading to <strong style={{ color: accent }}>{planLabel}</strong>.
                </p>

                <p style={{
                    fontSize: 13.5, color: 'var(--text-muted, #94a3b8)',
                    lineHeight: 1.5, margin: '0 0 36px',
                    animation: 'psRise 0.4s ease 0.45s both',
                }}>
                    Your plan will be activated within a few minutes after our team verifies the payment.
                    You'll automatically see the increased limits once activated.
                </p>

                {/* CTA */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: accentGrad,
                        color: '#fff', border: 'none', borderRadius: 12,
                        padding: '13px 28px', fontSize: 15, fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display, Outfit)',
                        boxShadow: `0 4px 16px ${accent}38`,
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        animation: 'psRise 0.4s ease 0.5s both',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 22px ${accent}50`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = `0 4px 16px ${accent}38`;
                    }}
                >
                    Back to Dashboard
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
