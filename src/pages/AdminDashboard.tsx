import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building2, Package, ShieldCheck, Trash2, Send, 
  Activity, RefreshCw, Sparkles, Database, Search, CheckCircle2,
  Megaphone, Zap, Radio, ChevronRight, UserCheck, Layers, AlertCircle
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToastStore } from '../store/useToastStore';
import { apiFetch } from '../lib/api';

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalProducts: number;
  totalSalesCount: number;
  totalSalesVolume: number;
  systemStatus: string;
  uptime: string;
}

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  businessCount: number;
  businessNames: string;
  createdAt: string;
}

interface AdminBusiness {
  id: string;
  name: string;
  type: string;
  currency: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'businesses' | 'broadcast'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Announcement state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const addToast = useToastStore(state => state.addToast);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch<AdminStats>('/admin/stats').catch(e => {
        console.error('Failed to fetch stats:', e);
        return null;
      });
      const usersRes = await apiFetch<AdminUser[]>('/admin/users').catch(e => {
        console.error('Failed to fetch users:', e);
        return [];
      });
      const bizRes = await apiFetch<AdminBusiness[]>('/admin/businesses').catch(e => {
        console.error('Failed to fetch businesses:', e);
        return [];
      });

      if (statsRes) setStats(statsRes);
      if (usersRes) setUsers(usersRes);
      if (bizRes) setBusinesses(bizRes);

