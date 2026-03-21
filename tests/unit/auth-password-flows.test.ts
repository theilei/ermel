import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
  queryMock,
  clientQueryMock,
  clientReleaseMock,
  connectMock,
  bcryptCompareMock,
  bcryptHashMock,
  sendPasswordResetEmailMock,
  addLogMock,
} = vi.hoisted(() => ({
  queryMock: vi.fn(),
  clientQueryMock: vi.fn(),
  clientReleaseMock: vi.fn(),
  connectMock: vi.fn(),
  bcryptCompareMock: vi.fn(),
  bcryptHashMock: vi.fn(),
  sendPasswordResetEmailMock: vi.fn(),
  addLogMock: vi.fn(),
}));

vi.mock('../../server/src/config/database', () => ({
  default: {
    query: queryMock,
    connect: connectMock,
  },
}));

vi.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    compare: bcryptCompareMock,
    hash: bcryptHashMock,
  },
  compare: bcryptCompareMock,
  hash: bcryptHashMock,
}));

vi.mock('../../server/src/services/passwordResetEmailService', () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

vi.mock('../../server/src/services/verificationEmailService', () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock('../../server/src/models/ActivityLogDB', () => ({
  addLog: addLogMock,
}));

import {
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from '../../server/src/controllers/authController';

function makeRes() {
  return {
    statusCode: 200,
    body: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
}

describe('auth password flows', () => {
  beforeEach(() => {
    queryMock.mockReset();
    clientQueryMock.mockReset();
    clientReleaseMock.mockReset();
    connectMock.mockReset();
    bcryptCompareMock.mockReset();
    bcryptHashMock.mockReset();
    sendPasswordResetEmailMock.mockReset();
    addLogMock.mockReset();

    connectMock.mockResolvedValue({
      query: clientQueryMock,
      release: clientReleaseMock,
    });
    addLogMock.mockResolvedValue(undefined);
  });

  test('changePassword rejects wrong current password', async () => {
    const req: any = {
      body: {
        currentPassword: 'wrong-pass',
        newPassword: 'newPass123',
        confirmNewPassword: 'newPass123',
      },
      session: { userId: 'user-1' },
      sessionID: 'sid-current',
    };
    const res: any = makeRes();

    queryMock.mockResolvedValueOnce({ rows: [{ id: 'user-1', full_name: 'User', email: 'u@test.com', role: 'customer', password_hash: 'existing-hash' }] });
    bcryptCompareMock.mockResolvedValueOnce(false);

    await changePassword(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Current password is incorrect');
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  test('forgotPassword returns generic response for unknown email', async () => {
    const req: any = {
      body: { email: 'unknown@test.com' },
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res: any = makeRes();

    queryMock.mockResolvedValueOnce({ rows: [] });

    await forgotPassword(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('If an account with that email exists');
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  test('verifyResetToken returns valid for active token', async () => {
    const req: any = {
      query: { token: '1234567890abcdef1234567890abcdef' },
    };
    const res: any = makeRes();

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'token-1',
          user_id: 'user-1',
          used_at: null,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      ],
    });

    await verifyResetToken(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('resetPassword updates password, marks token used, and clears sessions', async () => {
    const req: any = {
      body: {
        token: '1234567890abcdef1234567890abcdef',
        newPassword: 'newPass123',
        confirmNewPassword: 'newPass123',
      },
    };
    const res: any = makeRes();

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'reset-1',
          user_id: 'user-1',
          used_at: null,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          full_name: 'User',
          email: 'u@test.com',
          role: 'customer',
        },
      ],
    });

    bcryptHashMock.mockResolvedValueOnce('new-hash');
    clientQueryMock.mockResolvedValue({ rows: [] });

    await resetPassword(req, res);

    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('BEGIN'));
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), [expect.any(String), 'user-1']);
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM session'), ['user-1']);
    expect(clientQueryMock).toHaveBeenCalledWith(expect.stringContaining('COMMIT'));
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Password reset successful');
  });
});
