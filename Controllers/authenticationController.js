const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

// eslint-disable-next-line arrow-body-style
const signInToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);
  //do not use this..because with this..anyone can sign in as admin

  const newUser = await User.create({
    role: req.body.role,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  // for lecture 206 for sending emails
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome(); //since sendWelcome is async function in email.js...we use await

  const token = signInToken(newUser._id);
  //console.log(token);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, //cookie will only be send on an encrypted connection(on https)
    httpOnly: true, //cookie cannot be accessed or modified by browser
  };
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true; //only in prodcution secure option will be true
  res.cookie('jwt', token, cookieOption);

  //Remove the password from output
  newUser.password = undefined;
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if the email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if the user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  //since we do not show password in get users...now we have to sepreately select password from the database

  if (!user || !(await user.correctPassword(password, user.password))) {
    //await user.coorectPassword return either true or false
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If ok, send token to the client
  const token = signInToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, //cookie will only be send on an encrypted connection(on https)
    httpOnly: true, //cookie cannot be accessed or modified by browser
  };
  res.cookie('jwt', token, cookieOption);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.logout = (req, res) => {
  //for frontend
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Gettig token and check if its there

  //never declare varibale inside the try block
  //it will not be avaiable outsie of the block
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout')
    //this is for frontend part
    token = req.cookies.jwt;
  if (!token) {
    //console.log(token);

    return next(new AppError('Not logged in.Please log in first', 401));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //promisify returns a promise
  //console.log(decoded);

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exist', 401)
    );
  }

  // 4) CHeck if user changed password after the token was issued
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password.Please log in again', 401)
    );
  }
  req.user = freshUser; //This  is an important step
  res.locals.user = freshUser; //so they can be accessed by any pug template
  next();
});

//only for rendered pages for the frontend
exports.isLoggedIn = async (req, res, next) => {
  //for frontend
  if (req.cookies.jwt) {
    try {
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //promisify returns a promise
      //console.log(decoded);

      // 3) Check if user still exists
      const freshUser = await User.findById(decoded.id);

      if (!freshUser) {
        return next();
      }

      // 4) CHeck if user changed password after the token was issued
      if (freshUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      //There is a logged in user
      res.locals.user = freshUser; //res.locals.user can be accessed by all the pug templates
      // user is the variable that can be accessed by the template
      //this is passed onto the header template after logged in
      return next();
      //since next will be called two times.we use return to not get error
    } catch (err) {
      return next();
    }
  }
  next();
};

//Nomrally parametrs cant be passed in middleware
//to do that ...
//...roles gives the array of role
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    //it means if roles in anyting except lead-guide ad\nd admin..show error..here role is user..so show error
    return next(
      new AppError('You do not have the permission to perfomr this action', 403)
    ); //403 means forbidden
  }
  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // 2) generate random reset token
  //we user instance method for long codes to make them look neat
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //since database has only been modified and not save..we save here
  // deactivates all the validators

  // 3) Send it to the users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  //const message = `Forgot your password? Submit a PATCH request with you new password and passwordConfirm to : ${resetURL}.\n If you didnt forget your password,please ignore this email`;

  try {
    //------------this was for nodemailer
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token lasts for 10 min',
    //   message,
    // });

    //lecture 207 - password reset
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was a error sending email.Try again later', 500)
    ); //500 is error has happens in server
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //console.log({ hashedToken });

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    //passwordResetExpired: { $gt: Date.now() }, //to check if the time has expired or not
  });
  //console.log(user);
  // 2) If the token has not been expired,and there is user, set the new password

  if (!user) {
    return next(new AppError('Token is invalid or has been expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;
  await user.save();
  // 3) update the changedpasswordAt property for the user
  // 4)Log the user in, send jwt
  const token = signInToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const { passwordCurrent, password, passwordConfirm } = req.body;
  if (!passwordCurrent) {
    return next(new AppError('Please enter the current password', 401));
  }

  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the current password is correct

  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Please enter correct current password', 401));
  }

  // 3) if so , update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4) log user in, send JWT
  const token = signInToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
});
