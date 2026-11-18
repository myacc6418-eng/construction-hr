export type CompanySizeProfile = 'small' | 'medium' | 'enterprise';

export type HRRoleId =
  | 'hr_admin'
  | 'hr_manager'
  | 'hr_executive'
  | 'attendance_officer'
  | 'compliance_officer'
  | 'onboarding_officer'
  | 'site_manager';

export type PermissionKey =
  | 'employees.view'
  | 'employees.edit'
  | 'employees.sensitive_view'
  | 'employees.salary_view'
  | 'employees.medical_view'
  | 'employees.exit'
  | 'onboarding.manage'
  | 'onboarding.approve'
  | 'employment.records_manage'
  | 'attendance.view'
  | 'attendance.exceptions_investigate'
  | 'attendance.exceptions_approve'
  | 'leave.view'
  | 'leave.approve'
  | 'leave.policy_edit'
  | 'documents.view'
  | 'documents.verify'
  | 'documents.download_signed'
  | 'contractors.manage'
  | 'compliance.manage'
  | 'compliance.rules_edit'
  | 'training.manage'
  | 'requests.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.manage';

export interface HRRoleDefinition {
  id: HRRoleId;
  name: string;
  description: string;
  permissions: PermissionKey[];
  siteScopeRestricted?: boolean;
  assignedSites?: string[];
}

export type EmploymentType =
  | 'Permanent'
  | 'Contractual'
  | 'Temporary'
  | 'Daily Wage'
  | 'Hourly'
  | 'Weekly Wage'
  | 'Piece Rate'
  | 'Project Based'
  | 'Intern / Trainee'
  | 'Contractor Personnel';

export type EmploymentStatus =
  | 'Draft'
  | 'Onboarding'
  | 'Active'
  | 'Probation'
  | 'Confirmed'
  | 'On Leave'
  | 'Notice Period'
  | 'Suspended'
  | 'Inactive'
  | 'Exited'
  | 'Terminated';

export interface ProjectSite {
  id: string;
  orgId: string;
  projectName: string;
  siteName: string;
  state: string;
  city: string;
  projectCode: string;
  status: 'Active' | 'Mobilising' | 'Near Handover';
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  code: string;
  headEmployeeId: string | null;
  description: string;
  costCenter: string;
}

export interface Designation {
  id: string;
  orgId: string;
  title: string;
  departmentId: string;
  tradeCategory: 'Staff & Engineering' | 'Supervisory' | 'Skilled Trade' | 'Unskilled Labour' | 'Corporate';
  jobDescription: string;
  noticeOfRoleSeparation: string;
}

export interface EmploymentHistoryEntry {
  id: string;
  effectiveDate: string;
  changeType:
    | 'Joining'
    | 'Confirmation'
    | 'Probation Extension'
    | 'Contract Renewal'
    | 'Designation Change'
    | 'Department Transfer'
    | 'Project & Site Transfer'
    | 'Manager Change'
    | 'Status Change'
    | 'Resignation'
    | 'Exit Clearance'
    | 'Termination';
  previousValue: string;
  newValue: string;
  approvedBy: string;
  remarks: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  orgId: string;
  employeeCode: string;
  fullName: string;
  avatarUrl?: string;
  designationId: string;
  designationTitle: string;
  departmentId: string;
  departmentName: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  skillOrTrade: string;
  projectId: string;
  projectName: string;
  siteName: string;
  workLocation: string;
  shift: 'Day Shift (08:00 - 17:00)' | 'General Shift (09:30 - 18:30)' | 'Night Shift (20:00 - 05:00)' | 'Rotational Shift';
  reportingManagerId: string | null;
  reportingManagerName: string;
  joiningDate: string;
  probationEndDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender?: 'Male' | 'Female' | 'Prefer not to say';
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  profileCompletion: number;
  // Restricted financial data — gated by employees.salary_view permission
  monthlyCtcInr?: number;
  dailyWageInr?: number;
  wageStructureNote?: string;
  history: EmploymentHistoryEntry[];
  isSampleDemo: boolean;
}

export type OnboardingStage =
  | 'Employee Registration'
  | 'Employment Details'
  | 'Document Collection'
  | 'Document Verification'
  | 'Policy Acknowledgement'
  | 'Account Activation';

export type DocVerificationStatus =
  | 'Not Uploaded'
  | 'Uploaded'
  | 'Under Review'
  | 'Verified'
  | 'Rejected'
  | 'Resubmission Required'
  | 'Expired';

export interface OnboardingDocumentItem {
  id: string;
  name: string;
  requiredForCategory: boolean;
  status: DocVerificationStatus;
  uploadedDate?: string;
  verifiedBy?: string;
  verificationDate?: string;
  rejectionReason?: string;
  fileName?: string;
}

