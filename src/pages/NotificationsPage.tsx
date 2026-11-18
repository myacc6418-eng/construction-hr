import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, CheckCheck } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, Select, StatusBadge } from '@/src/components/ui/Primitives';
import { useHRStore } from '@/src/store/useHRStore';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, settings, updateSettings } = useHRStore();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (unreadOnly && n.isRead) return false;
        if (categoryFilter !== 'All' && n.category !== categoryFilter) return false;
        return true;
      }),
    [notifications, unreadOnly, categoryFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Notifications & Reminders</h2>
          <p className="text-xs text-[#64748B]">
            Real-time HR workflow alerts for onboarding, attendance exceptions, document expiries, and compliance deadlines
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            markAllNotificationsRead();
            toast.success('All notifications marked as read.');
          }}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <Card className="lg:col-span-8 overflow-hidden">
          <CardHeader className="flex-wrap">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#172B4D]">Alert Feed ({filtered.length})</h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-[#64748B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#2563EB]"
                />
                <span>Unread only</span>
              </label>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-8 text-xs">
                <option value="All">All Categories</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Attendance">Attendance</option>
                <option value="Leave">Leave</option>
                <option value="Documents">Documents</option>
                <option value="Compliance">Compliance</option>
                <option value="Contractors">Contractors</option>
              </Select>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  navigate(n.targetRoute);
                }}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 ${
                  !n.isRead ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span className="font-semibold text-[#2563EB]">{n.category}</span>
                    <span>·</span>
                    <span className="font-mono">{n.timestamp}</span>
                    {!n.isRead && <span className="font-semibold text-[#172B4D]">· Unread</span>}
                  </div>
                  <div className="text-sm font-semibold text-[#172B4D] mt-0.5">{n.title}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">{n.description}</div>
                  <div className="text-[11px] font-mono text-[#64748B] mt-1">{n.relatedRecordLabel}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge label={n.priority} />
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#172B4D]">Notification Preferences</h3>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              {
                key: 'notifyCriticalExceptions' as const,
                label: 'Critical Attendance Exceptions',
                desc: 'Missing check-outs & geofence violations',
              },
              {
                key: 'notifyDocumentExpiry' as const,
                label: 'Document & Licence Expiry Reminders',
                desc: '30d, 15d, 7d and expired alerts',
              },
              {
                key: 'notifyComplianceDeadlines' as const,
                label: 'Compliance Deadlines & Escalations',
                desc: 'Overdue filings & contractor gaps',
              },
              {
                key: 'notifyEmailDigest' as const,
                label: 'Daily HR Morning Summary Digest',
                desc: 'Consolidated morning roster & leave briefing',
              },
            ].map((pref) => (
              <label key={pref.key} className="flex items-start justify-between gap-3 cursor-pointer p-2 rounded hover:bg-slate-50">
                <div>
                  <div className="font-medium text-[#172B4D]">{pref.label}</div>
                  <div className="text-[11px] text-[#64748B]">{pref.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings[pref.key]}
                  onChange={(e) => {
                    updateSettings({ [pref.key]: e.target.checked });
                    toast.success('Notification preference saved.');
                  }}
                  className="w-4 h-4 mt-0.5 accent-[#2563EB]"
                />
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
