import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, History, ShieldAlert, UserCheck } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  StatusBadge,
  Textarea,
} from '@/src/components/ui/Primitives';
import { useHRStore } from '@/src/store/useHRStore';
import { AttendanceStatus } from '@/src/types/hr';
import { toast } from 'sonner';

export const AttendanceExceptionsPage: React.FC = () => {
  const { attendanceExceptions, attendanceRecords, resolveAttendanceException, can } = useHRStore();

  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string>(attendanceExceptions[0]?.id ?? '');

  // Investigation / correction form state
  const [remarks, setRemarks] = useState('');
  const [correctedIn, setCorrectedIn] = useState('08:04');
  const [correctedOut, setCorrectedOut] = useState('17:10');
  const [correctedStatus, setCorrectedStatus] = useState<AttendanceStatus>('Present');

  const summary = useMemo(() => {
    const total = attendanceExceptions.length;
    const critical = attendanceExceptions.filter((e) => e.severity === 'Critical').length;
    const pending = attendanceExceptions.filter((e) => e.status === 'Pending Review').length;
    const assigned = attendanceExceptions.filter(
      (e) =>
        e.status === 'Supervisor Verification Requested' ||
        e.status === 'Employee Clarification Requested' ||
        e.status === 'Escalated to HR Manager'
    ).length;
    const resolved = attendanceExceptions.filter((e) => e.status === 'Resolved').length;
    const rejected = attendanceExceptions.filter((e) => e.status === 'Rejected').length;
    return { total, critical, pending, assigned, resolved, rejected };
  }, [attendanceExceptions]);

  const filtered = useMemo(
    () =>
      attendanceExceptions.filter((e) => {
        if (statusFilter !== 'All' && e.status !== statusFilter) return false;
        if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
        return true;
      }),
    [attendanceExceptions, statusFilter, categoryFilter]
  );

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  const linkedAttendance = useMemo(
    () => (selected ? attendanceRecords.find((a) => a.id === selected.attendanceRecordId) : undefined),
    [selected, attendanceRecords]
  );

  const handleAction = (
    action:
      | 'accept_valid'
      | 'request_supervisor'
      | 'request_employee'
      | 'approve_correction'
      | 'reject_correction'
      | 'escalate'
  ) => {
    if (!selected) return;
    if ((action === 'approve_correction' || action === 'reject_correction') && !can('attendance.exceptions_approve')) {
      toast.error('Your active role cannot approve or reject attendance corrections. Switch to Attendance Officer, HR Admin, or HR Manager.');
      return;
    }
    if (!remarks.trim()) {
      toast.error('Please document remarks / reason before recording an exception action.');
      return;
    }

    resolveAttendanceException(
      selected.id,
      action,
      remarks,
      action === 'approve_correction' ? correctedIn : undefined,
      action === 'approve_correction' ? correctedOut : undefined,
      action === 'approve_correction' ? correctedStatus : undefined
    );
    setRemarks('');
    toast.success('Attendance exception workflow updated with full audit trail.');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#172B4D]">Attendance Exception Centre</h2>
        <p className="text-xs text-[#64748B]">
          Investigate unusual attendance punches · Corrections preserve original records and create audited versions for Payroll
        </p>
      </div>

      {/* Exception KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Exceptions', val: summary.total },
          { label: 'Critical', val: summary.critical, danger: summary.critical > 0 },
          { label: 'Pending Review', val: summary.pending },
          { label: 'Verification / Escalated', val: summary.assigned },
          { label: 'Resolved', val: summary.resolved },
          { label: 'Rejected', val: summary.rejected },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-[11px] text-[#64748B]">{s.label}</div>
            <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${s.danger ? 'text-[#DC2626]' : 'text-[#172B4D]'}`}>
              {s.val}
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs">
          <option value="All">All Exception Statuses</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Supervisor Verification Requested">Supervisor Verification Requested</option>
          <option value="Employee Clarification Requested">Employee Clarification Requested</option>
          <option value="Escalated to HR Manager">Escalated to HR Manager</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs">
          <option value="All">All 14 Exception Categories</option>
          <option value="Missing Check-In">Missing Check-In</option>
          <option value="Missing Check-Out">Missing Check-Out</option>
          <option value="Duplicate Check-In">Duplicate Check-In</option>
          <option value="Outside Geofence">Outside Geofence</option>
          <option value="GPS Unavailable">GPS Unavailable</option>
          <option value="Poor GPS Accuracy">Poor GPS Accuracy</option>
          <option value="Selfie Missing">Selfie Missing</option>
          <option value="Selfie Verification Pending">Selfie Verification Pending</option>
          <option value="Late Arrival">Late Arrival</option>
          <option value="Early Departure">Early Departure</option>
          <option value="Excessive Working Duration">Excessive Working Duration</option>
          <option value="Offline Attendance Pending Sync">Offline Attendance Pending Sync</option>
          <option value="Supervisor Verification Pending">Supervisor Verification Pending</option>
          <option value="Conflicting Attendance Records">Conflicting Attendance Records</option>
        </Select>
      </Card>

      {/* Master-Detail Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Exception Queue */}
        <Card className="lg:col-span-5 overflow-hidden">
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Exception Queue ({filtered.length})</h3>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {filtered.map((exc) => (
              <button
                key={exc.id}
                onClick={() => setSelectedId(exc.id)}
                className={`w-full p-4 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                  selected?.id === exc.id ? 'bg-blue-50/70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
                      <span>{exc.id.toUpperCase()}</span>
                      <span>·</span>
                      <span>{exc.date}</span>
                    </div>
                    <div className="text-sm font-semibold text-[#172B4D] mt-0.5 truncate">
                      {exc.employeeName} — {exc.category}
                    </div>
                    <div className="text-xs text-[#64748B] truncate mt-0.5">
                      {exc.projectName} · {exc.siteName}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge label={exc.severity} />
                    <StatusBadge label={exc.status} showIcon={false} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detailed Review Panel */}
        {selected && (
          <Card className="lg:col-span-7">
            <CardHeader className="flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#64748B]">{selected.id.toUpperCase()}</span>
                  <h3 className="text-base font-semibold text-[#172B4D]">{selected.category}</h3>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selected.employeeName} ({selected.employeeCode}) · {selected.projectName} · {selected.shift}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.affectsWages && <StatusBadge label="Affects Payroll Wages" tone="warning" />}
                <StatusBadge label={selected.status} />
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[#64748B]">Original Attendance Event (Preserved)</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">{selected.originalEventSummary}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Device & Timestamp Context</div>
                  <div className="font-mono text-[#172B4D] mt-0.5">{selected.recordedTimestamp}</div>
                  <div className="text-[#64748B] mt-0.5">{selected.deviceContext}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Supporting Evidence</div>
                  <div className="text-[#172B4D] mt-0.5">{selected.supportingEvidence}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Supervisor Remarks</div>
                  <div className="text-[#172B4D] mt-0.5">{selected.supervisorRemarks || 'Awaiting supervisor note'}</div>
                </div>
              </div>

              {linkedAttendance && linkedAttendance.correctionVersions.length > 0 && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
                  <div className="font-semibold text-[#16A34A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Audited Corrected Version Created
                  </div>
                  {linkedAttendance.correctionVersions.map((v) => (
                    <div key={v.version} className="mt-1 text-[#172B4D]">
                      v{v.version}: {v.checkIn || '—'} to {v.checkOut || '—'} · Status: <strong>{v.status}</strong> · Approved by {v.updatedBy} ({v.timestamp})
                    </div>
                  ))}
                </div>
              )}

              {/* Correction Inputs */}
              {selected.status !== 'Resolved' && selected.status !== 'Rejected' && (
                <div className="p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="font-semibold text-[#172B4D]">Audited Resolution / Correction Workspace</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#64748B] mb-1">Corrected Check-In</label>
                      <Input type="time" value={correctedIn} onChange={(e) => setCorrectedIn(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#64748B] mb-1">Corrected Check-Out</label>
                      <Input type="time" value={correctedOut} onChange={(e) => setCorrectedOut(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#64748B] mb-1">Corrected Status</label>
                      <Select
                        className="w-full"
                        value={correctedStatus}
                        onChange={(e) => setCorrectedStatus(e.target.value as AttendanceStatus)}
                      >
                        <option value="Present">Present</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                      HR Investigation Remarks / Reason (Required for Audit Log)
                    </label>
                    <Textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Document evidence verified, supervisor confirmation, or correction rationale..."
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button size="sm" variant="success" onClick={() => handleAction('approve_correction')}>
                      Approve Correction
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleAction('accept_valid')}>
                      Accept Valid Attendance
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction('request_supervisor')}>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Request Supervisor Verify</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction('request_employee')}>
                      Request Clarification
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction('escalate')}>
                      <ShieldAlert className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Escalate to HR Manager</span>
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleAction('reject_correction')}>
                      Reject Correction
                    </Button>
                  </div>
                </div>
              )}

              {/* Full Audit History */}
              <div>
                <div className="font-semibold text-[#172B4D] flex items-center gap-1.5 mb-2">
                  <History className="w-3.5 h-3.5 text-[#2563EB]" /> Exception Audit Trail
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {selected.auditTrail.map((a) => (
                    <div key={a.id} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-semibold text-[#172B4D]">{a.action}</span>
                        <span className="text-[#64748B]"> — {a.note}</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#64748B] shrink-0">
                        {a.actor} · {a.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
