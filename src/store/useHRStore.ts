import { create } from 'zustand';
import {
  DEMO_ORG_ID,
  INITIAL_HR_SETTINGS,
  SAMPLE_ACTIVITY_LOGS,
  SAMPLE_ATTENDANCE_EXCEPTIONS,
  SAMPLE_ATTENDANCE_RECORDS,
  SAMPLE_COMPLIANCE_RECORDS,
  SAMPLE_COMPLIANCE_RULES,
  SAMPLE_CONTRACTOR_COMPANIES,
  SAMPLE_CONTRACTOR_WORKERS,
  SAMPLE_DEPARTMENTS,
  SAMPLE_DESIGNATIONS,
  SAMPLE_DOCUMENTS,
  SAMPLE_EMPLOYEES,
  SAMPLE_HR_REQUESTS,
  SAMPLE_LEAVE_POLICIES,
  SAMPLE_LEAVE_REQUESTS,
  SAMPLE_NOTIFICATIONS,
  SAMPLE_ONBOARDING_RECORDS,
  SAMPLE_PROJECT_SITES,
  SAMPLE_TRAINING_RECORDS,
} from '@/src/data/demoData';
import { getRoleDefinition, hasPermission } from '@/src/services/hrService';
import {
  ActivityLogEntry,
  AttendanceException,
  AttendanceRecord,
  AttendanceStatus,
  CompanySizeProfile,
  ComplianceRecord,
  ComplianceStatus,
  ConfigurableComplianceRule,
  ContractorCompany,
  ContractorWorker,
  Department,
  Designation,
  DocVerificationStatus,
  DocumentCategory,
  Employee,
  EmployeeDocument,
  EmploymentHistoryEntry,
  EmploymentStatus,
  ExceptionStatus,
  HRNotification,
  HRRequest,
  HRRoleId,
  HRSettingsState,
  LeavePolicy,
  LeaveRequest,
  OnboardingRecord,
  PermissionKey,
  ProjectSite,
  TrainingRecord,
} from '@/src/types/hr';

interface HRStoreState {
  orgId: string;
  activeRoleId: HRRoleId;
  activeUserName: string;
  activeUserEmail: string;
  activeUserAvatar: string;
  selectedDate: string;
  sidebarCollapsed: boolean;
  settings: HRSettingsState;

  projectSites: ProjectSite[];
  departments: Department[];
  designations: Designation[];
  employees: Employee[];
  onboardingRecords: OnboardingRecord[];
  attendanceRecords: AttendanceRecord[];
  attendanceExceptions: AttendanceException[];
  leavePolicies: LeavePolicy[];
  leaveRequests: LeaveRequest[];
  documents: EmployeeDocument[];
  contractors: ContractorCompany[];
  contractorWorkers: ContractorWorker[];
  complianceRecords: ComplianceRecord[];
  complianceRules: ConfigurableComplianceRule[];
  trainingRecords: TrainingRecord[];
  hrRequests: HRRequest[];
  notifications: HRNotification[];
  activityLogs: ActivityLogEntry[];

  // Helpers
  can: (permission: PermissionKey) => boolean;
  getScopedEmployees: () => Employee[];
  setActiveRole: (roleId: HRRoleId) => void;
  setCompanySizeProfile: (profile: CompanySizeProfile) => void;
  setSelectedDate: (date: string) => void;
  toggleSidebar: () => void;
  logActivity: (action: string, module: string, targetEntity: string, details: string) => void;

  // Employee & Lifecycle mutations
  addOrUpdateEmployee: (emp: Employee, auditNote?: string) => void;
  changeEmployeeLifecycle: (
    employeeId: string,
    payload: {
      changeType: EmploymentHistoryEntry['changeType'];
      effectiveDate: string;
      newStatus?: EmploymentStatus;
      newDesignationTitle?: string;
      newDepartmentName?: string;
      newProjectName?: string;
      newSiteName?: string;
      newManagerName?: string;
      newContractEndDate?: string;
      remarks: string;
    }
  ) => void;

