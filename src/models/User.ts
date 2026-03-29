import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'employee' | 'finance';
  managerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  department?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'manager', 'employee', 'finance'], required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  department: { type: String },
  avatar: { type: String },
}, { timestamps: true });

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
