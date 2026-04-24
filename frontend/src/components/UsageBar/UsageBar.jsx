import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

export default function UsageBar({ module, current, limit, isUnlimited }) {
    const [hovered, setHovered] = useState(false);

    if (isUnlimited) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <span style={{ color: 'var(--accent-success, #10b981)', fontWeight: 600 }}>
                    {module}
                </span>
                <span style={{
                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                    Unlimited
                </span>
            </div>
        );
    }

    const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
    const isOver80 = pct >= 80;
    const isOver100 = pct >= 100;

    const barColor = isOver100
        ? '#ef4444'
        : isOver80
        ? '#f59e0b'
        : 'var(--accent-primary, #4361EE)';

    const trackColor = isOver100
        ? 'rgba(239,68,68,0.12)'
        : isOver80
        ? 'rgba(245,158,11,0.12)'
        : 'var(--border-light, #edf2fb)';

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ minWidth: 120 }}
        >
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 3,
            }}>
                <span style={{
                    fontSize: 11.5, fontWeight: 500,
                    color: isOver80 ? barColor : 'var(--text-secondary, #475569)',
                }}>
                    {module}
                </span>
                <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: isOver80 ? barColor : 'var(--text-muted, #94a3b8)',
                    fontFamily: 'var(--font-display, Outfit)',
                }}>
                    {current}/{limit}
                </span>
            </div>

            <div style={{
                height: 4, borderRadius: 999,
                background: trackColor,
                overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: isOver100
                        ? '#ef4444'
                        : isOver80
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : `linear-gradient(90deg, var(--accent-primary, #4361EE), #8B5CF6)`,
                    transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
            </div>

            {isOver100 && (
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('storage-limit-exceeded', { detail: { data: { module } } }))}
                    style={{
                        marginTop: 5,
                        background: 'rgba(239,68,68,0.09)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444',
                        fontSize: 10.5, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 999,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontFamily: 'var(--font-display, Outfit)',
                        letterSpacing: '0.03em',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.09)'}
                >
                    <TrendingUp size={10} />
                    Upgrade
                </button>
            )}
        </div>
    );
}
