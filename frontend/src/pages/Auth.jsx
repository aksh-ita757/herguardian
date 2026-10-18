// ============================================
// HerGuardian — Auth Page
// Login + Register + Email Verification flow
// ============================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';
import { apiUrl } from '../config';

const Auth = () => {
  const [tab,     setTab]     = useState('login');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending,   setResending]   = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm,   setRegForm]   = useState({ name: '', email: '', phone: '', password: '' });

  // ── LOGIN ─────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = await login(loginForm.email, loginForm.password);
      if (data.user && !data.user.isEmailVerified) {
        setShowVerifyBanner(true);
        setResendEmail(loginForm.email);
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── REGISTER ──────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await register(regForm.name, regForm.email, regForm.phone, regForm.password);
      setResendEmail(regForm.email);
      setShowVerifyBanner(true);
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── RESEND VERIFICATION ───────────────────
  const handleResend = async () => {
    setResending(true); setError(''); setSuccess('');
    try {
      const res = await fetch(apiUrl('/api/auth/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Verification email resent! Check your inbox.');
      } else {
        setError(data.error || 'Could not resend email.');
      }
    } catch {
      setError('Could not resend email. Please try again.');
    } finally { setResending(false); }
  };

  // ── EMAIL VERIFICATION BANNER ─────────────
  if (showVerifyBanner) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.leftSide}>
            <Link to="/" className={styles.backLink}>← Back to Home</Link>
            <div className="section-eyebrow">Almost there!</div>
            <h2 className="section-title">Check your<br />inbox.</h2>
            <p className="section-subtitle">We've sent a verification link to your email. Click it to activate your account and unlock all features.</p>
          </div>
          <div className={styles.formCard}>
            <div className={styles.verifyBox}>
              <div className={styles.verifyIcon}>📧</div>
              <h3 className={styles.verifyTitle}>Verify your email</h3>
              <p className={styles.verifySub}>
                We sent a verification link to <strong>{resendEmail}</strong>.
                Please click the link in that email to confirm your account.
              </p>
              {error   && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.successMsg}>{success}</div>}
              <div className={styles.verifyActions}>
                <button
                  className={styles.submit}
                  onClick={handleResend}
                  disabled={resending}
                  style={{ marginBottom: '12px' }}
                >
                  {resending ? 'Sending...' : '🔄 Resend verification email'}
                </button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => { setShowVerifyBanner(false); setTab('login'); setError(''); setSuccess(''); }}
                >
                  ← Back to Sign In
                </button>
              </div>
              <p className={styles.verifyNote}>
                Already verified?{' '}
                <button className={styles.inlineLink} onClick={() => { setShowVerifyBanner(false); setTab('login'); }}>
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN AUTH FORM ────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Left side */}
        <div className={styles.leftSide}>
          <Link to="/" className={styles.backLink}>← Back to Home</Link>
          <div className="section-eyebrow">Join Us</div>
          <h2 className="section-title">Your safe space<br />starts here.</h2>
          <p className="section-subtitle">Create a free account to access all five modules. Your data is encrypted, private, and always yours.</p>

          <div className={styles.features}>
            {[
              { icon:'🔒', title:'JWT-secured authentication', desc:'Your account is protected with encrypted tokens' },
              { icon:'📧', title:'Email verification', desc:'Verify your account for full access to all safety features' },
              { icon:'🌸', title:'Private by design', desc:'Your health and mood data stays completely private' },
              { icon:'💜', title:'Always free for women in need', desc:'Core safety features are and will remain free' },
            ].map(f => (
              <div key={f.title} className={styles.feature}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div>
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className={styles.formCard}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab==='login'?styles.active:''}`}
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            >Sign In</button>
            <button
              className={`${styles.tab} ${tab==='register'?styles.active:''}`}
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
            >Create Account</button>
          </div>

          {error   && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email" className="form-input" placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password" className="form-input" placeholder="Your password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In to HerGuardian →'}
              </button>
              <p className={styles.switchHint}>
                Not verified yet?{' '}
                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => { setShowVerifyBanner(true); setResendEmail(loginForm.email); }}
                >
                  Resend verification email
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text" className="form-input" placeholder="Your name"
                  value={regForm.name}
                  onChange={e => setRegForm({...regForm, name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email" className="form-input" placeholder="you@example.com"
                  value={regForm.email}
                  onChange={e => setRegForm({...regForm, email: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel" className="form-input" placeholder="+91 98765 43210"
                  value={regForm.phone}
                  onChange={e => setRegForm({...regForm, phone: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Create Password</label>
                <input
                  type="password" className="form-input" placeholder="Min. 8 characters"
                  value={regForm.password}
                  onChange={e => setRegForm({...regForm, password: e.target.value})}
                  required minLength={8}
                />
              </div>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? 'Creating account...' : 'Create My Account →'}
              </button>
              <p className={styles.switchHint}>
                A verification email will be sent after registration.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
