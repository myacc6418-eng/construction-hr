import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, CalendarClock, CheckCircle2, FileCheck2, History, Search } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Modal,
  Select,
  StatusBadge,
  Textarea,
} from '@/src/components/ui/Primitives';
import { useHRStore } from '@/src/store/useHRStore';
import { EmploymentHistoryEntry, EmploymentStatus } from '@/src/types/hr';
import { toast } from 'sonner';

const LIFECYCLE_STATUSES: EmploymentStatus[] = [
  'Draft',
  'Onboarding',
  'Active',
  'Probation',
  'Confirmed',
  'On Leave',
  'Notice Period',
  'Suspended',
  'Exited',
  'Terminated',
];

export const EmploymentRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getScopedEmployees, departments, designations, projectSites, changeEmployeeLifecycle, can } = useHRStore();
  const employees = getScopedEmployees();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [workflowOpen, setWorkflowOpen] = useState(false);

  // Lifecycle workflow form
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id ?? '');
  const [changeType, setChangeType] = useState<EmploymentHistoryEntry['changeType']>('Confirmation');
  const [effectiveDate, setEffectiveDate] = useState('2026-11-20');
  const [newStatus, setNewStatus] = useState<EmploymentStatus>('Confirmed');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newContractEnd, setNewContractEnd] = useState('2027-11-30');
  const [remarks, setRemarks] = useState('');

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (statusFilter !== 'All' && e.employmentStatus !== statusFilter) return false;
      if (q) {
        return (
          e.fullName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.designationTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employees, search, statusFilter]);

  const historicalLedger = useMemo(() => {
    const entries: Array<EmploymentHistoryEntry & { employeeName: string; employeeCode: string; employeeId: string }> = [];
    employees.forEach((emp) => {
      emp.history.forEach((h) => {
        entries.push({
          ...h,
          employeeName: emp.fullName,
          employeeCode: emp.employeeCode,
          employeeId: emp.id,
        });
      });
    });
    return entries.sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  }, [employees]);

  const probationOrContractDue = useMemo(
    () => employees.filter((e) => e.employmentStatus === 'Probation' || e.contractEndDate || e.employmentStatus === 'Notice Period'),
    [employees]
  );

  const openWorkflowModal = (empId?: string, presetType?: EmploymentHistoryEntry['changeType']) => {
    const target = employees.find((e) => e.id === (empId || employees[0]?.id));
    if (target) {
      setSelectedEmpId(target.id);
      setNewDesignation(target.designationTitle);
      setNewDepartment(target.departmentName);
      setNewProject(target.projectName);
      setNewStatus(target.employmentStatus);
    }
    if (presetType) setChangeType(presetType);
    setRemarks('');
    setWorkflowOpen(true);
  };

  const handleSubmitWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Audit remarks are required.');
      return;
    }

    const projObj = projectSites.find((p) => p.projectName === newProject);

    changeEmployeeLifecycle(selectedEmpId, {
      changeType,
      effectiveDate,
      newStatus:
        changeType === 'Confirmation'
          ? 'Confirmed'
          : changeType === 'Resignation'
          ? 'Notice Period'
          : changeType === 'Exit Clearance'
          ? 'Exited'
          : changeType === 'Termination'
          ? 'Terminated'
          : changeType === 'Status Change'
          ? newStatus
          : undefined,
      newDesignationTitle: changeType === 'Designation Change' ? newDesignation : undefined,
      newDepartmentName: changeType === 'Department Transfer' ? newDepartment : undefined,
      newProjectName: changeType === 'Project & Site Transfer' ? newProject : undefined,
      newSiteName: changeType === 'Project & Site Transfer' ? projObj?.siteName : undefined,
      newContractEndDate: changeType === 'Contract Renewal' ? newContractEnd : undefined,
      remarks,
    });

    setWorkflowOpen(false);
    toast.success(`${changeType} recorded with effective date ${effectiveDate}. Previous records preserved.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Employment Records & Lifecycle</h2>
          <p className="text-xs text-[#64748B]">
            Contracts, probation confirmations, transfers, notice periods, and immutable historical change log
          </p>
        </div>
        {can('employment.records_manage') && (
          <Button size="sm" onClick={() => openWorkflowModal()}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Execute Lifecycle Action</span>
          </Button>
        )}
      </div>

      {/* Upcoming Probation, Contract Renewals & Notice Periods */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Probation Reviews, Contract Renewals & Exits Due</h3>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#64748B]">{probationOrContractDue.length} tracked</span>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {probationOrContractDue.map((emp) => (
            <div key={emp.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-[#172B4D]">
                  {emp.fullName} <span className="font-mono text-[#64748B]">({emp.employeeCode})</span>
                </div>
                <div className="text-[#64748B] mt-0.5">
                  {emp.designationTitle} · {emp.projectName} ·{' '}
                  {emp.probationEndDate
                    ? `Probation End: ${emp.probationEndDate}`
                    : emp.contractEndDate
                    ? `Contract End: ${emp.contractEndDate}`
                    : 'Serving Notice Period'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge label={emp.employmentStatus} />
                {can('employment.records_manage') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openWorkflowModal(
                        emp.id,
                        emp.employmentStatus === 'Probation'
                          ? 'Confirmation'
                          : emp.employmentStatus === 'Notice Period'
                          ? 'Exit Clearance'
                          : 'Contract Renewal'
                      )
                    }
                  >
                    {emp.employmentStatus === 'Probation'
                      ? 'Confirm'
                      : emp.employmentStatus === 'Notice Period'
                      ? 'Exit Clearance'
                      : 'Renew Contract'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Current Employment Status Register */}
      <Card>
        <CardHeader className="flex-wrap">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Current Employment Records</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter employee..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs">
              <option value="All">All Lifecycle Statuses</option>
              {LIFECYCLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Current Designation & Dept</th>
                <th className="py-2.5 px-4">Project Assignment</th>
                <th className="py-2.5 px-4">Key Dates</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="font-semibold text-[#2563EB] hover:underline cursor-pointer text-left"
                    >
                      {emp.fullName}
                    </button>
                    <div className="font-mono text-[11px] text-[#64748B]">{emp.employeeCode}</div>
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">{emp.employmentType}</td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#172B4D]">{emp.designationTitle}</div>
                    <div className="text-[11px] text-[#64748B]">{emp.departmentName}</div>
                  </td>
                  <td className="py-2.5 px-4">{emp.projectName}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-[#64748B]">
                    Joined: {emp.joiningDate}
                    {emp.contractEndDate && <div>Contract End: {emp.contractEndDate}</div>}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge label={emp.employmentStatus} />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {can('employment.records_manage') && (
                      <Button size="sm" variant="outline" onClick={() => openWorkflowModal(emp.id)}>
                        Update
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Immutable Employment Change History Ledger */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Preserved Employment Change History</h3>
          </div>
          <span className="text-xs text-[#64748B]">Non-destructive effective-dated ledger</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {historicalLedger.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-semibold text-[#172B4D]">
                    {entry.employeeName}{' '}
                    <span className="font-mono text-[#64748B]">({entry.employeeCode})</span> ·{' '}
                    <span className="text-[#2563EB]">{entry.changeType}</span>
                  </div>
                  <div className="text-[#64748B] mt-0.5">
                    {entry.previousValue} → <strong className="text-[#172B4D]">{entry.newValue}</strong>
                  </div>
                  <div className="text-[#64748B] mt-0.5">{entry.remarks}</div>
                </div>
                <div className="text-right font-mono text-[11px] text-[#64748B] shrink-0">
                  <div>Effective: {entry.effectiveDate}</div>
                  <div>Approved by {entry.approvedBy}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Workflow Modal */}
      <Modal
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        title="Execute Employment Lifecycle Workflow"
        subtitle="Preserves previous designations, departments, contracts, and assignments with effective dates."
      >
        <form onSubmit={handleSubmitWorkflow} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Employee</label>
              <Select className="w-full" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeCode})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Workflow Type</label>
              <Select
                className="w-full"
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as EmploymentHistoryEntry['changeType'])}
              >
                <option value="Confirmation">Probation Review / Confirmation</option>
                <option value="Contract Renewal">Contract Extension / Renewal</option>
                <option value="Designation Change">Designation Change</option>
                <option value="Department Transfer">Department Transfer</option>
                <option value="Project & Site Transfer">Project & Site Transfer</option>
                <option value="Status Change">Status Change</option>
                <option value="Resignation">Resignation Processing</option>
                <option value="Exit Clearance">Exit Clearance</option>
                <option value="Termination">Termination</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Effective Date</label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </div>

          {changeType === 'Designation Change' && (
            <div>
              <label className="block font-medium mb-1">New Designation</label>
              <Select className="w-full" value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)}>
                {designations.map((d) => (
                  <option key={d.id} value={d.title}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {changeType === 'Department Transfer' && (
            <div>
              <label className="block font-medium mb-1">New Department</label>
              <Select className="w-full" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {changeType === 'Project & Site Transfer' && (
            <div>
              <label className="block font-medium mb-1">Target Project</label>
              <Select className="w-full" value={newProject} onChange={(e) => setNewProject(e.target.value)}>
                {projectSites.map((p) => (
                  <option key={p.id} value={p.projectName}>
                    {p.projectName} ({p.siteName})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {changeType === 'Contract Renewal' && (
            <div>
              <label className="block font-medium mb-1">New Contract End Date</label>
              <Input type="date" value={newContractEnd} onChange={(e) => setNewContractEnd(e.target.value)} required />
            </div>
          )}

          {changeType === 'Status Change' && (
            <div>
              <label className="block font-medium mb-1">New Lifecycle Status</label>
              <Select
                className="w-full"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as EmploymentStatus)}
              >
                {LIFECYCLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">Approval Remarks & Supporting Note *</label>
            <Textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason, approval reference, or exit clearance confirmation..."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWorkflowOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Lifecycle Record</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
