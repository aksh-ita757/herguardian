// ============================================
// HerGuardian — Footer with all working links
// ============================================
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>

      <div className={styles.brand}>
        <div className={styles.logo}>🌸 HerGuardian</div>
        <p className={styles.tagline}>Built with love for every woman's safety, health, and empowerment. Free forever for those who need it.</p>
        <div className={styles.badges}>
          <span className={styles.badge}>🔒 SSL Secured</span>
          <span className={styles.badge}>🇮🇳 Made in India</span>
          <span className={styles.badge}>💜 Free Forever</span>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.col}>
          <div className={styles.colTitle}>Platform</div>
          <Link to="/"          className={styles.link}>Home</Link>
          <Link to="/auth"      className={styles.link}>Sign In / Register</Link>
          <Link to="/dashboard" className={styles.link}>Dashboard</Link>
          <a href="#modules"    className={styles.link}>Features</a>
          <a href="#sos"        className={styles.link}>SOS Alert</a>
          <a href="#health"     className={styles.link}>Health Hub</a>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Emergency Helplines</div>
          <a href="tel:181"          className={styles.helpline}><span>181</span> Mahila Helpline</a>
          <a href="tel:100"          className={styles.helpline}><span>100</span> Police</a>
          <a href="tel:112"          className={styles.helpline}><span>112</span> National Emergency</a>
          <a href="tel:7827170170"   className={styles.helpline}><span>7827170170</span> NCW</a>
          <a href="tel:1091"         className={styles.helpline}><span>1091</span> Women Helpline</a>
          <a href="tel:9152987821"   className={styles.helpline}><span>9152987821</span> iCall Mental Health</a>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Legal Resources</div>
          <a href="https://legislative.gov.in/sites/default/files/A2013-14.pdf" target="_blank" rel="noreferrer" className={styles.link}>POSH Act 2013 (Full Text)</a>
          <a href="https://legislative.gov.in/sites/default/files/A2012-32.pdf"  target="_blank" rel="noreferrer" className={styles.link}>POCSO Act 2012 (Full Text)</a>
          <a href="https://wcd.nic.in/act/protection-women-domestic-violence-act-2005" target="_blank" rel="noreferrer" className={styles.link}>Domestic Violence Act 2005</a>
          <a href="https://ncw.nic.in" target="_blank" rel="noreferrer" className={styles.link}>NCW — National Commission for Women</a>
          <a href="https://wcd.nic.in/schemes/one-stop-centre-scheme" target="_blank" rel="noreferrer" className={styles.link}>One Stop Centres (Sakhi)</a>
          <a href="https://nalsa.gov.in" target="_blank" rel="noreferrer" className={styles.link}>NALSA — Free Legal Aid</a>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Support & Safety</div>
          <a href="https://icallhelpline.org"         target="_blank" rel="noreferrer" className={styles.link}>iCall Mental Health</a>
          <a href="https://vandrevalafoundation.com"  target="_blank" rel="noreferrer" className={styles.link}>Vandrevala Foundation</a>
          <a href="https://nimhans.ac.in"             target="_blank" rel="noreferrer" className={styles.link}>NIMHANS Mental Health</a>
          <a href="https://wcd.nic.in"                target="_blank" rel="noreferrer" className={styles.link}>Ministry of Women & Child Dev</a>
          <a href="https://cybercrime.gov.in"         target="_blank" rel="noreferrer" className={styles.link}>Cyber Crime Portal</a>
          <a href="https://nalsa.gov.in/lsams"        target="_blank" rel="noreferrer" className={styles.link}>Free Legal Aid Locator</a>
        </div>
      </div>
    </div>

    <div className={styles.bottom}>
      <div className={styles.bottomLeft}>
        © 2026 HerGuardian · All Rights Reserved · Built by <strong>The Techies</strong>
      </div>
      <div className={styles.bottomRight}>
        <span>Aryan Tomar</span>
        <span>·</span>
        <span>Akshita Bhardwaj</span>
        <span>·</span>
        <span>Devika Sharma</span>
      </div>
    </div>
  </footer>
);

export default Footer;
