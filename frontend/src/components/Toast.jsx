// ============================================
// HerGuardian — Toast Notification Component
// ============================================

const Toast = ({ message, type }) => {
  const colors = {
    sos:     'linear-gradient(135deg,#cc1144,#8c0030)',
    success: 'linear-gradient(135deg,#4a7a56,#2d5a3d)',
    info:    'linear-gradient(135deg,#e8758a,#c9728a)',
  };

  return (
    <div style={{
      position: 'fixed',
      top: '90px',
      right: '24px',
      zIndex: 99999,
      background: colors[type] || colors.info,
      color: 'white',
      padding: '18px 28px',
      borderRadius: '18px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 600,
      boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      animation: 'slideIn 0.4s cubic-bezier(.34,1.56,.64,1) both',
      maxWidth: '340px',
      lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
};

export default Toast;
