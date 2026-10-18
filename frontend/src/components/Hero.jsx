// ============================================
// HerGuardian — Hero Component
// ============================================

import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

const Hero = ({ onSOS }) => {
  return (
    <section className={styles.hero} id="home">
      {/* Animated background */}
      <div className={styles.heroBg}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`${styles.petalFloat} ${styles[`petal${i+1}`]}`} />
        ))}
      </div>

      {/* Left content */}
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot}></span>
          Your safety companion
        </div>

        <h1>
          Safety, Health &amp;<br />
          <em>Empowerment</em><br />
          — in one place.
        </h1>

        <p className={styles.heroDesc}>
          HerGuardian is a unified platform built for women — emergency SOS alerts,
          cycle tracking, legal awareness, and mental wellness support, all under
          a single, beautiful home.
        </p>

        <div className={styles.heroActions}>
          <Link to="/auth" className="btn-primary">
            🛡 Join HerGuardian
          </Link>
          <a href="#modules" className="btn-secondary">
            Explore Features →
          </a>
        </div>
      </div>

      {/* Right floating SOS card */}
      <div className={styles.heroVisual}>
        <div className={styles.sosCard}>
          <div className={styles.sosCardLabel}>🛡 Emergency SOS</div>
          <div className={styles.sosBtnWrap}>
            <button className={styles.sosButton} onClick={onSOS}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.07 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/>
              </svg>
              SOS
              <span>Tap to alert</span>
            </button>
          </div>
          <div className={styles.contactsRow}>
            {['Mom', 'Sara', 'Riya'].map((name, i) => (
              <div key={i} className={styles.contactChip}>
                <div className={styles.contactDot} style={{background: ['#e8758a','#c9728a','#a8c5b0'][i]}}>
                  {name[0]}
                </div>
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
