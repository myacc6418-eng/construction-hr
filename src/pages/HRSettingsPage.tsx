import React, { useState } from 'react';
import { Lock, Save, Settings, ShieldCheck } from 'lucide-react';
import {
  AccessRestrictedBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  StatusBadge,
} from '@/src/components/ui/Primitives';
import { HR_ROLES } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';
import { CompanySizeProfile, HRRoleId } from '@/src/types/hr';
import { toast } from 'sonner';

export const HRSettingsPage: React.FC = () => {
  const { settings, updateSettings, activeRoleId, setActiveRole, setCompanySizeProfile, can } = useHRStore();

  const [tab, setTab] = useState<'general' | 'attendance' | 'compliance' | 'rbac'>('general');
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [idPrefix, setIdPrefix] = useState(settings.employeeIdPrefix);
  const [graceMins, setGraceMins] = useState(settings.gracePeriodMinutes);
  const [halfDayHours, setHalfDayHours] = useState(settings.halfDayThresholdHours);
  const [jurisdictions, setJurisdictions] = useState(settings.applicableJurisdictions.join(', '));

  if (!can('settings.manage') && tab !== 'rbac') {
    return (
      <div className="space-y-4">
        <AccessRestrictedBanner
          title="HR Settings Restricted"
          message="Only HR Administrator or HR Manager roles can edit company-wide HR policies. You can still inspect the RBAC Role Matrix below or switch active demo role."
        />
        <Button size="sm" variant="outline" onClick={() => setTab('rbac')}>
          View RBAC Role Matrix
        </Button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      employeeIdPrefix: idPrefix,
      gracePeriodMinutes: Number(graceMins),
      halfDayThresholdHours: Number(halfDayHours),
      applicableJurisdictions: jurisdictions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    toast.success('HR configuration saved and logged.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">HR Settings & Access Control</h2>
          <p className="text-xs text-[#64748B]">
            Configurable workforce formats, shared attendance rules, compliance reminders, and least-privilege RBAC roles
          </p>
        </div>
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-md overflow-x-auto">
          {(
            [
              ['general', 'Employee & Org'],
              ['attendance', 'Attendance & Leave'],
              ['compliance', 'Compliance Rules'],
              ['rbac', 'Roles & Permissions'],
            ] as const
          ).map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap cursor-pointer ${
                tab === k ? 'bg-[#101F35] text-white' : 'text-[#64748B]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'rbac' && (
        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-[#172B4D]">
                  {tab === 'general'
                    ? 'Company Size Profile & Employee ID Configuration'
                    : tab === 'attendance'
                    ? 'Shared Attendance & Grace Period Rules'
                    : 'Compliance Jurisdictions & Expiry Thresholds'}
                </h3>
              </div>
              <Button type="submit" size="sm">
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {tab === 'general' && (
                <>
                  <div>
                    <label className="block font-medium mb-1">Tenant Organization Name</label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Company Operating Size Mode</label>
                    <Select
                      className="w-full"
                      value={settings.companySizeProfile}
                      onChange={(e) => setCompanySizeProfile(e.target.value as CompanySizeProfile)}
                    >
                      <option value="small">Small Company (Single HR Admin handling all workflows)</option>
                      <option value="medium">Medium Company (Separate HR, Recruitment & Payroll)</option>
                      <option value="enterprise">Large Enterprise (HR Managers, Compliance & Regional HR)</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Employee ID Prefix</label>
                    <Input value={idPrefix} onChange={(e) => setIdPrefix(e.target.value)} className="font-mono" />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Supported Employment Categories</label>
                    <div className="p-2.5 rounded border border-slate-200 bg-slate-50 text-[#64748B]">
                      Permanent, Contractual, Temporary, Daily Wage, Hourly, Weekly Wage, Piece Rate, Project Based, Intern/Trainee
                    </div>
                  </div>
                </>
              )}

              {tab === 'attendance' && (
                <>
                  <div>
                    <label className="block font-medium mb-1">Check-In Grace Period (Minutes)</label>
                    <Input type="number" value={graceMins} onChange={(e) => setGraceMins(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Half-Day Minimum Hours Threshold</label>
                    <Input type="number" value={halfDayHours} onChange={(e) => setHalfDayHours(Number(e.target.value))} />
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-[#172B4D]">
                    Attendance settings sync directly with the shared BuildFlow attendance engine and weekly off / holiday calendar.
                  </div>
                </>
              )}

              {tab === 'compliance' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block font-medium mb-1">Active Compliance Jurisdictions (Comma-separated)</label>
                    <Input value={jurisdictions} onChange={(e) => setJurisdictions(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium mb-1">Document Expiry Reminder Thresholds</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {settings.docExpiryReminderDays.map((d) => (
                        <StatusBadge key={d} label={`${d} Days Before Expiry`} tone="info" />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      )}

      {tab === 'rbac' && (
        <div className="space-y-4">
          <Card className="p-4 border-amber-200 bg-amber-50/60 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#172B4D]">Least-Privilege & Finance Isolation Guardrails:</strong>{' '}
              <span className="text-[#64748B]">
                HR roles do not automatically receive unrestricted Finance access. Salary details and Medical Fitness documents require explicit permissions. Site Managers are strictly scoped to their assigned project site.
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HR_ROLES.map((role) => {
              const isCurrent = role.id === activeRoleId;
              return (
                <Card key={role.id} className={`p-4 flex flex-col justify-between gap-3 ${isCurrent ? 'border-[#2563EB]' : ''}`}>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[#172B4D] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                        <span>{role.name}</span>
                      </div>
                      {isCurrent && <StatusBadge label="Active Demo Role" tone="info" />}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">{role.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.permissions.slice(0, 8).map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#172B4D] border border-slate-200"
                        >
                          {p}
                        </span>
                      ))}
                      {role.permissions.length > 8 && (
                        <span className="text-[10px] font-mono text-[#64748B] py-0.5">
                          +{role.permissions.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Button
                      size="sm"
                      variant={isCurrent ? 'secondary' : 'outline'}
                      disabled={isCurrent}
                      onClick={() => {
                        setActiveRole(role.id as HRRoleId);
                        toast.success(`Switched active demo persona to ${role.name}.`);
                      }}
                    >
                      {isCurrent ? 'Currently Active' : 'Switch to Role'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
