const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto'); //build in node module
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name bust be included'],
  },
  email: {
    type: String,
    required: [true, 'Email must be included'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Valid email must be used'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password must be included'],
    minlength: [8, 'atleast 8 characters'],
    select: false,
    //so that it will not show in the database
  },
  passwordConfirm: {
    type: String,
    required: [true, 'PasswordConfirm must be included'],
    validate: {
      //this will only work for save or create
      validator: function (el) {
        return el === this.password; //this fucntion will either return true or false
      },
      message: 'Password are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpired: {
    type: Date,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //if passord is created or updated
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12); //the higher the number the more the effective hash
  //it is cpu intensive...do not use more than 12
  this.passwordConfirm = undefined;
  //because we will not need this after validation
  next();
});

//lesson 136

// userSchema.pre('save', function (next) {
//   if (!this.isModified('password') || this.isNew) return next();

//   this.passwordChangedAt = Date.now() - 1000;
// });

// /^find/ means anything that starts from find
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//this is called instant method..it is gonna be available for all documentation of certain collection
//it is done for user model
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10 //where 10 is the base
    ); //this will be in ms..so we need to change it to seconds

    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp; //100 < 200..this means after the token is issued ,password is changed
    //this means password changed and is true
  }
  //false means password is not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //we dont need stroong encription.so instead of bcrypt we use crypto
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpired = Date.now() + 10 * 60 * 100; //converting 10 minutes to millisecond
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
