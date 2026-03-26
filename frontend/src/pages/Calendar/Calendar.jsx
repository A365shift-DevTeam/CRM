import React, { useEffect, useState, useMemo } from 'react';
import { calendarService } from '../../services/calendarService';
import { FaChevronLeft, FaChevronRight, FaCalendarDays } from 'react-icons/fa6';
import { Modal } from 'react-bootstrap';

const typeColors = { task: '#3b82f6', timesheet: '#10b981', milestone: '#f59e0b' };

export default function Calendar() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try { const data = await calendarService.getEvents(month, year); setEvents(data?.events || []); } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, [month, year]);

    const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
    const today = () => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); };

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [month, year]);

    const eventsByDay = useMemo(() => {
        const map = {};
        events.forEach(e => {
            const d = new Date(e.date).getDate();
            if (!map[d]) map[d] = [];
            map[d].push(e);
        });
        return map;
    }, [events]);

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const isToday = (d) => d === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

    return (
        <div style={{ padding: '20px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                    <FaCalendarDays size={20} style={{ color: '#3b82f6' }} />
                    <h4 className="m-0 fw-bold" style={{ color: '#0f172a' }}>Calendar</h4>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button onClick={prev} className="btn btn-sm" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}><FaChevronLeft /></button>
                    <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>{monthName} {year}</span>
                    <button onClick={next} className="btn btn-sm" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}><FaChevronRight /></button>
                    <button onClick={today} className="btn btn-sm" style={{ border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '8px', fontSize: '0.8rem' }}>Today</button>
                </div>
            </div>
            <div className="d-flex gap-3 mb-3">
                {[{ label: 'Tasks', color: typeColors.task }, { label: 'Timesheet', color: typeColors.timesheet }, { label: 'Milestones', color: typeColors.milestone }].map(l => (
                    <div key={l.label} className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />{l.label}
                    </div>
                ))}
            </div>
            {loading ? <div className="text-center p-5"><div className="spinner-border text-primary" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ padding: '8px', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: '#64748b', background: '#f8fafc' }}>{d}</div>
                    ))}
                    {calendarDays.map((day, i) => (
                        <div key={i} style={{ minHeight: '80px', padding: '4px 6px', background: day ? '#fff' : '#f8fafc', position: 'relative' }}>
                            {day && <>
                                <div style={{ fontSize: '0.8rem', fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? '#fff' : '#475569', background: isToday(day) ? '#3b82f6' : 'transparent', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '2px' }}>
                                    {(eventsByDay[day] || []).slice(0, 3).map((e, j) => (
                                        <div key={j} onClick={() => setSelectedEvent(e)} style={{ cursor: 'pointer', width: '100%', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', background: (typeColors[e.eventType] || '#94a3b8') + '20', color: typeColors[e.eventType] || '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                                    ))}
                                    {(eventsByDay[day] || []).length > 3 && <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>+{eventsByDay[day].length - 3} more</div>}
                                </div>
                            </>}
                        </div>
                    ))}
                </div>
            )}
            <Modal show={!!selectedEvent} onHide={() => setSelectedEvent(null)} centered>
                <Modal.Header closeButton><Modal.Title style={{ fontSize: '1rem' }}>Event Details</Modal.Title></Modal.Header>
                {selectedEvent && (
                    <Modal.Body>
                        <p><strong>Title:</strong> {selectedEvent.title}</p>
                        <p><strong>Type:</strong> <span style={{ color: typeColors[selectedEvent.eventType] }}>{selectedEvent.eventType}</span></p>
                        <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                        {selectedEvent.status && <p><strong>Status:</strong> {selectedEvent.status}</p>}
                    </Modal.Body>
                )}
            </Modal>
        </div>
    );
}
