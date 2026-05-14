import { Request, Response } from 'express';
import { getAdminAnalyticsSummary, getMaterialDemandTrends, trackEvent, type AnalyticsEventType } from '../services/analyticsService';

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  'quote_started',
  'quote_submitted',
  'quote_approved',
  'quote_accepted',
];

export async function postAnalyticsEvent(req: Request, res: Response) {
  const eventType = req.body?.eventType as AnalyticsEventType | undefined;

  if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
    return res.status(400).json({ error: 'Invalid analytics event type.' });
  }

  await trackEvent(eventType, req.session?.userId, req.body?.metadata || {});
  return res.status(202).json({ success: true });
}

export async function getAdminAnalytics(req: Request, res: Response) {
  try {
    const summary = await getAdminAnalyticsSummary();
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    console.error('[ANALYTICS CTRL] getAdminAnalytics error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getMaterialDemand(req: Request, res: Response) {
  try {
    const trends = await getMaterialDemandTrends();
    return res.json({ success: true, data: trends });
  } catch (err: any) {
    console.error('[ANALYTICS CTRL] getMaterialDemand error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
