import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, 
  phone: { type: String, required: true, unique: true },
  hasSubscribed : { type: Boolean, default: false },
  city : { type: String },
  dealerId : { type: String },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  singleFigure: { type: Number, default: 0 },
  doubleFigure: { type: Number, default: 0 },
  tripleFigure: { type: Number, default: 0 },
  fourFigure: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  isActive : {
    type: Boolean, 
    default: true
  }, 
  role: { type: String, enum: ['admin', 'user', 'distributor'], default: 'user' }, 
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    // This is not required for admin-created users
    required: function() {
      return this.role === 'user'; // Only require for regular users
    }
  },
  // admin is the system admin manage all the users and di
  //  there will be  a distributor admin account 
  // distributor admin can create users , list all users profile , suspend users profile , get all bills of users 
});
 
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);