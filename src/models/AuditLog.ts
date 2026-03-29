import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuditLog extends Document {
    _id: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    action: string;
    resource: string;
    resourceId?: mongoose.Types.ObjectId;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, required: true },
        resource: { type: String, required: true },
        resourceId: { type: Schema.Types.ObjectId },
        details: { type: Schema.Types.Mixed },
        ipAddress: { type: String },
        userAgent: { type: String },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

AuditLogSchema.index({ companyId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
