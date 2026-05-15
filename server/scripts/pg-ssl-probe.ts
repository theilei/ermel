import net from 'net';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[PG SSL PROBE] Missing DATABASE_URL in environment.');
  process.exit(1);
}

const url = new URL(connectionString);
const host = url.hostname;
const port = url.port ? parseInt(url.port, 10) : 5432;

console.log('[PG SSL PROBE] Connecting...', { host, port });

const socket = net.createConnection({ host, port });
let received = false;

socket.setTimeout(8000, () => {
  console.error('[PG SSL PROBE] Timeout waiting for response.');
  socket.destroy();
});

socket.on('connect', () => {
  const buffer = Buffer.alloc(8);
  buffer.writeInt32BE(8, 0);
  buffer.writeInt32BE(80877103, 4); // SSLRequest code
  socket.write(buffer);
});

socket.on('data', (data) => {
  received = true;
  const response = data.toString('utf8', 0, 1);
  if (response === 'S') {
    console.log('[PG SSL PROBE] Server supports SSL (S).');
  } else if (response === 'N') {
    console.log('[PG SSL PROBE] Server does NOT support SSL (N).');
  } else {
    console.log('[PG SSL PROBE] Unexpected response:', data.toString('hex'));
  }
  socket.end();
});

socket.on('error', (err) => {
  console.error('[PG SSL PROBE] Socket error:', {
    message: err.message,
    code: (err as any).code,
  });
});

socket.on('close', (hadError) => {
  if (!received) {
    console.log('[PG SSL PROBE] Closed without response.', { hadError });
  }
});
