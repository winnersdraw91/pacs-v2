import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { RadiologistDashboard } from './dashboards/RadiologistDashboard';
import { TechnicianDashboard } from './dashboards/TechnicianDashboard';
import { DiagnosticCentreDashboard } from './dashboards/DiagnosticCentreDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'radiologist':
      return <RadiologistDashboard />;
    case 'technician':
      return <TechnicianDashboard />;
    case 'diagnostic_centre':
      return <DiagnosticCentreDashboard />;
    default:
      return <div>Unknown role</div>;
  }
};
