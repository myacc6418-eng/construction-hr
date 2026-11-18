import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Download,
  LayoutGrid,
  List,
  Phone,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  StatusBadge,
} from '@/src/components/ui/Primitives';
import { downloadCsvFile } from '@/src/services/hrService';
import { useHRStore } from '@/src/store/useHRStore';
import { Employee } from '@/src/types/hr';
import { toast } from 'sonner';

type SortKey = 'fullName' | 'employeeCode' | 'joiningDate' | 'departmentName' | 'projectName';

export const EmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getScopedEmployees, departments, designations, projectSites, can } = useHRStore();

  const employees = getScopedEmployees();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [desigFilter, setDesigFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tradeFilter, setTradeFilter] = useState('');
  const [joiningFrom, setJoiningFrom] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('employeeCode');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tradeQ = tradeFilter.trim().toLowerCase();
    return employees
      .filter((e) => {
        if (q) {
          const hit =
            e.fullName.toLowerCase().includes(q) ||
            e.employeeCode.toLowerCase().includes(q) ||
            e.phone.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            e.designationTitle.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (statusFilter !== 'All') {
          if (statusFilter === 'Active') {
            if (!['Active', 'Confirmed', 'Probation'].includes(e.employmentStatus)) return false;
          } else if (e.employmentStatus !== statusFilter) {
            return false;
          }
        }
        if (deptFilter !== 'All' && e.departmentName !== deptFilter) return false;
        if (desigFilter !== 'All' && e.designationTitle !== desigFilter) return false;
        if (projectFilter !== 'All' && e.projectName !== projectFilter) return false;
        if (siteFilter !== 'All' && e.siteName !== siteFilter) return false;
        if (typeFilter !== 'All' && e.employmentType !== typeFilter) return false;
        if (tradeQ && !e.skillOrTrade.toLowerCase().includes(tradeQ)) return false;
        if (joiningFrom && e.joiningDate < joiningFrom) return false;
        return true;
      })
      .sort((a, b) => {
        const va = String(a[sortBy] || '').toLowerCase();
        const vb = String(b[sortBy] || '').toLowerCase();
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    employees,
    search,
    statusFilter,
    deptFilter,
    desigFilter,
    projectFilter,
    siteFilter,
    typeFilter,
    tradeFilter,
    joiningFrom,
    sortBy,
    sortAsc,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc((v) => !v);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDeptFilter('All');
    setDesigFilter('All');
    setProjectFilter('All');
    setSiteFilter('All');
    setTypeFilter('All');
    setTradeFilter('');
    setJoiningFrom('');
    setPage(1);
  };

  const handleExportCsv = () => {
    downloadCsvFile(
      `buildflow_employee_directory_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Employee ID',
        'Full Name',
        'Designation',
        'Department',
        'Employment Type',
        'Project',
        'Site',
        'Reporting Manager',
        'Joining Date',
        'Status',
        'Contact',
      ],
      filtered.map((e) => [
        e.employeeCode,
        e.fullName,
        e.designationTitle,
        e.departmentName,
        e.employmentType,
        e.projectName,
        e.siteName,
        e.reportingManagerName,
        e.joiningDate,
        e.employmentStatus,
        can('employees.sensitive_view') ? e.phone : 'Restricted',
      ])
    );
    toast.success(`Exported ${filtered.length} directory records to CSV.`);
  };

  const uniqueSites = Array.from(new Set(projectSites.map((p) => p.siteName)));

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B4D]">Direct Workforce Directory</h2>
          <p className="text-xs text-[#64748B]">
            Showing <strong className="font-mono tabular-nums text-[#172B4D]">{filtered.length}</strong> of{' '}
            <span className="font-mono tabular-nums">{employees.length}</span> direct employees · Contractor personnel managed separately
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden md:flex items-center p-1 bg-white border border-slate-200 rounded-md">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#101F35] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          {can('onboarding.manage') && (
            <Button size="sm" onClick={() => navigate('/onboarding?new=1')}>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Onboard Employee</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search & Multi-Facet Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, employee ID, phone, email, or designation..."
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Employment Statuses</option>
            <option value="Active">Active (Incl. Confirmed/Probation)</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Probation">Probation</option>
            <option value="On Leave">On Leave</option>
            <option value="Notice Period">Notice Period</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Terminated">Terminated</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Employment Types</option>
            <option value="Permanent">Permanent</option>
            <option value="Contractual">Contractual</option>
            <option value="Temporary">Temporary</option>
            <option value="Daily Wage">Daily Wage</option>
            <option value="Hourly">Hourly</option>
            <option value="Weekly Wage">Weekly Wage</option>
            <option value="Piece Rate">Piece Rate</option>
            <option value="Project Based">Project Based</option>
            <option value="Intern / Trainee">Intern / Trainee</option>
            <option value="Contractor Personnel">Contractor Personnel</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>

          <Select
            value={desigFilter}
            onChange={(e) => {
              setDesigFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Designations</option>
            {designations.map((d) => (
              <option key={d.id} value={d.title}>
                {d.title}
              </option>
            ))}
          </Select>

          <Select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Projects</option>
            {projectSites.map((p) => (
              <option key={p.id} value={p.projectName}>
                {p.projectName}
              </option>
            ))}
          </Select>

          <Select
            value={siteFilter}
            onChange={(e) => {
              setSiteFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Sites</option>
            {uniqueSites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <Input
              value={tradeFilter}
              onChange={(e) => {
                setTradeFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Skill / Trade..."
            />
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No matching employees found"
          description="Try clearing one or more project, employment type, or status filters."
          actionLabel="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          {viewMode === 'table' && (
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-[#64748B]">
                      <th className="py-2.5 px-4">
                        <button onClick={() => toggleSort('employeeCode')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#172B4D]">
                          <span>Employee ID</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 px-4">
                        <button onClick={() => toggleSort('fullName')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#172B4D]">
                          <span>Employee</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 px-4">Designation & Dept</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">
                        <button onClick={() => toggleSort('projectName')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#172B4D]">
                          <span>Project & Site</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 px-4">Reporting Manager</th>
                      <th className="py-2.5 px-4">
                        <button onClick={() => toggleSort('joiningDate')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#172B4D]">
                          <span>Joined</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginated.map((emp: Employee) => (
                      <tr
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono tabular-nums font-medium text-[#172B4D] whitespace-nowrap">
                          {emp.employeeCode}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={emp.fullName} src={emp.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <div className="font-semibold text-[#172B4D] truncate">{emp.fullName}</div>
                              <div className="text-[11px] text-[#64748B] truncate">{emp.skillOrTrade}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-[#172B4D]">{emp.designationTitle}</div>
                          <div className="text-[11px] text-[#64748B]">{emp.departmentName}</div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-[#172B4D]">{emp.employmentType}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-[#172B4D]">{emp.projectName}</div>
                          <div className="text-[11px] text-[#64748B]">{emp.siteName}</div>
                        </td>
                        <td className="py-2.5 px-4 text-[#172B4D] whitespace-nowrap">{emp.reportingManagerName}</td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-[#64748B] whitespace-nowrap">{emp.joiningDate}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <StatusBadge label={emp.employmentStatus} />
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                          {can('employees.sensitive_view') ? emp.phone : '•••• ••' + emp.phone.slice(-4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Card View (Always rendered on mobile <768px, optional on desktop) */}
          <div className={viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-3 md:hidden'}>
            {paginated.map((emp) => (
              <Card
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="p-4 hover:border-[#2563EB]/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={emp.fullName} src={emp.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#172B4D] truncate">{emp.fullName}</div>
                      <div className="text-xs text-[#64748B] truncate">
                        {emp.designationTitle} · {emp.departmentName}
                      </div>
                    </div>
                  </div>
                  <StatusBadge label={emp.employmentStatus} />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#64748B]">Employee ID</span>
                    <span className="font-mono tabular-nums font-medium text-[#172B4D]">{emp.employeeCode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#64748B]">Category</span>
                    <span className="text-[#172B4D]">{emp.employmentType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#64748B]">Project</span>
                    <span className="text-[#172B4D] truncate max-w-[60%] text-right">{emp.projectName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#64748B]">Manager</span>
                    <span className="text-[#172B4D]">{emp.reportingManagerName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#64748B] flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Contact
                    </span>
                    <span className="font-mono text-[#172B4D]">
                      {can('employees.sensitive_view') ? emp.phone : '•••• ••' + emp.phone.slice(-4)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-[#64748B]">
            <span className="tabular-nums">
              Page {safePage} of {totalPages} · {filtered.length} records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
