// ============================================
// HerGuardian — Navbar  (fixed anchor links)
// ============================================
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  // Smooth scroll to section on Home page; navigate first if on another page
  const scrollTo = (id) => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 200);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
        Her<span>Guardian</span>
      </Link>

      {/* Hamburger for mobile */}
      <button className={styles.burger} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        {menuOpen ? '✕' : '☰'}
      </button>

      <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <li><button className={styles.navLink} onClick={() => scrollTo('modules')}>Features</button></li>
        <li><button className={styles.navLink} onClick={() => scrollTo('sos')}>SOS Alert</button></li>
        <li><button className={styles.navLink} onClick={() => scrollTo('health')}>Health</button></li>
        <li><button className={styles.navLink} onClick={() => scrollTo('legal')}>Legal</button></li>
        <li><button className={styles.navLink} onClick={() => scrollTo('mental')}>Wellness</button></li>
        {user ? (
          <>
            <li><Link to="/dashboard" className={styles.navLink} onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
            <li><button className={styles.cta} onClick={handleLogout}>Sign Out</button></li>
          </>
        ) : (
          <li><Link to="/auth" className={styles.cta} onClick={() => setMenuOpen(false)}>Get Started</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
