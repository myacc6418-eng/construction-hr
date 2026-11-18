import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  Mail,
  Plus,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
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
import { DocVerificationStatus, EmploymentType, OnboardingDocumentItem, OnboardingRecord, OnboardingStage } from '@/src/types/hr';
import { toast } from 'sonner';

const ONBOARDING_STAGES: OnboardingStage[] = [
  'Employee Registration',
  'Employment Details',
  'Document Collection',
  'Document Verification',
  'Policy Acknowledgement',
  'Account Activation',
];

const wizardSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid mobile number required'),
  email: z.string().email('Valid email required'),
  dateOfBirth: z.string().min(4, 'Date of birth required'),
  emergencyContactName: z.string().min(2, 'Emergency contact name required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone required'),
  emergencyContactRelation: z.string().min(2, 'Relationship required'),
  employeeCode: z.string().min(4, 'Employee ID required'),
  designationTitle: z.string().min(2, 'Designation required'),
  departmentName: z.string().min(2, 'Department required'),
  employmentType: z.string().min(2, 'Employment type required'),
  joiningDate: z.string().min(4, 'Joining date required'),
  reportingManagerName: z.string().min(2, 'Reporting manager required'),
  branch: z.string().min(2, 'Branch required'),
  workLocation: z.string().min(2, 'Work location required'),
  projectName: z.string().min(2, 'Project assignment required'),
  shift: z.string().min(2, 'Shift required'),
});

type WizardValues = z.infer<typeof wizardSchema>;

