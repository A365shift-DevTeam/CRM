import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/reportService';
import { FaChartPie } from 'react-icons/fa6';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const presets = [
    { label: 'Last 3 Months', months: 3 },
    { label: 'Last 6 Months', months: 6 },
    { label: 'This Year', months: 0 },
];

function getDateRange(months) {
    const to = new Date();
    let from;
    if (months === 0) { from = new Date(to.getFullYear(), 0, 1); }
    else { from = new Date(to); from.setMonth(from.getMonth() - months); }
    return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}


export default function Reports() {
    const [preset, setPreset] = useState(1);
    const [revenue, setRevenue] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [growth, setGrowth] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { from, to } = getDateRange(presets[preset].months);
        setLoading(true);
        Promise.all([
            reportService.getRevenue(from, to).catch(() => []),
            reportService.getExpensesByCategory(from, to).catch(() => []),
            reportService.getPipelineConversion().catch(() => ({ stages: [] })),
            reportService.getContactGrowth(from, to).catch(() => []),
        ]).then(([rev, exp, pip, gro]) => {
            setRevenue((rev || []).map(r => ({ ...r, name: monthNames[r.month] + ' ' + r.year })));
            setExpenses(exp || []);
            setPipeline(pip?.stages || []);
            setGrowth((gro || []).map(g => ({ ...g, name: monthNames[g.month] + ' ' + g.year })));
            setLoading(false);
        });
    }, [preset]);

    return (
        <div style={{ padding: '20px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                    <FaChartPie size={20} style={{ color: '#3b82f6' }} />
                    <h4 className="m-0 fw-bold" style={{ color: '#0f172a' }}>Reports</h4>
                </div>
                <div className="d-flex gap-2">
                    {presets.map((p, i) => (
                        <button key={i} onClick={() => setPreset(i)} className="btn btn-sm" style={{ border: preset === i ? '1px solid #3b82f6' : '1px solid #e2e8f0', color: preset === i ? '#3b82f6' : '#64748b', borderRadius: '8px', fontSize: '0.8rem', fontWeight: preset === i ? 600 : 400 }}>{p.label}</button>
                    ))}
                </div>
            </div>
            {loading ? <div className="text-center p-5"><div className="spinner-border text-primary" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                    <div className="card p-4 border-0">
                        <h6 className="fw-bold mb-3" style={{ color: '#475569' }}>Revenue by Month</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={revenue}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card p-4 border-0">
                        <h6 className="fw-bold mb-3" style={{ color: '#475569' }}>Expenses by Category</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart><Pie data={expenses} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percentage }) => `${category} ${percentage}%`}>
                                {expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card p-4 border-0">
                        <h6 className="fw-bold mb-3" style={{ color: '#475569' }}>Pipeline Conversion</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={pipeline} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="stage" fontSize={12} width={80} /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card p-4 border-0">
                        <h6 className="fw-bold mb-3" style={{ color: '#475569' }}>Contact Growth</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={growth}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="totalContacts" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} /><Line type="monotone" dataKey="newContacts" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} /></LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
