import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'expense_submitted' | 'expense_approved' | 'expense_rejected' | 'approval_required' | 'system';
    resourceId?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['expense_submitted', 'expense_approved', 'expense_rejected', 'approval_required', 'system'],
            required: true,
        },
        resourceId: { type: Schema.Types.ObjectId },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
