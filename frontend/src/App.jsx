// ============================================
// HerGuardian — App.jsx (Main Router)
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar      from './components/Navbar';
import Home        from './pages/Home';
import Auth        from './pages/Auth';
import Dashboard   from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:"'Playfair Display',serif",color:'var(--rose)',fontSize:'1.5rem'}}>
      🌸 Loading HerGuardian...
    </div>
  );
  return user ? children : <Navigate to="/auth" />;
};

const App = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/auth"          element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/verify-email"  element={<VerifyEmail />} />
        <Route path="/dashboard"     element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;
