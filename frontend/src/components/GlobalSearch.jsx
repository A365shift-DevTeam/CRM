import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/searchService';
import { FaMagnifyingGlass } from 'react-icons/fa6';

const moduleRoutes = { Contacts: '/contact', Projects: '/sales', Tasks: '/todolist', Expenses: '/finance' };

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const doSearch = useCallback(async (q) => {
        if (!q || q.length < 2) { setResults(null); setOpen(false); return; }
        try {
            const data = await searchService.search(q);
            setResults(data);
            setOpen(true);
        } catch (e) { console.error(e); }
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSearch(val), 300);
    };

    const handleNavigate = (route) => { setOpen(false); setQuery(''); navigate(route); };

    const hasResults = results && (results.contacts?.length || results.projects?.length || results.tasks?.length || results.expenses?.length);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <FaMagnifyingGlass style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
                <input value={query} onChange={handleChange} onFocus={() => results && setOpen(true)} placeholder="Search..." className="glass-input" style={{ paddingLeft: '32px', width: '220px', height: '36px', fontSize: '0.85rem', borderRadius: '10px' }} />
            </div>
            {open && results && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '360px', maxHeight: '400px', overflowY: 'auto', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 1000 }}>
                    {!hasResults ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No results found</div>
                    ) : (
                        <>
                            {results.contacts?.length > 0 && <ResultGroup title="Contacts" items={results.contacts.map(c => ({ id: c.id, label: c.name, sub: c.company || c.email }))} onSelect={() => handleNavigate('/contact')} />}
                            {results.projects?.length > 0 && <ResultGroup title="Projects" items={results.projects.map(p => ({ id: p.id, label: p.title, sub: p.clientName }))} onSelect={() => handleNavigate('/sales')} />}
                            {results.tasks?.length > 0 && <ResultGroup title="Tasks" items={results.tasks.map(t => ({ id: t.id, label: t.title, sub: t.status }))} onSelect={() => handleNavigate('/todolist')} />}
                            {results.expenses?.length > 0 && <ResultGroup title="Expenses" items={results.expenses.map(e => ({ id: e.id, label: e.description || e.category, sub: `$${e.amount}` }))} onSelect={() => handleNavigate('/finance')} />}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function ResultGroup({ title, items, onSelect }) {
    return (
        <div>
            <div style={{ padding: '8px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>{title}</div>
            {items.map(item => (
                <div key={item.id} onClick={onSelect} style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#0f172a' }}>{item.label}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.sub}</span>
                </div>
            ))}
        </div>
    );
}
