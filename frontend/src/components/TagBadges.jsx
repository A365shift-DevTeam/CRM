import React, { useEffect, useState, useRef } from 'react';
import { tagService } from '../services/tagService';
import { FaPlus, FaXmark } from 'react-icons/fa6';

export default function TagBadges({ entityType, entityId }) {
    const [entityTags, setEntityTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (entityType && entityId) { loadEntityTags(); loadAllTags(); }
    }, [entityType, entityId]);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadEntityTags = async () => {
        try { const data = await tagService.getEntityTags(entityType, entityId); setEntityTags(data || []); } catch (e) { console.error(e); }
    };
    const loadAllTags = async () => {
        try { const data = await tagService.getAll(); setAllTags(data || []); } catch (e) { console.error(e); }
    };

    const attach = async (tagId) => {
        try { await tagService.attach({ tagId, entityType, entityId }); loadEntityTags(); setShowDropdown(false); } catch (e) { alert(e.message); }
    };

    const detach = async (tagId) => {
        try { await tagService.detach(tagId, entityType, entityId); setEntityTags(prev => prev.filter(t => t.tagId !== tagId)); } catch (e) { alert(e.message); }
    };

    const attachedIds = new Set(entityTags.map(t => t.tagId));
    const available = allTags.filter(t => !attachedIds.has(t.id));

    return (
        <div ref={ref} className="d-flex flex-wrap align-items-center gap-1" style={{ position: 'relative' }}>
            {entityTags.map(t => (
                <span key={t.tagId} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500, background: t.tagColor + '26', color: t.tagColor }}>
                    {t.tagName}
                    <button onClick={() => detach(t.tagId)} style={{ background: 'none', border: 'none', color: t.tagColor, cursor: 'pointer', padding: 0, lineHeight: 1 }}><FaXmark size={10} /></button>
                </span>
            ))}
            <button onClick={() => setShowDropdown(!showDropdown)} style={{ background: 'none', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '2px 6px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}><FaPlus size={8} /> Tag</button>
            {showDropdown && available.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '120px' }}>
                    {available.map(tag => (
                        <div key={tag.id} onClick={() => attach(tag.id)} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color }} />{tag.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