      if (!statsRes && (!usersRes || !usersRes.length) && (!bizRes || !bizRes.length)) {
        addToast('Admin authorization missing. Please log in again.', 'error');
      }
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      addToast(err.message || 'Failed to load system admin data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${email} and all associated data?`)) return;

    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      addToast(`User ${email} deleted successfully`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setSendingBroadcast(true);
    try {
      const res = await apiFetch('/admin/announcement', {
        method: 'POST',
        body: {
          title: broadcastTitle,
          message: broadcastMessage,
          priority: broadcastPriority
        }
      });
      addToast(res.message || 'Announcement sent to all shop owners successfully!', 'success');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      addToast(err.message || 'Failed to send announcement', 'error');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const applyPresetTemplate = (type: 'maintenance' | 'update' | 'security') => {
    if (type === 'maintenance') {
      setBroadcastTitle('🛠️ System Maintenance Schedule');
      setBroadcastMessage('We will perform scheduled system upgrades on Sunday from 2:00 AM to 3:00 AM. Access may be temporarily paused during this window.');
      setBroadcastPriority('medium');
    } else if (type === 'update') {
      setBroadcastTitle('🚀 New Features Available in Amr Hisab');
      setBroadcastMessage('We have upgraded analytics charts and restock warnings! Explore the updated insights tab in your dashboard now.');
      setBroadcastPriority('low');
    } else if (type === 'security') {
      setBroadcastTitle('🔒 Security Advisory');
      setBroadcastMessage('Please ensure you keep your account password secure and never share authentication OTPs or login credentials with anyone.');
      setBroadcastPriority('high');
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const safeBusinesses = Array.isArray(businesses) ? businesses : [];

  const filteredUsers = safeUsers.filter(u =>
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.businessNames || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBusinesses = safeBusinesses.filter(b =>
    (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.ownerEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-28 relative">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[300px] bg-accent-primary/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-10 w-[400px] h-[250px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Header Card */}
      <GlassCard className="p-6 md:p-8 relative overflow-hidden border border-border shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              SaaS Control Center & System Oversight
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
              সুপার অ্যাডমিন ড্যাশবোর্ড
              <span className="text-sm font-normal text-text-muted hidden sm:inline-block">| Platform Management</span>
            </h1>
            
            <p className="text-text-secondary text-sm md:text-base max-w-2xl">
              Monitor multi-tenant platform metrics, manage registered user accounts, inspect businesses, and broadcast announcements across the system.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-medium backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
              <span className="text-text-primary font-bold">MongoDB Atlas</span>
              <span className="text-text-muted">Connected</span>
            </div>

            <Button onClick={loadData} variant="secondary" size="sm" className="gap-2 shadow-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Dashboard
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Radiant Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Users */}
        <GlassCard className="p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Registered Users</span>
              <h3 className="text-4xl font-black text-text-primary tracking-tight">{stats?.totalUsers ?? 0}</h3>
              <div className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 font-semibold pt-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>All accounts active</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-md group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Registered Businesses */}
        <GlassCard className="p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Active Stores</span>
              <h3 className="text-4xl font-black text-text-primary tracking-tight">{stats?.totalBusinesses ?? 0}</h3>
              <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-semibold pt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Multi-tenant shops</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-md group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7" />
            </div>
          </div>
        </GlassCard>

        {/* Card 3: Total Products */}
        <GlassCard className="p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Products</span>
              <h3 className="text-4xl font-black text-text-primary tracking-tight">{stats?.totalProducts ?? 0}</h3>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Catalog items</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md group-hover:scale-110 transition-transform">
              <Package className="w-7 h-7" />
            </div>
          </div>
        </GlassCard>

        {/* Card 4: System Health & Uptime */}
        <GlassCard className="p-6 relative overflow-hidden group hover:border-rose-500/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider">System Status</span>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-black text-text-primary">{stats?.systemStatus ?? 'Healthy'}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">
                <Zap className="w-3.5 h-3.5" />
                <span>{stats?.uptime ?? '99.9%'} Uptime</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-md group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7" />
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Navigation Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Custom Glass Pills Tabs */}
        <div className="flex p-1.5 bg-bg-elevated rounded-2xl border border-border backdrop-blur-md">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'users' ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            ইউজার কন্ট্রোল ({users.length})
          </button>
          
          <button
            onClick={() => setActiveTab('businesses')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'businesses' ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Building2 className="w-4 h-4" />
            দোকানের তালিকা ({businesses.length})
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'broadcast' ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            এনাউন্সমেন্ট সেন্টার
          </button>
        </div>

        {/* Search Input for Tables */}
        {activeTab !== 'broadcast' && (
          <div className="w-full md:w-80">
            <Input
              prefix={Search}
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-bg-elevated backdrop-blur-md"
            />
          </div>
        )}
      </div>

      {/* Main Tab Content Panels */}
      <AnimatePresence mode="wait">
        
        {/* Tab 1: Users Management */}
        {activeTab === 'users' && (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    নিবন্ধিত ইউজার একাউন্টসমূহ (User Directory)
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">Full list of users registered in MongoDB Atlas</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-elevated text-text-muted text-xs uppercase tracking-wider border-b border-border">
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Contact & Location</th>
                      <th className="p-4">Businesses</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-muted">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const avatarGradient = getAvatarColor(u.fullName || u.email);
                        const initials = (u.fullName || u.email || 'US').substring(0, 2).toUpperCase();

                        return (
                          <tr key={u.id} className="hover:bg-bg-elevated/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-bold text-text-primary">{u.fullName}</p>
                                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold uppercase tracking-wider">Registered Owner</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 font-mono text-text-secondary text-xs">{u.email}</td>

                            <td className="p-4">
                              <p className="text-text-primary font-medium">{u.phone}</p>
                              <p className="text-xs text-text-muted">{u.address}</p>
                            </td>

                            <td className="p-4">
                              <Badge variant="success" size="sm" className="mb-1">{u.businessCount} Store(s)</Badge>
                              <p className="text-xs text-text-muted truncate max-w-[200px]">{u.businessNames}</p>
                            </td>

                            <td className="p-4 text-xs text-text-muted">
                              {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>

                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="text-danger hover:bg-danger/10 hover:text-danger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Tab 2: Businesses Management */}
        {activeTab === 'businesses' && (
          <motion.div
            key="businesses-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    নিবন্ধিত ব্যবসা ও দোকানসমূহ (Registered Stores)
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">Overview of all active store tenants on the platform</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-elevated text-text-muted text-xs uppercase tracking-wider border-b border-border">
                      <th className="p-4">Business Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Owner Name</th>
                      <th className="p-4">Owner Email</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-muted">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          No businesses found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredBusinesses.map((b) => (
                        <tr key={b.id} className="hover:bg-bg-elevated/60 transition-colors">
                          <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            {b.name}
                          </td>

                          <td className="p-4">
                            <Badge variant="info" size="sm">{b.type}</Badge>
                            <span className="ml-2 text-xs text-text-muted">({b.currency})</span>
                          </td>

                          <td className="p-4 font-medium text-text-primary">{b.ownerName}</td>

                          <td className="p-4 font-mono text-text-secondary text-xs">{b.ownerEmail}</td>

                          <td className="p-4 text-xs text-text-muted">{b.address}</td>

                          <td className="p-4 text-xs text-text-muted">
                            {new Date(b.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Tab 3: System Broadcast Announcement Center */}
        {activeTab === 'broadcast' && (
          <motion.div
            key="broadcast-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Container */}
              <GlassCard className="p-6 lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-accent-primary" />
                    সিস্টেম এনাউন্সমেন্ট ব্রডকাস্ট (Broadcaster)
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Send platform notifications directly to all registered shop owners' notification feeds.
                  </p>
                </div>

                {/* Preset Templates */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Quick Preset Templates</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyPresetTemplate('maintenance')}
                      className="px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-semibold hover:bg-warning/20 transition-colors"
                    >
                      🛠️ Maintenance Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetTemplate('update')}
                      className="px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold hover:bg-accent-primary/20 transition-colors"
                    >
                      🚀 Feature Update Alert
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetTemplate('security')}
                      className="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-semibold hover:bg-danger/20 transition-colors"
                    >
                      🔒 Security Advisory
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
                  <Input
                    label="Notice Title"
                    placeholder="e.g. Scheduled System Upgrade Notice"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={broadcastPriority}
                        onChange={(e: any) => setBroadcastPriority(e.target.value)}
                        className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary text-sm font-medium"
                      >
                        <option value="low">🟢 Low Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="high">🔴 High Priority</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-1">
                      <p className="text-xs text-text-muted">
                        Broadcasts are dispatched instantly to all {users.length} active users.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Announcement Message Content
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Write your notice message here..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary text-sm leading-relaxed resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2 py-3 shadow-lg shadow-accent-primary/20"
                    loading={sendingBroadcast}
                    disabled={!broadcastTitle || !broadcastMessage}
                  >
                    <Send className="w-4.5 h-4.5" />
                    Broadcast Announcement Now
                  </Button>
                </form>
              </GlassCard>

              {/* Live Card Preview */}
              <GlassCard className="p-6 space-y-4 h-fit">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent-primary animate-pulse" />
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Live User Feed Preview</h3>
                </div>

                <div className="p-4 rounded-xl bg-bg-elevated border border-border space-y-3 backdrop-blur-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-text-primary">
                      {broadcastTitle || 'Notification Title Preview'}
                    </span>
                    <Badge 
                      variant={broadcastPriority === 'high' ? 'danger' : broadcastPriority === 'medium' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {broadcastPriority.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {broadcastMessage || 'This is how your broadcast message will appear in shop owners\' notification feeds.'}
                  </p>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-text-muted border-t border-border">
                    <span>From: System Administration</span>
                    <span>Just Now</span>
                  </div>
                </div>
              </GlassCard>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
