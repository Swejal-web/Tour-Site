const express = require('express');
const authController = require('../Controllers/authenticationController');
const userController = require('../Controllers/userController');
//const reviewController = require('../Controllers/reviewController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//router.use(authController.protect);
//since middleware runs in sequence ..instead of writing .protect for every request..you can use the above line so that every code below this will be protected

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getSelectedUser
);
router.patch(
  '/updateMe',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizePhoto,
  userController.updateMe
);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

//router.use(authController.restrictTo('user'));
//all the request below can only be accesed by the admin

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getAllUsers
  )
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    userController.createUser
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getSelectedUser
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    userController.updateSelectedUser
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    userController.deleteSelectedUser
  );

module.exports = router;
