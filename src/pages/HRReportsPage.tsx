import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import {
  AccessRestrictedBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  Select,
  StatusBadge,
} from '@/src/components/ui/Primitives';
import { downloadCsvFile } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';
import { toast } from 'sonner';

type ReportCategory = 'Workforce' | 'Lifecycle' | 'Attendance' | 'Leave' | 'Compliance';

export const HRReportsPage: React.FC = () => {
  const {
    getScopedEmployees,
    attendanceRecords,
    attendanceExceptions,
    leaveRequests,
    complianceRecords,
    documents,
    contractors,
    projectSites,
    departments,
    can,
  } = useHRStore();

  const employees = getScopedEmployees();

  const [category, setCategory] = useState<ReportCategory>('Workforce');
  const [projectFilter, setProjectFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const scopedFilteredEmployees = useMemo(
    () =>
      employees.filter((e) => {
        if (projectFilter !== 'All' && e.projectName !== projectFilter) return false;
        if (deptFilter !== 'All' && e.departmentName !== deptFilter) return false;
        if (typeFilter !== 'All' && e.employmentType !== typeFilter) return false;
        return true;
      }),
    [employees, projectFilter, deptFilter, typeFilter]
  );

  if (!can('reports.view')) {
    return (
      <AccessRestrictedBanner
        title="Reports Access Restricted"
        message="Your current role does not include HR Reports & Analytics permission. Switch to HR Administrator, HR Manager, or Compliance Officer."
      />
    );
  }

  const handleExportCsv = (excelCompatible = false) => {
    if (!can('reports.export')) {
      toast.error('Your active role can preview reports but cannot export files.');
      return;
    }
    const ext = excelCompatible ? 'xls.csv' : 'csv';
    if (category === 'Workforce') {
      downloadCsvFile(
        `buildflow_workforce_report.${ext}`,
        ['Employee ID', 'Name', 'Designation', 'Department', 'Type', 'Project', 'Site', 'Status'],
        scopedFilteredEmployees.map((e) => [
          e.employeeCode,
          e.fullName,
          e.designationTitle,
          e.departmentName,
          e.employmentType,
          e.projectName,
          e.siteName,
          e.employmentStatus,
        ])
      );
    } else if (category === 'Lifecycle') {
      downloadCsvFile(
        `buildflow_lifecycle_report.${ext}`,
        ['Employee ID', 'Name', 'Joining Date', 'Probation/Contract End', 'Status', 'History Entries'],
        scopedFilteredEmployees.map((e) => [
          e.employeeCode,
          e.fullName,
          e.joiningDate,
          e.probationEndDate || e.contractEndDate || 'N/A',
          e.employmentStatus,
          e.history.length,
        ])
      );
    } else if (category === 'Attendance') {
      downloadCsvFile(
        `buildflow_attendance_exceptions_report.${ext}`,
        ['Exception ID', 'Employee', 'Project', 'Date', 'Category', 'Severity', 'Status', 'Affects Wages'],
        attendanceExceptions.map((x) => [
          x.id,
          x.employeeName,
          x.projectName,
          x.date,
          x.category,
          x.severity,
          x.status,
          x.affectsWages ? 'Yes' : 'No',
        ])
      );
    } else if (category === 'Leave') {
      downloadCsvFile(
        `buildflow_leave_report.${ext}`,
        ['Employee', 'Project', 'Leave Type', 'From', 'To', 'Days', 'Status'],
        leaveRequests.map((l) => [l.employeeName, l.projectName, l.leaveType, l.fromDate, l.toDate, l.daysCount, l.status])
      );
    } else {
      downloadCsvFile(
        `buildflow_compliance_report.${ext}`,
        ['Code', 'Requirement', 'Category', 'Jurisdiction', 'Due Date', 'Status'],
        complianceRecords.map((c) => [c.complianceCode, c.requirementName, c.category, c.jurisdiction, c.dueDate, c.status])
      );
    }
    toast.success(`Exported ${category} report (${excelCompatible ? 'Excel CSV' : 'Standard CSV'}).`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">HR Reports & Analytics Centre</h2>
          <p className="text-xs text-[#64748B]">
            Permission-scoped workforce, lifecycle, attendance, leave, and compliance exports
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => handleExportCsv(false)}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportCsv(true)}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>
        </div>
      </div>

      {/* Report Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center gap-1 overflow-x-auto no-print">
        {(['Workforce', 'Lifecycle', 'Attendance', 'Leave', 'Compliance'] as ReportCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
              category === cat ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            {cat} Reports
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects (Within Role Scope)</option>
          {projectSites.map((p) => (
            <option key={p.id} value={p.projectName}>
              {p.projectName}
            </option>
          ))}
        </Select>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All Employment Types</option>
          <option value="Permanent">Permanent</option>
          <option value="Contractual">Contractual</option>
          <option value="Daily Wage">Daily Wage</option>
          <option value="Hourly">Hourly</option>
          <option value="Weekly Wage">Weekly Wage</option>
          <option value="Project Based">Project Based</option>
          <option value="Intern / Trainee">Intern / Trainee</option>
        </Select>
      </Card>

      {/* Report Output */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#172B4D]">{category} Summary Report</h3>
          </div>
          <span className="text-xs text-[#64748B] font-mono">Generated 2026-11-18</span>
        </CardHeader>

        {category === 'Workforce' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Designation & Dept</th>
                  <th className="py-2.5 px-4">Employment Type</th>
                  <th className="py-2.5 px-4">Project & Site</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedFilteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-4 font-mono">{e.employeeCode}</td>
                    <td className="py-2.5 px-4 font-semibold">{e.fullName}</td>
                    <td className="py-2.5 px-4">
                      {e.designationTitle} · {e.departmentName}
                    </td>
                    <td className="py-2.5 px-4">{e.employmentType}</td>
                    <td className="py-2.5 px-4">{e.projectName}</td>
                    <td className="py-2.5 px-4"><StatusBadge label={e.employmentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {category === 'Lifecycle' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Joined</th>
                  <th className="py-2.5 px-4">Probation / Contract End</th>
                  <th className="py-2.5 px-4">Lifecycle Status</th>
                  <th className="py-2.5 px-4">Recorded Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedFilteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-4 font-semibold">{e.fullName} ({e.employeeCode})</td>
                    <td className="py-2.5 px-4 font-mono">{e.joiningDate}</td>
                    <td className="py-2.5 px-4 font-mono">{e.probationEndDate || e.contractEndDate || '—'}</td>
                    <td className="py-2.5 px-4"><StatusBadge label={e.employmentStatus} /></td>
                    <td className="py-2.5 px-4 font-mono">{e.history.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {category === 'Attendance' && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Attendance Records</div>
                <div className="text-lg font-bold font-mono mt-0.5">{attendanceRecords.length}</div>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Total Exceptions</div>
                <div className="text-lg font-bold font-mono mt-0.5">{attendanceExceptions.length}</div>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Wage-Impacting Exceptions</div>
                <div className="text-lg font-bold font-mono text-[#DC2626] mt-0.5">
                  {attendanceExceptions.filter((x) => x.affectsWages).length}
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Resolved</div>
                <div className="text-lg font-bold font-mono text-[#16A34A] mt-0.5">
                  {attendanceExceptions.filter((x) => x.status === 'Resolved').length}
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {category === 'Leave' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Leave Type</th>
                  <th className="py-2.5 px-4">Period & Days</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-4 font-semibold">{l.employeeName}</td>
                    <td className="py-2.5 px-4">{l.projectName}</td>
                    <td className="py-2.5 px-4">{l.leaveType}</td>
                    <td className="py-2.5 px-4 font-mono">{l.fromDate} → {l.toDate} ({l.daysCount}d)</td>
                    <td className="py-2.5 px-4"><StatusBadge label={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {category === 'Compliance' && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Total Compliance Items</div>
                <div className="text-lg font-bold font-mono mt-0.5">{complianceRecords.length}</div>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Overdue Compliance</div>
                <div className="text-lg font-bold font-mono text-[#DC2626] mt-0.5">
                  {complianceRecords.filter((c) => c.status === 'Overdue').length}
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Expired / Expiring Docs</div>
                <div className="text-lg font-bold font-mono text-[#B45309] mt-0.5">
                  {documents.filter((d) => Boolean(d.expiryDate)).length}
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="text-[#64748B]">Contractors with Gaps</div>
                <div className="text-lg font-bold font-mono text-[#DC2626] mt-0.5">
                  {contractors.filter((c) => c.complianceStatus !== 'Compliant').length}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
