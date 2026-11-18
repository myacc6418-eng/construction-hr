import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Plus, ShieldAlert, XCircle } from 'lucide-react';
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
import { DEMO_ORG_ID } from '@/src/data/demoData';
import { useHRStore } from '@/src/store/useHRStore';
import { LeavePolicy, LeaveRequest, LeaveTypeName } from '@/src/types/hr';
import { toast } from 'sonner';

export const LeaveManagementPage: React.FC = () => {
  const {
    leaveRequests,
    leavePolicies,
    getScopedEmployees,
    processLeaveRequest,
    addLeaveRequest,
    updateLeavePolicy,
    can,
  } = useHRStore();

  const employees = getScopedEmployees();
  const [tab, setTab] = useState<'requests' | 'calendar' | 'policies'>('requests');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [newLeaveOpen, setNewLeaveOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);

  // New Leave form state
  const [newEmpId, setNewEmpId] = useState(employees[0]?.id ?? '');
  const [newLeaveType, setNewLeaveType] = useState<LeaveTypeName>('Casual Leave');
  const [newFrom, setNewFrom] = useState('2026-11-24');
  const [newTo, setNewTo] = useState('2026-11-25');
  const [newReason, setNewReason] = useState('');

  const overview = useMemo(() => {
    const today = '2026-11-18';
    const pending = leaveRequests.filter((l) => l.status === 'Pending' || l.status === 'Forwarded to HR Manager').length;
    const approved = leaveRequests.filter((l) => l.status === 'Approved').length;
    const rejected = leaveRequests.filter((l) => l.status === 'Rejected').length;
    const onLeaveToday = leaveRequests.filter(
      (l) => l.status === 'Approved' && l.fromDate <= today && l.toDate >= today
    ).length;
    const upcoming = leaveRequests.filter((l) => l.status === 'Approved' && l.fromDate > today).length;
    return {
      totalToday: leaveRequests.length,
      pending,
      approved,
      rejected,
      onLeaveToday,
      upcoming,
    };
  }, [leaveRequests]);

  const filteredRequests = useMemo(
    () => leaveRequests.filter((l) => statusFilter === 'All' || l.status === statusFilter),
    [leaveRequests, statusFilter]
  );

  // November 2026 calendar days (18 to 30 focus + 1..30 grid)
  const calendarDays = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  const handleDecision = (decision: 'Approved' | 'Rejected' | 'Clarification Requested' | 'Forwarded to HR Manager') => {
    if (!selectedReq) return;
    if ((decision === 'Approved' || decision === 'Rejected') && !can('leave.approve')) {
      toast.error('Active role lacks Leave Approval permission.');
      return;
    }
    processLeaveRequest(selectedReq.id, decision, decisionRemarks);
    setSelectedReq(null);
    setDecisionRemarks('');
    toast.success(`Leave request marked ${decision}.`);
  };

  const handleSubmitNewLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === newEmpId);
    if (!emp || !newReason.trim()) {
      toast.error('Please select an employee and provide a reason.');
      return;
    }
    const diffDays = Math.max(
      1,
      Math.ceil((new Date(newTo).getTime() - new Date(newFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    addLeaveRequest({
      id: `lreq_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      departmentName: emp.departmentName,
      projectName: emp.projectName,
      siteName: emp.siteName,
      leaveType: newLeaveType,
      fromDate: newFrom,
      toDate: newTo,
      daysCount: diffDays,
      reason: newReason,
      status: 'Pending',
      approverName: emp.reportingManagerName,
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    setNewLeaveOpen(false);
    setNewReason('');
    toast.success(`Leave application submitted for ${emp.fullName}.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Leave Management & Calendar</h2>
          <p className="text-xs text-[#64748B]">
            Category-specific leave entitlements, site staffing overlap alerts, and effective-dated policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-md">
            {(
              [
                ['requests', 'Requests'],
                ['calendar', 'Leave Calendar'],
                ['policies', 'Leave Policies'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                  tab === k ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setNewLeaveOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Apply Leave</span>
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Requests', val: overview.totalToday },
          { label: 'Pending Approvals', val: overview.pending, warn: overview.pending > 0 },
          { label: 'Approved', val: overview.approved },
          { label: 'Rejected', val: overview.rejected },
          { label: 'On Leave Today', val: overview.onLeaveToday },
          { label: 'Upcoming Scheduled', val: overview.upcoming },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-[11px] text-[#64748B]">{s.label}</div>
            <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${s.warn ? 'text-[#B45309]' : 'text-[#172B4D]'}`}>
              {s.val}
            </div>
          </Card>
        ))}
      </div>

      {tab === 'requests' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex-wrap">
            <h3 className="text-sm font-semibold text-[#172B4D]">Leave Request Queue</h3>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs">
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Forwarded to HR Manager">Forwarded to HR Manager</option>
              <option value="Clarification Requested">Clarification Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </CardHeader>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Dept & Project</th>
                  <th className="py-2.5 px-4">Leave Type</th>
                  <th className="py-2.5 px-4">Dates & Days</th>
                  <th className="py-2.5 px-4">Reason & Risk</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#172B4D]">{req.employeeName}</div>
                      <div className="font-mono text-[11px] text-[#64748B]">{req.employeeCode}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div>{req.departmentName}</div>
                      <div className="text-[11px] text-[#64748B]">{req.projectName}</div>
                    </td>
                    <td className="py-2.5 px-4 font-medium">{req.leaveType}</td>
                    <td className="py-2.5 px-4 font-mono tabular-nums">
                      <div>
                        {req.fromDate} → {req.toDate}
                      </div>
                      <div className="text-[11px] text-[#64748B]">{req.daysCount} day(s)</div>
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="truncate text-[#172B4D]">{req.reason}</div>
                      {req.overlapWarning && (
                        <div className="text-[11px] text-[#B45309] flex items-center gap-1 mt-0.5 truncate">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{req.overlapWarning}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge label={req.status} />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedReq(req)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div key={req.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm text-[#172B4D]">{req.employeeName}</div>
                    <div className="text-[#64748B]">
                      {req.leaveType} · {req.daysCount}d · {req.projectName}
                    </div>
                  </div>
                  <StatusBadge label={req.status} />
                </div>
                <div className="font-mono text-[#64748B]">
                  {req.fromDate} → {req.toDate}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedReq(req)}>
                  Open Leave Details & Approve
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'calendar' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-semibold text-[#172B4D]">November 2026 — Project & Site Leave Calendar</h3>
              <p className="text-xs text-[#64748B]">
                Tracks overlapping approved & pending leaves to surface site staffing shortages
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <StatusBadge label="Approved" />
              <StatusBadge label="Pending" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
                const dayLeaves = leaveRequests.filter((l) => l.fromDate <= dateStr && l.toDate >= dateStr && l.status !== 'Rejected');
                const shortageRisk = dayLeaves.some((l) => Boolean(l.overlapWarning));
                return (
                  <div
                    key={day}
                    className={`min-h-[96px] p-2 rounded-md border text-xs ${
                      dateStr === '2026-11-18'
                        ? 'border-[#2563EB] bg-blue-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-semibold text-[#172B4D]">{day} Nov</span>
                      {shortageRisk && (
                        <span title="Potential site staffing shortage" className="inline-flex">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayLeaves.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setSelectedReq(l)}
                          className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-medium truncate cursor-pointer ${
                            l.status === 'Approved'
                              ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                              : 'bg-amber-50 text-[#B45309] border border-amber-200'
                          }`}
                        >
                          {l.employeeName.split(' ')[0]} · {l.leaveType.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'policies' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-semibold text-[#172B4D]">Configured Leave Policies (Effective-Dated)</h3>
              <p className="text-xs text-[#64748B]">
                Entitlements vary by employment category · Policy changes apply prospectively from effective date without rewriting historical leave records
              </p>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {leavePolicies.map((pol) => (
              <div key={pol.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[#172B4D]">{pol.leaveType}</div>
                  <div className="text-[#64748B]">
                    Eligible: <strong className="text-[#172B4D]">{pol.eligibleTypes.join(', ')}</strong>
                  </div>
                  <div className="text-[#64748B]">
                    Entitlement: <span className="font-mono font-semibold text-[#172B4D]">{pol.annualEntitlementDays} days/yr</span> ·{' '}
                    {pol.accrualRule} · Carry Forward Max: <span className="font-mono">{pol.carryForwardMaxDays}d</span> ·{' '}
                    Approval: {pol.approvalHierarchy}
                  </div>
                  <div className="font-mono text-[11px] text-[#2563EB]">Effective from: {pol.effectiveFrom}</div>
                </div>
                {can('leave.policy_edit') && (
                  <Button size="sm" variant="outline" onClick={() => setEditingPolicy({ ...pol })}>
                    Edit Policy
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leave Details & Approval Modal */}
      <Modal
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
        title={selectedReq ? `Leave Request — ${selectedReq.employeeName}` : ''}
        subtitle={selectedReq ? `${selectedReq.employeeCode} · ${selectedReq.projectName}` : ''}
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="text-[#64748B]">Leave Type</div>
                <div className="font-semibold text-[#172B4D] mt-0.5">{selectedReq.leaveType}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Requested Duration</div>
                <div className="font-mono font-semibold text-[#172B4D] mt-0.5">
                  {selectedReq.fromDate} → {selectedReq.toDate} ({selectedReq.daysCount}d)
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Available Balance</div>
                <div className="font-mono font-semibold text-[#172B4D] mt-0.5">
                  {selectedReq.availableBalanceBefore !== undefined ? `${selectedReq.availableBalanceBefore} days` : 'Unpaid / Muster'}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Current Status</div>
                <div className="mt-0.5"><StatusBadge label={selectedReq.status} /></div>
              </div>
            </div>

            {selectedReq.overlapWarning && (
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#172B4D]">Site Staffing Overlap / Eligibility Warning</div>
                  <div className="text-[#64748B] mt-0.5">{selectedReq.overlapWarning}</div>
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold text-[#172B4D]">Employee Reason</div>
              <p className="text-[#64748B] mt-1">{selectedReq.reason}</p>
            </div>

            <div>
              <label className="block font-medium text-[#172B4D] mb-1">Manager / HR Remarks</label>
              <Textarea
                rows={2}
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Document handover coverage or clarification note..."
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => handleDecision('Clarification Requested')}>
                Request Clarification
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDecision('Forwarded to HR Manager')}>
                <ShieldAlert className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Forward to HR Manager</span>
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDecision('Rejected')}>
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
              <Button size="sm" variant="success" onClick={() => handleDecision('Approved')}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Leave</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Apply Leave Modal */}
      <Modal open={newLeaveOpen} onClose={() => setNewLeaveOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleSubmitNewLeave} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Employee</label>
              <Select className="w-full" value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employmentType})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Leave Type</label>
              <Select
                className="w-full"
                value={newLeaveType}
                onChange={(e) => setNewLeaveType(e.target.value as LeaveTypeName)}
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Earned Leave">Earned Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
                <option value="Compensatory Off">Compensatory Off</option>
                <option value="Special Leave">Special Leave</option>
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">From Date</label>
              <Input type="date" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">To Date</label>
              <Input type="date" value={newTo} onChange={(e) => setNewTo(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Reason *</label>
            <Textarea rows={2} value={newReason} onChange={(e) => setNewReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewLeaveOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Leave Policy Modal */}
      <Modal
        open={editingPolicy !== null}
        onClose={() => setEditingPolicy(null)}
        title={editingPolicy ? `Edit Leave Policy — ${editingPolicy.leaveType}` : ''}
        subtitle="Prospective changes use Effective Date; historical leave approvals remain untouched."
      >
        {editingPolicy && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateLeavePolicy(editingPolicy);
              setEditingPolicy(null);
              toast.success(`Policy updated effective ${editingPolicy.effectiveFrom}.`);
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Annual Entitlement (Days)</label>
                <Input
                  type="number"
                  value={editingPolicy.annualEntitlementDays}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, annualEntitlementDays: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Effective Date *</label>
                <Input
                  type="date"
                  value={editingPolicy.effectiveFrom}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, effectiveFrom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Max Consecutive Days</label>
                <Input
                  type="number"
                  value={editingPolicy.maxConsecutiveDays}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, maxConsecutiveDays: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Carry Forward Max (Days)</label>
                <Input
                  type="number"
                  value={editingPolicy.carryForwardMaxDays}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, carryForwardMaxDays: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Approval Hierarchy</label>
              <Input
                value={editingPolicy.approvalHierarchy}
                onChange={(e) => setEditingPolicy({ ...editingPolicy, approvalHierarchy: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPolicy(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Effective Policy</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