  // Onboarding mutations
  createOnboardingRecord: (record: OnboardingRecord) => void;
  verifyOnboardingDoc: (onboardingId: string, docId: string, status: DocVerificationStatus, rejectionReason?: string) => void;
  updateOnboardingStage: (onboardingId: string, action: 'send_invite' | 'acknowledge_policy' | 'submit_approval' | 'activate') => { ok: boolean; message: string };

  // Attendance Exception mutations
  resolveAttendanceException: (
    exceptionId: string,
    action:
      | 'accept_valid'
      | 'request_supervisor'
      | 'request_employee'
      | 'approve_correction'
      | 'reject_correction'
      | 'escalate',
    remarks: string,
    correctedCheckIn?: string,
    correctedCheckOut?: string,
    correctedStatus?: AttendanceStatus
  ) => void;

  // Leave mutations
  processLeaveRequest: (
    requestId: string,
    decision: 'Approved' | 'Rejected' | 'Clarification Requested' | 'Forwarded to HR Manager',
    remarks: string
  ) => void;
  addLeaveRequest: (req: LeaveRequest) => void;
  updateLeavePolicy: (policy: LeavePolicy) => void;

  // Document mutations
  addEmployeeDocument: (doc: EmployeeDocument) => void;
  verifyEmployeeDocument: (docId: string, status: DocVerificationStatus, note?: string) => void;
  replaceDocumentVersion: (docId: string, newIssueDate: string, newExpiryDate?: string) => void;

  // Contractor mutations
  addContractorCompany: (company: ContractorCompany) => void;
  addContractorWorker: (worker: ContractorWorker) => void;
  completeContractorWorkerInduction: (workerId: string) => void;

  // Compliance mutations
  updateComplianceRecord: (
    id: string,
    updates: Partial<Pick<ComplianceRecord, 'status' | 'supportingEvidence' | 'remarks' | 'responsiblePerson' | 'nextReviewDate'>>
  ) => void;
  addComplianceRule: (rule: ConfigurableComplianceRule) => void;

  // Training mutations
  assignTraining: (record: TrainingRecord) => void;
  updateTrainingVerification: (id: string, status: TrainingRecord['verificationStatus'], certificateFile?: string) => void;

  // HR Requests mutations
  createHRRequest: (req: HRRequest) => void;
  updateHRRequest: (
    id: string,
    updates: Partial<Pick<HRRequest, 'status' | 'assignedHRUser' | 'priority'>>,
    newMessage?: { body: string; isInternalNote: boolean }
  ) => void;

  // Departments & Designations
  addDepartment: (dept: Department) => void;
  addDesignation: (des: Designation) => void;

  // Notifications & Settings
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (partial: Partial<HRSettingsState>) => void;
}

const ROLE_USER_MAP: Record<HRRoleId, { name: string; email: string; avatar: string }> = {
  hr_admin: {
    name: 'Anjali Reddy',
    email: 'anjali.reddy@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_anjali_hr_1794999596859.jpg',
  },
  hr_manager: {
    name: 'Vikram Menon',
    email: 'vikram.menon@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_mahesh_engineer_1794999596966.jpg',
  },
  hr_executive: {
    name: 'Anjali Reddy',
    email: 'anjali.reddy@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_anjali_hr_1794999596859.jpg',
  },
  attendance_officer: {
    name: 'Raghavendra Rao',
    email: 'raghavendra.att@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_rahul_electrician_1794999597369.jpg',
  },
  compliance_officer: {
    name: 'Meenakshi Iyer',
    email: 'meenakshi.comp@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_anjali_hr_1794999596859.jpg',
  },
  onboarding_officer: {
    name: 'Anjali Reddy',
    email: 'anjali.reddy@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_anjali_hr_1794999596859.jpg',
  },
  site_manager: {
    name: 'Prakash Naidu',
    email: 'prakash.naidu@buildflow-demo.in',
    avatar: '/src/assets/images/avatar_prakash_supervisor_1794999597644.jpg',
  },
};

