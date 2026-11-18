/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { AttendanceExceptionsPage } from '@/src/pages/AttendanceExceptionsPage';
import { AttendancePage } from '@/src/pages/AttendancePage';
import { ComplianceCentrePage } from '@/src/pages/ComplianceCentrePage';
import { ContractorWorkforcePage } from '@/src/pages/ContractorWorkforcePage';
import { DepartmentsDesignationsPage } from '@/src/pages/DepartmentsDesignationsPage';
import { EmployeeDirectoryPage } from '@/src/pages/EmployeeDirectoryPage';
import { EmployeeDocumentsPage } from '@/src/pages/EmployeeDocumentsPage';
import { EmployeeProfilePage } from '@/src/pages/EmployeeProfilePage';
import { EmploymentRecordsPage } from '@/src/pages/EmploymentRecordsPage';
import { HRReportsPage } from '@/src/pages/HRReportsPage';
import { HRRequestsPage } from '@/src/pages/HRRequestsPage';
import { HRSettingsPage } from '@/src/pages/HRSettingsPage';
import { LeaveManagementPage } from '@/src/pages/LeaveManagementPage';
import { NotificationsPage } from '@/src/pages/NotificationsPage';
import { OnboardingPage } from '@/src/pages/OnboardingPage';
import { OverviewPage } from '@/src/pages/OverviewPage';
import { ProfilePage } from '@/src/pages/ProfilePage';
import { TrainingCertificationsPage } from '@/src/pages/TrainingCertificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/employees" element={<EmployeeDirectoryPage />} />
            <Route path="/employees/:id" element={<EmployeeProfilePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/employment-records" element={<EmploymentRecordsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance-exceptions" element={<AttendanceExceptionsPage />} />
            <Route path="/leaves" element={<LeaveManagementPage />} />
            <Route path="/documents" element={<EmployeeDocumentsPage />} />
            <Route path="/contractors" element={<ContractorWorkforcePage />} />
            <Route path="/departments" element={<DepartmentsDesignationsPage />} />
            <Route path="/compliance" element={<ComplianceCentrePage />} />
            <Route path="/training" element={<TrainingCertificationsPage />} />
            <Route path="/requests" element={<HRRequestsPage />} />
            <Route path="/reports" element={<HRReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<HRSettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </AppShell>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
