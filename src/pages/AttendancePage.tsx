import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, Clock, Eye, MapPin, ShieldCheck } from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Modal,
  Select,
  StatusBadge,
} from '@/src/components/ui/Primitives';
import { useHRStore } from '@/src/store/useHRStore';
import { AttendanceRecord } from '@/src/types/hr';

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { attendanceRecords, projectSites, departments, activeRoleId, getScopedEmployees } = useHRStore();

  const scopedEmployeeIds = useMemo(() => new Set(getScopedEmployees().map((e) => e.id)), [getScopedEmployees]);
  const scopedRecords = useMemo(
    () => attendanceRecords.filter((a) => scopedEmployeeIds.has(a.employeeId)),
    [attendanceRecords, scopedEmployeeIds]
  );

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const stats = useMemo(() => {
    const total = scopedRecords.length;
    const present = scopedRecords.filter((r) => r.status === 'Present').length;
    const absent = scopedRecords.filter((r) => r.status === 'Absent').length;
    const late = scopedRecords.filter((r) => r.status === 'Late').length;
    const halfDay = scopedRecords.filter((r) => r.status === 'Half Day').length;
    const onLeave = scopedRecords.filter((r) => r.status === 'On Leave').length;
    const missingOut = scopedRecords.filter((r) => r.status === 'Missing Check-Out').length;
    const pendingVerify = scopedRecords.filter((r) => r.verificationStatus === 'Pending Supervisor').length;
    const exceptions = scopedRecords.filter((r) => r.status === 'Exception' || r.status === 'Missing Check-Out').length;
    return { total, present, absent, late, halfDay, onLeave, missingOut, pendingVerify, exceptions };
  }, [scopedRecords]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedRecords.filter((r) => {
      if (q && !r.employeeName.toLowerCase().includes(q) && !r.employeeCode.toLowerCase().includes(q)) return false;
      if (projectFilter !== 'All' && r.projectName !== projectFilter) return false;
      if (deptFilter !== 'All' && r.departmentName !== deptFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (verificationFilter !== 'All' && r.verificationStatus !== verificationFilter) return false;
      return true;
    });
  }, [scopedRecords, search, projectFilter, deptFilter, statusFilter, verificationFilter]);

  const formatDuration = (mins: number) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Attendance Management</h2>
          <p className="text-xs text-[#64748B]">
            Connected to the shared BuildFlow site attendance system · Approved records flow to Finance payroll
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/attendance-exceptions')}>
          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Open Exception Centre</span>
        </Button>
      </div>

      {/* Attendance Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
        {[
          { label: 'Expected Today', value: stats.total },
          { label: 'Present', value: stats.present },
          { label: 'Absent', value: stats.absent },
          { label: 'Late Arrivals', value: stats.late },
          { label: 'Half-Day', value: stats.halfDay },
          { label: 'On Leave', value: stats.onLeave },
          { label: 'Missing Check-Out', value: stats.missingOut, warn: stats.missingOut > 0 },
          { label: 'Pending Supervisor', value: stats.pendingVerify },
          { label: 'Exceptions', value: stats.exceptions, warn: stats.exceptions > 0 },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <div className="text-[11px] text-[#64748B] truncate">{item.label}</div>
            <div className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${item.warn ? 'text-[#DC2626]' : 'text-[#172B4D]'}`}>
              {item.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or ID..."
          />
          <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
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
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Attendance Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
            <option value="Missing Check-Out">Missing Check-Out</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Exception">Exception</option>
          </Select>
          <Select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
            <option value="All">All Verification States</option>
            <option value="Verified">Verified</option>
            <option value="Pending Supervisor">Pending Supervisor</option>
            <option value="Pending HR">Pending HR</option>
            <option value="Flagged">Flagged</option>
            <option value="Corrected">Corrected</option>
          </Select>
        </div>
      </Card>

      {/* Desktop Attendance Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Project & Site</th>
                <th className="py-2.5 px-4">Shift</th>
                <th className="py-2.5 px-4">Check-In</th>
                <th className="py-2.5 px-4">Check-Out</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Verification</th>
                <th className="py-2.5 px-4 text-right">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-[#172B4D]">{att.employeeName}</div>
                    <div className="font-mono text-[11px] text-[#64748B]">
                      {att.employeeCode} · {att.employmentType}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#172B4D]">{att.projectName}</div>
                    <div className="text-[11px] text-[#64748B]">{att.siteName}</div>
                  </td>
                  <td className="py-2.5 px-4 text-[#64748B]">{att.shift}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums">{att.checkIn || '—'}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums">{att.checkOut || '—'}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums">{formatDuration(att.workingDurationMinutes)}</td>
                  <td className="py-2.5 px-4">
                    <StatusBadge label={att.status} />
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge label={att.verificationStatus} />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedRecord(att)}>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((att) => (
          <Card key={att.id} className="p-4 space-y-2 text-xs" onClick={() => setSelectedRecord(att)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm text-[#172B4D]">{att.employeeName}</div>
                <div className="font-mono text-[11px] text-[#64748B]">{att.employeeCode} · {att.projectName}</div>
              </div>
              <StatusBadge label={att.status} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-mono">
              <span>In: {att.checkIn || '—'}</span>
              <span>Out: {att.checkOut || '—'}</span>
              <span>{formatDuration(att.workingDurationMinutes)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Attendance Evidence Inspector Modal */}
      <Modal
        open={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Attendance Record — ${selectedRecord.employeeName}` : ''}
        subtitle={
          selectedRecord
            ? `${selectedRecord.employeeCode} · ${selectedRecord.date} · ${selectedRecord.projectName}`
            : ''
        }
        maxWidth="lg"
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                Selfie & GPS location evidence are permission-controlled under role <strong>{activeRoleId}</strong> strictly for legitimate attendance verification.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> Punch Timestamps
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Check-In:</span>
                  <span className="font-mono font-semibold">{selectedRecord.checkIn || 'Missing'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Check-Out:</span>
                  <span className="font-mono font-semibold">{selectedRecord.checkOut || 'Missing'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Working Duration:</span>
                  <span className="font-mono">{formatDuration(selectedRecord.workingDurationMinutes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Supervisor:</span>
                  <span>{selectedRecord.supervisorName}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" /> Geofence & Selfie Evidence
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Geofence Result:</span>
                  <StatusBadge label={selectedRecord.geofenceResult} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">GPS Coordinates:</span>
                  <span className="font-mono">{selectedRecord.gpsCoordinates || 'Unavailable'}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Selfie Evidence:
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar name={selectedRecord.employeeName} src={selectedRecord.selfieUrl} size="sm" />
                    <span className="font-medium">{selectedRecord.selfieStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedRecord.supervisorRemarks && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-[#172B4D]">Supervisor Remarks</div>
                <p className="text-[#64748B] mt-0.5">{selectedRecord.supervisorRemarks}</p>
              </div>
            )}

            <div>
              <div className="font-semibold text-[#172B4D] mb-2">Correction & Version Audit History</div>
              {selectedRecord.correctionVersions.length === 0 ? (
                <p className="text-[#64748B]">Original punch record intact — no corrections applied.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {selectedRecord.correctionVersions.map((ver) => (
                    <div key={ver.version} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#172B4D]">
                          Version {ver.version} · {ver.status} ({ver.checkIn || '—'} – {ver.checkOut || '—'})
                        </div>
                        <div className="text-[#64748B] mt-0.5">{ver.reason}</div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-[#64748B]">
                        <div>{ver.updatedBy}</div>
                        <div>{ver.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
