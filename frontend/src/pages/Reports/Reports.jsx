import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import DashboardAnalytics from './DashboardAnalytics';

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
        <div style={{ padding: '24px' }}>
            <PageToolbar
                title="Reports"
                extraControls={
                    <div className="pt-period-toggle">
                        {presets.map((p, i) => (
                            <button key={i} onClick={() => setPreset(i)} className={`pt-period-btn${preset === i ? ' active' : ''}`}>{p.label}</button>
                        ))}
                    </div>
                }
            />
            {loading ? (
                <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
            ) : (
                <div style={{ marginTop: '8px' }}>
                    <DashboardAnalytics />
                </div>
            )}
        </div>
    );
}
