import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FaChartColumn, FaUserGroup, FaClock, FaRightFromBracket, FaHouse,
  FaMoneyBillWave, FaListCheck, FaFileInvoice, FaBars, FaXmark,
  FaBrain, FaShieldHalved, FaArrowUpFromBracket, FaChevronDown, FaChevronUp,
  FaGear, FaCircleInfo,
  FaBuilding, FaAddressBook, FaBullseye, FaChartLine, FaBriefcase,
  FaFileInvoiceDollar, FaScaleBalanced, FaFolderOpen, FaCalendarDays,
  FaTicket, FaChartPie, FaUsers
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [activePageAlertIndex, setActivePageAlertIndex] = useState(0);

  const navigate = useNavigate();

  const [projectCount, setProjectCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [timesheetCount, setTimesheetCount] = useState(0);
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(false);
  const [showPremiumInbox, setShowPremiumInbox] = useState(false);

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



  const navCategories = [
    {
      title: 'CRM',
      items: [
        { path: '/company', icon: <FaBuilding size={14} />, label: 'Company', permission: 'contacts.view' },
        { path: '/contact', icon: <FaAddressBook size={14} />, label: 'Contacts', permission: 'contacts.view' },
        { path: '/leads', icon: <FaBullseye size={14} />, label: 'Leads', permission: 'sales.view' },
      ],
    },
    {
      title: 'Execution',
      items: [
        { path: '/sales', icon: <FaChartLine size={14} />, label: 'Sales', permission: 'sales.view' },
        { path: '/projects', icon: <FaBriefcase size={14} />, label: 'Projects', permission: 'timesheet.view' },
        { path: '/timesheet', icon: <FaClock size={14} />, label: 'Timesheet', permission: 'timesheet.view' },
        { path: '/todolist', icon: <FaListCheck size={14} />, label: 'To-Do', permission: 'todolist.view' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { path: '/finance',   icon: <FaMoneyBillWave size={14} />, label: 'Finance',      permission: 'finance.view' },
        { path: '/invoice',   icon: <FaFileInvoiceDollar size={14} />,   label: 'Deal Finance', permission: 'invoice.view' },
        { path: '/legal',     icon: <FaScaleBalanced size={14} />,   label: 'Legal',        permission: 'invoice.view' },
        { path: '/documents', icon: <FaFolderOpen size={14} />,   label: 'Documents',    permission: 'documents.view' },
        { path: '/calendar',  icon: <FaCalendarDays size={14} />,         label: 'Calendar',     permission: 'calendar.view' },
        { path: '/tickets',   icon: <FaTicket size={14} />,     label: 'Tickets',      permission: 'notifications.view' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { path: '/reports',   icon: <FaChartPie size={14} />,   label: 'Reports',      permission: 'reports.view' },
      ],
    },
    {
      title: 'People',
      items: [
        { path: '/hr', icon: <FaUsers size={14} />, label: 'HR', permission: 'activitylog.view' },
      ],
    },
    {
      title: 'AI',
      items: [
        { path: '/ai-agents', icon: <FaBrain size={14} />, label: 'Agent AI', permission: 'aiagents.view' },
      ],
    },
  ];



  let currentPageLabel = 'Ambot365 Tracker';
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'transparent' }}>

      {/* ── Sidebar ── */}
      <div
        className="no-scrollbar"
        style={{
          width: sidebarOpen ? '256px' : '72px',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#FFFFFF',
          borderRight: '1px solid #E1E8F4',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          flexShrink: 0,
          zIndex: 999,
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: sidebarOpen ? '18px 20px 16px' : '18px 0 16px',
          borderBottom: '1px solid #EEF2F8',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${hexToRgba(themeColor, 0.06)} 0%, rgba(255,255,255,0) 100%)`,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: sidebarOpen ? 'space-between' : 'center', 
            flexDirection: sidebarOpen ? 'row' : 'column',
            gap: sidebarOpen ? '0' : '16px',
            padding: sidebarOpen ? '0' : '0' 
          }}>
            {sidebarOpen && (
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${themeColor} 0%, ${hexToRgba(themeColor, 0.7)} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${hexToRgba(themeColor, 0.3)}`,
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>AB</span>
                </div>
                <div>
                  <div style={{
                    color: '#0F172A', fontWeight: 800, fontSize: '15px',
                    fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px', lineHeight: '1',
                  }}>
                    Ambot365 Tracker
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 500, marginTop: '1px', letterSpacing: '0.03em' }}>
                    Enterprise CRM
                  </div>
                </div>
              </Link>
            )}
            
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
              title="Toggle menu"
            >
              <FaBars size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="no-scrollbar" style={{ flex: 1, padding: sidebarOpen ? '12px 12px 0' : '12px 8px 0', overflowY: 'auto' }}>

          {/* Dashboard */}
          <Link
            to="/"
            title="Dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: sidebarOpen ? '9px 12px' : '9px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              borderRadius: '10px',
              textDecoration: 'none',
              marginBottom: '12px',
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
            {sidebarOpen && <span>Dashboard</span>}
          </Link>

          {/* Nav Items (Flat List) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navCategories.flatMap(cat => cat.items).filter(i => hasPermission(i.permission)).map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: sidebarOpen ? '8px 12px' : '8px',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
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
                  {sidebarOpen && <span>{item.label}</span>}
                  {sidebarOpen && isActive && (
                    <div style={{
                      marginLeft: 'auto', width: '5px', height: '5px',
                      borderRadius: '50%', background: themeColor, flexShrink: 0,
                    }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin */}
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #EEF2F8' }}>
            <Link
              to="/admin"
              title="Admin"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: sidebarOpen ? '9px 12px' : '9px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
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
              {sidebarOpen && <span>Admin</span>}
            </Link>
          </div>
        </nav>

        {/* Profile Footer */}
        <div style={{ padding: sidebarOpen ? '12px' : '12px 8px', borderTop: '1px solid #EEF2F8', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {currentUser && (
            <Link
              to="/settings"
              title="Settings"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: sidebarOpen ? '10px 12px' : '8px', marginBottom: '8px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                width: '100%',
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
              {sidebarOpen && (
                <>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.displayName || 'User'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                      {currentUser.email}
                    </div>
                  </div>
                  <FaGear size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
                </>
              )}
            </Link>
          )}
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: sidebarOpen ? '9px' : '9px 0',
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
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flexGrow: 1, padding: '0', display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <div style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          background: 'transparent',
          overflow: 'hidden',
        }}>



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
