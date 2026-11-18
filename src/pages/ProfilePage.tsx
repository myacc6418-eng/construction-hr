import React from 'react';
import { History, Lock, ShieldCheck } from 'lucide-react';
import { Avatar, Card, CardContent, CardHeader, StatusBadge } from '@/src/components/ui/Primitives';
import { SUPABASE_TABLE_MAP, getRoleDefinition } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';

export const ProfilePage: React.FC = () => {
  const { activeRoleId, activeUserName, activeUserEmail, activeUserAvatar, activityLogs, settings } = useHRStore();
  const roleDef = getRoleDefinition(activeRoleId);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={activeUserName} src={activeUserAvatar} size="xl" />
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">{activeUserName}</h2>
              <div className="text-xs text-[#64748B] mt-0.5">{activeUserEmail}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge label={roleDef.name} tone="info" />
                <span className="text-xs text-[#64748B]">{settings.companyName}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-right text-[#64748B]">
            <div>Tenant Isolation: <strong className="text-[#16A34A]">Enforced (org_id)</strong></div>
            <div className="mt-0.5">Document Access: <strong className="text-[#172B4D]">Private Signed URLs</strong></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#172B4D]">Active Role Permissions ({roleDef.permissions.length})</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[#64748B] mb-3">{roleDef.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {roleDef.permissions.map((perm) => (
                <span
                  key={perm}
                  className="text-[11px] font-mono px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[#172B4D]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#172B4D]">Supabase-Ready Schema & RLS Architecture</h3>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p className="text-[#64748B]">
              Local demo service functions map 1-to-1 to PostgreSQL tables protected by Row Level Security and private storage buckets:
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              {Object.entries(SUPABASE_TABLE_MAP)
                .slice(0, 12)
                .map(([k, table]) => (
                  <div key={k} className="px-2 py-1 rounded bg-slate-50 border border-slate-200 truncate">
                    {table}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Workspace Audit Activity Log</h3>
          </div>
          <span className="text-xs font-mono text-[#64748B]">{activityLogs.length} events</span>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {activityLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-semibold text-[#172B4D]">
                  {log.action} · <span className="text-[#2563EB]">{log.targetEntity}</span>
                </div>
                <div className="text-[#64748B] mt-0.5">{log.details}</div>
              </div>
              <div className="font-mono text-[11px] text-[#64748B] shrink-0 text-right">
                <div>{log.actor} ({log.actorRole})</div>
                <div>{log.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
