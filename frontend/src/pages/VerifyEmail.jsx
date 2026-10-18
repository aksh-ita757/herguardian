// ============================================
// HerGuardian — Email Verification Landing Page
// User arrives here after clicking the link
// ============================================

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';
import { apiUrl } from '../config';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status,  setStatus]  = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const { login: setAuthUser } = useAuth();

  const ranOnce = useRef(false); // React StrictMode runs effects twice in dev; the token is single-use

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link. Please request a new one.');
      return;
    }

    const verify = async () => {
      try {
        const res  = await fetch(apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`));
        const data = await res.json();

        if (data.success) {
          // Store token + user in auth context
          if (data.token) {
            localStorage.setItem('herguardian_token', data.token);
            // Small delay then redirect to dashboard
            setStatus('success');
            setMessage(data.message || 'Email verified successfully!');
            // Full page load (not client-side navigate) so the auth context re-reads the new token
            // and the dashboard shows the account as verified.
            setTimeout(() => window.location.assign('/dashboard'), 2500);
          } else {
            setStatus('success');
            setMessage('Email verified! You can now sign in.');
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Verification failed. Please try again or request a new link.');
      }
    };

    verify();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.inner} style={{ justifyContent: 'center' }}>
        <div className={styles.formCard} style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

          {status === 'loading' && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌸</div>
              <h2 className={styles.verifyTitle}>Verifying your email…</h2>
              <p className={styles.verifySub}>Please wait a moment.</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>✅</div>
              <h2 className={styles.verifyTitle} style={{ color: '#2d6e45' }}>Email Verified!</h2>
              <p className={styles.verifySub}>{message}</p>
              <p className={styles.verifySub} style={{ fontSize: '0.8rem' }}>
                Redirecting you to your dashboard in 3 seconds…
              </p>
              <Link to="/dashboard" className={styles.submit} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}>
                Go to Dashboard →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>❌</div>
              <h2 className={styles.verifyTitle} style={{ color: '#c0392b' }}>Verification Failed</h2>
              <p className={styles.verifySub}>{message}</p>
              <Link to="/auth" className={styles.submit} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}>
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
