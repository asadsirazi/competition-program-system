import { Navigate } from 'react-router-dom'
import PublicHome from '../views/PublicHome.jsx'
import PublicResultsGate from '../views/PublicResultsGate.jsx'
import PublicResults from '../views/PublicResults.jsx'
import AdminLayout from '../views/admin/AdminLayout.jsx'
import AdminLogin from '../views/admin/AdminLogin.jsx'
import AdminDashboard from '../views/admin/AdminDashboard.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import AcademicYears from '../views/admin/AcademicYears.jsx'
import Classes from '../views/admin/Classes.jsx'
import Subjects from '../views/admin/Subjects.jsx'
import Groups from '../views/admin/Groups.jsx'
import Teachers from '../views/admin/Teachers.jsx'
import Registrations from '../views/admin/Registrations.jsx'
import Marksheets from '../views/admin/Marksheets.jsx'
import MarksEntry from '../views/admin/MarksEntry.jsx'
import ResultsAdmin from '../views/admin/ResultsAdmin.jsx'

const routes = [
  {
    path: '/',
    element: <PublicHome />,
  },
  {
    path: '/results',
    element: <PublicResultsGate />,
  },
  {
    path: '/results/view',
    element: <PublicResults />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <AdminLogin /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'academic-years',
        element: (
          <ProtectedRoute>
            <AcademicYears />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes',
        element: (
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'subjects',
        element: (
          <ProtectedRoute>
            <Subjects />
          </ProtectedRoute>
        ),
      },
      {
        path: 'groups',
        element: (
          <ProtectedRoute>
            <Groups />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers',
        element: (
          <ProtectedRoute>
            <Teachers />
          </ProtectedRoute>
        ),
      },
      {
        path: 'registrations',
        element: (
          <ProtectedRoute>
            <Registrations />
          </ProtectedRoute>
        ),
      },
      {
        path: 'marksheets',
        element: (
          <ProtectedRoute>
            <Marksheets />
          </ProtectedRoute>
        ),
      },
      {
        path: 'marks-entry',
        element: (
          <ProtectedRoute>
            <MarksEntry />
          </ProtectedRoute>
        ),
      },
      {
        path: 'results',
        element: (
          <ProtectedRoute>
            <ResultsAdmin />
          </ProtectedRoute>
        ),
      },
    ],
  },
]

export default routes
