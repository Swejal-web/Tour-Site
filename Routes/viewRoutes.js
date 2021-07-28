const express = require('express');
const viewsController = require('../Controllers/viewsController');
const authController = require('../Controllers/authenticationController');
const bookingController = require('../Controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
); //create booking check out because if it fails.go to next middleware

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', authController.isLoggedIn, viewsController.loginUser);

router.get('/me', authController.protect, viewsController.getAccount);

router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUser
);

module.exports = router;
