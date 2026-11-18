import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Download, Plus, Scale, ShieldCheck, Upload } from 'lucide-react';
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
import { downloadCsvFile } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';
import { ComplianceCategory, ComplianceRecord, ComplianceStatus } from '@/src/types/hr';
import { toast } from 'sonner';

const CATEGORIES: ComplianceCategory[] = [
  'Employee Compliance',
  'Contractor Compliance',
  'Social Security & Statutory',
  'Construction & Site Compliance',
  'Company & Establishment Records',
];

export const ComplianceCentrePage: React.FC = () => {
  const { complianceRecords, complianceRules, updateComplianceRecord, addComplianceRule, can } = useHRStore();

  const [tab, setTab] = useState<'register' | 'calendar' | 'rules'>('register');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<ComplianceRecord | null>(null);
  const [evidenceInput, setEvidenceInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [nextStatus, setNextStatus] = useState<ComplianceStatus>('Pending Review');
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // New configurable rule state
  const [rJurisdiction, setRJurisdiction] = useState('Andhra Pradesh');
  const [rRequirement, setRRequirement] = useState('');
  const [rCategory, setRCategory] = useState<ComplianceCategory>('Construction & Site Compliance');
  const [rConditions, setRConditions] = useState('');
  const [rEffective, setREffective] = useState('2026-11-18');
  const [rSource, setRSource] = useState('');

  const metrics = useMemo(() => {
    const total = complianceRecords.length;
    const completed = complianceRecords.filter((c) => c.status === 'Compliant').length;
    const pending = complianceRecords.filter((c) => ['In Progress', 'Pending Review', 'Not Started'].includes(c.status)).length;
    const overdue = complianceRecords.filter((c) => c.status === 'Overdue' || c.status === 'Non-Compliant').length;
    const expiring = complianceRecords.filter((c) => c.status === 'Expiring Soon').length;
    return { total, completed, pending, overdue, expiring };
  }, [complianceRecords]);

  const filtered = useMemo(
    () =>
      complianceRecords.filter((c) => {
        if (catFilter !== 'All' && c.category !== catFilter) return false;
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        return true;
      }),
    [complianceRecords, catFilter, statusFilter]
  );

  const openManage = (rec: ComplianceRecord) => {
    setSelectedItem(rec);
    setEvidenceInput(rec.supportingEvidence || '');
    setRemarksInput(rec.remarks);
    setNextStatus(rec.status);
  };

  const handleSaveCompliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    updateComplianceRecord(selectedItem.id, {
      status: nextStatus,
      supportingEvidence: evidenceInput || undefined,
      remarks: remarksInput,
    });
    setSelectedItem(null);
    toast.success(`Compliance record ${selectedItem.complianceCode} updated.`);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rRequirement.trim() || !rConditions.trim()) return;
    addComplianceRule({
      id: `crule_${Date.now()}`,
      jurisdiction: rJurisdiction,
      requirement: rRequirement,
      category: rCategory,
      applicabilityConditions: rConditions,
      effectiveDate: rEffective,
      sourceReference: rSource || 'Official Gazette / Qualified Advisor Review',
      lastVerifiedDate: '2026-11-18',
      responsibleReviewer: 'Qualified Compliance Professional',
    });
    setRuleModalOpen(false);
    setRRequirement('');
    setRConditions('');
    toast.success('Configurable compliance rule added.');
  };

  const handleExport = () => {
    downloadCsvFile(
      'buildflow_compliance_register.csv',
      ['Code', 'Requirement', 'Category', 'Establishment', 'Jurisdiction', 'Due Date', 'Status', 'Responsible'],
      filtered.map((c) => [
        c.complianceCode,
        c.requirementName,
        c.category,
        c.applicableEstablishment,
        c.jurisdiction,
        c.dueDate,
        c.status,
        c.responsiblePerson,
      ])
    );
    toast.success('Compliance register exported to CSV.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Compliance Management Centre</h2>
          <p className="text-xs text-[#64748B]">
            Employee, contractor, social security, construction site safety, and establishment compliance register
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-md">
            {(
              [
                ['register', 'Register'],
                ['calendar', 'Calendar'],
                ['rules', 'Configurable Rules'],
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
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Mandatory Legal Verification Notice */}
      <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs">
        <Scale className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#172B4D]">Compliance Verification Notice:</strong>{' '}
          <span className="text-[#64748B]">
            Statutory applicability, thresholds, forms, and due dates depend on state jurisdiction, establishment type, headcount coverage, and current legislation. Present documents do not constitute legal certification; all items must be verified against official notifications and reviewed by a qualified compliance professional.
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Applicable Items', val: metrics.total },
          { label: 'Compliant', val: metrics.completed },
          { label: 'In Progress / Review', val: metrics.pending },
          { label: 'Expiring Soon', val: metrics.expiring },
          { label: 'Overdue', val: metrics.overdue, danger: metrics.overdue > 0 },
        ].map((m) => (
          <Card key={m.label} className="p-3">
            <div className="text-[11px] text-[#64748B]">{m.label}</div>
            <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${m.danger ? 'text-[#DC2626]' : 'text-[#172B4D]'}`}>
              {m.val}
            </div>
          </Card>
        ))}
      </div>

      {tab === 'register' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex-wrap">
            <h3 className="text-sm font-semibold text-[#172B4D]">Compliance Register</h3>
            <div className="flex flex-wrap gap-2">
              <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-8 text-xs">
                <option value="All">All 5 Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs">
                <option value="All">All Statuses</option>
                <option value="Overdue">Overdue</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Pending Review">Pending Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Compliant">Compliant</option>
              </Select>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">ID & Requirement</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Establishment & Jurisdiction</th>
                  <th className="py-2.5 px-4">Period & Due Date</th>
                  <th className="py-2.5 px-4">Responsible</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="font-mono text-[11px] text-[#64748B]">{rec.complianceCode}</div>
                      <div className="font-semibold text-[#172B4D]">{rec.requirementName}</div>
                      <div className="text-[11px] text-[#64748B] truncate">{rec.requiredDocument}</div>
                    </td>
                    <td className="py-2.5 px-4">{rec.category}</td>
                    <td className="py-2.5 px-4">
                      <div className="text-[#172B4D]">{rec.applicableEstablishment}</div>
                      <div className="text-[11px] text-[#64748B]">{rec.jurisdiction}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums">
                      <div>Due: {rec.dueDate}</div>
                      <div className="text-[11px] text-[#64748B]">Next: {rec.nextReviewDate}</div>
                    </td>
                    <td className="py-2.5 px-4">{rec.responsiblePerson}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge label={rec.status} />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {can('compliance.manage') ? (
                        <Button size="sm" variant="outline" onClick={() => openManage(rec)}>
                          Review / Submit
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#64748B]">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#172B4D]">Compliance Deadlines, Renewals & Review Schedule</h3>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {[...complianceRecords]
              .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
              .map((rec) => (
                <div key={rec.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-mono text-[11px] text-[#2563EB]">
                      Due {rec.dueDate} · Next Review {rec.nextReviewDate}
                    </div>
                    <div className="font-semibold text-[#172B4D] mt-0.5">{rec.requirementName}</div>
                    <div className="text-[#64748B]">{rec.applicableEstablishment} · Responsible: {rec.responsiblePerson}</div>
                  </div>
                  <StatusBadge label={rec.status} />
                </div>
              ))}
          </div>
        </Card>
      )}

      {tab === 'rules' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-semibold text-[#172B4D]">Configurable Jurisdiction Compliance Rules</h3>
              <p className="text-xs text-[#64748B]">
                No statutory rates or thresholds are hardcoded; configure applicability conditions and verification sources per state
              </p>
            </div>
            {can('compliance.rules_edit') && (
              <Button size="sm" onClick={() => setRuleModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </Button>
            )}
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {complianceRules.map((rule) => (
              <div key={rule.id} className="p-4 text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-sm text-[#172B4D]">
                    {rule.jurisdiction} — {rule.requirement}
                  </div>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    Effective {rule.effectiveDate} · Verified {rule.lastVerifiedDate}
                  </span>
                </div>
                <div className="text-[#172B4D]">{rule.applicabilityConditions}</div>
                <div className="text-[#64748B]">
                  Source: {rule.sourceReference} · Reviewer: {rule.responsibleReviewer}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Manage / Review Compliance Modal */}
      <Modal
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `${selectedItem.complianceCode} — ${selectedItem.requirementName}` : ''}
      >
        {selectedItem && (
          <form onSubmit={handleSaveCompliance} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Workflow Status</label>
                <Select
                  className="w-full"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as ComplianceStatus)}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Compliant">Compliant (Reviewed & Accepted)</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Not Applicable">Not Applicable</option>
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Supporting Evidence File Ref</label>
                <Input
                  value={evidenceInput}
                  onChange={(e) => setEvidenceInput(e.target.value)}
                  placeholder="e.g., epf_oct2026_ecr_receipt.pdf"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Reviewer Remarks / Escalation Note</label>
              <Textarea rows={3} value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button type="submit">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Update Compliance Record</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Configurable Rule Modal */}
      <Modal open={ruleModalOpen} onClose={() => setRuleModalOpen(false)} title="Add Configurable Compliance Rule">
        <form onSubmit={handleAddRule} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Jurisdiction / State *</label>
              <Input value={rJurisdiction} onChange={(e) => setRJurisdiction(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Effective Date *</label>
              <Input type="date" value={rEffective} onChange={(e) => setREffective(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Requirement Title *</label>
            <Input value={rRequirement} onChange={(e) => setRRequirement(e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Applicability Conditions *</label>
            <Textarea
              rows={2}
              value={rConditions}
              onChange={(e) => setRConditions(e.target.value)}
              placeholder="Describe establishment size, worker category, and state threshold criteria..."
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Official Source / Reference</label>
            <Input value={rSource} onChange={(e) => setRSource(e.target.value)} placeholder="State Labour Portal / Gazette Ref" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Configurable Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
