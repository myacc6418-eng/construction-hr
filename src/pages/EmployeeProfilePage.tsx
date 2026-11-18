import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Edit3,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  UserX,
} from 'lucide-react';
import {
  AccessRestrictedBanner,
  Avatar,
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
import { EmploymentStatus } from '@/src/types/hr';
import { toast } from 'sonner';

const TABS = [
  'Overview',
  'Personal Information',
  'Employment Details',
  'Department & Reporting',
  'Project & Site Assignments',
  'Attendance',
  'Leave History',
  'Documents',
  'Training & Certifications',
  'HR Requests',
  'Activity History',
] as const;

type ProfileTab = (typeof TABS)[number];

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    employees,
    departments,
    designations,
    projectSites,
    attendanceRecords,
    leaveRequests,
    documents,
    trainingRecords,
    hrRequests,
    can,
    addOrUpdateEmployee,
    changeEmployeeLifecycle,
  } = useHRStore();

  const employee = useMemo(() => employees.find((e) => e.id === id), [employees, id]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('Overview');

  // Action Modals
  const [editOpen, setEditOpen] = useState(false);
  const [lifecycleModal, setLifecycleModal] = useState<null | 'transfer' | 'status' | 'designation' | 'exit'>(null);

  // Edit state
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  // Lifecycle state
  const [effectiveDate, setEffectiveDate] = useState('2026-11-20');
  const [targetProject, setTargetProject] = useState('');
  const [targetSite, setTargetSite] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [targetDesignation, setTargetDesignation] = useState('');
  const [targetStatus, setTargetStatus] = useState<EmploymentStatus>('Active');
  const [targetManager, setTargetManager] = useState('');
  const [lifecycleRemarks, setLifecycleRemarks] = useState('');

  if (!employee) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-[#172B4D]">Employee record not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/employees')}>
          Back to Employee Directory
        </Button>
      </Card>
    );
  }

  const empAttendance = attendanceRecords.filter((a) => a.employeeId === employee.id);
  const empLeaves = leaveRequests.filter((l) => l.employeeId === employee.id);
  const empDocs = documents.filter((d) => d.employeeId === employee.id);
  const empTraining = trainingRecords.filter((t) => t.employeeId === employee.id);
  const empRequests = hrRequests.filter((r) => r.employeeId === employee.id);

  const canViewSensitive = can('employees.sensitive_view');
  const canViewSalary = can('employees.salary_view');
  const canEdit = can('employees.edit');

  const openEditModal = () => {
    setEditPhone(employee.phone);
    setEditEmail(employee.email);
    setEditAddress(employee.currentAddress);
    setEditEmergencyName(employee.emergencyContactName);
    setEditEmergencyPhone(employee.emergencyContactPhone);
    setEditOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addOrUpdateEmployee(
      {
        ...employee,
        phone: editPhone,
        email: editEmail,
        currentAddress: editAddress,
        emergencyContactName: editEmergencyName,
        emergencyContactPhone: editEmergencyPhone,
      },
      'Updated contact & emergency information via Employee Profile.'
    );
    setEditOpen(false);
    toast.success('Employee profile updated and logged in audit trail.');
  };

  const openLifecycle = (mode: 'transfer' | 'status' | 'designation' | 'exit') => {
    setTargetProject(employee.projectName);
    setTargetSite(employee.siteName);
    setTargetDepartment(employee.departmentName);
    setTargetDesignation(employee.designationTitle);
    setTargetStatus(employee.employmentStatus);
    setTargetManager(employee.reportingManagerName);
    setLifecycleRemarks('');
    setLifecycleModal(mode);
  };

  const handleLifecycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleRemarks.trim()) {
      toast.error('Please enter remarks for the audit history.');
      return;
    }

    if (lifecycleModal === 'transfer') {
      const selectedSiteObj = projectSites.find((p) => p.projectName === targetProject);
      changeEmployeeLifecycle(employee.id, {
        changeType: 'Project & Site Transfer',
        effectiveDate,
        newProjectName: targetProject,
        newSiteName: selectedSiteObj?.siteName || targetSite,
        newDepartmentName: targetDepartment,
        newManagerName: targetManager,
        remarks: lifecycleRemarks,
      });
      toast.success('Project & site transfer recorded with historical assignment preserved.');
    } else if (lifecycleModal === 'designation') {
      changeEmployeeLifecycle(employee.id, {
        changeType: 'Designation Change',
        effectiveDate,
        newDesignationTitle: targetDesignation,
        remarks: lifecycleRemarks,
      });
      toast.success('Designation updated and archived in employment history.');
    } else if (lifecycleModal === 'status') {
      changeEmployeeLifecycle(employee.id, {
        changeType: 'Status Change',
        effectiveDate,
        newStatus: targetStatus,
        remarks: lifecycleRemarks,
      });
      toast.success(`Employment status updated to ${targetStatus}.`);
    } else if (lifecycleModal === 'exit') {
      changeEmployeeLifecycle(employee.id, {
        changeType: 'Resignation',
        effectiveDate,
        newStatus: 'Notice Period',
        remarks: lifecycleRemarks,
      });
      toast.success('Employee exit workflow initiated (status moved to Notice Period).');
    }

    setLifecycleModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={openEditModal}>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => openLifecycle('transfer')}>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer Project/Site</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => openLifecycle('status')}>
                <span>Change Status</span>
              </Button>
            </>
          )}
          {can('employees.exit') && (
            <Button variant="danger" size="sm" onClick={() => openLifecycle('exit')}>
              <UserX className="w-3.5 h-3.5" />
              <span>Initiate Exit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Employee Header Summary Card */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <Avatar name={employee.fullName} src={employee.avatarUrl} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[#172B4D]">{employee.fullName}</h2>
                <StatusBadge label={employee.employmentStatus} />
              </div>
              <div className="mt-1 text-xs text-[#64748B] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono font-semibold text-[#172B4D]">{employee.employeeCode}</span>
                <span aria-hidden="true">·</span>
                <span>{employee.designationTitle}</span>
                <span aria-hidden="true">·</span>
                <span>{employee.departmentName}</span>
                <span aria-hidden="true">·</span>
                <span>{employee.employmentType}</span>
              </div>
              <div className="mt-2 text-xs text-[#64748B] flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                  {employee.projectName} ({employee.siteName})
                </span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  {canViewSensitive ? employee.phone : '•••• ••' + employee.phone.slice(-4)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {employee.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="text-right">
              <div className="text-[11px] text-[#64748B]">Profile Completion</div>
              <div className="text-base font-bold font-mono tabular-nums text-[#172B4D]">
                {employee.profileCompletion}%
              </div>
            </div>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16A34A]"
                style={{ width: `${employee.profileCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 11-Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              activeTab === tab ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D] hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-sm font-semibold text-[#172B4D]">Workforce Summary</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#64748B]">Full Legal Name</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.fullName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Skill / Trade Specialization</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.skillOrTrade}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Reporting Manager</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.reportingManagerName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Joining Date</div>
                <div className="font-mono tabular-nums font-medium text-[#172B4D] mt-0.5">{employee.joiningDate}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Assigned Shift</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.shift}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Emergency Contact Status</div>
                <div className="mt-0.5">
                  <StatusBadge
                    label={employee.emergencyContactPhone ? 'On File & Verified' : 'Missing'}
                    tone={employee.emergencyContactPhone ? 'success' : 'danger'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-[#172B4D]">Quick HR Actions</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => openLifecycle('designation')}>
                Update Designation
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => openLifecycle('transfer')}>
                Request Project / Site Transfer
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => navigate('/documents')}>
                Upload / Verify Documents ({empDocs.length})
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setActiveTab('Attendance')}>
                View Attendance History ({empAttendance.length})
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setActiveTab('Leave History')}>
                Review Leave History ({empLeaves.length})
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Personal Information' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Personal & Emergency Information</h3>
            <span className="text-xs text-[#64748B] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Role-restricted personal data
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canViewSensitive ? (
              <AccessRestrictedBanner
                message="Your active role does not have permission to view sensitive personal addresses, DOB, or emergency contacts. Switch to HR Administrator or HR Manager to inspect."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[#64748B]">Full Legal Name</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">{employee.fullName}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Date of Birth</div>
                  <div className="font-mono tabular-nums font-medium text-[#172B4D] mt-0.5">{employee.dateOfBirth}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Gender</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">{employee.gender || 'Not Specified'}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Contact Number</div>
                  <div className="font-mono font-medium text-[#172B4D] mt-0.5">{employee.phone}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Official / Contact Email</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">{employee.email}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Current Address</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">{employee.currentAddress}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Permanent Address</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">{employee.permanentAddress}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Emergency Contact</div>
                  <div className="font-medium text-[#172B4D] mt-0.5">
                    {employee.emergencyContactName} ({employee.emergencyContactRelation})
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">Emergency Phone</div>
                  <div className="font-mono font-medium text-[#172B4D] mt-0.5">{employee.emergencyContactPhone}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'Employment Details' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-[#172B4D]">Employment Contract & Assignment</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-[#64748B]">Employee ID</div>
                <div className="font-mono font-semibold text-[#172B4D] mt-0.5">{employee.employeeCode}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Designation</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.designationTitle}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Department</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.departmentName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Employment Type</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.employmentType}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Joining Date</div>
                <div className="font-mono tabular-nums font-medium text-[#172B4D] mt-0.5">{employee.joiningDate}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Probation / Contract Dates</div>
                <div className="font-mono tabular-nums font-medium text-[#172B4D] mt-0.5">
                  {employee.probationEndDate
                    ? `Probation ends ${employee.probationEndDate}`
                    : employee.contractEndDate
                    ? `${employee.contractStartDate} → ${employee.contractEndDate}`
                    : 'Standard muster / N/A'}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Work Location</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.workLocation}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Shift</div>
                <div className="font-medium text-[#172B4D] mt-0.5">{employee.shift}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Employment Status</div>
                <div className="mt-0.5"><StatusBadge label={employee.employmentStatus} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-[#172B4D]">Compensation & Payroll Reference</h3>
              <span className="text-xs text-[#64748B] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Separate salary-information permission
              </span>
            </CardHeader>
            <CardContent>
              {!canViewSalary ? (
                <AccessRestrictedBanner
                  title="Salary Information Restricted"
                  message="Compensation details are hidden by default. Only roles with explicit salary-view permission (HR Manager / HR Admin) can view CTC or wage rates. Payroll disbursement remains exclusively under Finance."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[#64748B]">Configured Rate / Monthly CTC</div>
                    <div className="text-base font-bold font-mono tabular-nums text-[#172B4D] mt-0.5">
                      {employee.monthlyCtcInr
                        ? `₹${employee.monthlyCtcInr.toLocaleString('en-IN')} / month`
                        : employee.dailyWageInr
                        ? `₹${employee.dailyWageInr.toLocaleString('en-IN')} / day`
                        : 'Managed via Finance Payroll'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Payroll Integration Boundary</div>
                    <div className="text-[#172B4D] mt-0.5">
                      {employee.wageStructureNote || 'Approved attendance & leave shared with BuildFlow Finance for payment execution.'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Department & Reporting' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Department & Reporting Line</h3>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => openLifecycle('transfer')}>
                Change Department / Manager
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[#64748B]">Current Department</div>
                <div className="text-sm font-semibold text-[#172B4D] mt-0.5">{employee.departmentName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Designation (Not a System Role)</div>
                <div className="text-sm font-semibold text-[#172B4D] mt-0.5">{employee.designationTitle}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Reporting Manager</div>
                <div className="text-sm font-semibold text-[#172B4D] mt-0.5">{employee.reportingManagerName}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'Project & Site Assignments' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Project & Site Assignment</h3>
            {canEdit && (
              <Button size="sm" onClick={() => openLifecycle('transfer')}>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Initiate Transfer</span>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="text-[#64748B]">Current Project</div>
                <div className="font-semibold text-[#172B4D] mt-0.5">{employee.projectName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Current Site</div>
                <div className="font-semibold text-[#172B4D] mt-0.5">{employee.siteName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Shift Schedule</div>
                <div className="font-semibold text-[#172B4D] mt-0.5">{employee.shift}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-[#172B4D] mb-2">Preserved Assignment & Lifecycle History</h4>
              {employee.history.length === 0 ? (
                <p className="text-[#64748B]">No historical transfers recorded since initial joining.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {employee.history.map((h) => (
                    <div key={h.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#172B4D]">{h.changeType}</div>
                        <div className="text-[#64748B] mt-0.5">
                          {h.previousValue} → <strong className="text-[#172B4D]">{h.newValue}</strong>
                        </div>
                        <div className="text-[#64748B] mt-0.5">{h.remarks}</div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-[#64748B] shrink-0">
                        <div>Effective: {h.effectiveDate}</div>
                        <div>By: {h.approvedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'Attendance' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Shared BuildFlow Attendance Logs</h3>
            <Button size="sm" variant="outline" onClick={() => navigate('/attendance')}>
              Open Attendance Workspace
            </Button>
          </CardHeader>
          <CardContent>
            {empAttendance.length === 0 ? (
              <p className="text-xs text-[#64748B]">No attendance entries logged for the selected period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#64748B]">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Check-In</th>
                      <th className="py-2 pr-4">Check-Out</th>
                      <th className="py-2 pr-4">Geofence</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empAttendance.map((att) => (
                      <tr key={att.id}>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">{att.date}</td>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">{att.checkIn || '—'}</td>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">{att.checkOut || '—'}</td>
                        <td className="py-2.5 pr-4">{att.geofenceResult}</td>
                        <td className="py-2.5 pr-4"><StatusBadge label={att.status} /></td>
                        <td className="py-2.5"><StatusBadge label={att.verificationStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'Leave History' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Leave Requests & History</h3>
            <Button size="sm" variant="outline" onClick={() => navigate('/leaves')}>
              Manage Leaves
            </Button>
          </CardHeader>
          <CardContent>
            {empLeaves.length === 0 ? (
              <p className="text-xs text-[#64748B]">No leave applications recorded for {employee.fullName}.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {empLeaves.map((l) => (
                  <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-[#172B4D]">
                        {l.leaveType} · <span className="font-mono">{l.daysCount} day(s)</span>
                      </div>
                      <div className="text-[#64748B] font-mono mt-0.5">
                        {l.fromDate} → {l.toDate}
                      </div>
                      <div className="text-[#64748B] mt-0.5">{l.reason}</div>
                    </div>
                    <StatusBadge label={l.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'Documents' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Private Employee Documents</h3>
            <Button size="sm" variant="outline" onClick={() => navigate('/documents')}>
              Open Document Vault
            </Button>
          </CardHeader>
          <CardContent>
            {empDocs.length === 0 ? (
              <p className="text-xs text-[#64748B]">No documents uploaded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {empDocs.map((d) => (
                  <div key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#172B4D]">{d.documentName}</div>
                        <div className="text-[#64748B] mt-0.5">
                          {d.category} · v{d.version} · {d.expiryDate ? `Expires ${d.expiryDate}` : 'No expiry'}
                        </div>
                      </div>
                    </div>
                    <StatusBadge label={d.isSensitiveMedical && !can('employees.medical_view') ? 'Medical Restricted' : d.verificationStatus} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'Training & Certifications' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Safety Inductions & Certifications</h3>
            <Button size="sm" variant="outline" onClick={() => navigate('/training')}>
              Training Register
            </Button>
          </CardHeader>
          <CardContent>
            {empTraining.length === 0 ? (
              <p className="text-xs text-[#64748B]">No training courses assigned yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {empTraining.map((t) => (
                  <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-[#172B4D]">{t.trainingName}</div>
                      <div className="text-[#64748B] mt-0.5">
                        Provider: {t.provider} · Assigned {t.assignedDate}
                        {t.expiryDate ? ` · Expires ${t.expiryDate}` : ''}
                      </div>
                    </div>
                    <StatusBadge label={t.verificationStatus} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'HR Requests' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Employee HR Requests</h3>
            <Button size="sm" variant="outline" onClick={() => navigate('/requests')}>
              Open Request Centre
            </Button>
          </CardHeader>
          <CardContent>
            {empRequests.length === 0 ? (
              <p className="text-xs text-[#64748B]">No HR requests filed by {employee.fullName}.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {empRequests.map((r) => (
                  <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-[#172B4D]">
                        {r.requestCode} · {r.category}
                      </div>
                      <div className="text-[#64748B] mt-0.5">{r.subject}</div>
                    </div>
                    <StatusBadge label={r.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'Activity History' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Audited Employment & Activity History</h3>
          </CardHeader>
          <CardContent>
            {employee.history.length === 0 ? (
              <p className="text-xs text-[#64748B]">Initial joining record active; no subsequent lifecycle changes logged.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {employee.history.map((h) => (
                  <div key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[#172B4D]">{h.changeType}</div>
                      <div className="text-[#64748B] mt-0.5">
                        {h.previousValue} → {h.newValue}
                      </div>
                      <div className="text-[#64748B] mt-0.5">{h.remarks}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-[#64748B]">
                      <div>Effective {h.effectiveDate}</div>
                      <div>{h.approvedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Info Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit Profile — ${employee.fullName}`}
        subtitle="All changes are recorded in the employee audit trail."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Contact Phone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Email</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Current Address</label>
            <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Emergency Contact Name</label>
              <Input value={editEmergencyName} onChange={(e) => setEditEmergencyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Emergency Contact Phone</label>
              <Input value={editEmergencyPhone} onChange={(e) => setEditEmergencyPhone(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save & Log Change</Button>
          </div>
        </form>
      </Modal>

      {/* Lifecycle / Transfer / Exit Workflow Modal */}
      <Modal
        open={lifecycleModal !== null}
        onClose={() => setLifecycleModal(null)}
        title={
          lifecycleModal === 'transfer'
            ? `Transfer Project / Site — ${employee.fullName}`
            : lifecycleModal === 'designation'
            ? `Change Designation — ${employee.fullName}`
            : lifecycleModal === 'exit'
            ? `Initiate Employee Exit — ${employee.fullName}`
            : `Change Employment Status — ${employee.fullName}`
        }
        subtitle="Historical employment records are preserved with effective dates."
      >
        <form onSubmit={handleLifecycleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Effective Date</label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </div>

          {lifecycleModal === 'transfer' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172B4D] mb-1">New Project</label>
                  <Select
                    className="w-full"
                    value={targetProject}
                    onChange={(e) => {
                      setTargetProject(e.target.value);
                      const p = projectSites.find((x) => x.projectName === e.target.value);
                      if (p) setTargetSite(p.siteName);
                    }}
                  >
                    {projectSites.map((p) => (
                      <option key={p.id} value={p.projectName}>
                        {p.projectName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B4D] mb-1">Target Department</label>
                  <Select className="w-full" value={targetDepartment} onChange={(e) => setTargetDepartment(e.target.value)}>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#172B4D] mb-1">New Reporting Manager</label>
                <Input value={targetManager} onChange={(e) => setTargetManager(e.target.value)} />
              </div>
            </>
          )}

          {lifecycleModal === 'designation' && (
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">New Designation</label>
              <Select className="w-full" value={targetDesignation} onChange={(e) => setTargetDesignation(e.target.value)}>
                {designations.map((d) => (
                  <option key={d.id} value={d.title}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {lifecycleModal === 'status' && (
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">New Employment Status</label>
              <Select
                className="w-full"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as EmploymentStatus)}
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="On Leave">On Leave</option>
                <option value="Notice Period">Notice Period</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
                <option value="Exited">Exited</option>
                <option value="Terminated">Terminated</option>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Approval Remarks / Reason (Required)</label>
            <Textarea
              rows={3}
              value={lifecycleRemarks}
              onChange={(e) => setLifecycleRemarks(e.target.value)}
              placeholder="Document business reason, approval reference, or exit clearance details..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLifecycleModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant={lifecycleModal === 'exit' ? 'danger' : 'primary'}>
              Confirm & Archive History
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