export const useHRStore = create<HRStoreState>((set, get) => ({
  orgId: DEMO_ORG_ID,
  activeRoleId: 'hr_admin',
  activeUserName: ROLE_USER_MAP.hr_admin.name,
  activeUserEmail: ROLE_USER_MAP.hr_admin.email,
  activeUserAvatar: ROLE_USER_MAP.hr_admin.avatar,
  selectedDate: '2026-11-18',
  sidebarCollapsed: false,
  settings: INITIAL_HR_SETTINGS,

  projectSites: SAMPLE_PROJECT_SITES,
  departments: SAMPLE_DEPARTMENTS,
  designations: SAMPLE_DESIGNATIONS,
  employees: SAMPLE_EMPLOYEES,
  onboardingRecords: SAMPLE_ONBOARDING_RECORDS,
  attendanceRecords: SAMPLE_ATTENDANCE_RECORDS,
  attendanceExceptions: SAMPLE_ATTENDANCE_EXCEPTIONS,
  leavePolicies: SAMPLE_LEAVE_POLICIES,
  leaveRequests: SAMPLE_LEAVE_REQUESTS,
  documents: SAMPLE_DOCUMENTS,
  contractors: SAMPLE_CONTRACTOR_COMPANIES,
  contractorWorkers: SAMPLE_CONTRACTOR_WORKERS,
  complianceRecords: SAMPLE_COMPLIANCE_RECORDS,
  complianceRules: SAMPLE_COMPLIANCE_RULES,
  trainingRecords: SAMPLE_TRAINING_RECORDS,
  hrRequests: SAMPLE_HR_REQUESTS,
  notifications: SAMPLE_NOTIFICATIONS,
  activityLogs: SAMPLE_ACTIVITY_LOGS,

  can: (permission) => hasPermission(get().activeRoleId, permission),

  getScopedEmployees: () => {
    const state = get();
    const role = getRoleDefinition(state.activeRoleId);
    if (role.siteScopeRestricted && role.assignedSites?.length) {
      return state.employees.filter((e) => role.assignedSites?.includes(e.projectName));
    }
    return state.employees;
  },

  setActiveRole: (roleId) => {
    const profile = ROLE_USER_MAP[roleId];
    set({
      activeRoleId: roleId,
      activeUserName: profile.name,
      activeUserEmail: profile.email,
      activeUserAvatar: profile.avatar,
    });
    get().logActivity('Switched Active Demo Role', 'RBAC & Access', getRoleDefinition(roleId).name, `Active persona switched to ${profile.name} (${getRoleDefinition(roleId).name}).`);
  },

  setCompanySizeProfile: (profile) =>
    set((s) => ({
      settings: { ...s.settings, companySizeProfile: profile },
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  logActivity: (action, module, targetEntity, details) => {
    const s = get();
    const entry: ActivityLogEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orgId: s.orgId,
      actor: s.activeUserName,
      actorRole: getRoleDefinition(s.activeRoleId).name,
      action,
      module,
      targetEntity,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      details,
    };
    set((prev) => ({ activityLogs: [entry, ...prev.activityLogs] }));
  },

  addOrUpdateEmployee: (emp, auditNote) => {
    set((s) => {
      const exists = s.employees.some((e) => e.id === emp.id);
      const next = exists ? s.employees.map((e) => (e.id === emp.id ? emp : e)) : [emp, ...s.employees];
      return { employees: next };
    });
    get().logActivity(
      'Updated Employee Record',
      'Employee Directory',
      `${emp.fullName} (${emp.employeeCode})`,
      auditNote || 'Profile details updated with audit entry.'
    );
  },

  changeEmployeeLifecycle: (employeeId, payload) => {
    const actor = `${get().activeUserName} (${getRoleDefinition(get().activeRoleId).name})`;
    set((s) => ({
      employees: s.employees.map((emp) => {
        if (emp.id !== employeeId) return emp;

        let previousValue: string = emp.employmentStatus;
        let newValue: string = payload.newStatus ?? emp.employmentStatus;

        if (payload.changeType === 'Designation Change' && payload.newDesignationTitle) {
          previousValue = emp.designationTitle;
          newValue = payload.newDesignationTitle;
        } else if (payload.changeType === 'Department Transfer' && payload.newDepartmentName) {
          previousValue = emp.departmentName;
          newValue = payload.newDepartmentName;
        } else if (payload.changeType === 'Project & Site Transfer' && payload.newProjectName) {
          previousValue = `${emp.projectName} · ${emp.siteName}`;
          newValue = `${payload.newProjectName} · ${payload.newSiteName || emp.siteName}`;
        } else if (payload.changeType === 'Manager Change' && payload.newManagerName) {
          previousValue = emp.reportingManagerName;
          newValue = payload.newManagerName;
        } else if (payload.changeType === 'Contract Renewal' && payload.newContractEndDate) {
          previousValue = emp.contractEndDate || 'None';
          newValue = payload.newContractEndDate;
        }

        const historyEntry: EmploymentHistoryEntry = {
          id: `hist_${Date.now()}`,
          effectiveDate: payload.effectiveDate,
          changeType: payload.changeType,
          previousValue,
          newValue,
          approvedBy: actor,
          remarks: payload.remarks,
          createdAt: new Date().toISOString().slice(0, 10),
        };

        return {
          ...emp,
          employmentStatus: payload.newStatus ?? emp.employmentStatus,
          designationTitle: payload.newDesignationTitle ?? emp.designationTitle,
          departmentName: payload.newDepartmentName ?? emp.departmentName,
          projectName: payload.newProjectName ?? emp.projectName,
          siteName: payload.newSiteName ?? emp.siteName,
          reportingManagerName: payload.newManagerName ?? emp.reportingManagerName,
          contractEndDate: payload.newContractEndDate ?? emp.contractEndDate,
          history: [historyEntry, ...emp.history],
        };
      }),
    }));
    const target = get().employees.find((e) => e.id === employeeId);
    get().logActivity(
      payload.changeType,
      'Employment Records',
      target ? `${target.fullName} (${target.employeeCode})` : employeeId,
      `${payload.changeType} effective ${payload.effectiveDate}: ${payload.remarks}`
    );
  },

  createOnboardingRecord: (record) => {
    set((s) => ({ onboardingRecords: [record, ...s.onboardingRecords] }));
    get().logActivity('Created Onboarding Record', 'Employee Onboarding', `${record.fullName} (${record.employeeCode})`, `Onboarding initiated for ${record.projectName}.`);
  },

  verifyOnboardingDoc: (onboardingId, docId, status, rejectionReason) => {
    const verifier = get().activeUserName;
    const today = new Date().toISOString().slice(0, 10);
    set((s) => ({
      onboardingRecords: s.onboardingRecords.map((rec) => {
        if (rec.id !== onboardingId) return rec;
        const docs = rec.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                status,
                verifiedBy: status === 'Verified' ? verifier : d.verifiedBy,
                verificationDate: status === 'Verified' ? today : d.verificationDate,
                rejectionReason: status === 'Rejected' || status === 'Resubmission Required' ? rejectionReason : undefined,
              }
            : d
        );
        const allRequiredVerified = docs.filter((d) => d.requiredForCategory).every((d) => d.status === 'Verified');
        const completed = new Set(rec.completedStages);
        if (docs.every((d) => !d.requiredForCategory || d.status !== 'Not Uploaded')) {
          completed.add('Document Collection');
        }
        if (allRequiredVerified) {
          completed.add('Document Verification');
        } else {
          completed.delete('Document Verification');
        }
        return {
          ...rec,
          documents: docs,
          completedStages: Array.from(completed),
          currentStage: allRequiredVerified ? (rec.policyAcknowledged ? 'Account Activation' : 'Policy Acknowledgement') : 'Document Verification',
        };
      }),
    }));
    get().logActivity('Updated Onboarding Document', 'Employee Onboarding', onboardingId, `Document ${docId} marked ${status}.`);
  },

  updateOnboardingStage: (onboardingId, action) => {
    const rec = get().onboardingRecords.find((r) => r.id === onboardingId);
    if (!rec) return { ok: false, message: 'Onboarding record not found.' };

    if (action === 'send_invite') {
      set((s) => ({
        onboardingRecords: s.onboardingRecords.map((r) =>
          r.id === onboardingId ? { ...r, invitationSentAt: new Date().toISOString().slice(0, 10) } : r
        ),
      }));
      get().logActivity('Sent Onboarding Invitation', 'Employee Onboarding', rec.fullName, 'Digital onboarding invitation sent.');
      return { ok: true, message: `Invitation sent to ${rec.email}.` };
    }

    if (action === 'acknowledge_policy') {
      set((s) => ({
        onboardingRecords: s.onboardingRecords.map((r) => {
          if (r.id !== onboardingId) return r;
          const completed = Array.from(new Set([...r.completedStages, 'Policy Acknowledgement' as const]));
          return { ...r, policyAcknowledged: true, completedStages: completed, currentStage: 'Account Activation' };
        }),
      }));
      get().logActivity('Recorded Policy Acknowledgement', 'Employee Onboarding', rec.fullName, 'Safety & HR policies acknowledged.');
      return { ok: true, message: 'Policy acknowledgement recorded.' };
    }

    if (action === 'submit_approval') {
      const missingReq = rec.documents.some((d) => d.requiredForCategory && d.status !== 'Verified');
      if (missingReq) {
        return { ok: false, message: 'Cannot submit for activation approval while required documents remain unverified.' };
      }
      set((s) => ({
        onboardingRecords: s.onboardingRecords.map((r) =>
          r.id === onboardingId ? { ...r, approvalStatus: 'Pending Approval' } : r
        ),
      }));
      get().logActivity('Submitted Onboarding for Approval', 'Employee Onboarding', rec.fullName, 'Submitted for HR Manager activation approval.');
      return { ok: true, message: 'Submitted for activation approval.' };
    }

    // Activate Employee
    if (!get().can('onboarding.approve')) {
      return { ok: false, message: 'Your active role does not have Onboarding Approval permission. Switch to HR Manager or HR Admin.' };
    }
    const unverifiedRequired = rec.documents.filter((d) => d.requiredForCategory && d.status !== 'Verified');
    if (unverifiedRequired.length > 0 || !rec.policyAcknowledged) {
      return {
        ok: false,
        message: 'Activation blocked: All required documents must be Verified and Policy Acknowledgement completed first.',
      };
    }

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      orgId: rec.orgId,
      employeeCode: rec.employeeCode,
      fullName: rec.fullName,
      designationId: 'des_site_eng',
      designationTitle: rec.designationTitle,
      departmentId: 'dept_eng',
      departmentName: rec.departmentName,
      employmentType: rec.employmentType,
      employmentStatus: 'Active',
      skillOrTrade: rec.designationTitle,
      projectId: rec.projectId,
      projectName: rec.projectName,
      siteName: rec.siteName,
      workLocation: rec.workLocation,
      shift: rec.shift,
      reportingManagerId: null,
      reportingManagerName: rec.reportingManagerName,
      joiningDate: rec.joiningDate,
      phone: rec.phone,
      email: rec.email,
      dateOfBirth: rec.dateOfBirth,
      currentAddress: rec.workLocation,
      permanentAddress: rec.workLocation,
      emergencyContactName: rec.emergencyContactName,
      emergencyContactPhone: rec.emergencyContactPhone,
      emergencyContactRelation: rec.emergencyContactRelation,
      profileCompletion: 95,
      isSampleDemo: true,
      history: [
        {
          id: `hist_${Date.now()}`,
          effectiveDate: rec.joiningDate,
          changeType: 'Joining',
          previousValue: 'Onboarding',
          newValue: `${rec.designationTitle} — ${rec.projectName}`,
          approvedBy: get().activeUserName,
          remarks: 'Activated via BuildFlow Onboarding Approval workflow.',
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ],
    };

    set((s) => ({
      employees: [newEmp, ...s.employees],
      onboardingRecords: s.onboardingRecords.map((r) =>
        r.id === onboardingId
          ? {
              ...r,
              approvalStatus: 'Activated',
              currentStage: 'Account Activation',
              completedStages: [
                'Employee Registration',
                'Employment Details',
                'Document Collection',
                'Document Verification',
                'Policy Acknowledgement',
                'Account Activation',
              ],
            }
          : r
      ),
    }));
    get().logActivity('Activated Employee Account', 'Employee Onboarding', `${rec.fullName} (${rec.employeeCode})`, 'Employee added to active directory and project roster.');
    return { ok: true, message: `${rec.fullName} activated and added to Employee Directory.` };
  },

  resolveAttendanceException: (exceptionId, action, remarks, correctedCheckIn, correctedCheckOut, correctedStatus) => {
    const actor = `${get().activeUserName} (${getRoleDefinition(get().activeRoleId).name})`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const statusMap: Record<typeof action, ExceptionStatus> = {
      accept_valid: 'Resolved',
      request_supervisor: 'Supervisor Verification Requested',
      request_employee: 'Employee Clarification Requested',
      approve_correction: 'Resolved',
      reject_correction: 'Rejected',
      escalate: 'Escalated to HR Manager',
    };

    const actionLabelMap: Record<typeof action, string> = {
      accept_valid: 'Accepted Valid Attendance',
      request_supervisor: 'Requested Supervisor Verification',
      request_employee: 'Requested Employee Clarification',
      approve_correction: 'Approved Audited Correction',
      reject_correction: 'Rejected Correction',
      escalate: 'Escalated to HR Manager',
    };

    const exc = get().attendanceExceptions.find((e) => e.id === exceptionId);
    if (!exc) return;

    set((s) => ({
      attendanceExceptions: s.attendanceExceptions.map((item) => {
        if (item.id !== exceptionId) return item;
        return {
          ...item,
          status: statusMap[action],
          hrRemarks: remarks || item.hrRemarks,
          auditTrail: [
            ...item.auditTrail,
            {
              id: `aud_${Date.now()}`,
              action: actionLabelMap[action],
              actor,
              timestamp: now,
              note: remarks || actionLabelMap[action],
            },
          ],
        };
      }),
      attendanceRecords: s.attendanceRecords.map((att) => {
        if (att.id !== exc.attendanceRecordId) return att;
        if (action === 'accept_valid') {
          return {
            ...att,
            status: 'Present',
            verificationStatus: 'Verified',
            lastUpdated: now,
            correctionVersions: [
              ...att.correctionVersions,
              {
                version: att.correctionVersions.length + 1,
                checkIn: att.checkIn,
                checkOut: att.checkOut,
                status: 'Present',
                updatedBy: actor,
                reason: remarks || 'Original punch verified as valid.',
                timestamp: now,
                affectsPayroll: exc.affectsWages,
              },
            ],
          };
        }
        if (action === 'approve_correction') {
          const nextIn = correctedCheckIn || att.checkIn;
          const nextOut = correctedCheckOut || att.checkOut;
          const nextStatus = correctedStatus || 'Present';
          return {
            ...att,
            checkIn: nextIn,
            checkOut: nextOut,
            workingDurationMinutes: nextIn && nextOut ? 540 : att.workingDurationMinutes,
            status: nextStatus,
            verificationStatus: 'Corrected',
            lastUpdated: now,
            correctionVersions: [
              ...att.correctionVersions,
              {
                version: att.correctionVersions.length + 1,
                checkIn: nextIn,
                checkOut: nextOut,
                status: nextStatus,
                updatedBy: actor,
                reason: remarks,
                timestamp: now,
                affectsPayroll: exc.affectsWages,
              },
            ],
          };
        }
        return att;
      }),
    }));

    get().logActivity(actionLabelMap[action], 'Attendance Exceptions', `${exc.employeeName} (${exc.date})`, remarks);
  },

  processLeaveRequest: (requestId, decision, remarks) => {
    const actor = get().activeUserName;
    const target = get().leaveRequests.find((r) => r.id === requestId);
    set((s) => ({
      leaveRequests: s.leaveRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: decision,
              approverName: actor,
              managerRemarks: remarks || r.managerRemarks,
            }
          : r
      ),
    }));
    if (target) {
      get().logActivity(`Leave ${decision}`, 'Leave Management', `${target.employeeName} (${target.leaveType})`, remarks || `Marked ${decision}.`);
    }
  },

  addLeaveRequest: (req) => {
    set((s) => ({ leaveRequests: [req, ...s.leaveRequests] }));
    get().logActivity('Submitted Leave Request', 'Leave Management', `${req.employeeName} (${req.leaveType})`, `${req.fromDate} to ${req.toDate}`);
  },

  updateLeavePolicy: (policy) => {
    set((s) => ({
      leavePolicies: s.leavePolicies.map((p) => (p.id === policy.id ? policy : p)),
    }));
    get().logActivity('Updated Leave Policy', 'Leave Management', policy.leaveType, `Effective from ${policy.effectiveFrom}. Historical leave records unchanged.`);
  },

  addEmployeeDocument: (doc) => {
    set((s) => ({ documents: [doc, ...s.documents] }));
    get().logActivity('Uploaded Private Document', 'Employee Documents', `${doc.employeeName} — ${doc.documentName}`, `Stored in ${doc.storageBucket}.`);
  },

  verifyEmployeeDocument: (docId, status, note) => {
    const actor = get().activeUserName;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              verificationStatus: status,
              verifiedBy: status === 'Verified' ? actor : d.verifiedBy,
              lastUpdated: now.slice(0, 10),
              auditHistory: [
                ...d.auditHistory,
                { timestamp: now, actor, action: `Marked ${status}`, note },
              ],
            }
          : d
      ),
    }));
    get().logActivity(`Document ${status}`, 'Employee Documents', docId, note || `Verification status set to ${status}.`);
  },

  replaceDocumentVersion: (docId, newIssueDate, newExpiryDate) => {
    const actor = get().activeUserName;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              version: d.version + 1,
              issueDate: newIssueDate,
              expiryDate: newExpiryDate,
              uploadDate: now.slice(0, 10),
              lastUpdated: now.slice(0, 10),
              verificationStatus: 'Under Review',
              auditHistory: [
                ...d.auditHistory,
                {
                  timestamp: now,
                  actor,
                  action: `Uploaded replacement v${d.version + 1}`,
                  note: `New expiry: ${newExpiryDate || 'No expiry'}`,
                },
              ],
            }
          : d
      ),
    }));
    get().logActivity('Uploaded Document Version', 'Employee Documents', docId, 'Replaced with new version pending verification.');
  },

  addContractorCompany: (company) => {
    set((s) => ({ contractors: [company, ...s.contractors] }));
    get().logActivity('Registered Contractor Company', 'Contractor Workforce', company.companyName, `Agreement ${company.agreementNumber}`);
  },

  addContractorWorker: (worker) => {
    set((s) => ({ contractorWorkers: [worker, ...s.contractorWorkers] }));
    get().logActivity('Added Contractor Worker', 'Contractor Workforce', `${worker.fullName} (${worker.contractorName})`, `Assigned to ${worker.assignedProject}.`);
  },

  completeContractorWorkerInduction: (workerId) => {
    set((s) => ({
      contractorWorkers: s.contractorWorkers.map((w) =>
        w.id === workerId
          ? {
              ...w,
              idDocumentVerified: true,
              safetyInductionCompleted: true,
              trainingStatus: 'Completed',
              workStatus: 'Site Access Active',
            }
          : w
      ),
    }));
    get().logActivity('Activated Contractor Site Access', 'Contractor Workforce', workerId, 'Verified ID & Site Safety Induction completed.');
  },

  updateComplianceRecord: (id, updates) => {
    set((s) => ({
      complianceRecords: s.complianceRecords.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              lastCompletedDate: updates.status === 'Compliant' ? new Date().toISOString().slice(0, 10) : c.lastCompletedDate,
            }
          : c
      ),
    }));
    get().logActivity('Updated Compliance Item', 'Compliance Centre', id, `Status: ${updates.status || 'Updated'}`);
  },

  addComplianceRule: (rule) => {
    set((s) => ({ complianceRules: [rule, ...s.complianceRules] }));
    get().logActivity('Added Configurable Compliance Rule', 'Compliance Centre', `${rule.jurisdiction} — ${rule.requirement}`, rule.sourceReference);
  },

  assignTraining: (record) => {
    set((s) => ({ trainingRecords: [record, ...s.trainingRecords] }));
    get().logActivity('Assigned Safety Training', 'Training & Certifications', `${record.employeeName} — ${record.trainingName}`, 'Status initialized as Assigned (Not Trained).');
  },

  updateTrainingVerification: (id, status, certificateFile) => {
    const today = new Date().toISOString().slice(0, 10);
    set((s) => ({
      trainingRecords: s.trainingRecords.map((t) =>
        t.id === id
          ? {
              ...t,
              verificationStatus: status,
              completionDate: status === 'Verified' || status === 'Certificate Uploaded' ? t.completionDate || today : t.completionDate,
              certificateFile: certificateFile || t.certificateFile,
            }
          : t
      ),
    }));
    get().logActivity('Updated Training Status', 'Training & Certifications', id, `Training status updated to ${status}.`);
  },

  createHRRequest: (req) => {
    set((s) => ({ hrRequests: [req, ...s.hrRequests] }));
    get().logActivity('Created HR Request', 'HR Requests', `${req.requestCode} — ${req.employeeName}`, req.subject);
  },

  updateHRRequest: (id, updates, newMessage) => {
    const actor = `${get().activeUserName} (${getRoleDefinition(get().activeRoleId).name})`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    set((s) => ({
      hrRequests: s.hrRequests.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          ...updates,
          lastUpdated: now,
          messages: newMessage
            ? [
                ...r.messages,
                {
                  id: `msg_${Date.now()}`,
                  sender: actor,
                  isInternalNote: newMessage.isInternalNote,
                  timestamp: now,
                  body: newMessage.body,
                },
              ]
            : r.messages,
        };
      }),
    }));
    get().logActivity('Updated HR Request', 'HR Requests', id, updates.status ? `Status changed to ${updates.status}` : 'Added response/note.');
  },

  addDepartment: (dept) => {
    set((s) => ({ departments: [...s.departments, dept] }));
    get().logActivity('Created Department', 'Departments & Designations', dept.name, `Code ${dept.code}`);
  },

  addDesignation: (des) => {
    set((s) => ({ designations: [...s.designations, des] }));
    get().logActivity('Created Designation', 'Departments & Designations', des.title, des.tradeCategory);
  },

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  updateSettings: (partial) => {
    set((s) => ({ settings: { ...s.settings, ...partial } }));
    get().logActivity('Updated HR Configuration', 'HR Settings', 'Tenant Policy Settings', Object.keys(partial).join(', '));
  },
}));
