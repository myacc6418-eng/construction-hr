import React, { useMemo, useState } from 'react';
import { AlertTriangle, Award, CheckCircle2, Plus, Upload } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Modal,
  Select,
  StatusBadge,
} from '@/src/components/ui/Primitives';
import { DEMO_ORG_ID } from '@/src/data/demoData';
import { useHRStore } from '@/src/store/useHRStore';
import { toast } from 'sonner';

const CONSTRUCTION_COURSES = [
  'Site Safety Induction',
  'PPE Training',
  'Working at Height',
  'Electrical Safety & LOTO Protocol',
  'Fire Safety & Emergency Warden',
  'First Aid',
  'Equipment Operation',
  'Confined Space Safety',
  'Quality Procedures',
];

export const TrainingCertificationsPage: React.FC = () => {
  const { trainingRecords, getScopedEmployees, assignTraining, updateTrainingVerification, can } = useHRStore();
  const employees = getScopedEmployees();

  const [assignOpen, setAssignOpen] = useState(false);
  const [empId, setEmpId] = useState(employees[0]?.id ?? '');
  const [courseName, setCourseName] = useState(CONSTRUCTION_COURSES[0]);
  const [provider, setProvider] = useState('BuildFlow EHS Academy');
  const [isMandatory, setIsMandatory] = useState(true);

  const missingInduction = useMemo(
    () => trainingRecords.filter((t) => t.isMandatoryInduction && t.verificationStatus === 'Assigned (Not Trained)'),
    [trainingRecords]
  );

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === empId);
    if (!emp) return;
    assignTraining({
      id: `trn_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      projectName: emp.projectName,
      siteName: emp.siteName,
      trainingName: courseName,
      provider,
      assignedDate: '2026-11-18',
      verificationStatus: 'Assigned (Not Trained)',
      isMandatoryInduction: isMandatory,
    });
    setAssignOpen(false);
    toast.success(`Assigned "${courseName}" to ${emp.fullName}. Status remains Not Trained until certificate verification.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Training & Certifications</h2>
          <p className="text-xs text-[#64748B]">
            Site safety induction, trade certifications, and expiry tracking · Assignment does not mark workers as trained
          </p>
        </div>
        {can('training.manage') && (
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Training</span>
          </Button>
        )}
      </div>

      {/* Missing Mandatory Site Induction Alert */}
      {missingInduction.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/70">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#172B4D]">
                {missingInduction.length} Worker(s) Missing Mandatory Site Safety Induction Verification
              </div>
              <div className="text-[#64748B] mt-0.5">
                {missingInduction.map((m) => `${m.employeeName} (${m.projectName})`).join(' · ')}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Training Course</th>
                <th className="py-2.5 px-4">Provider</th>
                <th className="py-2.5 px-4">Completion & Expiry</th>
                <th className="py-2.5 px-4">Certificate</th>
                <th className="py-2.5 px-4">Verification Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trainingRecords.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-[#172B4D]">{t.employeeName}</div>
                    <div className="font-mono text-[11px] text-[#64748B]">
                      {t.employeeCode} · {t.projectName}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#172B4D] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{t.trainingName}</span>
                    </div>
                    {t.isMandatoryInduction && (
                      <div className="text-[11px] text-[#DC2626]">Mandatory Site Induction</div>
                    )}
                  </td>
                  <td className="py-2.5 px-4">{t.provider}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-[11px]">
                    <div>Assigned: {t.assignedDate}</div>
                    {t.completionDate && <div>Completed: {t.completionDate}</div>}
                    {t.expiryDate && <div className="text-[#64748B]">Expires: {t.expiryDate}</div>}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#64748B]">
                    {t.certificateFile || 'Not uploaded'}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge label={t.verificationStatus} />
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    {can('training.manage') && (
                      <div className="inline-flex gap-1.5">
                        {t.verificationStatus === 'Assigned (Not Trained)' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateTrainingVerification(t.id, 'Certificate Uploaded', `${t.employeeCode.toLowerCase()}_cert.pdf`);
                              toast.success('Training certificate uploaded for verification.');
                            }}
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Cert</span>
                          </Button>
                        )}
                        {t.verificationStatus === 'Certificate Uploaded' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              updateTrainingVerification(t.id, 'Verified');
                              toast.success('Training certificate verified.');
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verify</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Safety / Skill Training">
        <form onSubmit={handleAssign} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium mb-1">Employee</label>
            <Select className="w-full" value={empId} onChange={(e) => setEmpId(e.target.value)}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.designationTitle})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block font-medium mb-1">Training Course</label>
            <Select className="w-full" value={courseName} onChange={(e) => setCourseName(e.target.value)}>
              {CONSTRUCTION_COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block font-medium mb-1">Training Provider</label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 accent-[#2563EB]"
            />
            <span>Mandatory site induction / safety clearance requirement</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign Training</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
