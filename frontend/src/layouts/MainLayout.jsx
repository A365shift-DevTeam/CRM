import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FaChartColumn, FaUserGroup, FaClock, FaRightFromBracket, FaHouse,
  FaMoneyBillWave, FaListCheck, FaFileInvoice, FaBars, FaXmark,
  FaBrain, FaShieldHalved, FaArrowUpFromBracket, FaChevronDown, FaChevronUp,
  FaGear, FaCircleInfo
} from 'react-icons/fa6';
import { notificationService } from '../services/notificationService';
import { projectService } from '../services/api';
import { contactService } from '../services/contactService';
import { timesheetService } from '../services/timesheetService';
import AlertSidebar from '../components/AlertSidebar';
import NotificationInboxModal from '../components/NotificationInboxModal';
import '../pages/Dashboard/Dashboard.css';

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
  const [expandedCategories, setExpandedCategories] = useState({
    CRM: false,
    Execution: false,
    Operations: false,
    Reports: false,
    People: false,
    AI: false,
  });

  const navigate = useNavigate();

  const [projectCount, setProjectCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [timesheetCount, setTimesheetCount] = useState(0);
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(false);
  const [showPremiumInbox, setShowPremiumInbox] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAlerts = async () => {
      try {
        const data = await notificationService.getAlerts();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (e) { console.error('MainLayout alerts:', e); }
    };
    const fetchCounts = async () => {
      try {
        const [proj, cont, time] = await Promise.all([
          projectService.getAll().catch(() => []),
          contactService.getContacts(1, 100).catch(() => []),
          timesheetService.getEntries(1, 100).catch(() => [])
        ]);
        setProjectCount(proj.length || 0);
        setContactCount(cont?.data?.length || cont.length || 0);
        setTimesheetCount(time?.items?.length || time.length || 0);
      } catch (e) { console.error('Error fetching global counts:', e); }
    };
    fetchAlerts();
    fetchCounts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout failed', e); }
  };

  const toggleCategory = (title) => {
    setExpandedCategories((prev) => ({ ...prev, [title]: prev[title] !== false ? false : true }));
  };

  const navCategories = [
    {
      title: 'CRM',
      items: [
        { path: '/company',  icon: <FaUserGroup size={14} />,   label: 'Company',   permission: 'contacts.view' },
        { path: '/contact',  icon: <FaUserGroup size={14} />,   label: 'Contacts',  permission: 'contacts.view' },
        { path: '/leads',    icon: <FaUserGroup size={14} />,   label: 'Leads',     permission: 'sales.view' },
        
       
       
      ],
    },
    {
      title: 'Execution',
      items: [
         { path: '/sales',    icon: <FaChartColumn size={14} />, label: 'Sales',     permission: 'sales.view' },
        { path: '/projects',  icon: <FaChartColumn size={14} />, label: 'Projects',  permission: 'timesheet.view' },
        { path: '/timesheet', icon: <FaClock size={14} />,       label: 'Timesheet', permission: 'timesheet.view' },
        { path: '/todolist',  icon: <FaListCheck size={14} />,   label: 'To-Do',     permission: 'todolist.view' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { path: '/finance',   icon: <FaMoneyBillWave size={14} />, label: 'Finance',      permission: 'finance.view' },
        { path: '/invoice',   icon: <FaFileInvoice size={14} />,   label: 'Deal Finance', permission: 'invoice.view' },
        { path: '/legal',     icon: <FaFileInvoice size={14} />,   label: 'Legal',        permission: 'invoice.view' },
        { path: '/documents', icon: <FaFileInvoice size={14} />,   label: 'Documents',    permission: 'dashboard.view' },
        { path: '/calendar',  icon: <FaHouse size={14} />,         label: 'Calendar',  permission: 'dashboard.view' },
        { path: '/tickets',  icon: <FaListCheck size={14} />,   label: 'Tickets',   permission: 'dashboard.view' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { path: '/reports',   icon: <FaChartColumn size={14} />,   label: 'Reports',   permission: 'dashboard.view' },
      ],
    },
    {
      title: 'People',
      items: [
        { path: '/hr', icon: <FaUserGroup size={14} />, label: 'HR', permission: 'dashboard.view' },
      ],
    },
    {
      title: 'AI',
      items: [
        { path: '/ai-agents', icon: <FaBrain size={14} />, label: 'Agent AI', permission: 'aiagents.view' },
      ],
    },
  ];

  const allExpanded = navCategories.every(cat => expandedCategories[cat.title] !== false);

  const handleToggleAll = () => {
    const newState = {};
    navCategories.forEach(cat => {
      newState[cat.title] = !allExpanded;
    });
    setExpandedCategories(newState);
  };

  let currentPageLabel = 'A365 Tracker';
  if (location.pathname === '/') currentPageLabel = 'Dashboard';
  if (location.pathname === '/settings') currentPageLabel = 'Settings';
  if (location.pathname === '/about') currentPageLabel = 'About';
  navCategories.forEach((cat) => cat.items.forEach((item) => {
    if (location.pathname.startsWith(item.path)) currentPageLabel = item.label;
  }));

  const getPageScope = (p) => {
    if (p.startsWith('/finance') || p.startsWith('/legal')) return 'finance';
    if (p.startsWith('/sales')) return 'sales';
    if (p.startsWith('/projects') || p.startsWith('/timesheet') || p.startsWith('/todolist')) return 'execution';
    if (p.startsWith('/contact') || p.startsWith('/leads') || p.startsWith('/company')) return 'crm';
    return 'all';
  };

  const getAlertScope = (alert) => {
    const cat = String(alert?.category || '').toLowerCase();
    const txt = `${alert?.title || ''} ${alert?.message || ''}`.toLowerCase();
    if (cat.includes('finance') || txt.includes('payment') || txt.includes('invoice')) return 'finance';
    if (cat.includes('sale') || txt.includes('deal') || txt.includes('pipeline')) return 'sales';
    if (cat.includes('task') || txt.includes('task') || txt.includes('timesheet')) return 'execution';
    if (cat.includes('contact') || txt.includes('lead') || txt.includes('client')) return 'crm';
    return 'all';
  };

  const pageScope = getPageScope(location.pathname);
  const pageAlerts = useMemo(() => {
    if (pageScope === 'all') return [];
    return alerts.filter((a) => getAlertScope(a) === pageScope);
  }, [alerts, pageScope]);

  useEffect(() => {
    if (pageAlerts.length <= 1) return;
    const interval = setInterval(() => setActivePageAlertIndex((p) => (p + 1) % pageAlerts.length), 3500);
    return () => clearInterval(interval);
  }, [pageAlerts]);

  const activePageAlert = pageAlerts.length > 0 ? pageAlerts[activePageAlertIndex % pageAlerts.length] : null;
  const activePageAlertMessage = activePageAlert?.title || activePageAlert?.message;

  const userInitials = (currentUser?.displayName || currentUser?.email || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const getAlertCategoryGlobal = (alert) => {
    if (!alert) return { label: 'General', className: 'bg-slate-100 text-slate-700' };
    const raw = String(alert.category || '').toLowerCase();
    const txt = `${alert.title || ''} ${alert.message || ''}`.toLowerCase();
    if (raw.includes('sale') || txt.includes('sale') || txt.includes('deal'))
      return { label: 'Sales', className: 'bg-blue-50 text-blue-700' };
    if (raw.includes('finance') || txt.includes('payment') || txt.includes('invoice'))
      return { label: 'Finance', className: 'bg-emerald-50 text-emerald-700' };
    if (raw.includes('task') || txt.includes('task'))
      return { label: 'Execution', className: 'bg-amber-50 text-amber-700' };
    if (raw.includes('contact') || txt.includes('lead'))
      return { label: 'CRM', className: 'bg-violet-50 text-violet-700' };
    return { label: 'General', className: 'bg-slate-100 text-slate-700' };
  };

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = (currentUser?.displayName || '').split(' ')[0] || 'there';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EEF2F8' }}>

      {/* ── Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 998,
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          width: '256px',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#FFFFFF',
          borderRight: '1px solid #E1E8F4',
          zIndex: 999,
          boxShadow: sidebarOpen ? '8px 0 40px rgba(15,23,42,0.1)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid #EEF2F8',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${hexToRgba(themeColor, 0.06)} 0%, rgba(255,255,255,0) 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${themeColor} 0%, ${hexToRgba(themeColor, 0.7)} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${hexToRgba(themeColor, 0.3)}`,
                flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>A3</span>
              </div>
              <div>
                <div style={{
                  color: '#0F172A', fontWeight: 800, fontSize: '15px',
                  fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px', lineHeight: '1',
                }}>
                  A365 Tracker
                </div>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 500, marginTop: '1px', letterSpacing: '0.03em' }}>
                  Enterprise CRM
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                borderRadius: '8px', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748B', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <FaXmark size={14} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>

          {/* Dashboard */}
          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px',
              borderRadius: '10px',
              textDecoration: 'none',
              marginBottom: '4px',
              color: location.pathname === '/' ? themeColor : '#475569',
              background: location.pathname === '/' ? hexToRgba(themeColor, 0.09) : 'transparent',
              border: `1px solid ${location.pathname === '/' ? hexToRgba(themeColor, 0.15) : 'transparent'}`,
              fontWeight: location.pathname === '/' ? 700 : 500,
              fontSize: '13.5px',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '28px', height: '28px',
              borderRadius: '8px',
              background: location.pathname === '/' ? hexToRgba(themeColor, 0.14) : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FaHouse size={13} style={{ color: location.pathname === '/' ? themeColor : '#94A3B8' }} />
            </div>
            <span>Dashboard</span>
          </Link>

          {/* Menus Header & Toggle All Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 4px', padding: '0 4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
            <button
               onClick={handleToggleAll}
               style={{
                 background: 'none', border: 'none', color: themeColor,
                 fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                 fontFamily: 'DM Sans, sans-serif'
               }}
            >
               {allExpanded ? 'View Less' : 'View All'}
            </button>
          </div>

          {/* Categories */}
          {navCategories.map((category) => {
            const hasPerm = category.items.some((item) => hasPermission(item.permission));
            if (!hasPerm) return null;
            const isExpanded = expandedCategories[category.title] !== false;

            return (
              <div key={category.title} style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => toggleCategory(category.title)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: 'none', border: 'none',
                    padding: '8px 12px 5px',
                    color: '#94A3B8',
                    fontWeight: 400,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <span>{category.title}</span>
                  {isExpanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                </button>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {category.items.filter((i) => hasPermission(i.permission)).map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 12px',
                            borderRadius: '9px',
                            textDecoration: 'none',
                            color: isActive ? themeColor : '#64748B',
                            background: isActive ? hexToRgba(themeColor, 0.09) : 'transparent',
                            border: `1px solid ${isActive ? hexToRgba(themeColor, 0.14) : 'transparent'}`,
                            fontWeight: isActive ? 700 : 500,
                            fontSize: '13px',
                            fontFamily: 'DM Sans, sans-serif',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = '#F8FAFC';
                              e.currentTarget.style.color = '#334155';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#64748B';
                            }
                          }}
                        >
                          <div style={{
                            width: '26px', height: '26px',
                            borderRadius: '7px',
                            background: isActive ? hexToRgba(themeColor, 0.12) : '#F1F5F9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            transition: 'background 0.15s',
                          }}>
                            {React.cloneElement(item.icon, {
                              style: { color: isActive ? themeColor : '#94A3B8' }
                            })}
                          </div>
                          <span>{item.label}</span>
                          {isActive && (
                            <div style={{
                              marginLeft: 'auto', width: '5px', height: '5px',
                              borderRadius: '50%', background: themeColor, flexShrink: 0,
                            }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin */}
          <div style={{ marginTop: '6px', paddingTop: '2px' }}>
            <Link
              to="/admin"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: location.pathname === '/admin' ? themeColor : '#64748B',
                background: location.pathname === '/admin' ? hexToRgba(themeColor, 0.09) : 'transparent',
                border: `1px solid ${location.pathname === '/admin' ? hexToRgba(themeColor, 0.14) : 'transparent'}`,
                fontWeight: location.pathname === '/admin' ? 700 : 500,
                fontSize: '13px',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: location.pathname === '/admin' ? hexToRgba(themeColor, 0.12) : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FaShieldHalved size={13} style={{ color: location.pathname === '/admin' ? themeColor : '#94A3B8' }} />
              </div>
              <span>Admin</span>
            </Link>
          </div>
        </nav>

        {/* Profile Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #EEF2F8', flexShrink: 0 }}>
          {currentUser && (
            <Link
              to="/settings"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', marginBottom: '8px',
                background: location.pathname === '/settings' ? hexToRgba(themeColor, 0.07) : '#F8FAFC',
                border: `1px solid ${location.pathname === '/settings' ? hexToRgba(themeColor, 0.14) : '#E1E8F4'}`,
                borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${themeColor}, ${hexToRgba(themeColor, 0.65)})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '12px',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: `0 3px 10px ${hexToRgba(themeColor, 0.28)}`,
                flexShrink: 0,
              }}>
                {userInitials}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.displayName || 'User'}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                  {currentUser.email}
                </div>
              </div>
              <FaGear size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
            </Link>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '9px',
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.14)',
              borderRadius: '10px', color: '#E11D48',
              fontWeight: 600, fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.06)'; }}
          >
            <FaRightFromBracket size={13} />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flexGrow: 1, padding: '0', display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <div style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          background: '#EEF2F8',
          overflow: 'hidden',
        }}>

          {/* ── Top Header Bar ── */}
          <div style={{
            padding: '0 20px',
            height: '56px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E1E8F4',
          }}>
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E1E8F4',
                borderRadius: '10px',
                padding: '7px 9px',
                cursor: 'pointer',
                color: themeColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = hexToRgba(themeColor, 0.07); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
              title="Open menu"
            >
              <FaBars size={16} />
            </button>

            {/* Page Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <h5 style={{
                margin: 0, fontWeight: 800, fontSize: '15px',
                color: '#0F172A', fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.3px', whiteSpace: 'nowrap',
              }}>
                {currentPageLabel}
              </h5>

              {/* Alert pill */}
              {activePageAlertMessage && (
                <div
                  key={`${location.pathname}-${activePageAlertIndex}`}
                  className="layout-page-alert-pop"
                  style={{
                    maxWidth: '420px',
                    background: 'rgba(67, 97, 238, 0.07)',
                    border: '1px solid rgba(67, 97, 238, 0.16)',
                    color: '#4361EE',
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  title={activePageAlertMessage}
                >
                  ✦ {activePageAlertMessage}
                </div>
              )}
            </div>

            {/* Right side actions */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              
              {/* Added Home & Notifications to Top Header Bar */}
              <div className="dash-header-nav" style={{ marginRight: '10px' }}>
                <button className="dash-nav-pill active" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => navigate('/')}>Home</button>
                <button className="dash-nav-pill" onClick={() => setShowPremiumInbox(true)} style={{ padding: '6px 16px', fontSize: '13px' }}>
                  Notifications
                  {criticalAlertsCount > 0 && <span className="dash-nav-badge">{criticalAlertsCount}</span>}
                </button>
              </div>
            </div>
          </div>

          {/* ── Scrollable Content ── */}
          <div ref={contentRef} style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Outlet context={{ setIsAlertSidebarOpen }} />
          </div>
        </div>
      </div>

      {/* ── Alert Sidebar ── */}
      {isAlertSidebarOpen && (
        <AlertSidebar
          alerts={alerts}
          onClose={() => setIsAlertSidebarOpen(false)}
          getAlertCategory={getAlertCategoryGlobal}
        />
      )}

      {/* ── Premium Notification Inbox ── */}
      <NotificationInboxModal 
        show={showPremiumInbox} 
        onHide={() => setShowPremiumInbox(false)} 
        alerts={alerts}
      />
    </div>
  );
}
