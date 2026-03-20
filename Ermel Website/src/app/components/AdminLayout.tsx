import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router';
import {
  Menu, TrendingUp, ClipboardCheck, Trello, FileText, Package, Settings, Bell, LogOut, User, ChevronRight, DollarSign
} from 'lucide-react';
import { useQuotes } from '../context/QuoteContext';
import { supabase } from '../services/supabaseClient';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [unreadQuoteIds, setUnreadQuoteIds] = useState<string[]>([]);
  const { quotes, refreshQuotes } = useQuotes();

  const pendingCount = quotes.filter((q) => q.status === 'pending' || q.status === 'draft').length;

  const sortedQuotes = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()),
    [quotes]
  );

  const notificationItems = useMemo(
    () => sortedQuotes.slice(0, 8).map((q) => ({
      id: q.id,
      title: 'New Quote Request',
      message: `${q.customerName} submitted ${q.id}`,
      createdAt: q.submissionDate,
      unread: unreadQuoteIds.includes(q.id),
    })),
    [sortedQuotes, unreadQuoteIds]
  );

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('ermel_admin_token');
    const user = localStorage.getItem('ermel_admin_user');
    
    if (!token) {
      navigate('/admin/login');
    } else {
      setAdminUser(user || 'Admin');
    }
  }, [navigate]);

  useEffect(() => {
    const stored = localStorage.getItem('ermel_admin_unread_quotes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setUnreadQuoteIds(parsed);
      } catch {
        setUnreadQuoteIds([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ermel_admin_unread_quotes', JSON.stringify(unreadQuoteIds));
  }, [unreadQuoteIds]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('admin-quotes-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, (payload) => {
        const quoteNumber = (payload.new as any)?.quote_number;
        if (quoteNumber && typeof quoteNumber === 'string') {
          setUnreadQuoteIds((prev) => (prev.includes(quoteNumber) ? prev : [quoteNumber, ...prev].slice(0, 50)));
        }
        refreshQuotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshQuotes]);

  const handleLogout = () => {
    localStorage.removeItem('ermel_admin_token');
    localStorage.removeItem('ermel_admin_user');
    navigate('/admin/login');
  };

  const unreadCount = unreadQuoteIds.length;

  const handleOpenQuoteFromNotif = (quoteId: string) => {
    setUnreadQuoteIds((prev) => prev.filter((id) => id !== quoteId));
    setOpenNotifications(false);
    navigate(`/admin/quotations/${quoteId}`);
  };

  const menuCategories = [
    {
      title: 'Intelligence',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: '/admin/dashboard', category: 'intelligence' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'price-approval', label: 'Price Approval', icon: DollarSign, path: '/admin/price-approval', category: 'operations' },
        { id: 'quotations', label: 'Quotation Approval', icon: ClipboardCheck, path: '/admin/quotations', category: 'operations', badge: pendingCount || undefined },
        { id: 'queue', label: 'Installation Queue', icon: Trello, path: '/admin/queue', category: 'operations' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'logs', label: 'Order Logs', icon: FileText, path: '/admin/logs', category: 'management' },
        { id: 'procurement', label: 'Material Procurement', icon: Package, path: '/admin/procurement', category: 'management' },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings', category: 'system' },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ backgroundColor: '#fafafa', minHeightcd: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? '80px' : '260px',
          backgroundColor: '#15263c',
          transition: 'width 0.3s ease',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo Section */}
        <div
          className="flex items-center justify-between px-4"
          style={{ height: '76px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '20px', fontWeight: 800 }}>EM</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1 }}>
                  ERMEL
                </div>
                <div style={{ color: '#9ab0c4', fontSize: '10px', fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Admin DSS
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div
                className="flex items-center justify-center"
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '24px', fontWeight: 800 }}>EM</div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          {menuCategories.map((category) => (
            <div key={category.title} className="mb-6">
              {!sidebarCollapsed && (
                <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: '12px', marginBottom: '8px' }}>
                  {category.title}
                </div>
              )}
              <div className="space-y-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="flex items-center gap-3 px-3 py-3 transition-all duration-200"
                      style={{
                        backgroundColor: active ? 'rgba(122,0,0,0.15)' : 'transparent',
                        color: active ? 'white' : '#9ab0c4',
                        textDecoration: 'none',
                        position: 'relative',
                        borderLeft: active ? '3px solid #7a0000' : '3px solid transparent',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#9ab0c4';
                        }
                      }}
                    >
                      <Icon size={20} />
                      {!sidebarCollapsed && (
                        <>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em', flex: 1 }}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className="px-2 py-0.5"
                              style={{ backgroundColor: '#7a0000', color: 'white', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, borderRadius: '8px' }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div
          className="px-3 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#7a0000' }}
                >
                  <User size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                    {adminUser}
                  </div>
                  <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-body)' }}>
                    Administrator
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded hover:bg-opacity-80 transition-colors"
                title="Logout"
              >
                <LogOut size={16} color="#9ab0c4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
              title="Logout"
            >
              <LogOut size={20} color="#9ab0c4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '260px',
          flex: 1,
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Top Header */}
        <header
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #e0e4ea',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Burger Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 transition-colors"
                style={{ borderRadius: '8px' }}
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight size={20} color="#54667d" /> : <Menu size={20} color="#54667d" />}
              </button>

              <div>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Decision Support System
                </div>
                <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              className="relative p-3"
              style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px' }}
              onClick={() => setOpenNotifications((v) => !v)}
            >
              <Bell size={18} color="#54667d" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#7a0000', color: 'white', fontSize: '10px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            {openNotifications && (
              <div style={{ position: 'absolute', top: '68px', right: '24px', width: '320px', maxHeight: '420px', overflowY: 'auto', backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5', fontFamily: 'var(--font-heading)', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#15263c' }}>
                  Notifications
                </div>
                {notificationItems.length === 0 && (
                  <div style={{ padding: '14px', color: '#9ab0c4', fontSize: '13px' }}>No notifications yet.</div>
                )}
                {notificationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenQuoteFromNotif(item.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #f0f2f5', backgroundColor: item.unread ? '#fff8e1' : 'white', cursor: 'pointer' }}
                  >
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', color: '#15263c', fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#54667d', marginTop: '2px' }}>{item.message}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
