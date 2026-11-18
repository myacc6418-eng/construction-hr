import React, { useState } from 'react';
import { Building2, Plus, ShieldAlert, Users } from 'lucide-react';
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
import { Designation } from '@/src/types/hr';
import { toast } from 'sonner';

export const DepartmentsDesignationsPage: React.FC = () => {
  const { departments, designations, getScopedEmployees, addDepartment, addDesignation, can } = useHRStore();
  const employees = getScopedEmployees();

  const [tab, setTab] = useState<'departments' | 'designations'>('departments');
  const [deptOpen, setDeptOpen] = useState(false);
  const [desOpen, setDesOpen] = useState(false);

  // New Dept state
  const [dName, setDName] = useState('');
  const [dCode, setDCode] = useState('');
  const [dCostCenter, setDCostCenter] = useState('CC-108');
  const [dDesc, setDDesc] = useState('');

  // New Designation state
  const [tTitle, setTTitle] = useState('');
  const [tDeptId, setTDeptId] = useState(departments[0]?.id ?? '');
  const [tTrade, setTTrade] = useState<Designation['tradeCategory']>('Skilled Trade');
  const [tJobDesc, setTJobDesc] = useState('');

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    addDepartment({
      id: `dept_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      name: dName,
      code: dCode.toUpperCase(),
      headEmployeeId: null,
      description: dDesc,
      costCenter: dCostCenter,
    });
    setDeptOpen(false);
    setDName('');
    setDCode('');
    setDDesc('');
    toast.success(`Department "${dName}" created.`);
  };

  const handleAddDesig = (e: React.FormEvent) => {
    e.preventDefault();
    addDesignation({
      id: `des_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      title: tTitle,
      departmentId: tDeptId,
      tradeCategory: tTrade,
      jobDescription: tJobDesc,
      noticeOfRoleSeparation: 'Job title only. System access requires explicit RBAC role assignment.',
    });
    setDesOpen(false);
    setTTitle('');
    setTJobDesc('');
    toast.success(`Designation "${tTitle}" created (without automatic system permissions).`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Departments & Designations</h2>
          <p className="text-xs text-[#64748B]">
            Organisational structure, department heads, trade classifications, and job descriptions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-md">
            <button
              onClick={() => setTab('departments')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                tab === 'departments' ? 'bg-[#101F35] text-white' : 'text-[#64748B]'
              }`}
            >
              Departments ({departments.length})
            </button>
            <button
              onClick={() => setTab('designations')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                tab === 'designations' ? 'bg-[#101F35] text-white' : 'text-[#64748B]'
              }`}
            >
              Designations ({designations.length})
            </button>
          </div>
          {can('settings.manage') && (
            <Button size="sm" onClick={() => (tab === 'departments' ? setDeptOpen(true) : setDesOpen(true))}>
              <Plus className="w-3.5 h-3.5" />
              <span>{tab === 'departments' ? 'Create Department' : 'Create Designation'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Explicit Separation Notice */}
      <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs">
        <ShieldAlert className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#172B4D]">Designation Is Not a System Role:</strong>{' '}
          <span className="text-[#64748B]">
            Assigning a job title such as "Site Engineer" or "Project Manager" never automatically grants dashboard or administrative permissions. System access is controlled exclusively through Role-Based Access Control (RBAC) in HR Settings.
          </span>
        </div>
      </div>

      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const head = employees.find((e) => e.id === dept.headEmployeeId);
            const count = employees.filter((e) => e.departmentName === dept.name).length;
            return (
              <Card key={dept.id} className="p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {dept.code} · {dept.costCenter}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#2563EB] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {count}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#172B4D] mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#2563EB]" />
                    <span>{dept.name}</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">{dept.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                  <span className="text-[#64748B]">Department Head</span>
                  <span className="font-medium text-[#172B4D]">{head ? head.fullName : 'Unassigned'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'designations' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">Designation Title</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Trade Category</th>
                  <th className="py-2.5 px-4">Job Description</th>
                  <th className="py-2.5 px-4">Assigned Staff</th>
                  <th className="py-2.5 px-4">Access Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {designations.map((des) => {
                  const dept = departments.find((d) => d.id === des.departmentId);
                  const count = employees.filter((e) => e.designationTitle === des.title).length;
                  return (
                    <tr key={des.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-[#172B4D]">{des.title}</td>
                      <td className="py-2.5 px-4">{dept?.name || 'General'}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge label={des.tradeCategory} tone="info" showIcon={false} />
                      </td>
                      <td className="py-2.5 px-4 max-w-xs text-[#64748B]">{des.jobDescription}</td>
                      <td className="py-2.5 px-4 font-mono tabular-nums font-semibold">{count}</td>
                      <td className="py-2.5 px-4 text-[11px] text-[#64748B]">{des.noticeOfRoleSeparation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Department Modal */}
      <Modal open={deptOpen} onClose={() => setDeptOpen(false)} title="Create Department">
        <form onSubmit={handleAddDept} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Department Name *</label>
              <Input value={dName} onChange={(e) => setDName(e.target.value)} required placeholder="e.g., Procurement" />
            </div>
            <div>
              <label className="block font-medium mb-1">Code *</label>
              <Input value={dCode} onChange={(e) => setDCode(e.target.value)} required placeholder="e.g., PRC" />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Cost Center</label>
            <Input value={dCostCenter} onChange={(e) => setDCostCenter(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <Textarea rows={2} value={dDesc} onChange={(e) => setDDesc(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeptOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Department</Button>
          </div>
        </form>
      </Modal>

      {/* Create Designation Modal */}
      <Modal open={desOpen} onClose={() => setDesOpen(false)} title="Create Designation">
        <form onSubmit={handleAddDesig} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium mb-1">Designation Title *</label>
            <Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} required placeholder="e.g., Foreman" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Department</label>
              <Select className="w-full" value={tDeptId} onChange={(e) => setTDeptId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Trade Category</label>
              <Select
                className="w-full"
                value={tTrade}
                onChange={(e) => setTTrade(e.target.value as Designation['tradeCategory'])}
              >
                <option value="Staff & Engineering">Staff & Engineering</option>
                <option value="Supervisory">Supervisory</option>
                <option value="Skilled Trade">Skilled Trade</option>
                <option value="Unskilled Labour">Unskilled Labour</option>
                <option value="Corporate">Corporate</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Job Description *</label>
            <Textarea rows={2} value={tJobDesc} onChange={(e) => setTJobDesc(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDesOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Designation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
