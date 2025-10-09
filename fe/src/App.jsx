// App.jsx - Using React Router DOM
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/DashBoard';
import { SensorProvider } from './contexts/SensorContextSimple';

import DeviceHistory from './pages/DeviceHistory';
import SensorHistory from './pages/SensorHistory';
import ProfilePage from './pages/Profile';
import Settings from './pages/Settings';
import AuthenPage from './pages/AuthenPage';
import LoginLayout from './layouts/loginLayout';

const App = () => {
  return (
    <Router>
      <SensorProvider>
        <Routes>
          {/* Routes with AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/device-history" element={<DeviceHistory />} />
            <Route path="/sensor-history" element={<SensorHistory />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<LoginLayout />}>
            <Route path="/login" element={<AuthenPage />} />
          </Route>
        </Routes>
      </SensorProvider>
    </Router>
  );
};

export default App;