import tls from 'tls';

const host = 'aws-1-ap-northeast-1.pooler.supabase.com';
const port = 6543;

console.log('[TLS PROBE] Connecting...', { host, port });

const socket = tls.connect({
  host,
  port,
  servername: host,
  rejectUnauthorized: false,
}, () => {
  const cert = socket.getPeerCertificate();
  console.log('[TLS PROBE] Handshake OK');
  console.log('[TLS PROBE] Authorized:', socket.authorized);
  console.log('[TLS PROBE] Protocol:', socket.getProtocol());
  console.log('[TLS PROBE] Cert Subject:', cert?.subject);
  socket.end();
});

socket.setTimeout(8000, () => {
  console.error('[TLS PROBE] Timeout');
  socket.destroy();
});

socket.on('error', (err) => {
  console.error('[TLS PROBE] Error:', {
    message: err.message,
    code: (err as any).code,
    cause: (err as any).cause,
  });
});

socket.on('close', (hadError) => {
  console.log('[TLS PROBE] Closed', { hadError });
});
