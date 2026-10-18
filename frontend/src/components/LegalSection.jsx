// ============================================
// HerGuardian — Legal Section (Landing Page)
// All links verified working as of 2026
// ============================================
import { useNavigate } from 'react-router-dom';
import styles from './LegalSection.module.css';

const laws = [
  {
    title: 'POSH Act, 2013',
    badge: 'Workplace',
    desc: 'Protects women from sexual harassment at the workplace. Mandates an Internal Complaints Committee in all organisations with 10+ employees.',
    url: 'https://legislative.gov.in/sites/default/files/A2013-14.pdf',
    label: 'Read Full Act (PDF)',
  },
  {
    title: 'POCSO Act, 2012',
    badge: 'Child Safety',
    desc: 'Protects children under 18 from sexual offences. All cases must be reported to police within 24 hours. Special courts for fast trials.',
    url: 'https://legislative.gov.in/sites/default/files/A2012-32.pdf',
    label: 'Read Full Act (PDF)',
  },
  {
    title: 'BNS Sections 63 & 74',
    badge: 'Criminal Law',
    desc: 'Section 74 covers assault with intent to outrage modesty. Section 63 defines rape with minimum 7-year imprisonment. Updated 2023.',
    url: 'https://legislative.gov.in/sites/default/files/2023-12/bharatiya-nyaya-sanhita.pdf',
    label: 'Read Bharatiya Nyaya Sanhita',
  },
];

const helplines = [
  { icon:'🚨', name:'Women Helpline',    desc:'24/7 Emergency Support',          num:'1091' },
  { icon:'👮‍♀️', name:'Police Emergency',  desc:'All India Emergency',             num:'100'  },
  { icon:'⚖️', name:'NCW Helpline',      desc:'National Commission for Women',   num:'7827170170' },
  { icon:'💛', name:'iCall Mental Health',desc:'TISS Counselling (Mon–Sat)',      num:'9152987821' },
  { icon:'🏠', name:'Mahila Helpline',   desc:'MWCD India · Domestic Violence',  num:'181'  },
  { icon:'🌐', name:'Cyber Crime',       desc:'Online abuse & harassment',       num:'1930' },
];

const LegalSection = () => {
  const navigate = useNavigate();
  return (
    <section id="legal" className={styles.section}>
      <div className={styles.inner}>
        <div>
          <div className="section-eyebrow">Legal Awareness</div>
          <h2 className="section-title">Know your rights.<br /><em style={{fontStyle:'italic',color:'var(--mauve)'}}>Simply.</em></h2>
          <p className="section-subtitle">Complex legislation translated into plain, accessible language. Because every woman deserves to know what protections she has.</p>

          <div className={styles.lawCards}>
            {laws.map(law => (
              <div key={law.title} className={styles.lawCard}>
                <div className={styles.lawTop}>
                  <h4>{law.title}</h4>
                  <span className={styles.lawBadge}>{law.badge}</span>
                </div>
                <p>{law.desc}</p>
                <a href={law.url} target="_blank" rel="noreferrer" className={styles.arrow}>
                  {law.label} →
                </a>
              </div>
            ))}
          </div>

          <div style={{marginTop:20}}>
            <button className="btn-secondary" onClick={() => navigate('/auth')}>
              📚 See full legal guide in Dashboard →
            </button>
          </div>
        </div>

        <div className={styles.helplineWidget}>
          <div className={styles.helplineTitle}>📞 National Helpline Directory</div>
          <div className={styles.helplineList}>
            {helplines.map(h => (
              <div key={h.name} className={styles.helplineItem}>
                <div className={styles.helplineLeft}>
                  <div className={styles.helplineIcon}>{h.icon}</div>
                  <div>
                    <div className={styles.helplineName}>{h.name}</div>
                    <div className={styles.helplineDesc}>{h.desc}</div>
                  </div>
                </div>
                <a href={`tel:${h.num}`} className={styles.helplineNum}>{h.num}</a>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,textAlign:'center'}}>
            <a href="https://ncw.nic.in" target="_blank" rel="noreferrer"
              style={{fontSize:'0.78rem',color:'var(--mauve)',fontWeight:600,textDecoration:'none'}}>
              More resources at ncw.nic.in →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegalSection;
