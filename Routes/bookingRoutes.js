const express = require('express');
const bookingController = require('../Controllers/bookingController');
const authController = require('../Controllers/authenticationController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/checkout-session/:tourID')
  .get(bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
