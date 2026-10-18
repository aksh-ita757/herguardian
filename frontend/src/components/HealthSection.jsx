// ============================================
// HerGuardian — Health Section Component
// Cycle Tracker + Mood Journal + Articles
// ============================================

import { useState } from 'react';
import styles from './HealthSection.module.css';

const ARTICLES = [
  { title: 'Understanding Your Menstrual Cycle', source: 'Healthline', url: 'https://www.healthline.com/health/womens-health/stages-of-menstrual-cycle' },
  { title: 'PCOS Symptoms, Diagnosis & Treatment', source: 'Mayo Clinic', url: 'https://www.mayoclinic.org/diseases-conditions/pcos/symptoms-causes/syc-20353439' },
  { title: 'Iron Deficiency Anaemia in Women', source: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/anaemia' },
  { title: 'Cervical Cancer Screening Guidelines', source: 'NHP India', url: 'https://www.nhp.gov.in/disease/gynaecological/cervical-cancer' },
  { title: 'PCOS & Fertility: What You Need to Know', source: 'NHS UK', url: 'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/treatment/' },
  { title: 'Endometriosis Explained', source: 'Endometriosis UK', url: 'https://www.endometriosis-uk.org/understanding-endometriosis' },
  { title: 'Thyroid Disease in Women', source: 'NIH', url: 'https://www.nichd.nih.gov/health/topics/thyroid/conditioninfo' },
  { title: 'Tracking Ovulation for Fertility', source: 'Clearblue', url: 'https://www.clearblue.com/how-to-get-pregnant/ovulation-signs-and-symptoms' },
];

const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MOODS  = [
  { key:'happy', emoji:'😊' },
  { key:'tired', emoji:'😴' },
  { key:'anxious', emoji:'😰' },
  { key:'sad', emoji:'😔' },
  { key:'energized', emoji:'⚡' },
  { key:'calm', emoji:'🌸' },
];

// Day types for demo calendar
const DAY_TYPES = {
  3:'period', 4:'period', 5:'period', 6:'period', 7:'period',
  12:'fertile', 13:'fertile', 14:'ovulation', 15:'fertile', 16:'fertile', 17:'fertile',
  19:'today',
};

const HealthSection = ({ showToast }) => {
  const [selectedMood, setSelectedMood] = useState('happy');
  const [note, setNote] = useState('');

  const handleSaveMood = () => {
    showToast(`🌸 Mood logged: ${MOODS.find(m => m.key === selectedMood)?.emoji} Feeling ${selectedMood} today!`, 'success');
    setNote('');
  };

  return (
    <section id="health" className={styles.section}>
      <div className={styles.inner}>

        {/* Left — text + stats */}
        <div>
          <div className="section-eyebrow">Health Module</div>
          <h2 className="section-title">Your body.<br />Your rhythm.</h2>
          <p className="section-subtitle">
            Track your menstrual cycle with a beautiful visual calendar, log your daily mood
            with emoji journaling, and browse a curated library of health articles.
          </p>

          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Next Period</div>
              <div className={styles.statVal} style={{color:'var(--rose)'}}>8 days</div>
              <div className={styles.statBar}><div className={styles.statFill} style={{background:'var(--rose)',width:'72%'}} /></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Fertile Window</div>
              <div className={styles.statVal} style={{color:'#50c878'}}>Active</div>
              <div className={styles.statBar}><div className={styles.statFill} style={{background:'#50c878',width:'45%'}} /></div>
            </div>
          </div>
        </div>

        {/* Right — calendar + mood */}
        <div>
          {/* Cycle Calendar */}
          <div className={styles.calWidget}>
            <div className={styles.calTitle}>Cycle Tracker — February 2026</div>
            <div className={styles.calSub}>Tap a date to log symptoms</div>
            <div className={styles.calGrid}>
              {DAYS.map(d => <div key={d} className={styles.dayName}>{d}</div>)}
              {/* Empty cells for Feb start (Saturday) */}
              {[...Array(6)].map((_, i) => <div key={`empty-${i}`} />)}
              {[...Array(28)].map((_, i) => {
                const day = i + 1;
                const type = DAY_TYPES[day] || '';
                return (
                  <div
                    key={day}
                    className={`${styles.calDay} ${type ? styles[type] : ''}`}
                    onClick={() => showToast(`📅 Day ${day} selected`, 'info')}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className={styles.legend}>
              {[['var(--rose)','Period'],['rgba(168,197,176,0.5)','Fertile'],['rgba(212,149,106,0.4)','Ovulation'],['var(--rose)','Today (circle)']].map(([c, l]) => (
                <div key={l} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{background:c}} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Mood Journal */}
          <div className={styles.moodWidget}>
            <div className={styles.moodTitle}>🌙 Today's Mood Journal</div>
            <div className={styles.moodEmojis}>
              {MOODS.map(m => (
                <div
                  key={m.key}
                  className={`${styles.moodEmoji} ${selectedMood === m.key ? styles.active : ''}`}
                  onClick={() => setSelectedMood(m.key)}
                  title={m.key}
                >
                  {m.emoji}
                </div>
              ))}
            </div>
            <textarea
              className={`form-input ${styles.moodNote}`}
              rows={2}
              placeholder="How are you feeling today? Write anything..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button className="btn-primary" style={{marginTop:'12px',borderRadius:'12px',padding:'12px 24px'}} onClick={handleSaveMood}>
              Save Mood Entry
            </button>
          </div>
        </div>
      </div>

      {/* Articles Section — full width */}
      <div className={styles.articlesWrap}>
        <div className={styles.articlesHeader}>
          <span className={styles.articlesIcon}>📚</span>
          <div>
            <div className={styles.articlesTitle}>Women's Health Articles</div>
            <div className={styles.articlesSub}>Curated from trusted medical sources. Click any article to read on the original site.</div>
          </div>
        </div>
        <ul className={styles.articlesList}>
          {ARTICLES.map((a, i) => (
            <li key={i} className={styles.articleItem}>
              <span className={styles.articleBullet}>•</span>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.articleLink}
              >
                {a.title}
                <span className={styles.articleSource}>{a.source} →</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HealthSection;
