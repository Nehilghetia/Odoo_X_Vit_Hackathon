import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/notifications
export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        const query: Record<string, unknown> = { userId: authUser.userId };
        if (unreadOnly) query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({ userId: authUser.userId, isRead: false });

        return apiSuccess({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        return apiError('Failed to fetch notifications', 500);
    }
}

// PATCH /api/notifications - Mark all as read
export async function PATCH(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();

        const body = await request.json();
        const { ids } = body; // null = mark all, array = mark specific

        if (ids) {
            await Notification.updateMany({ _id: { $in: ids }, userId: authUser.userId }, { isRead: true });
        } else {
            await Notification.updateMany({ userId: authUser.userId }, { isRead: true });
        }

        return apiSuccess({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark notifications error:', error);
        return apiError('Failed to update notifications', 500);
    }
}