export interface OnboardingRecord {
  id: string;
  orgId: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  designationTitle: string;
  departmentName: string;
  employmentType: EmploymentType;
  joiningDate: string;
  reportingManagerName: string;
  branch: string;
  workLocation: string;
  projectId: string;
  projectName: string;
  siteName: string;
  shift: Employee['shift'];
  invitationSentAt?: string;
  currentStage: OnboardingStage;
  completedStages: OnboardingStage[];
  policyAcknowledged: boolean;
  approvalStatus: 'Draft' | 'Pending Approval' | 'Approved' | 'Activated';
  dueDate: string;
  isOverdue: boolean;
  documents: OnboardingDocumentItem[];
  assignedOfficer: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half Day'
  | 'On Leave'
  | 'Weekly Off'
  | 'Holiday'
  | 'Missing Check-Out'
  | 'Pending Verification'
  | 'Exception';

export interface AttendanceCorrectionVersion {
  version: number;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  updatedBy: string;
  reason: string;
  timestamp: string;
  affectsPayroll: boolean;
}

export interface AttendanceRecord {
  id: string;
  orgId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  employmentType: EmploymentType;
  projectName: string;
  siteName: string;
  date: string;
  shift: string;
  checkIn?: string;
  checkOut?: string;
  workingDurationMinutes: number;
  status: AttendanceStatus;
  verificationStatus: 'Verified' | 'Pending Supervisor' | 'Pending HR' | 'Flagged' | 'Corrected';
  geofenceResult: 'Inside Geofence' | 'Outside Geofence (185m)' | 'GPS Unavailable' | 'Poor GPS Accuracy (95m)';
  gpsCoordinates?: string;
  selfieStatus: 'Captured & Matched' | 'Missing' | 'Verification Pending' | 'Not Required';
  selfieUrl?: string;
  supervisorName: string;
  supervisorRemarks?: string;
  lastUpdated: string;
  correctionVersions: AttendanceCorrectionVersion[];
}

export type ExceptionCategory =
  | 'Missing Check-In'
  | 'Missing Check-Out'
  | 'Duplicate Check-In'
  | 'Outside Geofence'
  | 'GPS Unavailable'
  | 'Poor GPS Accuracy'
  | 'Selfie Missing'
  | 'Selfie Verification Pending'
  | 'Late Arrival'
  | 'Early Departure'
  | 'Excessive Working Duration'
  | 'Offline Attendance Pending Sync'
  | 'Supervisor Verification Pending'
  | 'Conflicting Attendance Records';

export type ExceptionStatus =
  | 'Pending Review'
  | 'Supervisor Verification Requested'
  | 'Employee Clarification Requested'
  | 'Escalated to HR Manager'
  | 'Resolved'
  | 'Rejected';

export interface AttendanceException {
  id: string;
  orgId: string;
  attendanceRecordId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  projectName: string;
  siteName: string;
  date: string;
  shift: string;
  category: ExceptionCategory;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  originalEventSummary: string;
  recordedTimestamp: string;
  deviceContext: string;
  supportingEvidence: string;
  supervisorRemarks: string;
  hrRemarks: string;
  status: ExceptionStatus;
  affectsWages: boolean;
  auditTrail: Array<{
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    note: string;
  }>;
}

export type LeaveTypeName =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Earned Leave'
  | 'Annual Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Compensatory Off'
  | 'Unpaid Leave'
  | 'Special Leave';

export interface LeavePolicy {
  id: string;
  orgId: string;
  leaveType: LeaveTypeName;
  eligibleTypes: EmploymentType[];
  annualEntitlementDays: number;
  accrualRule: string;
  carryForwardMaxDays: number;
  maxConsecutiveDays: number;
  requiresDocumentAfterDays: number;
  approvalHierarchy: string;
  effectiveFrom: string;
}

export interface LeaveRequest {
  id: string;
  orgId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  projectName: string;
  siteName: string;
  leaveType: LeaveTypeName;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string;
  supportingDocument?: string;
  status: 'Pending' | 'Clarification Requested' | 'Forwarded to HR Manager' | 'Approved' | 'Rejected';
  approverName: string;
  managerRemarks?: string;
  availableBalanceBefore?: number;
  submittedAt: string;
  overlapWarning?: string;
}

export type DocumentCategory =
  | 'Identity Documents'
  | 'Address Proof'
  | 'Employment Agreements'
  | 'Appointment Letters'
  | 'Qualification Certificates'
  | 'Training Certificates'
  | 'Safety Certificates'
  | 'Medical Fitness Documents'
  | 'Experience Letters'
  | 'Resignation Letters'
  | 'Exit Documents'
  | 'Other HR Documents';

export interface EmployeeDocument {
  id: string;
  orgId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  documentName: string;
  category: DocumentCategory;
  version: number;
  issueDate: string;
  expiryDate?: string;
  uploadDate: string;
  verificationStatus: DocVerificationStatus;
  verifiedBy?: string;
  lastUpdated: string;
  isSensitiveMedical?: boolean;
  storageBucket: string;
  objectKey: string;
  auditHistory: Array<{
    timestamp: string;
    actor: string;
    action: string;
    note?: string;
  }>;
}

export interface ContractorCompany {
  id: string;
  orgId: string;
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  agreementNumber: string;
  agreementStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'Under Renewal';
  agreementStartDate: string;
  agreementEndDate: string;
  assignedProjects: string[];
  assignedSites: string[];
  complianceStatus: 'Compliant' | 'Gaps Identified' | 'Non-Compliant';
  isActive: boolean;
  documents: Array<{
    id: string;
    name: string;
    status: 'Verified' | 'Expiring Soon' | 'Expired' | 'Missing';
    expiryDate?: string;
  }>;
}

export interface ContractorWorker {
  id: string;
  orgId: string;
  workerCode: string;
  fullName: string;
  contractorId: string;
  contractorName: string;
  trade: string;
  engagementType: 'Contractor Personnel' | 'Daily Rate Sub-Contractor';
  assignedProject: string;
  assignedSite: string;
  supervisorName: string;
  joiningDate: string;
  idDocumentVerified: boolean;
  safetyInductionCompleted: boolean;
  trainingStatus: 'Completed' | 'Pending Induction' | 'Expired';
  workStatus: 'Site Access Active' | 'Pending Induction' | 'Suspended';
}

export type ComplianceCategory =
  | 'Employee Compliance'
  | 'Contractor Compliance'
  | 'Social Security & Statutory'
  | 'Construction & Site Compliance'
  | 'Company & Establishment Records';

export type ComplianceStatus =
  | 'Not Applicable'
  | 'Not Started'
  | 'In Progress'
  | 'Pending Review'
  | 'Compliant'
  | 'Expiring Soon'
  | 'Overdue'
  | 'Non-Compliant';

export interface ComplianceRecord {
  id: string;
  orgId: string;
  complianceCode: string;
  requirementName: string;
  category: ComplianceCategory;
  applicableEstablishment: string;
  jurisdiction: string;
  responsiblePerson: string;
  requiredDocument: string;
  applicablePeriod: string;
  dueDate: string;
  lastCompletedDate?: string;
  nextReviewDate: string;
  status: ComplianceStatus;
  supportingEvidence?: string;
  reviewer: string;
  remarks: string;
}

export interface ConfigurableComplianceRule {
  id: string;
  jurisdiction: string;
  requirement: string;
  category: ComplianceCategory;
  applicabilityConditions: string;
  effectiveDate: string;
  expiryDate?: string;
  sourceReference: string;
  lastVerifiedDate: string;
  responsibleReviewer: string;
}

export interface TrainingRecord {
  id: string;
  orgId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  projectName: string;
  siteName: string;
  trainingName: string;
  provider: string;
  assignedDate: string;
  completionDate?: string;
  expiryDate?: string;
  certificateFile?: string;
  verificationStatus: 'Assigned (Not Trained)' | 'Certificate Uploaded' | 'Verified' | 'Expired' | 'Rejected';
  isMandatoryInduction: boolean;
}

export interface HRRequest {
  id: string;
  orgId: string;
  requestCode: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  category:
    | 'Personal Information Update'
    | 'Address Change'
    | 'Document Update'
    | 'Employment Letter'
    | 'Experience Certificate'
    | 'Leave Clarification'
    | 'Attendance Correction Request'
    | 'Resignation'
    | 'General HR Query'
    | 'Other';
  submissionDate: string;
  assignedHRUser: string;
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  status:
    | 'Submitted'
    | 'Under Review'
    | 'Assigned'
    | 'Awaiting Employee'
    | 'Approved'
    | 'Rejected'
    | 'Resolved'
    | 'Closed';
  lastUpdated: string;
  subject: string;
  messages: Array<{
    id: string;
    sender: string;
    isInternalNote: boolean;
    timestamp: string;
    body: string;
  }>;
}

export interface HRNotification {
  id: string;
  orgId: string;
  category: 'Onboarding' | 'Attendance' | 'Leave' | 'Documents' | 'Compliance' | 'Contractors' | 'Lifecycle';
  priority: 'Critical' | 'High' | 'Normal';
  title: string;
  description: string;
  relatedRecordLabel: string;
  targetRoute: string;
  timestamp: string;
  isRead: boolean;
}

export interface ActivityLogEntry {
  id: string;
  orgId: string;
  actor: string;
  actorRole: string;
  action: string;
  module: string;
  targetEntity: string;
  timestamp: string;
  details: string;
}

export interface HRSettingsState {
  companyName: string;
  companySizeProfile: CompanySizeProfile;
  employeeIdPrefix: string;
  employeeIdFormat: string;
  gracePeriodMinutes: number;
  halfDayThresholdHours: number;
  docExpiryReminderDays: number[];
  notifyEmailDigest: boolean;
  notifyCriticalExceptions: boolean;
  notifyDocumentExpiry: boolean;
  notifyComplianceDeadlines: boolean;
  applicableJurisdictions: string[];
}
