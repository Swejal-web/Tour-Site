const multer = require('multer'); //it should be at the top
const sharp = require('sharp');
const User = require('../Models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handleFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     //destination is a callback fucntion and the patameter callback is simialr to next
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     // user-78723dddasa0-323234545.jpeg
//     const extension = file.mimetype.split('/')[1];
//     //console.log(req.user.id);
//     callback(null, `user-${req.user._id}-${Date.now()}.${extension}`);
//   },
// }); //this function specifies how we store our files with destination and file name

//it is always best to save thr file in memory ..not in disk
const multerStorage = multer.memoryStorage();
//storing file in memory is way more efficient than in disk
//this is mainly done for image processing
const multerfilter = (req, file, callback) => {
  //this function only accepts images and filters out any other file
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not an image! Please upload only image', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerfilter,
});

exports.uploadUserPhoto = upload.single('photo'); //lecture 199..uploading user pic into the server using multer

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  //since we are storing in memory adn not in disk ..filename is not created which is required to store photo's name (line: 17)
  //hence we create filename here so that it can be used in updateMe COntroller

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  //keeping the file in memory
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 }) //resizing the image
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

//////////////////// The ABove part is for image upload of the user ///////////////////////////////////

const filterObj = (obj, ...allowedFields) => {
  //allowed fields includes name and email from the parameters
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    //object.keys is used to loop through the objects
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file); //contains info abaout the photo file. lecture 198
  // console.log(req.body); //after updating file cannot be shown..so we use multer

  // 1) Create error if user POSTS password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword',
        400
      )
    );
  }

  // filtered out unwanted field names that are not allowed to be updated

  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename; //lexture 200..to uplaod photo
  // 3) update user document

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    //since we are not dealinmg with passwords we can use update
    new: true, //to show the updated data
    runValidators: true, //to check the validators
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined Please use Sign Up instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getSelectedUser = factory.getOne(User);

// Do Not update password with this...use updateMe function
exports.updateSelectedUser = factory.updateOne(User);
exports.deleteSelectedUser = factory.deleteOne(User);
