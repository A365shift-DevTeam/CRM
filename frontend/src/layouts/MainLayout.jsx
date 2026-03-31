import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChartColumn, FaUserGroup, FaClock, FaRightFromBracket, FaHouse, FaMoneyBillWave, FaListCheck, FaFileInvoice, FaBars, FaXmark, FaBrain, FaShieldHalved, FaArrowUpFromBracket } from 'react-icons/fa6';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import { exportPageToExcel } from '../utils/exportPageToExcel';

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= breakpoint);
    React.useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [breakpoint]);
    return isMobile;
}

export default function MainLayout() {
    const { logout, hasPermission, currentUser } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const isMobile = useIsMobile();
    const contentRef = React.useRef(null);

    // Close sidebar when navigating
    React.useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // All nav items with their required permission
    const allNavItems = [
        { path: '/', icon: <FaHouse size={20} />, label: 'Dashboard', permission: 'dashboard.view' },
        { path: '/sales', icon: <FaChartColumn size={20} />, label: 'Sales', permission: 'sales.view' },
        { path: '/todolist', icon: <FaListCheck size={20} />, label: 'Todo', permission: 'todolist.view' },
        { path: '/contact', icon: <FaUserGroup size={20} />, label: 'Contacts', permission: 'contacts.view' },
        { path: '/timesheet', icon: <FaClock size={20} />, label: 'Time', permission: 'timesheet.view' },
        { path: '/finance', icon: <FaMoneyBillWave size={20} />, label: 'Finance', permission: 'finance.view' },
        { path: '/invoice', icon: <FaFileInvoice size={20} />, label: 'Invoice', permission: 'invoice.view' },
        { path: '/ai-agents', icon: <FaBrain size={20} />, label: 'AI Agents', permission: 'aiagents.view' },
        { path: '/admin', icon: <FaShieldHalved size={20} />, label: 'Admin', permission: 'admin.view' },
    ];

    // Filter nav items based on permissions
    const navItems = allNavItems.filter(item => hasPermission(item.permission));
    const currentPageLabel = allNavItems.find(item => item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))?.label || 'A365 Tracker';

    const handleExportCurrentPage = () => {
        exportPageToExcel({
            pageName: currentPageLabel,
            rootElement: contentRef.current || document.body
        });
    };

    /* ───── MOBILE LAYOUT ───── */
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', paddingBottom: '72px' }}>
                {/* Main Content */}
                <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px 8px 4px' }}>
                        <button
                            onClick={handleExportCurrentPage}
                            style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.24)',
                                color: '#059669',
                                borderRadius: '10px',
                                padding: '6px 10px',
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
                    </div>
                    <div
                        ref={contentRef}
                        className="w-100 overflow-auto"
                        style={{
                            minHeight: 'calc(100vh - 132px)',
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            borderRadius: '16px',
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                        }}
                    >
                        <Outlet />
                    </div>
                </div>

                {/* Bottom Navigation */}
                <nav style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '64px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '0 4px',
                    zIndex: 1000
                }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px',
                                    textDecoration: 'none',
                                    color: isActive ? '#3b82f6' : '#94a3b8',
                                    fontSize: '0.6rem',
                                    fontWeight: isActive ? 700 : 500,
                                    padding: '6px 4px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    flex: 1,
                                    maxWidth: '64px',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '28px',
                                    borderRadius: '14px',
                                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {React.cloneElement(item.icon, { size: 18 })}
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.6rem',
                            fontWeight: 500,
                            padding: '6px 4px',
                            cursor: 'pointer',
                            flex: 1,
                            maxWidth: '64px'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '28px',
                            borderRadius: '14px'
                        }}>
                            <FaRightFromBracket size={18} />
                        </div>
                        <span>Logout</span>
                    </button>
                </nav>
            </div>
        );
    }

    /* ───── DESKTOP LAYOUT ───── */
    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
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
                    boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.08)' : 'none'
                }}
            >
                {/* Sidebar Header */}
                <div className="d-flex align-items-center justify-content-between mb-3 px-2" style={{ height: '40px' }}>
                    <Link to="/" className="d-flex align-items-center text-decoration-none">
                        <span className="fs-5 fw-bold text-nowrap" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
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
                <hr style={{ borderColor: 'rgba(0,0,0,0.08)', opacity: 0.5 }} />
                <ul className="nav nav-pills flex-column mb-auto gap-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li className="nav-item" key={item.path}>
                                <Link
                                    to={item.path}
                                    className="nav-link d-flex align-items-center gap-3 px-3 py-2"
                                    style={{
                                        color: isActive ? '#3b82f6' : '#64748b',
                                        background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                        border: isActive ? '1px solid rgba(59, 130, 246, 0.12)' : '1px solid transparent',
                                        borderRadius: '10px',
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                                        {item.icon}
                                    </div>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <hr style={{ borderColor: 'rgba(0,0,0,0.08)', opacity: 0.5 }} />

                {/* Profile Section */}
                {currentUser && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            marginBottom: '12px',
                            background: 'rgba(59, 130, 246, 0.04)',
                            border: '1px solid rgba(59, 130, 246, 0.08)',
                            borderRadius: '12px'
                        }}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
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
                    </div>
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

            {/* Main Content */}
            <div className="flex-grow-1 p-3 d-flex flex-column" style={{ minWidth: 0, width: '100%' }}>
                <div
                    className="h-100 w-100 d-flex flex-column"
                    style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        borderRadius: '16px',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
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
                                color: '#3b82f6',
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
