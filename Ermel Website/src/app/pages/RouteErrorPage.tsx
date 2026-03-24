import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Page Not Found';
  let subtitle = 'The page you requested could not be found.';
  let code = '404';

  if (isRouteErrorResponse(error)) {
    code = String(error.status);
    if (error.status >= 500) {
      title = 'Something Went Wrong';
      subtitle = 'The server encountered an issue. Please try again in a moment.';
    } else if (error.status === 403) {
      title = 'Access Forbidden';
      subtitle = 'You do not have permission to view this page.';
    } else if (error.status === 401) {
      title = 'Authentication Required';
      subtitle = 'Please sign in and try again.';
    }
  }

  const handleGoBack = () => {
    const lastGoodPath = sessionStorage.getItem('ermel.last.good.path');
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (lastGoodPath && lastGoodPath !== currentPath) {
      navigate(lastGoodPath, { replace: true });
      return;
    }

    navigate('/');
  };

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
          Error {code}
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
          {title}
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
          {subtitle}
        </p>

        <button
          onClick={handleGoBack}
          style={{
            display: 'inline-block',
            border: 'none',
            background: 'linear-gradient(135deg, #15263c, #244061)',
            color: 'white',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '13px',
            borderRadius: '8px',
            padding: '12px 18px',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
