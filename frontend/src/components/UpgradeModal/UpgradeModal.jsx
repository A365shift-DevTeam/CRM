import { useEffect, useRef } from 'react';
import { X, Zap, Crown, Check, ArrowUpRight } from 'lucide-react';

// ── Replace these with your actual Razorpay payment links ──
const RAZORPAY_BASIC_URL = 'YOUR_RAZORPAY_BASIC_LINK_HERE';
const RAZORPAY_PRO_URL   = 'YOUR_RAZORPAY_PRO_LINK_HERE';

const TIERS = [
    {
        key: 'free',
        label: 'Free',
        price: '₹0',
        period: 'forever',
        icon: null,
        accent: '#64748b',
        accentBg: 'rgba(100,116,139,0.08)',
        border: '#e1e8f4',
        recommended: false,
        cta: null,
        limits: { Contacts: 50, Leads: 25, Projects: 10, Documents: 5, Invoices: 10 },
    },
    {
        key: 'basic',
        label: 'Basic',
        price: '₹499',
        period: '/mo',
        icon: Zap,
        accent: '#4361EE',
        accentBg: 'rgba(67,97,238,0.07)',
        border: '#4361EE',
        recommended: true,
        ctaLabel: 'Upgrade to Basic',
        ctaUrl: RAZORPAY_BASIC_URL,
        limits: { Contacts: 500, Leads: 250, Projects: 100, Documents: 50, Invoices: 100 },
    },
    {
        key: 'pro',
        label: 'Pro',
        price: '₹999',
        period: '/mo',
        icon: Crown,
        accent: '#f59e0b',
        accentBg: 'rgba(245,158,11,0.07)',
        border: '#f59e0b',
        recommended: false,
        ctaLabel: 'Upgrade to Pro',
        ctaUrl: RAZORPAY_PRO_URL,
        limits: { Contacts: '∞', Leads: '∞', Projects: '∞', Documents: '∞', Invoices: '∞' },
    },
];

const MODULES = ['Contacts', 'Leads', 'Projects', 'Documents', 'Invoices'];

