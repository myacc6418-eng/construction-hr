import React, { useMemo, useState } from 'react';
import { Inbox, MessageSquare, Plus, Send } from 'lucide-react';
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
import { HRRequest } from '@/src/types/hr';
import { toast } from 'sonner';

const REQUEST_CATEGORIES: HRRequest['category'][] = [
  'Personal Information Update',
  'Address Change',
  'Document Update',
  'Employment Letter',
  'Experience Certificate',
  'Leave Clarification',
  'Attendance Correction Request',
  'Resignation',
  'General HR Query',
  'Other',
];

const REQUEST_STATUSES: HRRequest['status'][] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'Awaiting Employee',
  'Approved',
  'Rejected',
  'Resolved',
  'Closed',
];

export const HRRequestsPage: React.FC = () => {
  const { hrRequests, getScopedEmployees, createHRRequest, updateHRRequest, can } = useHRStore();
  const employees = getScopedEmployees();

  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(hrRequests[0]?.id ?? '');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  // New request state
  const [newEmpId, setNewEmpId] = useState(employees[0]?.id ?? '');
  const [newCat, setNewCat] = useState<HRRequest['category']>('Employment Letter');
  const [newPriority, setNewPriority] = useState<HRRequest['priority']>('Normal');
  const [newSubject, setNewSubject] = useState('');

  const filtered = useMemo(
    () => hrRequests.filter((r) => statusFilter === 'All' || r.status === statusFilter),
    [hrRequests, statusFilter]
  );

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    updateHRRequest(selected.id, {}, { body: replyText, isInternalNote: isInternal });
    setReplyText('');
    toast.success(isInternal ? 'Internal HR remark added.' : 'Response sent to employee.');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === newEmpId);
    if (!emp || !newSubject.trim()) return;
    const id = `req_${Date.now()}`;
    createHRRequest({
      id,
      orgId: DEMO_ORG_ID,
      requestCode: `HR-REQ-${411 + hrRequests.length}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      category: newCat,
      submissionDate: '2026-11-18',
      assignedHRUser: 'Anjali Reddy',
      priority: newPriority,
      status: 'Submitted',
      lastUpdated: '2026-11-18 11:00',
      subject: newSubject,
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: emp.fullName,
          isInternalNote: false,
          timestamp: '2026-11-18 11:00',
          body: newSubject,
        },
      ],
    });
    setSelectedId(id);
    setNewOpen(false);
    setNewSubject('');
    toast.success('HR request logged.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">HR Requests & Employee Support</h2>
          <p className="text-xs text-[#64748B]">
            Address updates, experience/employment letters, resignation requests, and threaded HR support
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 text-xs">
            <option value="All">All Ticket Statuses</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Ticket Queue */}
        <Card className="lg:col-span-5 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#172B4D]">Tickets ({filtered.length})</h3>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full p-4 text-left hover:bg-slate-50 cursor-pointer ${
                  selected?.id === r.id ? 'bg-blue-50/70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-[#64748B]">
                      {r.requestCode} · {r.submissionDate} · {r.category}
                    </div>
                    <div className="text-sm font-semibold text-[#172B4D] mt-0.5 truncate">{r.employeeName}</div>
                    <div className="text-xs text-[#64748B] truncate mt-0.5">{r.subject}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge label={r.status} />
                    <span className="text-[10px] font-medium text-[#64748B]">Priority: {r.priority}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Thread & Resolution Workspace */}
        {selected && (
          <Card className="lg:col-span-7">
            <CardHeader className="flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#64748B]">{selected.requestCode}</span>
                  <h3 className="text-sm font-semibold text-[#172B4D]">{selected.category}</h3>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selected.employeeName} ({selected.employeeCode}) · Assigned to {selected.assignedHRUser}
                </p>
              </div>
              {can('requests.manage') && (
                <Select
                  value={selected.status}
                  onChange={(e) => {
                    updateHRRequest(selected.id, { status: e.target.value as HRRequest['status'] });
                    toast.success(`Status updated to ${e.target.value}.`);
                  }}
                  className="h-8 text-xs"
                >
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              )}
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-[#172B4D]">{selected.subject}</div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border ${
                      m.isInternalNote ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                      <span className="font-semibold text-[#172B4D]">
                        {m.sender} {m.isInternalNote && '(Internal HR Note)'}
                      </span>
                      <span className="font-mono">{m.timestamp}</span>
                    </div>
                    <div className="text-[#172B4D]">{m.body}</div>
                  </div>
                ))}
              </div>

              {can('requests.manage') && (
                <form onSubmit={handleSendMessage} className="space-y-2.5 pt-2 border-t border-slate-100">
                  <Textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write employee response or internal HR remark..."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#2563EB]"
                      />
                      <span>Save as Internal HR Note (hidden from employee)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        type="button"
                        onClick={() => {
                          updateHRRequest(selected.id, { status: 'Approved' });
                          toast.success('Request approved.');
                        }}
                      >
                        Approve
                      </Button>
                      <Button size="sm" type="submit">
                        <Send className="w-3.5 h-3.5" />
                        <span>{isInternal ? 'Add Note' : 'Reply'}</span>
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Request Modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Log HR Support Request">
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Employee</label>
              <Select className="w-full" value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeCode})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Category</label>
              <Select
                className="w-full"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as HRRequest['category'])}
              >
                {REQUEST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Priority</label>
            <Select
              className="w-full"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as HRRequest['priority'])}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
              <option value="Low">Low</option>
            </Select>
          </div>
          <div>
            <label className="block font-medium mb-1">Subject & Details *</label>
            <Textarea rows={3} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Create Request</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
