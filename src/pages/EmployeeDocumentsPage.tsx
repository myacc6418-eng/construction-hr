import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  AccessRestrictedBanner,
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
import { generateSimulatedSignedUrl } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';
import { DocumentCategory, EmployeeDocument } from '@/src/types/hr';
import { toast } from 'sonner';

const DOC_CATEGORIES: DocumentCategory[] = [
  'Identity Documents',
  'Address Proof',
  'Employment Agreements',
  'Appointment Letters',
  'Qualification Certificates',
  'Training Certificates',
  'Safety Certificates',
  'Medical Fitness Documents',
  'Experience Letters',
  'Resignation Letters',
  'Exit Documents',
  'Other HR Documents',
];

export const EmployeeDocumentsPage: React.FC = () => {
  const {
    documents,
    getScopedEmployees,
    addEmployeeDocument,
    verifyEmployeeDocument,
    replaceDocumentVersion,
    can,
  } = useHRStore();

  const employees = getScopedEmployees();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expiryBucket, setExpiryBucket] = useState<'all' | 'expired' | '7' | '15' | '30'>('all');
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceDoc, setReplaceDoc] = useState<EmployeeDocument | null>(null);

  // Upload state
  const [upEmpId, setUpEmpId] = useState(employees[0]?.id ?? '');
  const [upDocName, setUpDocName] = useState('');
  const [upCategory, setUpCategory] = useState<DocumentCategory>('Safety Certificates');
  const [upIssueDate, setUpIssueDate] = useState('2026-11-18');
  const [upExpiryDate, setUpExpiryDate] = useState('2027-11-18');

  // Replace state
  const [repIssue, setRepIssue] = useState('2026-11-18');
  const [repExpiry, setRepExpiry] = useState('2027-11-18');

  const todayMs = new Date('2026-11-18').getTime();
  const getDaysUntilExpiry = (exp?: string) => {
    if (!exp) return null;
    return Math.ceil((new Date(exp).getTime() - todayMs) / (1000 * 60 * 60 * 24));
  };

  const alerts = useMemo(() => {
    let expired = 0;
    let in7 = 0;
    let in15 = 0;
    let in30 = 0;
    documents.forEach((d) => {
      const diff = getDaysUntilExpiry(d.expiryDate);
      if (diff === null) return;
      if (diff < 0) expired += 1;
      else if (diff <= 7) in7 += 1;
      else if (diff <= 15) in15 += 1;
      else if (diff <= 30) in30 += 1;
    });
    return { expired, in7, in15, in30 };
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (q && !d.employeeName.toLowerCase().includes(q) && !d.documentName.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (expiryBucket !== 'all') {
        const diff = getDaysUntilExpiry(d.expiryDate);
        if (diff === null) return false;
        if (expiryBucket === 'expired' && diff >= 0) return false;
        if (expiryBucket === '7' && (diff < 0 || diff > 7)) return false;
        if (expiryBucket === '15' && (diff < 0 || diff > 15)) return false;
        if (expiryBucket === '30' && (diff < 0 || diff > 30)) return false;
      }
      return true;
    });
  }, [documents, search, categoryFilter, expiryBucket]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === upEmpId);
    if (!emp || !upDocName.trim()) {
      toast.error('Select an employee and enter a document name.');
      return;
    }
    const cleanKey = upDocName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    addEmployeeDocument({
      id: `doc_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      documentName: upDocName,
      category: upCategory,
      version: 1,
      issueDate: upIssueDate,
      expiryDate: upExpiryDate || undefined,
      uploadDate: '2026-11-18',
      verificationStatus: 'Uploaded',
      lastUpdated: '2026-11-18',
      isSensitiveMedical: upCategory === 'Medical Fitness Documents',
      storageBucket: upCategory === 'Medical Fitness Documents' ? 'bf-private-medical-docs' : 'bf-private-hr-docs',
      objectKey: `org_deccan/${emp.id}/${cleanKey}_v1.pdf`,
      auditHistory: [
        { timestamp: '2026-11-18 10:00', actor: 'Current HR User', action: 'Uploaded v1 into private storage' },
      ],
    });
    setUploadOpen(false);
    setUpDocName('');
    toast.success('Document uploaded to private storage (pending verification).');
  };

  const handleSignedDownload = (doc: EmployeeDocument) => {
    if (doc.isSensitiveMedical && !can('employees.medical_view')) {
      toast.error('Medical documents require explicit medical-view permission (HR Manager).');
      return;
    }
    if (!can('documents.download_signed')) {
      toast.error('Your role cannot generate signed download URLs.');
      return;
    }
    const { signedUrl, expiresAtIso } = generateSimulatedSignedUrl(doc.storageBucket, doc.objectKey);
    toast.success(`Short-lived signed URL issued (expires ${expiresAtIso}): ${signedUrl.slice(0, 56)}...`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Employee Document Vault</h2>
          <p className="text-xs text-[#64748B]">
            Private storage with role-based access, version history, expiry reminders, and short-lived signed download URLs
          </p>
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </Button>
      </div>

      {/* Expiry Alert Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'All Documents', val: documents.length, tone: 'neutral' },
          { key: 'expired', label: 'Already Expired', val: alerts.expired, tone: 'danger' },
          { key: '7', label: 'Expiring ≤ 7 Days', val: alerts.in7, tone: 'danger' },
          { key: '15', label: 'Expiring ≤ 15 Days', val: alerts.in15, tone: 'warning' },
          { key: '30', label: 'Expiring ≤ 30 Days', val: alerts.in30, tone: 'warning' },
        ].map((b) => (
          <button
            key={b.key}
            onClick={() => setExpiryBucket(b.key as typeof expiryBucket)}
            className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
              expiryBucket === b.key
                ? 'bg-[#101F35] text-white border-[#101F35]'
                : 'bg-white text-[#172B4D] border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[11px] ${expiryBucket === b.key ? 'text-slate-300' : 'text-[#64748B]'}`}>
              {b.label}
            </div>
            <div className="text-xl font-bold font-mono tabular-nums mt-0.5">{b.val}</div>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee or document title..."
        />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All 12 Document Categories</option>
          {DOC_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Card>

      {/* Document Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Document & Version</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Issue / Expiry</th>
                <th className="py-2.5 px-4">Verification</th>
                <th className="py-2.5 px-4">Verified By</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => {
                const diff = getDaysUntilExpiry(doc.expiryDate);
                const medicalBlocked = doc.isSensitiveMedical && !can('employees.medical_view');
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#172B4D]">{doc.employeeName}</div>
                      <div className="font-mono text-[11px] text-[#64748B]">{doc.employeeCode}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-[#172B4D] flex items-center gap-1.5">
                        {medicalBlocked ? <Lock className="w-3.5 h-3.5 text-[#F59E0B]" /> : <FileText className="w-3.5 h-3.5 text-[#2563EB]" />}
                        <span>{doc.documentName}</span>
                        <span className="font-mono text-[11px] text-[#64748B]">v{doc.version}</span>
                      </div>
                      <div className="font-mono text-[10px] text-[#64748B] mt-0.5">
                        Private: {doc.storageBucket}/{doc.objectKey}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">{doc.category}</td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-[11px]">
                      <div>Issued: {doc.issueDate}</div>
                      {doc.expiryDate ? (
                        <div
                          className={
                            diff !== null && diff < 0
                              ? 'text-[#DC2626] font-semibold'
                              : diff !== null && diff <= 15
                              ? 'text-[#B45309] font-semibold'
                              : 'text-[#64748B]'
                          }
                        >
                          Exp: {doc.expiryDate} ({diff !== null && diff < 0 ? 'Expired' : `${diff}d left`})
                        </div>
                      ) : (
                        <div className="text-[#64748B]">No expiry</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge label={doc.verificationStatus} />
                    </td>
                    <td className="py-2.5 px-4 text-[#64748B]">{doc.verifiedBy || '—'}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setPreviewDoc(doc)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSignedDownload(doc)} title="Generate short-lived signed URL">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        {can('documents.verify') && doc.verificationStatus !== 'Verified' && !medicalBlocked && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              verifyEmployeeDocument(doc.id, 'Verified', 'Verified via Document Vault.');
                              toast.success('Document verified.');
                            }}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Preview & Audit Modal */}
      <Modal
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? previewDoc.documentName : ''}
        subtitle={previewDoc ? `${previewDoc.employeeName} (${previewDoc.employeeCode}) · Version ${previewDoc.version}` : ''}
      >
        {previewDoc && (
          <div className="space-y-4 text-xs">
            {previewDoc.isSensitiveMedical && !can('employees.medical_view') ? (
              <AccessRestrictedBanner
                title="Medical Fitness Document Restricted"
                message="Medical records require explicit medical-view authorisation (HR Manager). Switch active role to HR Manager to preview or download via signed URL."
              />
            ) : (
              <>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Private Storage Object (No Public URL):</span>
                    <span className="font-mono text-[#172B4D]">{previewDoc.storageBucket}/{previewDoc.objectKey}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Verification Status:</span>
                    <StatusBadge label={previewDoc.verificationStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Issue / Expiry:</span>
                    <span className="font-mono">{previewDoc.issueDate} → {previewDoc.expiryDate || 'Perpetual'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleSignedDownload(previewDoc)}>
                    <Download className="w-3.5 h-3.5" />
                    <span>Issue Signed Download URL (120s)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplaceDoc(previewDoc);
                      setPreviewDoc(null);
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Replacement Version</span>
                  </Button>
                  {can('documents.verify') && previewDoc.verificationStatus !== 'Verified' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        verifyEmployeeDocument(previewDoc.id, 'Verified');
                        setPreviewDoc(null);
                        toast.success('Document verified.');
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify Document</span>
                    </Button>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-[#172B4D] mb-2">Version & Verification Audit Trail</div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {previewDoc.auditHistory.length === 0 ? (
                      <div className="p-3 text-[#64748B]">Initial upload audit recorded on {previewDoc.uploadDate}.</div>
                    ) : (
                      previewDoc.auditHistory.map((a, idx) => (
                        <div key={idx} className="p-2.5 flex justify-between gap-2">
                          <div>
                            <span className="font-medium text-[#172B4D]">{a.action}</span>
                            {a.note && <span className="text-[#64748B]"> — {a.note}</span>}
                          </div>
                          <div className="font-mono text-[11px] text-[#64748B]">
                            {a.actor} · {a.timestamp}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Private Employee Document">
        <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Employee</label>
              <Select className="w-full" value={upEmpId} onChange={(e) => setUpEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeCode})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Document Category</label>
              <Select
                className="w-full"
                value={upCategory}
                onChange={(e) => setUpCategory(e.target.value as DocumentCategory)}
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Document Name *</label>
            <Input
              value={upDocName}
              onChange={(e) => setUpDocName(e.target.value)}
              placeholder="e.g., Working at Height Safety Certificate"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Issue Date</label>
              <Input type="date" value={upIssueDate} onChange={(e) => setUpIssueDate(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Expiry Date (Optional)</label>
              <Input type="date" value={upExpiryDate} onChange={(e) => setUpExpiryDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Upload to Private Vault</Button>
          </div>
        </form>
      </Modal>

      {/* Replace Document Version Modal */}
      <Modal
        open={replaceDoc !== null}
        onClose={() => setReplaceDoc(null)}
        title={replaceDoc ? `Replace Document Version — ${replaceDoc.documentName}` : ''}
      >
        {replaceDoc && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              replaceDocumentVersion(replaceDoc.id, repIssue, repExpiry || undefined);
              setReplaceDoc(null);
              toast.success('New document version uploaded; previous version archived.');
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">New Issue Date</label>
                <Input type="date" value={repIssue} onChange={(e) => setRepIssue(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium mb-1">New Expiry Date</label>
                <Input type="date" value={repExpiry} onChange={(e) => setRepExpiry(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplaceDoc(null)}>
                Cancel
              </Button>
              <Button type="submit">Upload v{replaceDoc.version + 1}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
