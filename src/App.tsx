import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'


import ServicesPage from '@/features/services/ServicesPage'
import ClinicPage from '@/features/clinic/ClinicPage'
import ProfessionalsPage from '@/features/professionals/ProfessionalsPage'
import BlocksPage from '@/features/blocks/BlocksPage'
import UsersPage from '@/features/users/UsersPage'
import AgendaPage from '@/features/appointments/AgendaPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import AppointmentsPage from '@/features/appointments/AppointmentsPage'
import PatientsPage from '@/features/patients/PatientsPage'
import BookingPage from '@/features/booking/BookingPage'
import AppointmentPage from '@/features/booking/AppointmentPage'

// Guarda em memória os dados já buscados, para as telas abrirem rápido.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Páginas públicas de agendamento (sem login) */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/c/:slug" element={<BookingPage />} />
            <Route path="/c/:slug/agendamento/:token" element={<AppointmentPage />} />
            {/* Telas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

            {/* Telas internas: exigem login */}
            <Route path="/app" element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="agendamentos" element={<AppointmentsPage />} />

                {/* Somente administrador e recepção */}
                <Route element={<RequireRole allow={['admin', 'receptionist']} />}>
                  <Route path="pacientes" element={<PatientsPage />} />
                  <Route path="profissionais" element={<ProfessionalsPage />} />
                  <Route path="servicos" element={<ServicesPage />} />
                  <Route path="bloqueios" element={<BlocksPage />} />
                </Route>

                {/* Somente administrador */}
                <Route element={<RequireRole allow={['admin']} />}>
                  <Route path="clinica" element={<ClinicPage />} />
                  <Route path="usuarios" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
