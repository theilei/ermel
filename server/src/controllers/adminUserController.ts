import { Request, Response } from 'express';
import pool from '../config/database';
import { addLog } from '../models/ActivityLogDB';

type UserRole = 'admin' | 'customer';

function sanitizeRole(value: unknown): UserRole | null {
  if (value === 'admin' || value === 'customer') return value;
  return null;
}

// PATCH /api/admin/users/:id/role
export async function updateUserRole(req: Request, res: Response) {
  try {
    const actorId = req.session?.user?.id || req.session?.userId;
    const actorEmail = req.session?.user?.email || req.session?.userEmail || 'Unknown';
    const targetUserId = (req.params.id || '').trim();
    const nextRole = sanitizeRole(req.body?.role);

    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    if (!nextRole) {
      return res.status(400).json({ error: "Role must be either 'admin' or 'customer'." });
    }

    const existing = await pool.query(
      `SELECT id, email, role FROM users WHERE id = $1 LIMIT 1`,
      [targetUserId],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const target = existing.rows[0];
    if ((target.role || 'customer') === nextRole) {
      return res.json({
        message: 'Role unchanged.',
        user: {
          id: target.id,
          email: target.email,
          role: target.role === 'admin' ? 'admin' : 'customer',
        },
      });
    }

    if (actorId && actorId === targetUserId && nextRole !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own admin role.' });
    }

    const updated = await pool.query(
      `UPDATE users
       SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role`,
      [nextRole, targetUserId],
    );

    const user = updated.rows[0];

    await addLog({
      action: 'Admin changed user role',
      entity: 'user',
      entityId: user.id,
      userId: actorId,
      userRole: 'admin',
      userName: actorEmail,
      details: `${user.email} -> ${user.role}`,
    });

    return res.json({
      message: 'User role updated successfully.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'customer',
      },
    });
  } catch (err: any) {
    console.error('[ADMIN USER] updateUserRole error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
