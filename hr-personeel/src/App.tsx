import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './auth/AuthProvider';
import { PersoneelProvider } from './context/PersoneelContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PersoneelLijst from './pages/PersoneelLijst';
import Validatie from './pages/Validatie';
import Uitnodigingen from './pages/Uitnodigingen';
import Rollen from './pages/Rollen';
import ADImport from './pages/ADImport';
import DistributieGroepen from './pages/DistributieGroepen';
import SectorHierarchy from './pages/SectorHierarchy';
import Vrijwilligers from './pages/Vrijwilligers';
import SyncGeschiedenis from './pages/SyncGeschiedenis';
import AuditLog from './pages/AuditLog';
import AutoRoltoewijzing from './pages/AutoRoltoewijzing';
import Licenties from './pages/Licenties';
// New pages
import Onboarding from './pages/Onboarding';
import OnboardingDetail from './pages/OnboardingDetail';
import OnboardingTemplates from './pages/OnboardingTemplates';
import ApplicatieToegang from './pages/ApplicatieToegang';
import Infrastructuur from './pages/Infrastructuur';
import Materiaal from './pages/Materiaal';
import Functieprofielen from './pages/Functieprofielen';

export default function App() {
  return (
    <ProtectedRoute>
      <PersoneelProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              {/* Medewerkers */}
              <Route path="/personeel" element={<PersoneelLijst />} />
              <Route path="/vrijwilligers" element={<Vrijwilligers />} />
              <Route path="/validatie" element={<Validatie />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/onboarding/:id" element={<OnboardingDetail />} />
              <Route path="/onboarding/templates" element={<OnboardingTemplates />} />
              {/* Toegang & Licenties */}
              <Route path="/licenties" element={<Licenties />} />
              <Route path="/applicaties" element={<ApplicatieToegang />} />
              <Route path="/infrastructuur" element={<Infrastructuur />} />
              <Route path="/materiaal" element={<Materiaal />} />
              {/* Rollen & Rechten */}
              <Route path="/rollen" element={<Rollen />} />
              <Route path="/auto-roltoewijzing" element={<AutoRoltoewijzing />} />
              <Route path="/functieprofielen" element={<Functieprofielen />} />
              {/* Organisatie */}
              <Route path="/sectoren" element={<SectorHierarchy />} />
              <Route path="/distributiegroepen" element={<DistributieGroepen />} />
              <Route path="/uitnodigingen" element={<Uitnodigingen />} />
              {/* Systeem */}
              <Route path="/sync" element={<SyncGeschiedenis />} />
              <Route path="/import" element={<ADImport />} />
              <Route path="/audit" element={<AuditLog />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PersoneelProvider>
    </ProtectedRoute>
  );
}