export const OnboardingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    onboardingRecords,
    departments,
    designations,
    projectSites,
    employees,
    settings,
    can,
    createOnboardingRecord,
    verifyOnboardingDoc,
    updateOnboardingStage,
  } = useHRStore();

  const [wizardOpen, setWizardOpen] = useState(searchParams.get('new') === '1');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(onboardingRecords[0]?.id ?? null);
  const [rejectPrompt, setRejectPrompt] = useState<{ onboardingId: string; docId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Step 3 simulated uploads
  const [step3Docs, setStep3Docs] = useState<Record<string, boolean>>({
    idProof: true,
    addressProof: true,
    photo: true,
    qualification: false,
    prevEmployment: false,
    agreement: true,
  });

  const nextEmpCode = `${settings.employeeIdPrefix}-${1018 + onboardingRecords.length}`;

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      fullName: '',
      phone: '+91 ',
      email: '',
      dateOfBirth: '1994-05-15',
      emergencyContactName: '',
      emergencyContactPhone: '+91 ',
      emergencyContactRelation: 'Spouse',
      employeeCode: nextEmpCode,
      designationTitle: designations[0]?.title || 'Site Engineer',
      departmentName: departments[0]?.name || 'Engineering',
      employmentType: 'Permanent',
      joiningDate: '2026-11-26',
      reportingManagerName: 'Mahesh Rao',
      branch: 'Hyderabad Regional Office',
      workLocation: 'Hyderabad, Telangana',
      projectName: projectSites[0]?.projectName || 'Hyderabad Commercial Tower',
      shift: 'Day Shift (08:00 - 17:00)',
    },
  });

  const watchedType = form.watch('employmentType') as EmploymentType;
  const watchedAll = form.watch();

  // Tailored documents per employment category (do not assume every doc mandatory for daily-wage)
  const categoryDocumentRequirements = useMemo(() => {
    const isStaffOrContract = ['Permanent', 'Contractual', 'Project Based'].includes(watchedType);
    return [
      { key: 'idProof', label: 'Identity Proof (Aadhaar / PAN / Voter ID)', required: true },
      { key: 'addressProof', label: 'Current / Permanent Address Proof', required: isStaffOrContract },
      { key: 'photo', label: 'Worker Photograph', required: true },
      { key: 'qualification', label: 'Education / Trade Qualification Certificate', required: watchedType === 'Permanent' },
      { key: 'prevEmployment', label: 'Previous Employment / Relieving Documents', required: false },
      { key: 'agreement', label: 'Signed Employment Agreement / Muster Consent', required: true },
    ];
  }, [watchedType]);

  const metrics = useMemo(() => {
    const invitationsSent = onboardingRecords.filter((r) => Boolean(r.invitationSentAt)).length;
    const pendingCompletion = onboardingRecords.filter((r) => r.approvalStatus !== 'Activated').length;
    const docsPendingUpload = onboardingRecords.filter((r) =>
      r.documents.some((d) => d.requiredForCategory && d.status === 'Not Uploaded')
    ).length;
    const docsAwaitingVerification = onboardingRecords.reduce(
      (acc, r) => acc + r.documents.filter((d) => d.status === 'Uploaded' || d.status === 'Under Review').length,
      0
    );
    const pendingApprovals = onboardingRecords.filter((r) => r.approvalStatus === 'Pending Approval').length;
    const completed = onboardingRecords.filter((r) => r.approvalStatus === 'Activated').length;
    const overdue = onboardingRecords.filter((r) => r.isOverdue && r.approvalStatus !== 'Activated').length;
    return {
      invitationsSent,
      pendingCompletion,
      docsPendingUpload,
      docsAwaitingVerification,
      pendingApprovals,
      completed,
      overdue,
    };
  }, [onboardingRecords]);

  const selectedRecord = useMemo(
    () => onboardingRecords.find((r) => r.id === selectedRecordId) ?? onboardingRecords[0] ?? null,
    [onboardingRecords, selectedRecordId]
  );

  const openWizard = () => {
    form.reset({
      ...form.getValues(),
      employeeCode: `${settings.employeeIdPrefix}-${1018 + onboardingRecords.length}`,
    });
    setWizardStep(1);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    if (searchParams.get('new')) {
      setSearchParams({});
    }
  };

  const handleNextStep = async () => {
    if (wizardStep === 1) {
      const ok = await form.trigger([
        'fullName',
        'phone',
        'email',
        'dateOfBirth',
        'emergencyContactName',
        'emergencyContactPhone',
        'emergencyContactRelation',
      ]);
      if (ok) setWizardStep(2);
    } else if (wizardStep === 2) {
      const ok = await form.trigger([
        'employeeCode',
        'designationTitle',
        'departmentName',
        'employmentType',
        'joiningDate',
        'reportingManagerName',
        'branch',
        'workLocation',
        'projectName',
        'shift',
      ]);
      if (ok) setWizardStep(3);
    } else if (wizardStep === 3) {
      setWizardStep(4);
    } else if (wizardStep === 4) {
      setWizardStep(5);
    }
  };

  const submitOnboardingWizard = (mode: 'Draft' | 'Invite' | 'Approval') => {
    const values = form.getValues();
    const projectObj = projectSites.find((p) => p.projectName === values.projectName) ?? projectSites[0];
    const today = new Date().toISOString().slice(0, 10);

    const docs: OnboardingDocumentItem[] = categoryDocumentRequirements.map((req, idx) => ({
      id: `odoc_${Date.now()}_${idx}`,
      name: req.label,
      requiredForCategory: req.required,
      status: step3Docs[req.key] ? 'Uploaded' : 'Not Uploaded',
      uploadedDate: step3Docs[req.key] ? today : undefined,
      fileName: step3Docs[req.key] ? `${values.employeeCode.toLowerCase()}_${req.key}.pdf` : undefined,
    }));

    const hasAllReqUploaded = docs.filter((d) => d.requiredForCategory).every((d) => d.status !== 'Not Uploaded');

    const newRec: OnboardingRecord = {
      id: `onb_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      employeeCode: values.employeeCode,
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      dateOfBirth: values.dateOfBirth,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      emergencyContactRelation: values.emergencyContactRelation,
      designationTitle: values.designationTitle,
      departmentName: values.departmentName,
      employmentType: values.employmentType as EmploymentType,
      joiningDate: values.joiningDate,
      reportingManagerName: values.reportingManagerName,
      branch: values.branch,
      workLocation: values.workLocation,
      projectId: projectObj.id,
      projectName: projectObj.projectName,
      siteName: projectObj.siteName,
      shift: values.shift as OnboardingRecord['shift'],
      invitationSentAt: mode === 'Invite' || mode === 'Approval' ? today : undefined,
      currentStage: hasAllReqUploaded ? 'Document Verification' : 'Document Collection',
      completedStages: hasAllReqUploaded
        ? ['Employee Registration', 'Employment Details', 'Document Collection']
        : ['Employee Registration', 'Employment Details'],
      policyAcknowledged: false,
      approvalStatus: mode === 'Approval' ? 'Pending Approval' : 'Draft',
      dueDate: values.joiningDate,
      isOverdue: false,
      assignedOfficer: 'Anjali Reddy',
      documents: docs,
    };

    createOnboardingRecord(newRec);
    setSelectedRecordId(newRec.id);
    closeWizard();
    toast.success(
      mode === 'Draft'
        ? `Saved onboarding draft for ${values.fullName}.`
        : mode === 'Invite'
        ? `Onboarding invitation sent to ${values.email}.`
        : `Submitted ${values.fullName} for document verification & approval.`
    );
  };

  const handleAction = (onboardingId: string, action: 'send_invite' | 'acknowledge_policy' | 'submit_approval' | 'activate') => {
    const res = updateOnboardingStage(onboardingId, action);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Employee Onboarding Pipeline</h2>
          <p className="text-xs text-[#64748B]">
            Registration, category-aware document collection, verification, policy acknowledgement, and activation
          </p>
        </div>
        {can('onboarding.manage') && (
          <Button size="sm" onClick={openWizard}>
            <Plus className="w-4 h-4" />
            <span>New Employee Onboarding</span>
          </Button>
        )}
      </div>

      {/* Pipeline Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Invitations Sent', val: metrics.invitationsSent },
          { label: 'Pending Completion', val: metrics.pendingCompletion },
          { label: 'Docs Pending Upload', val: metrics.docsPendingUpload },
          { label: 'Docs Awaiting Verify', val: metrics.docsAwaitingVerification },
          { label: 'Pending Approvals', val: metrics.pendingApprovals },
          { label: 'Completed', val: metrics.completed },
          { label: 'Onboarding Overdue', val: metrics.overdue, danger: metrics.overdue > 0 },
        ].map((m) => (
          <Card key={m.label} className="p-3">
            <div className="text-[11px] text-[#64748B] truncate">{m.label}</div>
            <div
              className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                m.danger ? 'text-[#DC2626]' : 'text-[#172B4D]'
              }`}
            >
              {m.val}
            </div>
          </Card>
        ))}
      </div>

      {/* Onboarding Queue + Stage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Candidate Queue */}
        <Card className="lg:col-span-5 overflow-hidden">
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Onboarding Queue ({onboardingRecords.length})</h3>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {onboardingRecords.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <button
                  key={rec.id}
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#172B4D] truncate">{rec.fullName}</div>
                      <div className="text-xs text-[#64748B] mt-0.5 truncate">
                        <span className="font-mono">{rec.employeeCode}</span> · {rec.designationTitle} · {rec.employmentType}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-1 truncate">
                        Stage: <strong className="text-[#172B4D]">{rec.currentStage}</strong> · Target {rec.dueDate}
                      </div>
                    </div>
                    <StatusBadge
                      label={rec.isOverdue && rec.approvalStatus !== 'Activated' ? 'Overdue' : rec.approvalStatus}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Detailed 6-Stage Progress Tracker & Document Verification */}
        {selectedRecord && (
          <Card className="lg:col-span-7">
            <CardHeader className="flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#172B4D]">{selectedRecord.fullName}</h3>
                  <StatusBadge label={selectedRecord.approvalStatus} />
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selectedRecord.employeeCode} · {selectedRecord.designationTitle} ({selectedRecord.employmentType}) ·{' '}
                  {selectedRecord.projectName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!selectedRecord.invitationSentAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(selectedRecord.id, 'send_invite')}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Invite</span>
                  </Button>
                )}
                {!selectedRecord.policyAcknowledged && selectedRecord.approvalStatus !== 'Activated' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(selectedRecord.id, 'acknowledge_policy')}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mark Policy Ack</span>
                  </Button>
                )}
                {selectedRecord.approvalStatus !== 'Activated' && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleAction(selectedRecord.id, 'activate')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Activate Employee</span>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* 6-Stage Progress Tracker */}
              <div>
                <div className="text-xs font-semibold text-[#172B4D] mb-2.5">
                  Onboarding Progress Tracker (Exact Stage Visibility)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {ONBOARDING_STAGES.map((stage, idx) => {
                    const done = selectedRecord.completedStages.includes(stage);
                    const current = selectedRecord.currentStage === stage && !done;
                    return (
                      <div
                        key={stage}
                        className={`p-2.5 rounded-md border text-xs flex items-center gap-2 ${
                          done
                            ? 'bg-emerald-50/70 border-emerald-200 text-[#16A34A]'
                            : current
                            ? 'bg-blue-50 border-[#2563EB]/40 text-[#2563EB]'
                            : 'bg-slate-50 border-slate-200 text-[#64748B]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-mono shrink-0">
                          {done ? <Check className="w-3 h-3" /> : idx + 1}
                        </span>
                        <span className="font-medium truncate">{stage}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Verification Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-[#172B4D]">
                    Document Collection & Verification ({selectedRecord.employmentType} rules)
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    Policy Ack: {selectedRecord.policyAcknowledged ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {selectedRecord.documents.map((doc) => (
                    <div key={doc.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                          <span className="font-medium text-[#172B4D]">{doc.name}</span>
                          {doc.requiredForCategory ? (
                            <span className="text-[10px] font-semibold text-[#DC2626]">Required</span>
                          ) : (
                            <span className="text-[10px] text-[#64748B]">Optional</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5 pl-5">
                          {doc.uploadedDate ? `Uploaded ${doc.uploadedDate}` : 'Not uploaded yet'}
                          {doc.verifiedBy ? ` · Verified by ${doc.verifiedBy} (${doc.verificationDate})` : ''}
                          {doc.rejectionReason ? ` · Reason: ${doc.rejectionReason}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pl-5 sm:pl-0">
                        <StatusBadge label={doc.status} />
                        {selectedRecord.approvalStatus !== 'Activated' && can('documents.verify') && (
                          <>
                            {doc.status === 'Not Uploaded' || doc.status === 'Resubmission Required' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  verifyOnboardingDoc(selectedRecord.id, doc.id, 'Uploaded');
                                  toast.success('Document uploaded for review.');
                                }}
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload</span>
                              </Button>
                            ) : doc.status !== 'Verified' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => {
                                    verifyOnboardingDoc(selectedRecord.id, doc.id, 'Verified');
                                    toast.success(`${doc.name} verified.`);
                                  }}
                                >
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectPrompt({ onboardingId: selectedRecord.id, docId: doc.id });
                                    setRejectReason('');
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecord.approvalStatus !== 'Activated' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>
                      Activation enforces all required document verifications and policy acknowledgement before creating an active Employee Directory record.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(selectedRecord.id, 'submit_approval')}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Approval</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Rejection Reason Modal */}
      <Modal
        open={rejectPrompt !== null}
        onClose={() => setRejectPrompt(null)}
        title="Reject / Request Document Resubmission"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[#172B4D]">Rejection Reason (Shown to candidate/HR)</label>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Blurry Aadhaar scan; please upload clear copy"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectPrompt(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (!rejectPrompt || !rejectReason.trim()) {
                  toast.error('Rejection reason is required.');
                  return;
                }
                verifyOnboardingDoc(rejectPrompt.onboardingId, rejectPrompt.docId, 'Resubmission Required', rejectReason);
                setRejectPrompt(null);
                toast.warning('Document marked Resubmission Required.');
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5-Step Multi-Step New Employee Onboarding Wizard */}
      <Modal
        open={wizardOpen}
        onClose={closeWizard}
        title="New Employee Onboarding Wizard"
        subtitle={`Step ${wizardStep} of 5 · BuildFlow Workforce Registration`}
        maxWidth="xl"
      >
        <div className="space-y-5">
          {/* Stepper Bar */}
          <div className="grid grid-cols-5 gap-1.5 text-[11px]">
            {[
              '1. Basic Info',
              '2. Employment',
              '3. Documents',
              '4. Verification',
              '5. Review',
            ].map((lbl, i) => {
              const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5;
              return (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => stepNum < wizardStep && setWizardStep(stepNum)}
                  className={`py-2 px-2 rounded-md text-center font-medium border truncate ${
                    wizardStep === stepNum
                      ? 'bg-[#101F35] text-white border-[#101F35]'
                      : stepNum < wizardStep
                      ? 'bg-emerald-50 text-[#16A34A] border-emerald-200 cursor-pointer'
                      : 'bg-slate-50 text-[#64748B] border-slate-200'
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>

          {wizardStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Full Legal Name *</label>
                <Input {...form.register('fullName')} placeholder="e.g., Venkat Rao" />
                {form.formState.errors.fullName && (
                  <p className="text-[#DC2626] mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">Mobile Number *</label>
                <Input type="tel" {...form.register('phone')} placeholder="+91 98480 00000" />
                {form.formState.errors.phone && (
                  <p className="text-[#DC2626] mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">Email Address *</label>
                <Input type="email" {...form.register('email')} placeholder="name@buildflow-demo.in" />
                {form.formState.errors.email && (
                  <p className="text-[#DC2626] mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">Date of Birth *</label>
                <Input type="date" {...form.register('dateOfBirth')} />
              </div>
              <div>
                <label className="block font-medium mb-1">Emergency Contact Name *</label>
                <Input {...form.register('emergencyContactName')} placeholder="Spouse / Parent name" />
                {form.formState.errors.emergencyContactName && (
                  <p className="text-[#DC2626] mt-1">{form.formState.errors.emergencyContactName.message}</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">Emergency Contact Phone *</label>
                <Input type="tel" {...form.register('emergencyContactPhone')} placeholder="+91 98480 11111" />
              </div>
              <div>
                <label className="block font-medium mb-1">Emergency Relationship *</label>
                <Input {...form.register('emergencyContactRelation')} placeholder="Spouse / Father / Brother" />
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Employee ID *</label>
                <Input {...form.register('employeeCode')} className="font-mono" />
              </div>
              <div>
                <label className="block font-medium mb-1">Employment Type *</label>
                <Select className="w-full" {...form.register('employmentType')}>
                  <option value="Permanent">Permanent</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Daily Wage">Daily Wage</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Weekly Wage">Weekly Wage</option>
                  <option value="Piece Rate">Piece Rate</option>
                  <option value="Project Based">Project Based</option>
                  <option value="Intern / Trainee">Intern / Trainee</option>
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Designation *</label>
                <Select className="w-full" {...form.register('designationTitle')}>
                  {designations.map((d) => (
                    <option key={d.id} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Department *</label>
                <Select className="w-full" {...form.register('departmentName')}>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Project & Site Assignment *</label>
                <Select className="w-full" {...form.register('projectName')}>
                  {projectSites.map((p) => (
                    <option key={p.id} value={p.projectName}>
                      {p.projectName} ({p.siteName})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Reporting Manager *</label>
                <Select className="w-full" {...form.register('reportingManagerName')}>
                  {employees
                    .filter((e) => ['Site Engineer', 'Supervisor', 'Project Manager', 'HR Manager'].includes(e.designationTitle))
                    .map((m) => (
                      <option key={m.id} value={m.fullName}>
                        {m.fullName} ({m.designationTitle})
                      </option>
                    ))}
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Joining Date *</label>
                <Input type="date" {...form.register('joiningDate')} />
              </div>
              <div>
                <label className="block font-medium mb-1">Shift *</label>
                <Select className="w-full" {...form.register('shift')}>
                  <option value="Day Shift (08:00 - 17:00)">Day Shift (08:00 - 17:00)</option>
                  <option value="General Shift (09:30 - 18:30)">General Shift (09:30 - 18:30)</option>
                  <option value="Night Shift (20:00 - 05:00)">Night Shift (20:00 - 05:00)</option>
                  <option value="Rotational Shift">Rotational Shift</option>
                </Select>
              </div>
              <div>
                <label className="block font-medium mb-1">Branch *</label>
                <Input {...form.register('branch')} />
              </div>
              <div>
                <label className="block font-medium mb-1">Work Location *</label>
                <Input {...form.register('workLocation')} />
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-[#172B4D]">
                Document requirements adapt automatically for <strong>{watchedType}</strong> workers (e.g., Daily Wage hires do not require degree certificates).
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {categoryDocumentRequirements.map((doc) => (
                  <label key={doc.key} className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-[#172B4D]">
                        {doc.label}{' '}
                        {doc.required && <span className="text-[#DC2626] font-semibold">(Required)</span>}
                      </div>
                      <div className="text-[11px] text-[#64748B]">Toggle mock file attachment for this onboarding intake</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(step3Docs[doc.key])}
                      onChange={(e) => setStep3Docs((prev) => ({ ...prev, [doc.key]: e.target.checked }))}
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-3 text-xs">
              <div className="text-[#64748B]">
                Uploaded files enter the verification queue. Required documents must be verified by HR before employee activation.
              </div>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {categoryDocumentRequirements.map((doc) => (
                  <div key={doc.key} className="p-3 flex items-center justify-between">
                    <span className="font-medium text-[#172B4D]">{doc.label}</span>
                    <StatusBadge label={step3Docs[doc.key] ? 'Uploaded' : 'Not Uploaded'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[#64748B]">Candidate:</span>{' '}
                  <strong className="text-[#172B4D]">{watchedAll.fullName}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Employee ID:</span>{' '}
                  <strong className="font-mono text-[#172B4D]">{watchedAll.employeeCode}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Role & Dept:</span>{' '}
                  <strong className="text-[#172B4D]">
                    {watchedAll.designationTitle} · {watchedAll.departmentName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Category:</span>{' '}
                  <strong className="text-[#172B4D]">{watchedAll.employmentType}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Project:</span>{' '}
                  <strong className="text-[#172B4D]">{watchedAll.projectName}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Joining Date:</span>{' '}
                  <strong className="font-mono text-[#172B4D]">{watchedAll.joiningDate}</strong>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-[#172B4D]">
                <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                <span>
                  Direct activation is blocked until uploaded documents are verified and policy acknowledgement is completed in the onboarding tracker.
                </span>
              </div>
            </div>
          )}

          {/* Wizard Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)}
            >
              Back
            </Button>
            {wizardStep < 5 ? (
              <Button size="sm" onClick={handleNextStep}>
                Continue to Step {wizardStep + 1}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => submitOnboardingWizard('Draft')}>
                  Save as Draft
                </Button>
                <Button variant="secondary" size="sm" onClick={() => submitOnboardingWizard('Invite')}>
                  Send Invitation
                </Button>
                <Button size="sm" onClick={() => submitOnboardingWizard('Approval')}>
                  Submit for Approval
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
