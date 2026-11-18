import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck2,
  FileText,
  HardHat,
  Inbox,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UserCircle2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Avatar, Button, cn } from '@/src/components/ui/Primitives';
import { HR_ROLES, getRoleDefinition } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';
import { HRRoleId } from '@/src/types/hr';

interface NavItem {
  label: string;
  shortLabel?: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'Core Workforce' | 'Time & Leave' | 'Compliance & Contractors' | 'Operations & Admin';
  badgeCount?: number;
}

const ROUTE_TITLES: Array<{ prefix: string; title: string; parent?: string }> = [
  { prefix: '/overview', title: 'HR Overview' },
  { prefix: '/employees/', title: 'Employee Profile', parent: 'Employee Directory' },
  { prefix: '/employees', title: 'Employee Directory' },
  { prefix: '/onboarding', title: 'Employee Onboarding' },
  { prefix: '/employment-records', title: 'Employment Records' },
  { prefix: '/attendance-exceptions', title: 'Attendance Exceptions', parent: 'Attendance Management' },
  { prefix: '/attendance', title: 'Attendance Management' },
  { prefix: '/leaves', title: 'Leave Management' },
  { prefix: '/documents', title: 'Employee Documents' },
  { prefix: '/contractors', title: 'Contractor Workforce' },
  { prefix: '/departments', title: 'Departments & Designations' },
  { prefix: '/compliance', title: 'Compliance Centre' },
  { prefix: '/training', title: 'Training & Certifications' },
  { prefix: '/requests', title: 'HR Requests' },
  { prefix: '/reports', title: 'HR Reports & Analytics' },
  { prefix: '/notifications', title: 'Notifications' },
  { prefix: '/settings', title: 'HR Settings' },
  { prefix: '/profile', title: 'My HR Profile' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    sidebarCollapsed,
    toggleSidebar,
    activeRoleId,
    setActiveRole,
    activeUserName,
    activeUserAvatar,
    selectedDate,
    setSelectedDate,
    employees,
    onboardingRecords,
    attendanceExceptions,
    leaveRequests,
    complianceRecords,
    notifications,
    markNotificationRead,
    settings,
  } = useHRStore();

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const openExceptionsCount = attendanceExceptions.filter(
    (e) => e.status !== 'Resolved' && e.status !== 'Rejected'
  ).length;
  const pendingLeavesCount = leaveRequests.filter(
    (l) => l.status === 'Pending' || l.status === 'Forwarded to HR Manager'
  ).length;
  const pendingOnboardingCount = onboardingRecords.filter((o) => o.approvalStatus !== 'Activated').length;
  const overdueComplianceCount = complianceRecords.filter(
    (c) => c.status === 'Overdue' || c.status === 'Non-Compliant'
  ).length;

  const navItems: NavItem[] = [
    { label: 'Overview', to: '/overview', icon: LayoutDashboard, group: 'Core Workforce' },
    { label: 'Employee Directory', to: '/employees', icon: Users, group: 'Core Workforce' },
    {
      label: 'Employee Onboarding',
      to: '/onboarding',
      icon: UserPlus,
      group: 'Core Workforce',
      badgeCount: pendingOnboardingCount,
    },
    { label: 'Employment Records', to: '/employment-records', icon: FileCheck2, group: 'Core Workforce' },
    { label: 'Attendance Management', to: '/attendance', icon: Clock, group: 'Time & Leave' },
    {
      label: 'Attendance Exceptions',
      to: '/attendance-exceptions',
      icon: AlertTriangle,
      group: 'Time & Leave',
      badgeCount: openExceptionsCount,
    },
    {
      label: 'Leave Management',
      to: '/leaves',
      icon: Calendar,
      group: 'Time & Leave',
      badgeCount: pendingLeavesCount,
    },
    { label: 'Employee Documents', to: '/documents', icon: FileText, group: 'Compliance & Contractors' },
    { label: 'Contractor Workforce', to: '/contractors', icon: HardHat, group: 'Compliance & Contractors' },
    { label: 'Departments & Designations', to: '/departments', icon: Building2, group: 'Compliance & Contractors' },
    {
      label: 'Compliance Centre',
      to: '/compliance',
      icon: ShieldCheck,
      group: 'Compliance & Contractors',
      badgeCount: overdueComplianceCount,
    },
    { label: 'Training & Certifications', to: '/training', icon: Award, group: 'Compliance & Contractors' },
    { label: 'HR Requests', to: '/requests', icon: Inbox, group: 'Operations & Admin' },
    { label: 'HR Reports & Analytics', to: '/reports', icon: BarChart3, group: 'Operations & Admin' },
    {
      label: 'Notifications',
      to: '/notifications',
      icon: Bell,
      group: 'Operations & Admin',
      badgeCount: unreadNotifs,
    },
    { label: 'HR Settings', to: '/settings', icon: Settings, group: 'Operations & Admin' },
    { label: 'Profile', to: '/profile', icon: UserCircle2, group: 'Operations & Admin' },
  ];

  const groups: NavItem['group'][] = [
    'Core Workforce',
    'Time & Leave',
    'Compliance & Contractors',
    'Operations & Admin',
  ];

  const routeMeta = useMemo(() => {
    const match = ROUTE_TITLES.find((r) => location.pathname.startsWith(r.prefix));
    return match ?? ROUTE_TITLES[0];
  }, [location.pathname]);

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.phone.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designationTitle.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [globalSearch, employees]);

  const activeRole = getRoleDefinition(activeRoleId);

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-[#172B4D] overflow-x-hidden">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-[#101F35] text-slate-200 border-r border-slate-800 transition-all duration-200',
          sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'
        )}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight text-white whitespace-nowrap truncate">
                BuildFlow
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap truncate">
                HR & Compliance Workspace
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-md bg-[#2563EB] text-white font-bold flex items-center justify-center mx-auto text-sm">
              BF
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="mx-auto mt-2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {groups.map((group) => (
            <div key={group}>
              {!sidebarCollapsed && (
                <div className="px-2.5 mb-1.5 text-[11px] font-medium text-slate-400 tracking-wide">
                  {group}
                </div>
              )}
              <div className="space-y-0.5">
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors duration-150',
                            isActive
                              ? 'bg-[#2563EB] text-white'
                              : 'text-slate-300 hover:text-white hover:bg-white/8'
                          )
                        }
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </span>
                        {!sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-white/10 text-slate-100 shrink-0">
                            {item.badgeCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/10 text-[11px] text-slate-400">
            <div className="font-medium text-slate-200 truncate">{settings.companyName}</div>
            <div className="mt-0.5">
              Mode: <span className="capitalize text-slate-300">{settings.companySizeProfile}</span> · Sample Demo Data
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Frame */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-200 pb-16 md:pb-0',
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[256px]'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 md:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Page Title & Breadcrumb */}
          <div className="min-w-0 flex items-center gap-3">
            <button
              onClick={() => setMobileMoreOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 -ml-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <span>BuildFlow</span>
                <span>/</span>
                <span>HR & Compliance</span>
                {routeMeta.parent && (
                  <>
                    <span>/</span>
                    <span>{routeMeta.parent}</span>
                  </>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-[#172B4D] truncate">
                {routeMeta.title}
              </h1>
            </div>
          </div>

          {/* Center-Right: Global Employee Search (desktop/tablet) */}
          <div className="hidden lg:block relative w-72 xl:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              placeholder="Search employee name, ID, phone..."
              aria-label="Global employee search"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 bg-[#F5F7FA] text-xs text-[#172B4D] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
            {searchFocused && globalSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-40">
                {searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[#64748B]">No employees matched "{globalSearch}".</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {searchResults.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onMouseDown={() => {
                          navigate(`/employees/${emp.id}`);
                          setGlobalSearch('');
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Avatar name={emp.fullName} src={emp.avatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#172B4D] truncate">{emp.fullName}</div>
                          <div className="text-[11px] text-[#64748B] truncate font-mono">
                            {emp.employeeCode} · {emp.designationTitle} · {emp.projectName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Date Selector, Quick Actions, Notifications, Role/Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Operational date selector"
              className="hidden xl:block h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-mono tabular-nums text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
            />

            {/* Quick Action Dropdown */}
            <div className="relative">
              <Button
                size="sm"
                onClick={() => {
                  setQuickActionOpen((v) => !v);
                  setNotifOpen(false);
                  setRoleMenuOpen(false);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Action</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              {quickActionOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40">
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      navigate('/onboarding?new=1');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Add Employee / Start Onboarding</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      navigate('/attendance-exceptions');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Review Attendance Exceptions ({openExceptionsCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      navigate('/leaves');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Review Leave Requests ({pendingLeavesCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      navigate('/compliance?upload=1');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Upload Compliance Document</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setQuickActionOpen(false);
                  setRoleMenuOpen(false);
                }}
                aria-label="Notifications"
                className="relative h-9 w-9 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-[#172B4D] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded bg-[#DC2626] text-white text-[10px] font-mono tabular-nums flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#172B4D]">HR Alerts ({unreadNotifs} unread)</span>
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/notifications');
                      }}
                      className="text-[11px] font-medium text-[#2563EB] hover:underline cursor-pointer"
                    >
                      View all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          navigate(n.targetRoute);
                        }}
                        className={cn(
                          'w-full px-3.5 py-2.5 text-left hover:bg-slate-50 cursor-pointer block',
                          !n.isRead && 'bg-blue-50/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
                          <span className="font-medium text-[#172B4D]">{n.category}</span>
                          <span className="font-mono">{n.timestamp.slice(11)}</span>
                        </div>
                        <div className="text-xs font-medium text-[#172B4D] mt-0.5">{n.title}</div>
                        <div className="text-[11px] text-[#64748B] truncate mt-0.5">{n.relatedRecordLabel}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Role / HR Profile Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setRoleMenuOpen((v) => !v);
                  setQuickActionOpen(false);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <Avatar name={activeUserName} src={activeUserAvatar} size="sm" />
                <div className="hidden sm:block text-left min-w-0">
                  <div className="text-xs font-semibold text-[#172B4D] leading-tight truncate max-w-[110px]">
                    {activeUserName}
                  </div>
                  <div className="text-[10px] text-[#64748B] leading-tight truncate max-w-[110px]">
                    {activeRole.name}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-40">
                  <div className="px-3.5 pb-2 border-b border-slate-100">
                    <div className="text-[11px] font-medium text-[#64748B]">Switch Active RBAC Role (Demo)</div>
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {HR_ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setActiveRole(role.id as HRRoleId);
                          setRoleMenuOpen(false);
                        }}
                        className={cn(
                          'w-full px-3.5 py-2 text-left hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-2',
                          role.id === activeRoleId && 'bg-blue-50/70'
                        )}
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#172B4D] flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>{role.name}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">{role.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-1.5 mt-1 border-t border-slate-100 px-2">
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#2563EB] hover:bg-slate-50 rounded cursor-pointer"
                    >
                      Open My Profile & Permissions →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sample Data Notice + Role Scope Bar */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-[#172B4D]">Sample Demo Data</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">
              Tenant: {settings.companyName} · Active Role: <strong className="text-[#172B4D]">{activeRole.name}</strong>
              {activeRole.siteScopeRestricted && activeRole.assignedSites && (
                <span> (Scoped to {activeRole.assignedSites.join(', ')})</span>
              )}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Supabase-ready service layer</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{selectedDate}</span>
          </div>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 p-3 sm:p-6 max-w-[1440px] w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 targets: Overview, Employees, Attendance, Leaves, More) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-slate-200 grid grid-cols-5">
        <NavLink
          to="/overview"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center text-[10px] font-medium gap-0.5',
              isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
            )
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </NavLink>
        <NavLink
          to="/employees"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center text-[10px] font-medium gap-0.5',
              isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
            )
          }
        >
          <Users className="w-4 h-4" />
          <span>Employees</span>
        </NavLink>
        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center text-[10px] font-medium gap-0.5',
              isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
            )
          }
        >
          <Clock className="w-4 h-4" />
          <span>Attendance</span>
        </NavLink>
        <NavLink
          to="/leaves"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center text-[10px] font-medium gap-0.5',
              isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
            )
          }
        >
          <Calendar className="w-4 h-4" />
          <span>Leaves</span>
        </NavLink>
        <button
          onClick={() => setMobileMoreOpen(true)}
          className="flex flex-col items-center justify-center text-[10px] font-medium gap-0.5 text-[#64748B] cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More / Full Navigation Drawer */}
      {mobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#101F35]/60 flex">
          <div className="w-72 max-w-[85vw] bg-[#101F35] text-slate-200 h-full flex flex-col">
            <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">BuildFlow HR</div>
                <div className="text-[11px] text-slate-400">{activeRole.name}</div>
              </div>
              <button
                onClick={() => setMobileMoreOpen(false)}
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {groups.map((group) => (
                <div key={group}>
                  <div className="px-2 mb-1 text-[11px] font-medium text-slate-400">{group}</div>
                  <div className="space-y-0.5">
                    {navItems
                      .filter((i) => i.group === group)
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileMoreOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center justify-between px-2.5 py-2.5 rounded-md text-xs font-medium',
                                isActive ? 'bg-[#2563EB] text-white' : 'text-slate-300 hover:bg-white/10'
                              )
                            }
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span>{item.label}</span>
                            </span>
                            {item.badgeCount !== undefined && item.badgeCount > 0 && (
                              <span className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded">
                                {item.badgeCount}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMoreOpen(false)} />
        </div>
      )}
    </div>
  );
};
