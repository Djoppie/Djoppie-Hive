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

export default function App() {
  return (
    <ProtectedRoute>
      <PersoneelProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/personeel" element={<PersoneelLijst />} />
              <Route path="/vrijwilligers" element={<Vrijwilligers />} />
              <Route path="/validatie" element={<Validatie />} />
              <Route path="/distributiegroepen" element={<DistributieGroepen />} />
              <Route path="/sectoren" element={<SectorHierarchy />} />
              <Route path="/uitnodigingen" element={<Uitnodigingen />} />
              <Route path="/rollen" element={<Rollen />} />
              <Route path="/import" element={<ADImport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PersoneelProvider>
    </ProtectedRoute>
  );
}
