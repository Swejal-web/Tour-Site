const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const cors = require('cors');
const cookieparser = require('cookie-parser');

const AppError = require('./utils/AppError');
const globalErrorhandler = require('./Controllers/errorController');
const tourRouter = require('./Routes/tourRoute');
const userRouter = require('./Routes/userRoute');
const reviewRouter = require('./Routes/reviewRoute');
const bookingRouter = require('./Routes/bookingRoutes');
const viewRouter = require('./Routes/viewRoutes');

const app = express();

app.use(
  cors({
    origin: 'http://127.0.0.1:3000',
    credentials: true,
  })
);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //this is the ideal way for finding the path instead of ./

//serving static file
app.use(express.static(path.join(__dirname, 'public'))); //this is used to get link css etc
//this middleware servers the static files in the folder

/////////Middleware///////////

//Security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} //this is 3rd party middleware
//morgan is used as similar to req,res,next

//limit request from the same IP
const limiter = rateLimit({
  max: 500, //no of request
  windowMs: 60 * 60 * 1000, //allows 100 request for same Ip in 1 hour(converted into ms)
  message: 'Too many request from this Ip.Please try again in an hour!',
});

app.use('/', limiter);

//Body Parser, reading data from body into req.body
app.use(express.json()); //this is called middleware
//middleware is the function that can modilfy the iocoming request

app.use(express.urlencoded()); //the way form for updating user to the user is also called urlencoded
//we need this middleware to parse the update user form data into the server

app.use(cookieparser()); //parses the cookie after login

//Data sanitization against  NOSQL query injection
app.use(mongoSanitize()); //it removes all of the $ sign

// Data Sanitization against XSS
app.use(xss()); //prevents attack in the form of malacious html code

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], //it means duplicate of duration is allowed
  })
);

// app.use((req, res, next) => {
//   console.log('Hello from the middleware'); //never forget to write next otherwise it will be stuck and never give response
//   next();
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //req.requestTime is defining a property in request
  //toISOstring changes into string
  // console.log(req.cookies);
  next();
});

////////////Route Handler////////////////

// app.get('/', (req, res) => {
//   res.status(200).json({
//     name: 'Swejal Shrestha',
//     age: 22,
//   });
// });

// app.post('/', (req, res) => {
//   res.send('You can point this');
// });

// const tour = fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`);
// const tours = JSON.parse(tour);
// console.log(tours);
/////////////or//////////

//////////////////Routes///////////////

//app.get('/api/v1/tours', getAllTours);

//app.get('/api/v1/tours/:id', getSelectedTour);

//app.post('/api/v1/tours', createTour);

//app.patch('/api/v1/tours/:id', updateSelectedTour);

//app.delete('/api/v1/tours/:id', deleteSelectedTour);

///////////you can do this OR///////////

// app.route('/api/v1/tours').get(getAllTours).post(createTour);

// app
//   .route('/api/v1/tours/:id')
//   .get(getSelectedTour)
//   .patch(updateSelectedTour)
//   .delete(deleteSelectedTour);

// app.route('/api/v1/users').get(getAllUsers).post(createUser);

// app
//   .route('/api/v1/users/:id')
//   .get(getSelectedUser)
//   .patch(updateSelectedUser)
//   .delete(deleteSelectedUser);

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//this process is called mounting

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Cant connect to ${req.originalUrl}.Try again`,
  // });
  // next();

  // const err = new Error(`Cant connect to ${req.originalUrl}.Try again`);
  // err.statusCode = 404;
  // err.status = 'Fail';
  // next(err); //if there is any variable passing through next then
  // //express will automatically thinl of it as a error and passes to the error handling middleware

  next(new AppError(`Cant connect to ${req.originalUrl}.Try again`, 404));
});

//////Error Handler Middleware

app.use(globalErrorhandler);

//////////////////Start Server////////////////

module.exports = app;