export default function UpgradeModal({ isOpen, onClose, limitModule }) {
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleCta = (url) => {
        if (!url || url.includes('YOUR_RAZORPAY')) {
            alert('Please configure your Razorpay payment link in UpgradeModal.jsx');
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(10,17,40,0.72)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                animation: 'upgFadeIn 0.18s ease',
            }}
        >
            <style>{`
                @keyframes upgFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes upgSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
                .upg-card { transition: box-shadow 0.2s, transform 0.2s; }
                .upg-card:hover { transform: translateY(-2px); }
                .upg-cta-btn { transition: background 0.15s, box-shadow 0.15s, transform 0.12s; }
                .upg-cta-btn:hover { transform: translateY(-1px); }
                .upg-cta-btn:active { transform: translateY(0); }
            `}</style>

            <div style={{
                background: 'var(--bg-secondary, #fff)',
                borderRadius: 20,
                boxShadow: '0 24px 80px rgba(10,17,40,0.22), 0 4px 16px rgba(10,17,40,0.1)',
                width: '100%', maxWidth: 780,
                maxHeight: '90vh', overflowY: 'auto',
                animation: 'upgSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative',
            }}>
                {/* Header */}
                <div style={{
                    padding: '28px 32px 0',
                    background: 'linear-gradient(135deg, rgba(67,97,238,0.04) 0%, rgba(139,92,246,0.04) 100%)',
                    borderBottom: '1px solid var(--border-color, #e1e8f4)',
                    borderRadius: '20px 20px 0 0',
                    paddingBottom: 24,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            background: 'var(--bg-primary, #eef2f8)',
                            border: 'none', borderRadius: '50%',
                            width: 32, height: 32,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-secondary, #475569)',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--border-color, #e1e8f4)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary, #eef2f8)'}
                    >
                        <X size={16} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #4361EE, #8B5CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={18} color="#fff" fill="#fff" />
                        </div>
                        <span style={{ fontFamily: 'var(--font-display, Outfit)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                            Upgrade Your Plan
                        </span>
                    </div>
                    {limitModule && (
                        <p style={{ fontSize: 13.5, color: 'var(--text-secondary, #475569)', margin: 0, paddingLeft: 46 }}>
                            Your <strong>{limitModule}</strong> limit has been reached. Upgrade to continue adding records.
                        </p>
                    )}
                </div>

                {/* Tier cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, padding: '24px 32px 32px',
                }}>
                    {TIERS.map((tier, i) => {
                        const Icon = tier.icon;
                        return (
                            <div
                                key={tier.key}
                                className="upg-card"
                                style={{
                                    border: `2px solid ${tier.recommended ? tier.border : 'var(--border-color, #e1e8f4)'}`,
                                    borderRadius: 16,
                                    padding: '20px 18px 22px',
                                    background: tier.recommended ? tier.accentBg : 'var(--bg-card, #fff)',
                                    position: 'relative',
                                    boxShadow: tier.recommended ? `0 4px 24px rgba(67,97,238,0.12)` : 'var(--shadow-sm)',
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            >
                                {tier.recommended && (
                                    <div style={{
                                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, #4361EE, #8B5CF6)',
                                        color: '#fff', fontSize: 11, fontWeight: 700,
                                        padding: '3px 12px', borderRadius: 999,
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'var(--font-display, Outfit)',
                                    }}>
                                        Most Popular
                                    </div>
                                )}

                                {/* Tier header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                    {Icon && (
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 7,
                                            background: tier.recommended
                                                ? 'linear-gradient(135deg, #4361EE, #8B5CF6)'
                                                : `${tier.accentBg}`,
                                            border: `1.5px solid ${tier.recommended ? 'transparent' : tier.accent + '40'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Icon size={14} color={tier.recommended ? '#fff' : tier.accent} />
                                        </div>
                                    )}
                                    <span style={{
                                        fontFamily: 'var(--font-display, Outfit)',
                                        fontSize: 15, fontWeight: 700,
                                        color: tier.recommended ? tier.accent : 'var(--text-primary, #0f172a)',
                                    }}>
                                        {tier.label}
                                    </span>
                                </div>

                                {/* Price */}
                                <div style={{ marginBottom: 16 }}>
                                    <span style={{
                                        fontFamily: 'var(--font-display, Outfit)',
                                        fontSize: 28, fontWeight: 800,
                                        color: 'var(--text-primary, #0f172a)',
                                        letterSpacing: '-0.02em',
                                    }}>
                                        {tier.price}
                                    </span>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', marginLeft: 3 }}>
                                        {tier.period}
                                    </span>
                                </div>

                                {/* Module limits */}
                                <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {MODULES.map(mod => {
                                        const val = tier.limits[mod];
                                        const isHighlighted = mod === limitModule;
                                        return (
                                            <div
                                                key={mod}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '4px 7px', borderRadius: 6,
                                                    background: isHighlighted ? `${tier.accent}14` : 'transparent',
                                                    border: isHighlighted ? `1px solid ${tier.accent}30` : '1px solid transparent',
                                                }}
                                            >
                                                <span style={{
                                                    fontSize: 12.5,
                                                    color: isHighlighted ? tier.accent : 'var(--text-secondary, #475569)',
                                                    fontWeight: isHighlighted ? 600 : 400,
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    {isHighlighted && <Check size={11} color={tier.accent} />}
                                                    {mod}
                                                </span>
                                                <span style={{
                                                    fontSize: val === '∞' ? 16 : 12.5, fontWeight: 600,
                                                    color: val === '∞' ? tier.accent : 'var(--text-primary, #0f172a)',
                                                    fontFamily: val === '∞' ? 'serif' : 'inherit',
                                                }}>
                                                    {val === '∞' ? '∞' : val.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* CTA */}
                                {tier.cta !== null && tier.ctaLabel ? (
                                    <button
                                        className="upg-cta-btn"
                                        onClick={() => handleCta(tier.ctaUrl)}
                                        style={{
                                            width: '100%', padding: '10px 16px',
                                            border: 'none', borderRadius: 10, cursor: 'pointer',
                                            fontFamily: 'var(--font-display, Outfit)',
                                            fontSize: 13.5, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            ...(tier.recommended ? {
                                                background: 'linear-gradient(135deg, #4361EE 0%, #8B5CF6 100%)',
                                                color: '#fff',
                                                boxShadow: '0 4px 14px rgba(67,97,238,0.35)',
                                            } : {
                                                background: `${tier.accent}15`,
                                                color: tier.accent,
                                                border: `1.5px solid ${tier.accent}40`,
                                            }),
                                        }}
                                    >
                                        {tier.ctaLabel}
                                        <ArrowUpRight size={14} />
                                    </button>
                                ) : (
                                    <div style={{
                                        width: '100%', padding: '10px 16px', borderRadius: 10,
                                        background: 'var(--bg-primary, #eef2f8)',
                                        color: 'var(--text-muted, #94a3b8)',
                                        fontSize: 13.5, fontWeight: 600, textAlign: 'center',
                                        fontFamily: 'var(--font-display, Outfit)',
                                    }}>
                                        Current Plan
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <div style={{
                    padding: '0 32px 24px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--text-muted, #94a3b8)',
                }}>
                    After payment, your plan will be activated within a few minutes by our team.
                    &nbsp;Existing records are never deleted when plans expire.
                </div>
            </div>
        </div>
    );
}
