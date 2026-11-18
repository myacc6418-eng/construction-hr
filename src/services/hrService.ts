import { HRRoleDefinition, HRRoleId, PermissionKey } from '@/src/types/hr';

/**
 * Supabase-Ready Service & RBAC Blueprint
 * ---------------------------------------
 * Designed for drop-in replacement with Supabase Auth, PostgreSQL + RLS,
 * Realtime subscriptions, Edge Functions, and private signed URLs via R2/Supabase Storage.
 * Zero secrets are stored on the client.
 */

export const SUPABASE_TABLE_MAP = {
  organizations: 'organizations',
  memberships: 'organization_memberships',
  employees: 'employees',
  employmentHistory: 'employment_history',
  departments: 'departments',
  designations: 'designations',
  onboarding: 'employee_onboarding',
  attendanceRecords: 'attendance_records', // Shared BuildFlow attendance table (read + audited correction view)
  attendanceExceptions: 'attendance_exceptions',
  leaveTypes: 'leave_types',
  leavePolicies: 'leave_policies',
  leaveRequests: 'leave_requests',
  employeeDocuments: 'employee_documents',
  contractorCompanies: 'contractor_companies',
  contractorWorkers: 'contractor_workers',
  complianceRecords: 'compliance_records',
  complianceRules: 'compliance_jurisdiction_rules',
  trainingRecords: 'training_certifications',
  hrRequests: 'hr_requests',
  notifications: 'hr_notifications',
  activityLogs: 'audit_activity_logs',
} as const;

export const HR_ROLES: HRRoleDefinition[] = [
  {
    id: 'hr_admin',
    name: 'HR Administrator',
    description: 'Full operational HR access for small/medium teams. Excludes unrestricted Finance access; includes salary visibility only when explicitly enabled.',
    permissions: [
      'employees.view',
      'employees.edit',
      'employees.sensitive_view',
      'employees.salary_view',
      'employees.exit',
      'onboarding.manage',
      'onboarding.approve',
      'employment.records_manage',
      'attendance.view',
      'attendance.exceptions_investigate',
      'attendance.exceptions_approve',
      'leave.view',
      'leave.approve',
      'leave.policy_edit',
      'documents.view',
      'documents.verify',
      'documents.download_signed',
      'contractors.manage',
      'compliance.manage',
      'training.manage',
      'requests.manage',
      'reports.view',
      'reports.export',
      'settings.manage',
    ],
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Approves escalations, policy updates, exits, medical document access, and compliance sign-offs across all projects.',
    permissions: [
      'employees.view',
      'employees.edit',
      'employees.sensitive_view',
      'employees.salary_view',
      'employees.medical_view',
      'employees.exit',
      'onboarding.manage',
      'onboarding.approve',
      'employment.records_manage',
      'attendance.view',
      'attendance.exceptions_investigate',
      'attendance.exceptions_approve',
      'leave.view',
      'leave.approve',
      'leave.policy_edit',
      'documents.view',
      'documents.verify',
      'documents.download_signed',
      'contractors.manage',
      'compliance.manage',
      'compliance.rules_edit',
      'training.manage',
      'requests.manage',
      'reports.view',
      'reports.export',
      'settings.manage',
    ],
  },
  {
    id: 'hr_executive',
    name: 'HR Executive',
    description: 'Day-to-day workforce operations, onboarding coordination, and HR request triage. Restricted from salary/CTC and medical records by default.',
    permissions: [
      'employees.view',
      'employees.edit',
      'onboarding.manage',
      'employment.records_manage',
      'attendance.view',
      'attendance.exceptions_investigate',
      'leave.view',
      'documents.view',
      'documents.verify',
      'contractors.manage',
      'training.manage',
      'requests.manage',
      'reports.view',
    ],
  },
  {
    id: 'attendance_officer',
    name: 'Attendance Officer',
    description: 'Investigates geofence, selfie, and missing punch exceptions and coordinates supervisor verification.',
    permissions: [
      'employees.view',
      'attendance.view',
      'attendance.exceptions_investigate',
      'attendance.exceptions_approve',
      'leave.view',
      'reports.view',
      'reports.export',
    ],
  },
  {
    id: 'compliance_officer',
    name: 'Compliance Officer',
    description: 'Manages statutory registers, contractor licences, site safety certifications, and configurable jurisdiction rules.',
    permissions: [
      'employees.view',
      'documents.view',
      'documents.verify',
      'documents.download_signed',
      'contractors.manage',
      'compliance.manage',
      'compliance.rules_edit',
      'training.manage',
      'reports.view',
      'reports.export',
    ],
  },
  {
    id: 'onboarding_officer',
    name: 'Recruitment / Onboarding Officer',
    description: 'Registers new hires, collects KYC & agreements, tracks verification stages before activation.',
    permissions: [
      'employees.view',
      'onboarding.manage',
      'documents.view',
      'documents.verify',
      'training.manage',
    ],
  },
  {
    id: 'site_manager',
    name: 'Site Manager (Scoped)',
    description: 'Restricted to operational workforce data for assigned site only (Bengaluru Residential Complex). No access to private HR notes, medical docs, or salary.',
    siteScopeRestricted: true,
    assignedSites: ['Bengaluru Residential Complex'],
    permissions: [
      'employees.view',
      'attendance.view',
      'attendance.exceptions_investigate',
      'leave.view',
      'leave.approve',
      'contractors.manage',
      'training.manage',
    ],
  },
];

export function getRoleDefinition(roleId: HRRoleId): HRRoleDefinition {
  return HR_ROLES.find((r) => r.id === roleId) ?? HR_ROLES[0];
}

export function hasPermission(roleId: HRRoleId, permission: PermissionKey): boolean {
  const role = getRoleDefinition(roleId);
  return role.permissions.includes(permission);
}

/**
 * Simulates generating a short-lived signed download URL from private R2/Supabase Storage.
 * Never exposes public bucket URLs.
 */
export function generateSimulatedSignedUrl(bucket: string, objectKey: string): {
  signedUrl: string;
  expiresAtIso: string;
} {
  const expiresAt = new Date(Date.now() + 120 * 1000); // 120-second short-lived token
  const token = btoa(`${bucket}:${objectKey}:${expiresAt.getTime()}`).slice(0, 28);
  return {
    signedUrl: `https://private-storage.buildflow.local/v1/object/sign/${bucket}/${objectKey}?token=${token}&exp=${Math.floor(expiresAt.getTime() / 1000)}`,
    expiresAtIso: expiresAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Generates clean CSV download for reports and directory exports.
 */
export function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<string | number | boolean | undefined>>): void {
  const escapeCell = (val: string | number | boolean | undefined) => {
    const str = val === undefined || val === null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
