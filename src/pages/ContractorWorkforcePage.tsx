import React, { useState } from 'react';
import { Building2, CheckCircle2, HardHat, Plus, ShieldAlert, UserPlus } from 'lucide-react';
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

export const ContractorWorkforcePage: React.FC = () => {
  const {
    contractors,
    contractorWorkers,
    projectSites,
    addContractorCompany,
    addContractorWorker,
    completeContractorWorkerInduction,
    can,
  } = useHRStore();

  const [tab, setTab] = useState<'companies' | 'workers'>('companies');
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);

  // Company form
  const [cName, setCName] = useState('');
  const [cContact, setCContact] = useState('');
  const [cPhone, setCPhone] = useState('+91 ');
  const [cEmail, setCEmail] = useState('');
  const [cAgreement, setCAgreement] = useState('CON-2026-NEW-11');
  const [cProject, setCProject] = useState(projectSites[0]?.projectName ?? '');

  // Worker form
  const [wName, setWName] = useState('');
  const [wContractorId, setWContractorId] = useState(contractors[0]?.id ?? '');
  const [wTrade, setWTrade] = useState('Bar Bender');
  const [wProject, setWProject] = useState(projectSites[0]?.projectName ?? '');
  const [wSupervisor, setWSupervisor] = useState('Mahesh Rao');

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const pObj = projectSites.find((p) => p.projectName === cProject) ?? projectSites[0];
    addContractorCompany({
      id: `con_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      companyName: cName,
      contactPerson: cContact,
      contactNumber: cPhone,
      email: cEmail,
      agreementNumber: cAgreement,
      agreementStatus: 'Active',
      agreementStartDate: '2026-11-18',
      agreementEndDate: '2027-11-17',
      assignedProjects: [pObj.projectName],
      assignedSites: [pObj.siteName],
      complianceStatus: 'Gaps Identified',
      isActive: true,
      documents: [
        { id: `cd_${Date.now()}`, name: 'Subcontractor Agreement', status: 'Verified', expiryDate: '2027-11-17' },
        { id: `cd_${Date.now() + 1}`, name: 'Labour Licence / Statutory Proof', status: 'Missing' },
      ],
    });
    setCompanyModalOpen(false);
    setCName('');
    toast.success(`Registered contractor company ${cName}.`);
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const con = contractors.find((c) => c.id === wContractorId) ?? contractors[0];
    const pObj = projectSites.find((p) => p.projectName === wProject) ?? projectSites[0];
    addContractorWorker({
      id: `cw_${Date.now()}`,
      orgId: DEMO_ORG_ID,
      workerCode: `CW-${Math.floor(100 + Math.random() * 899)}`,
      fullName: wName,
      contractorId: con.id,
      contractorName: con.companyName,
      trade: wTrade,
      engagementType: 'Contractor Personnel',
      assignedProject: pObj.projectName,
      assignedSite: pObj.siteName,
      supervisorName: wSupervisor,
      joiningDate: '2026-11-18',
      idDocumentVerified: false,
      safetyInductionCompleted: false,
      trainingStatus: 'Pending Induction',
      workStatus: 'Pending Induction',
    });
    setWorkerModalOpen(false);
    setWName('');
    toast.success('Contractor worker registered (Site access gated until ID & safety induction verified).');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Contractor Workforce Management</h2>
          <p className="text-xs text-[#64748B]">
            Strict separation between Direct Employees, Contractor Companies, and Contractor Personnel records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-md">
            <button
              onClick={() => setTab('companies')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                tab === 'companies' ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              Contractor Companies ({contractors.length})
            </button>
            <button
              onClick={() => setTab('workers')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                tab === 'workers' ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              Contractor Workers ({contractorWorkers.length})
            </button>
          </div>
          {can('contractors.manage') && (
            <Button
              size="sm"
              onClick={() => (tab === 'companies' ? setCompanyModalOpen(true) : setWorkerModalOpen(true))}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tab === 'companies' ? 'Add Contractor' : 'Add Contractor Worker'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Separation Boundary Notice */}
      <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-[#172B4D] flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <span>
          Contractor workers are not treated as direct company payroll employees unless formally hired and onboarded as direct staff. Site access requires verified ID and completed safety induction.
        </span>
      </div>

      {tab === 'companies' && (
        <div className="grid grid-cols-1 gap-4">
          {contractors.map((con) => {
            const workerCount = contractorWorkers.filter((w) => w.contractorId === con.id).length;
            return (
              <Card key={con.id}>
                <CardHeader className="flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#2563EB]" />
                      <h3 className="text-sm font-semibold text-[#172B4D]">{con.companyName}</h3>
                      <StatusBadge label={con.complianceStatus} />
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Contact: {con.contactPerson} ({con.contactNumber}) · Agreement <span className="font-mono">{con.agreementNumber}</span> ({con.agreementStartDate} → {con.agreementEndDate})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={con.agreementStatus} />
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-[#172B4D]">
                      {workerCount} workers
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-[#172B4D] mb-1">Assigned Projects & Sites</div>
                    <div className="text-[#64748B]">{con.assignedProjects.join(', ')}</div>
                    <div className="text-[#64748B] mt-0.5">{con.assignedSites.join(', ')}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#172B4D] mb-1.5">Applicable Compliance Documents</div>
                    <div className="space-y-1.5">
                      {con.documents.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2">
                          <span className="text-[#172B4D] truncate">{d.name}</span>
                          <StatusBadge label={d.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'workers' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B]">
                  <th className="py-2.5 px-4">Worker ID & Name</th>
                  <th className="py-2.5 px-4">Contractor Company</th>
                  <th className="py-2.5 px-4">Trade</th>
                  <th className="py-2.5 px-4">Project & Site</th>
                  <th className="py-2.5 px-4">ID & Safety Induction</th>
                  <th className="py-2.5 px-4">Site Access</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractorWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{w.fullName}</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#64748B]">{w.workerCode}</div>
                    </td>
                    <td className="py-2.5 px-4">{w.contractorName}</td>
                    <td className="py-2.5 px-4">{w.trade}</td>
                    <td className="py-2.5 px-4">
                      <div>{w.assignedProject}</div>
                      <div className="text-[11px] text-[#64748B]">Sup: {w.supervisorName}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge label={w.trainingStatus} />
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge label={w.workStatus} />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {!w.safetyInductionCompleted && can('contractors.manage') ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            completeContractorWorkerInduction(w.id);
                            toast.success(`${w.fullName} ID & safety induction verified — site access activated.`);
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Activate</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#64748B]">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Contractor Modal */}
      <Modal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)} title="Register Contractor Company">
        <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium mb-1">Contractor Company Name *</label>
            <Input value={cName} onChange={(e) => setCName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Contact Person *</label>
              <Input value={cContact} onChange={(e) => setCContact(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Contact Phone *</label>
              <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Email *</label>
              <Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Agreement Number *</label>
              <Input value={cAgreement} onChange={(e) => setCAgreement(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Primary Project Assignment</label>
            <Select className="w-full" value={cProject} onChange={(e) => setCProject(e.target.value)}>
              {projectSites.map((p) => (
                <option key={p.id} value={p.projectName}>
                  {p.projectName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Contractor</Button>
          </div>
        </form>
      </Modal>

      {/* Add Contractor Worker Modal */}
      <Modal open={workerModalOpen} onClose={() => setWorkerModalOpen(false)} title="Register Contractor Worker">
        <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium mb-1">Worker Full Name *</label>
            <Input value={wName} onChange={(e) => setWName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Contractor Company *</label>
              <Select className="w-full" value={wContractorId} onChange={(e) => setWContractorId(e.target.value)}>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Trade *</label>
              <Input value={wTrade} onChange={(e) => setWTrade(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Project Assignment</label>
              <Select className="w-full" value={wProject} onChange={(e) => setWProject(e.target.value)}>
                {projectSites.map((p) => (
                  <option key={p.id} value={p.projectName}>
                    {p.projectName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Site Supervisor</label>
              <Input value={wSupervisor} onChange={(e) => setWSupervisor(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setWorkerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Contractor Worker</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
