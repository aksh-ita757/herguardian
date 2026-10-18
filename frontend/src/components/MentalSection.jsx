// ============================================
// HerGuardian — Mental Wellness Section
// All resource links verified working 2026
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MentalSection.module.css';

// Real YouTube videos — verified accessible
const resources = [
  {
    emoji: '🧘‍♀️',
    type: 'YouTube · 8 min',
    title: '5-Minute Deep Breathing for Anxiety Relief',
    bg: 'linear-gradient(135deg,#fde8ee,#ffd6e4)',
    url: 'https://www.youtube.com/watch?v=tybOi4hjZFQ',
    play: '▶',
  },
  {
    emoji: '🌿',
    type: 'YouTube · 10 min',
    title: 'Guided Body Scan Meditation for Stress',
    bg: 'linear-gradient(135deg,#e8f3eb,#d4f0da)',
    url: 'https://www.youtube.com/watch?v=QS2yDmWk0vs',
    play: '▶',
  },
  {
    emoji: '💜',
    type: 'iCall Resource',
    title: 'Setting Boundaries — A Guide for Women',
    bg: 'linear-gradient(135deg,#ede4f7,#e0d4f7)',
    url: 'https://icallhelpline.org/resources/',
    play: '📖',
  },
];

const forumPosts = [
  { initial:'A', color:'linear-gradient(135deg,#e8758a,#c9728a)', name:'Anonymous',  time:'2h ago', tag:'Anxiety',    text:"Anyone else struggle with going home late at night? HerGuardian's SOS has given me so much peace of mind.", hearts:24, replies:8  },
  { initial:'P', color:'linear-gradient(135deg,#a8c5b0,#6a9e7a)', name:'Priya_S',    time:'5h ago', tag:'Legal Help', text:"The POSH module helped me understand what happened to me was NOT okay. Filing a complaint tomorrow. Thank you all. 💪", hearts:61, replies:22 },
  { initial:'R', color:'linear-gradient(135deg,#d4b8e0,#9a72c0)', name:'Rhea_M',     time:'1d ago', tag:'Self Care',  text:"The mood journal is my new ritual every night. Helps me track patterns. 🌸", hearts:38, replies:14 },
];

const MentalSection = ({ showToast }) => {
  const [liked, setLiked] = useState({});
  const navigate = useNavigate();

  const handleLike = (i) => setLiked(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <section id="mental" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <div className="section-eyebrow">Wellness Corner</div>
            <h2 className="section-title">You are never alone.</h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/auth')}>
            Browse all resources →
          </button>
        </div>

        {/* Resource cards — each opens real link */}
        <div className={styles.resourceGrid}>
          {resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer"
              className={styles.resourceCard} style={{textDecoration:'none',color:'inherit'}}>
              <div className={styles.thumbnail} style={{background:r.bg}}>
                <span>{r.emoji}</span>
                <div className={styles.playBtn}>{r.play}</div>
              </div>
              <div className={styles.resourceBody}>
                <div className={styles.resourceType}>{r.type}</div>
                <div className={styles.resourceTitle}>{r.title}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Crisis resources strip */}
        <div className={styles.crisisStrip}>
          <span className={styles.crisisLabel}>🆘 In crisis right now?</span>
          <a href="tel:9152987821" className={styles.crisisBtn}>iCall: 9152987821</a>
          <a href="tel:181"        className={styles.crisisBtn}>Mahila Helpline: 181</a>
          <a href="tel:112"        className={styles.crisisBtn}>National Emergency: 112</a>
          <a href="https://vandrevalafoundation.com" target="_blank" rel="noreferrer" className={styles.crisisLink}>
            Vandrevala Foundation →
          </a>
        </div>

        {/* Forum preview */}
        <div className={styles.forum}>
          <div className={styles.forumHeader}>
            <h3>💬 Peer Support Forum</h3>
            <button className="btn-secondary"
              style={{padding:'8px 20px',fontSize:'0.82rem'}}
              onClick={() => navigate('/auth')}>
              Join discussion →
            </button>
          </div>
          <div className={styles.posts}>
            {forumPosts.map((post, i) => (
              <div key={i} className={styles.post}>
                <div className={styles.avatar} style={{background:post.color}}>{post.initial}</div>
                <div className={styles.postContent}>
                  <div className={styles.postMeta}>
                    <span className={styles.postName}>{post.name}</span>
                    <span className={styles.postTime}>{post.time}</span>
                    <span className={styles.postTag}>{post.tag}</span>
                  </div>
                  <div className={styles.postText}>{post.text}</div>
                  <div className={styles.postLikes} onClick={() => handleLike(i)}>
                    <span>{liked[i] ? '💗' : '🤍'}</span>
                    {post.hearts + (liked[i] ? 1 : 0)} hearts · {post.replies} replies
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:14}}>
            <button className="btn-primary" onClick={() => navigate('/auth')}
              style={{padding:'10px 28px',fontSize:'0.88rem'}}>
              Sign Up to Join the Community →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MentalSection;
