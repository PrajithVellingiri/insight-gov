import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public pages
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import RegisterPage from '@/pages/public/RegisterPage';

// Citizen pages
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import SubmitPetition from '@/pages/citizen/SubmitPetition';
import PetitionStatus from '@/pages/citizen/PetitionStatus';

// Officer pages
import OfficerDashboard from '@/pages/officer/OfficerDashboard';
import PetitionReview from '@/pages/officer/PetitionReview';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import DepartmentManagement from '@/pages/admin/DepartmentManagement';
import OfficerManagement from '@/pages/admin/OfficerManagement';

// Layout
import PageWrapper from '@/components/layout/PageWrapper';

const router = createBrowserRouter([
  // Public
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Citizen routes
  {
    element: <ProtectedRoute allowedRoles={['citizen']} />,
    children: [
      {
        element: <PageWrapper role="citizen" />,
        children: [
          { path: '/citizen/dashboard', element: <CitizenDashboard /> },
          { path: '/citizen/petitions/new', element: <SubmitPetition /> },
          { path: '/citizen/petitions/:id', element: <PetitionStatus /> },
        ],
      },
    ],
  },

  // Officer routes
  {
    element: <ProtectedRoute allowedRoles={['officer']} />,
    children: [
      {
        element: <PageWrapper role="officer" />,
        children: [
          { path: '/officer/dashboard', element: <OfficerDashboard /> },
          { path: '/officer/petitions/:id', element: <PetitionReview /> },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <PageWrapper role="admin" />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboard /> },
          { path: '/admin/departments', element: <DepartmentManagement /> },
          { path: '/admin/officers', element: <OfficerManagement /> },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
