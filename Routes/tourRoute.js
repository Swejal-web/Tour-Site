const express = require('express');
const tourController = require('../Controllers/tourController');
const authController = require('../Controllers/authenticationController');
const reviewRouter = require('./reviewRoute');

const router = express.Router(); //router is a middleware

//router param
//router.param('id', tourController.checkID);

// POST tour/223fdf/reviews
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-five-tours')
  .get(tourController.aliasTourRouting, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStates);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
//this is called chaining multiple middleware fucntion

router
  .route('/:id') //this id is called the param(parameter)
  .get(tourController.getSelectedTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateSelectedTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteSelectedTour
  );

module.exports = router;
