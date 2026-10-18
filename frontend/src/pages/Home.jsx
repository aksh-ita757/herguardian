// ============================================
// HerGuardian — Home Page
// Assembles all section components
// ============================================

import { useState, useCallback } from 'react';
import Hero          from '../components/Hero';
import Modules       from '../components/Modules';
import SOSSection    from '../components/SOSSection';
import HealthSection from '../components/HealthSection';
import LegalSection  from '../components/LegalSection';
import MentalSection from '../components/MentalSection';
import Footer        from '../components/Footer';
import Toast         from '../components/Toast';

const Home = () => {
  const [toast, setToast] = useState(null);

  // showToast: message, type ('sos' | 'success' | 'info')
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <Hero          onSOS={() => showToast('🚨 SOS Alert Sent! Your location has been shared with 5 contacts.', 'sos')} />
      <Modules />
      <SOSSection    showToast={showToast} />
      <HealthSection showToast={showToast} />
      <LegalSection />
      <MentalSection showToast={showToast} />
      <Footer />
    </>
  );
};

export default Home;
