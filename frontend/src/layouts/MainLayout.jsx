import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FaChartColumn, FaUserGroup, FaClock, FaRightFromBracket, FaHouse, 
  FaMoneyBillWave, FaListCheck, FaFileInvoice, FaBars, FaXmark, 
  FaBrain, FaShieldHalved, FaArrowUpFromBracket, FaChevronDown, FaChevronUp,
  FaGear, FaCircleInfo
} from 'react-icons/fa6';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import { exportPageToExcel } from '../utils/exportPageToExcel';
import { notificationService } from '../services/notificationService';

const hexToRgba = (hex, alpha) => {
    let r = 0, g = 0, b = 0;
    if (hex && hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex && hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function MainLayout() {
    const { logout, hasPermission, currentUser } = useAuth();
    const { themeColor } = useTheme();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const contentRef = useRef(null);
    const [alerts, setAlerts] = useState([]);
    const [activePageAlertIndex, setActivePageAlertIndex] = useState(0);

    // Expand categories state
    const [expandedCategories, setExpandedCategories] = useState({});

    // Close sidebar when navigating on smaller screens mostly handled by useEffect
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!currentUser) return;

        const fetchAlerts = async () => {
            try {
                const data = await notificationService.getAlerts();
                setAlerts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Main layout alerts error:', error);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const toggleCategory = (catTitle) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catTitle]: !prev[catTitle]
        }));
    };

    // Submenu structure based on User specifications
    const navCategories = [
        {
            title: 'CRM',
            items: [
                { path: '/company', icon: <FaUserGroup size={16} />, label: 'Company', permission: 'contacts.view' },
                { path: '/contact', icon: <FaUserGroup size={16} />, label: 'Contacts', permission: 'contacts.view' },
                { path: '/leads', icon: <FaUserGroup size={16} />, label: 'Leads', permission: 'sales.view' },
                { path: '/sales', icon: <FaChartColumn size={16} />, label: 'Sales', permission: 'sales.view' },
            ]
        },
        {
            title: 'Execution',
            items: [
                { path: '/projects', icon: <FaChartColumn size={16} />, label: 'Projects', permission: 'timesheet.view' },
                { path: '/timesheet', icon: <FaClock size={16} />, label: 'Timesheet', permission: 'timesheet.view' },
                { path: '/todolist', icon: <FaListCheck size={16} />, label: 'To-Do', permission: 'todolist.view' },
            ]
        },
        {
            title: 'Operations',
            items: [
                { path: '/finance', icon: <FaMoneyBillWave size={16} />, label: 'Finance', permission: 'finance.view' },
                { path: '/legal', icon: <FaFileInvoice size={16} />, label: 'Legal', permission: 'invoice.view' },
                { path: '/documents', icon: <FaFileInvoice size={16} />, label: 'Documents', permission: 'dashboard.view' },
                { path: '/links', icon: <FaHouse size={16} />, label: 'Links', permission: 'dashboard.view' },
            ]
        },
        {
            title: 'People',
            items: [
                { path: '/hr', icon: <FaUserGroup size={16} />, label: 'HR', permission: 'dashboard.view' },
            ]
        },
        {
            title: 'AI',
            items: [
                { path: '/ai-agents', icon: <FaBrain size={16} />, label: 'Agent AI', permission: 'aiagents.view' },
            ]
        }
    ];

    // Find current page label for export button
    let currentPageLabel = 'A365 Tracker';
    if (location.pathname === '/') currentPageLabel = 'Dashboard';
    if (location.pathname === '/settings') currentPageLabel = 'Settings';
    if (location.pathname === '/about') currentPageLabel = 'About';
    navCategories.forEach(cat => {
        cat.items.forEach(item => {
            if (location.pathname.startsWith(item.path)) {
                currentPageLabel = item.label;
            }
        });
    });

    const getPageScope = (pathname) => {
        if (pathname.startsWith('/finance')) return 'finance';
        if (pathname.startsWith('/legal') || pathname.startsWith('/invoice')) return 'finance';
        if (pathname.startsWith('/sales')) return 'sales';
        if (pathname.startsWith('/projects') || pathname.startsWith('/timesheet') || pathname.startsWith('/todolist')) return 'execution';
        if (pathname.startsWith('/contact') || pathname.startsWith('/leads') || pathname.startsWith('/company')) return 'crm';
        return 'all';
    };

    const getAlertScope = (alert) => {
        const category = String(alert?.category || '').toLowerCase();
        const text = `${alert?.title || ''} ${alert?.message || ''}`.toLowerCase();

        if (
            category.includes('finance') || category.includes('payment') || category.includes('income') ||
            category.includes('expense') || category.includes('invoice') ||
            text.includes('payment') || text.includes('income') || text.includes('expense') || text.includes('invoice')
        ) return 'finance';

        if (category.includes('sale') || text.includes('sale') || text.includes('deal') || text.includes('pipeline')) return 'sales';
        if (category.includes('task') || text.includes('task') || text.includes('todo') || text.includes('timesheet')) return 'execution';
        if (category.includes('contact') || text.includes('contact') || text.includes('lead') || text.includes('client')) return 'crm';
        return 'all';
    };

    const pageScope = getPageScope(location.pathname);
    const pageAlerts = useMemo(() => {
        if (pageScope === 'all') return [];
        return alerts.filter((alert) => {
            const scope = getAlertScope(alert);
            return scope === pageScope;
        });
    }, [alerts, pageScope]);

    useEffect(() => {
        if (pageAlerts.length <= 1) return;
        const interval = setInterval(() => {
            setActivePageAlertIndex((prev) => (prev + 1) % pageAlerts.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [pageAlerts]);

    const activePageAlert = pageAlerts.length > 0
        ? pageAlerts[activePageAlertIndex % pageAlerts.length]
        : null;
    const activePageAlertMessage = activePageAlert?.title || activePageAlert?.message;

    const handleExportCurrentPage = () => {
        exportPageToExcel({
            pageName: currentPageLabel,
            rootElement: contentRef.current || document.body
        });
    };

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', background: '#F5F7FA' }}>
            {/* Overlay (visible when sidebar is open) */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 998,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            {/* Sidebar - slides in from the left */}
            <div
                className="d-flex flex-column p-3"
                style={{
                    width: '240px',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
                    zIndex: 999,
                    boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.08)' : 'none',
                    overflowY: 'auto'
                }}
            >
                {/* Sidebar Header */}
                <div className="d-flex align-items-center justify-content-between mb-3 px-2" style={{ height: '40px', flexShrink: 0 }}>
                    <Link to="/" className="d-flex align-items-center text-decoration-none">
                        <span className="fs-5 fw-bold text-nowrap" style={{
                            color: themeColor,
                            letterSpacing: '-0.3px'
                        }}>
                            A365 Tracker
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px'
                        }}
                    >
                        <FaXmark size={20} />
                    </button>
                </div>
                
                <hr style={{ borderColor: 'rgba(0,0,0,0.08)', opacity: 0.5, margin: '0 0 10px 0', flexShrink: 0 }} />

                <ul className="nav nav-pills flex-column mb-auto gap-2">
                    {/* Dashboard explicitly separated if wanted, but using categories instead */}
                    <li className="nav-item">
                        <Link
                            to="/"
                            className="nav-link d-flex align-items-center gap-3 px-3 py-2"
                            style={{
                                color: location.pathname === '/' ? themeColor : '#64748b',
                                background: location.pathname === '/' ? hexToRgba(themeColor, 0.08) : 'transparent',
                                border: location.pathname === '/' ? `1px solid ${hexToRgba(themeColor, 0.12)}` : '1px solid transparent',
                                borderRadius: '10px',
                                fontWeight: location.pathname === '/' ? 600 : 500,
                                fontSize: '0.9rem',
                            }}
                        >
                            <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                                <FaHouse size={16} />
                            </div>
                            <span>Dashboard</span>
                        </Link>
                    </li>

                    {navCategories.map((category) => {
                        const hasPerm = category.items.some(item => hasPermission(item.permission));
                        if (!hasPerm) return null;
                        
                        const isExpanded = expandedCategories[category.title] !== false; // Default expanded if undefined

                        return (
                            <li className="nav-item d-flex flex-column" key={category.title}>
                                <button
                                    onClick={() => toggleCategory(category.title)}
                                    className="d-flex align-items-center justify-content-between px-3 py-2 text-decoration-none"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#475569',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        marginTop: '10px'
                                    }}
                                >
                                    <span>{category.title}</span>
                                    {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </button>
                                
                                {isExpanded && (
                                    <ul className="nav nav-pills flex-column gap-1 mt-1 pl-2" style={{ marginLeft: '10px', borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
                                        {category.items.filter(i => hasPermission(i.permission)).map((item) => {
                                            const isActive = location.pathname.startsWith(item.path);
                                            return (
                                                <li className="nav-item ml-2" key={item.path}>
                                                    <Link
                                                        to={item.path}
                                                        className="nav-link d-flex align-items-center gap-3 px-3 py-1.5"
                                                        style={{
                                                            color: isActive ? themeColor : '#64748b',
                                                            background: isActive ? hexToRgba(themeColor, 0.08) : 'transparent',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontWeight: isActive ? 600 : 500,
                                                            fontSize: '0.85rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <div style={{ minWidth: '18px', display: 'flex', justifyContent: 'center' }}>
                                                            {item.icon}
                                                        </div>
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}

                    <li className="nav-item mt-3">
                        <Link
                            to="/admin"
                            className="nav-link d-flex align-items-center gap-3 px-3 py-2"
                            style={{
                                color: location.pathname === '/admin' ? themeColor : '#64748b',
                                background: location.pathname === '/admin' ? hexToRgba(themeColor, 0.08) : 'transparent',
                                borderRadius: '10px',
                                fontWeight: location.pathname === '/admin' ? 600 : 500,
                                fontSize: '0.9rem',
                            }}
                        >
                            <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                                <FaShieldHalved size={16} />
                            </div>
                            <span>Admin</span>
                        </Link>
                    </li>
                </ul>
                <hr style={{ borderColor: 'rgba(0,0,0,0.08)', opacity: 0.5, flexShrink: 0 }} />

                {/* Profile Section & Settings */}
                <div style={{ flexShrink: 0 }}>
                    {currentUser && (
                        <Link
                            to="/settings"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                marginBottom: '12px',
                                background: location.pathname === '/settings' ? hexToRgba(themeColor, 0.08) : hexToRgba(themeColor, 0.04),
                                border: location.pathname === '/settings' ? `1px solid ${hexToRgba(themeColor, 0.16)}` : `1px solid ${hexToRgba(themeColor, 0.08)}`,
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    flexShrink: 0,
                                    boxShadow: `0 2px 8px ${hexToRgba(themeColor, 0.3)}`
                                }}
                            >
                                {(currentUser.displayName || currentUser.email || '?')
                                    .split(' ')
                                    .map(w => w[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    color: '#1e293b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentUser.displayName || 'User'}
                                </div>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: '#94a3b8',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentUser.email}
                                </div>
                            </div>
                        </Link>
                    )}

                    <button
                        onClick={handleLogout}
                        className="btn d-flex align-items-center w-100 py-2 gap-2 justify-content-center"
                        style={{
                            background: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            borderRadius: '10px',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        }}
                    >
                        <FaRightFromBracket />
                        <span>Sign out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 p-3 d-flex flex-column" style={{ minWidth: 0, width: '100%' }}>
                <div
                    className="h-100 w-100 d-flex flex-column"
                    style={{
                        background: '#F5F7FA',
                        border: '1px solid #E2E8F0',
                        borderRadius: '20px',
                        boxShadow: 'none',
                        overflow: 'hidden'
                    }}
                >
                    {/* Top Header Bar with Menu Button & Title */}
                    <div style={{
                        padding: '10px 16px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: '10px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                color: themeColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}
                            title="Open menu"
                        >
                            <FaBars size={18} />
                        </button>
                        <h5 className="m-0 fw-bold" style={{ color: '#475569', letterSpacing: '-0.3px' }}>
                            {currentPageLabel}
                        </h5>
                        {activePageAlertMessage && (
                            <div
                                key={`${location.pathname}-${activePageAlertIndex}`}
                                className="layout-page-alert-pop"
                                style={{
                                    marginLeft: '10px',
                                    maxWidth: '460px',
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: '1px solid rgba(16, 185, 129, 0.24)',
                                    color: '#0f766e',
                                    borderRadius: '999px',
                                    padding: '6px 12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                title={activePageAlertMessage}
                            >
                                {activePageAlertMessage}
                            </div>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={handleExportCurrentPage}
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.24)',
                                    color: '#059669',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer'
                                }}
                                title="Export current page"
                            >
                                <FaArrowUpFromBracket size={12} />
                                Export
                            </button>
                            <GlobalSearch />
                            <NotificationBell />
                        </div>
                    </div>
                    {/* Scrollable Content */}
                    <div ref={contentRef} className="flex-grow-1 overflow-auto">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
