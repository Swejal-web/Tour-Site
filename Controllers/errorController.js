const AppError = require('../utils/AppError');
//this is done since the error handler acts like controllers

const handleCastErrordb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token.Please log in again', 401);
//we do not need to use return if it is written in smae line

const handleJWTExpiredError = () =>
  new AppError('Your Token has expired.Please log in again', 401);

const handleDuplicatedb = (err) => {
  const value = err.errmsg.match(/(['"])(?:(?!\1|\\).|\\.)*\1/);
  const message = `Duplicate field value: ${value}.Please use another value`;
  return new AppError(message, 404);
};

const handleValidationErrordb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  //Object.values is used for object loop
  const message = `Invalid Input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (req, err, res) => {
  // For API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });

    //for rendered pages
  }
  console.log('Error', err);
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (req, err, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('Error', err);
    return res.status(500).json({
      status: 'Error',
      message: 'Something went very wrong',
    });
  }

  //For rendered file
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'something went wrong',
      msg: err.message,
    });
  }
  console.log('Error', err);
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: 'Pleas try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;
    if (error.name === 'CastError') error = handleCastErrordb(error);
    if (error.code === 11000) error = handleDuplicatedb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrordb(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(req, error, res);
  }
};
