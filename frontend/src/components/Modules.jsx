// ============================================
// HerGuardian — Modules Overview Component
// Shows all 5 feature modules as cards
// ============================================

import styles from './Modules.module.css';

const modules = [
  {
    id: 'sos', cls: 'sos', icon: '🚨', span: 2,
    title: 'SOS Emergency Alert',
    desc: 'Instantly broadcast your live GPS coordinates to up to 5 trusted contacts via SMS and email. In a crisis, every second counts — and HerGuardian responds in under 5 seconds.',
    tags: ['📍 Live GPS', '📲 SMS Alert', '📧 Email Alert', '👥 5 Contacts', '⚡ <5 sec Response'],
  },
  {
    id: 'health', cls: 'health', icon: '🌸', span: 1,
    title: 'Health Hub',
    desc: 'Track your cycle, log your moods, and access a curated health article library — all in one gentle space.',
    tags: ['🗓 Cycle Tracker', '😊 Mood Journal', '📚 Articles'],
  },
  {
    id: 'legal', cls: 'legal', icon: '⚖️', span: 1,
    title: 'Legal Awareness',
    desc: 'Understand your rights with plain-language summaries of POSH, POCSO, IPC, and more.',
    tags: ['📜 POSH / POCSO', '🏛 IPC Sections', '📞 Helplines'],
  },
  {
    id: 'mental', cls: 'mental', icon: '💆‍♀️', span: 2,
    title: 'Mental Wellness Corner',
    desc: "Browse vetted articles and calming videos, and connect with a moderated peer-support forum where you're never alone.",
    tags: ['🎥 Videos', '✍️ Articles', '💬 Peer Forum', '🤝 Community'],
  },
  {
    id: 'map', cls: 'map', icon: '🗺️', span: 1,
    title: 'Safety Map',
    desc: 'View crowd-sourced safety zones with live heatmaps and get safe-route suggestions.',
    tags: ['🌐 Live Map', '🔴 Risk Zones'],
  },
];

const Modules = () => (
  <section id="modules" className={styles.section}>
    <div className={styles.header}>
      <div className="section-eyebrow" style={{justifyContent:'center'}}>All-in-one platform</div>
      <h2 className="section-title" style={{textAlign:'center'}}>
        Everything she needs.<br />
        <em style={{fontStyle:'italic',color:'var(--rose)'}}>All in one place.</em>
      </h2>
      <p className="section-subtitle" style={{textAlign:'center', margin:'0 auto'}}>
        Five powerful modules designed to keep you safe, informed, and supported — every single day.
      </p>
    </div>

    <div className={styles.grid}>
      {modules.map((mod) => (
        <div
          key={mod.id}
          className={`${styles.card} ${styles[mod.cls]} ${mod.span === 2 ? styles.span2 : ''}`}
        >
          <div className={styles.icon}>{mod.icon}</div>
          <h3>{mod.title}</h3>
          <p>{mod.desc}</p>
          <div className={styles.tags}>
            {mod.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Modules;
