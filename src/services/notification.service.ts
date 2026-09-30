import { Response } from 'express';
import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification.js';
import { AppError } from '../utils/appError.js';

// Live connections per user (in-process). With more than one server instance this needs Redis pub/sub;
// clients also poll as a fallback, so nothing is lost either way.
const streams = new Map<string, Set<Response>>();

export class NotificationService {
  static async notify(
    userId: string | Types.ObjectId,
    input: { type: NotificationType; title: string; body: string; data?: Record<string, string> }
  ) {
    try {
      const doc = await Notification.create({ user: userId, ...input });
      const payload = JSON.stringify({
        id: doc._id,
        type: doc.type,
        title: doc.title,
        body: doc.body,
        data: doc.data,
        createdAt: doc.createdAt,
        readAt: null,
      });
      streams.get(userId.toString())?.forEach((res) => res.write(`event: notification\ndata: ${payload}\n\n`));
    } catch (error) {
      // A failed notification must never fail the action that triggered it
      console.error('⚠️ Notification error:', error);
    }
  }

  static async list(userId: string, limit = 50) {
    const [items, unread] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(Math.min(100, Math.max(1, limit))).lean(),
      Notification.countDocuments({ user: userId, readAt: null }),
    ]);
    return { items, unread };
  }

  static async markRead(userId: string, id: string) {
    const res = await Notification.updateOne({ _id: id, user: userId, readAt: null }, { readAt: new Date() });
    if (res.matchedCount === 0 && !(await Notification.exists({ _id: id, user: userId }))) {
      throw new AppError('Notification not found', 404);
    }
  }

  static async markAllRead(userId: string) {
    await Notification.updateMany({ user: userId, readAt: null }, { readAt: new Date() });
  }

  /** Opens a server-sent-events stream for the user */
  static subscribe(userId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('event: ready\ndata: {}\n\n');

    const set = streams.get(userId) ?? new Set<Response>();
    set.add(res);
    streams.set(userId, set);

    const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);
    res.on('close', () => {
      clearInterval(heartbeat);
      set.delete(res);
      if (set.size === 0) streams.delete(userId);
    });
  }
}
