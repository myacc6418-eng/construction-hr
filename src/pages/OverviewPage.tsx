import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  FileWarning,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, Card, CardContent, CardHeader, StatusBadge } from '@/src/components/ui/Primitives';
import { ATTENDANCE_EXCEPTION_TREND_SERIES, MONTHLY_JOINING_EXITS_SERIES } from '@/src/data/demoData';
import { useHRStore } from '@/src/store/useHRStore';

const CHART_COLORS = ['#2563EB', '#101F35', '#16A34A', '#F59E0B', '#7C3AED', '#0EA5E9', '#DC2626', '#64748B'];

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    getScopedEmployees,
    onboardingRecords,
    attendanceExceptions,
    leaveRequests,
    documents,
    complianceRecords,
    contractors,
    projectSites,
  } = useHRStore();

  const employees = getScopedEmployees();
  const [actionFilter, setActionFilter] = useState<'all' | 'onboarding' | 'attendance' | 'leave' | 'documents' | 'compliance'>('all');

  // Derived KPI metrics from live store
  const metrics = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) =>
      ['Active', 'Confirmed', 'Probation', 'Notice Period'].includes(e.employmentStatus)
    ).length;
    const newJoinersThisMonth = employees.filter((e) => e.joiningDate.startsWith('2026-11')).length;
    const onLeaveToday = employees.filter((e) => e.employmentStatus === 'On Leave').length;
    const pendingOnboarding = onboardingRecords.filter((o) => o.approvalStatus !== 'Activated').length;
    const openExceptions = attendanceExceptions.filter(
      (e) => e.status !== 'Resolved' && e.status !== 'Rejected'
    ).length;
    const criticalExceptions = attendanceExceptions.filter(
      (e) => e.severity === 'Critical' && e.status !== 'Resolved'
    ).length;

    const todayMs = new Date('2026-11-18').getTime();
    const expiringDocs = documents.filter((d) => {
      if (!d.expiryDate) return false;
      const diffDays = Math.ceil((new Date(d.expiryDate).getTime() - todayMs) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    const overdueCompliance = complianceRecords.filter(
      (c) => c.status === 'Overdue' || c.status === 'Non-Compliant'
    ).length;

    return {
      totalEmployees,
      activeEmployees,
      newJoinersThisMonth,
      onLeaveToday,
      pendingOnboarding,
      openExceptions,
      criticalExceptions,
      expiringDocs,
      overdueCompliance,
    };
  }, [employees, onboardingRecords, attendanceExceptions, documents, complianceRecords]);

  // 8 Chart Datasets derived from consistent underlying records
  const chartData = useMemo(() => {
    // 1. Workforce by Employment Type
    const typeCounts = new Map<string, number>();
    employees.forEach((e) => typeCounts.set(e.employmentType, (typeCounts.get(e.employmentType) || 0) + 1));
    const byEmploymentType = Array.from(typeCounts.entries()).map(([name, value]) => ({ name, value }));

    // 2. Employees by Department
    const deptCounts = new Map<string, number>();
    employees.forEach((e) => deptCounts.set(e.departmentName, (deptCounts.get(e.departmentName) || 0) + 1));
    const byDepartment = Array.from(deptCounts.entries()).map(([name, count]) => ({ name, count }));

    // 3. Workforce by Project
    const projCounts = new Map<string, number>();
    employees.forEach((e) => projCounts.set(e.projectName, (projCounts.get(e.projectName) || 0) + 1));
    const byProject = Array.from(projCounts.entries()).map(([name, count]) => ({
      name: name.replace(' Complex', '').replace(' Development', ''),
      count,
    }));

    // 6. Leave Utilisation
    const leaveTypes = new Map<string, number>();
    leaveRequests.forEach((l) => leaveTypes.set(l.leaveType, (leaveTypes.get(l.leaveType) || 0) + l.daysCount));
    const leaveUtilisation = Array.from(leaveTypes.entries()).map(([name, days]) => ({ name, days }));

    // 7. Document Expiry Overview
    const todayMs = new Date('2026-11-18').getTime();
    let expired = 0;
    let in7 = 0;
    let in15 = 0;
    let in30 = 0;
    let healthy = 0;
    documents.forEach((d) => {
      if (!d.expiryDate) {
        healthy += 1;
        return;
      }
      const diff = Math.ceil((new Date(d.expiryDate).getTime() - todayMs) / (1000 * 60 * 60 * 24));
      if (diff < 0) expired += 1;
      else if (diff <= 7) in7 += 1;
      else if (diff <= 15) in15 += 1;
      else if (diff <= 30) in30 += 1;
      else healthy += 1;
    });
    const docExpiry = [
      { bucket: 'Expired', count: expired },
      { bucket: '≤ 7 Days', count: in7 },
      { bucket: '≤ 15 Days', count: in15 },
      { bucket: '≤ 30 Days', count: in30 },
      { bucket: 'Valid >30d', count: healthy },
    ];

    // 8. Compliance Completion Status
    const compMap = new Map<string, number>();
    complianceRecords.forEach((c) => compMap.set(c.status, (compMap.get(c.status) || 0) + 1));
    const complianceStatus = Array.from(compMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      byEmploymentType,
      byDepartment,
      byProject,
      leaveUtilisation,
      docExpiry,
      complianceStatus,
    };
  }, [employees, leaveRequests, documents, complianceRecords]);

  // Action Centre Items
  const actionItems = useMemo(() => {
    const list: Array<{
      id: string;
      group: 'onboarding' | 'attendance' | 'leave' | 'documents' | 'compliance';
      categoryLabel: string;
      title: string;
      meta: string;
      status: string;
      route: string;
    }> = [];

    onboardingRecords
      .filter((o) => o.approvalStatus !== 'Activated')
      .forEach((o) => {
        list.push({
          id: `act_onb_${o.id}`,
          group: 'onboarding',
          categoryLabel: 'Onboarding',
          title: `${o.fullName} — Stage: ${o.currentStage}`,
          meta: `${o.employeeCode} · ${o.designationTitle} · ${o.projectName}`,
          status: o.isOverdue ? 'Overdue' : o.approvalStatus,
          route: '/onboarding',
        });
      });

    documents
      .filter((d) => d.verificationStatus === 'Uploaded' || d.verificationStatus === 'Under Review' || d.verificationStatus === 'Expired')
      .forEach((d) => {
        list.push({
          id: `act_doc_${d.id}`,
          group: 'documents',
          categoryLabel: 'Document',
          title: `${d.documentName} (${d.employeeName})`,
          meta: `${d.category} · ${d.expiryDate ? `Expiry: ${d.expiryDate}` : `Uploaded: ${d.uploadDate}`}`,
          status: d.verificationStatus,
          route: '/documents',
        });
      });

    attendanceExceptions
      .filter((e) => e.status !== 'Resolved' && e.status !== 'Rejected')
      .forEach((e) => {
        list.push({
          id: `act_exc_${e.id}`,
          group: 'attendance',
          categoryLabel: 'Attendance Exception',
          title: `${e.employeeName} — ${e.category}`,
          meta: `${e.projectName} · ${e.date} · ${e.affectsWages ? 'Impacts Wages' : 'Non-wage'}`,
          status: e.severity === 'Critical' ? 'Critical' : e.status,
          route: '/attendance-exceptions',
        });
      });

    leaveRequests
      .filter((l) => l.status === 'Pending' || l.status === 'Forwarded to HR Manager')
      .forEach((l) => {
        list.push({
          id: `act_lreq_${l.id}`,
          group: 'leave',
          categoryLabel: 'Leave Approval',
          title: `${l.employeeName} — ${l.leaveType} (${l.daysCount}d)`,
          meta: `${l.fromDate} to ${l.toDate} · ${l.projectName}`,
          status: l.status,
          route: '/leaves',
        });
      });

    complianceRecords
      .filter((c) => c.status === 'Overdue' || c.status === 'Expiring Soon' || c.status === 'Pending Review')
      .forEach((c) => {
        list.push({
          id: `act_cmp_${c.id}`,
          group: 'compliance',
          categoryLabel: 'Compliance',
          title: `${c.requirementName}`,
          meta: `${c.complianceCode} · Due ${c.dueDate} · ${c.responsiblePerson}`,
          status: c.status,
          route: '/compliance',
        });
      });

    contractors
      .filter((c) => c.complianceStatus !== 'Compliant' || c.agreementStatus === 'Expiring Soon')
      .forEach((c) => {
        list.push({
          id: `act_con_${c.id}`,
          group: 'compliance',
          categoryLabel: 'Contractor Gap',
          title: `${c.companyName}`,
          meta: `Agreement ${c.agreementNumber} · Ends ${c.agreementEndDate}`,
          status: c.complianceStatus,
          route: '/contractors',
        });
      });

    employees
      .filter((e) => e.profileCompletion < 85)
      .forEach((e) => {
        list.push({
          id: `act_prof_${e.id}`,
          group: 'onboarding',
          categoryLabel: 'Incomplete Profile',
          title: `${e.fullName} — Profile ${e.profileCompletion}% complete`,
          meta: `${e.employeeCode} · ${e.projectName}`,
          status: 'Review Needed',
          route: `/employees/${e.id}`,
        });
      });

    return actionFilter === 'all' ? list : list.filter((i) => i.group === actionFilter);
  }, [onboardingRecords, documents, attendanceExceptions, leaveRequests, complianceRecords, contractors, employees, actionFilter]);

  const kpiCards = [
    {
      label: 'Total Employees',
      value: metrics.totalEmployees,
      subtext: 'Direct workforce roster',
      icon: Users,
      status: 'Nominal',
      route: '/employees',
    },
    {
      label: 'Active Employees',
      value: metrics.activeEmployees,
      subtext: `${Math.round((metrics.activeEmployees / Math.max(1, metrics.totalEmployees)) * 100)}% of direct roster`,
      icon: UserCheck,
      status: 'Active',
      route: '/employees?status=Active',
    },
    {
      label: 'New Joiners This Month',
      value: metrics.newJoinersThisMonth,
      subtext: 'Joined in Nov 2026',
      icon: UserPlus,
      status: 'Active',
      route: '/employees',
    },
    {
      label: 'Employees on Leave Today',
      value: metrics.onLeaveToday,
      subtext: 'Approved site absences',
      icon: CalendarClock,
      status: 'On Leave',
      route: '/leaves',
    },
    {
      label: 'Pending Onboarding',
      value: metrics.pendingOnboarding,
      subtext: `${onboardingRecords.filter((o) => o.isOverdue).length} overdue verification`,
      icon: UserPlus,
      status: metrics.pendingOnboarding > 0 ? 'Pending Review' : 'Completed',
      route: '/onboarding',
    },
    {
      label: 'Attendance Exceptions',
      value: metrics.openExceptions,
      subtext: `${metrics.criticalExceptions} critical missing punch`,
      icon: AlertTriangle,
      status: metrics.criticalExceptions > 0 ? 'Critical' : 'Pending Review',
      route: '/attendance-exceptions',
    },
    {
      label: 'Documents Expiring Soon',
      value: metrics.expiringDocs,
      subtext: 'Within 30 days or expired',
      icon: FileWarning,
      status: metrics.expiringDocs > 0 ? 'Expiring Soon' : 'Verified',
      route: '/documents',
    },
    {
      label: 'Compliance Items Overdue',
      value: metrics.overdueCompliance,
      subtext: 'Requires compliance action',
      icon: ShieldAlert,
      status: metrics.overdueCompliance > 0 ? 'Overdue' : 'Compliant',
      route: '/compliance',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 8 KPI Cards */}
      <section aria-label="Key HR Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={() => navigate(kpi.route)}
              className="text-left bg-white border border-slate-200 hover:border-[#2563EB]/50 rounded-lg p-4 transition-colors duration-150 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-[#64748B]">{kpi.label}</span>
                <Icon className="w-4 h-4 text-[#64748B] group-hover:text-[#2563EB] shrink-0" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-[#172B4D] font-mono tabular-nums">{kpi.value}</span>
                <StatusBadge label={kpi.status} showIcon={false} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#64748B]">
                <span className="truncate">{kpi.subtext}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] shrink-0" />
              </div>
            </button>
          );
        })}
      </section>

      {/* Project & Site Attention Matrix */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-[#172B4D]">Project & Site HR Attention</h2>
            <p className="text-xs text-[#64748B]">Live staffing, onboarding, and exception load across active construction sites</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
            Open Directory
          </Button>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {projectSites.map((site) => {
            const siteEmps = employees.filter((e) => e.projectName === site.projectName);
            const siteExc = attendanceExceptions.filter(
              (x) => x.projectName === site.projectName && x.status !== 'Resolved' && x.status !== 'Rejected'
            );
            const siteOnb = onboardingRecords.filter(
              (o) => o.projectName === site.projectName && o.approvalStatus !== 'Activated'
            );
            return (
              <div key={site.id} className="p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#64748B]">{site.projectCode}</span>
                    <StatusBadge label={site.status} showIcon={false} />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#172B4D] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">{site.projectName}</span>
                  </div>
                  <div className="text-xs text-[#64748B] truncate mt-0.5">
                    {site.siteName} · {site.state}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[#64748B]">
                    Roster: <strong className="font-mono tabular-nums text-[#172B4D]">{siteEmps.length}</strong>
                  </span>
                  <span className="text-[#64748B]">
                    Onb: <strong className="font-mono tabular-nums text-[#172B4D]">{siteOnb.length}</strong>
                  </span>
                  <span className="text-[#64748B]">
                    Exc: <strong className="font-mono tabular-nums text-[#DC2626]">{siteExc.length}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* HR Action Centre */}
      <Card>
        <CardHeader className="flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-[#172B4D]">HR Action Centre</h2>
            <p className="text-xs text-[#64748B]">
              Pending onboarding, document verifications, exceptions, leave approvals, and compliance deadlines
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
            {(
              [
                ['all', 'All'],
                ['onboarding', 'Onboarding'],
                ['attendance', 'Attendance'],
                ['leave', 'Leaves'],
                ['documents', 'Documents'],
                ['compliance', 'Compliance'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActionFilter(key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  actionFilter === key ? 'bg-white text-[#172B4D] shadow-xs' : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
          {actionItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="w-full px-5 py-3 text-left hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span className="font-semibold text-[#2563EB]">{item.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{item.meta}</span>
                </div>
                <div className="text-sm font-medium text-[#172B4D] mt-0.5 truncate">{item.title}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge label={item.status} />
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 8 HR Workforce & Compliance Charts */}
      <section aria-label="HR Analytics Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Workforce by Employment Type */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">1. Workforce by Employment Type</h3>
            <span className="text-xs font-mono tabular-nums text-[#64748B]">{employees.length} direct staff</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.byEmploymentType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {chartData.byEmploymentType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Employees by Department */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">2. Employees by Department</h3>
            <span className="text-xs text-[#64748B]">Active distribution</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.byDepartment} layout="vertical" margin={{ left: 20, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Workforce by Project */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">3. Workforce by Project</h3>
            <span className="text-xs text-[#64748B]">Site deployment</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.byProject} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#101F35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Monthly Joining vs Exits */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">4. Monthly Joining vs Exits</h3>
            <span className="text-xs text-[#64748B]">6-month trend</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_JOINING_EXITS_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="joiners" name="New Joiners" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="Exits" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. Attendance Exception Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">5. Attendance Exception Trends</h3>
            <span className="text-xs text-[#64748B]">Weekly site exceptions</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ATTENDANCE_EXCEPTION_TREND_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="missingPunch" name="Missing Punch" stroke="#DC2626" strokeWidth={2} />
                <Line type="monotone" dataKey="geofence" name="Outside Geofence" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="lateOrSelfie" name="Late / Selfie" stroke="#2563EB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. Leave Utilisation */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">6. Leave Utilisation (Days Requested)</h3>
            <span className="text-xs text-[#64748B]">By leave type</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.leaveUtilisation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="days" name="Leave Days" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. Document Expiry Overview */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">7. Document Expiry Overview</h3>
            <span className="text-xs text-[#64748B]">Alert thresholds</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.docExpiry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Documents" radius={[4, 4, 0, 0]}>
                  {chartData.docExpiry.map((entry, idx) => (
                    <Cell
                      key={entry.bucket}
                      fill={idx === 0 ? '#DC2626' : idx <= 3 ? '#F59E0B' : '#16A34A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 8. Compliance Completion Status */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">8. Compliance Completion Status</h3>
            <span className="text-xs text-[#64748B]">Register distribution</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.complianceStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {chartData.complianceStatus.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === 'Compliant'
                          ? '#16A34A'
                          : entry.name === 'Overdue'
                          ? '#DC2626'
                          : entry.name === 'Expiring Soon'
                          ? '#F59E0B'
                          : CHART_COLORS[i % CHART_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
