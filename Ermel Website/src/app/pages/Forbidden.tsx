import { Link } from 'react-router';

export default function Forbidden() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #f4f7fb 0%, #eef2f7 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'white',
          border: '1px solid #dce4ee',
          borderRadius: '14px',
          boxShadow: '0 12px 42px rgba(21,38,60,0.12)',
          padding: '34px 28px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#7a0000',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 800,
            fontSize: '14px',
          }}
        >
          Error 403
        </p>

        <h1
          style={{
            margin: '10px 0 8px',
            color: '#15263c',
            fontFamily: 'var(--font-heading)',
            fontSize: '34px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Access Forbidden
        </h1>

        <p
          style={{
            margin: '0 0 22px',
            color: '#54667d',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            lineHeight: 1.7,
          }}
        >
          Your account does not have permission to view this page. If you believe this is a mistake,
          contact an administrator.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #15263c, #244061)',
            color: 'white',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '13px',
            borderRadius: '8px',
            padding: '12px 18px',
          }}
        >
          Go To Home
        </Link>
      </div>
    </div>
  );
}
