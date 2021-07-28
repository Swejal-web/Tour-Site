const multer = require('multer'); //it should be at the top
const sharp = require('sharp');
const Tour = require('../Models/tourModel');
const factory = require('./handleFactory');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.memoryStorage();

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

exports.uploadTourImages = upload.fields([
  //this will create files
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// if uploading multiple files
//upload.array('images', 5)  //this will create req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // For Cover Image

  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 }) //resizing the image
    .toFile(`public/img/tours/${imageCoverFilename}`);

  req.body.imageCover = imageCoverFilename;

  // For Images
  req.body.images = [];
  await Promise.all(
    //we need to use promise.all so that the whole process is completed before moving to the next()
    //we do this since async is done only inside the loop..in order to await the whole result we use PRomise.all
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 }) //resizing the image
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  //console.log(req.body.images);
  next();
});

////////////////////// Above code contains uploading and resizinf of image/////////////////////////

exports.aliasTourRouting = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, ratingsAverage, difficulty, price, summary';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getSelectedTour = factory.getOne(Tour);

exports.createTour = factory.createOne(Tour);

exports.updateSelectedTour = factory.updateOne(Tour);

exports.deleteSelectedTour = factory.deleteOne(Tour);

exports.getTourStates = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.2 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' }, //by using null we find average of all the documnets
          tourNum: { $sum: 1 }, //for every documnet 1 will be added
          numRating: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' }, //to calculate average
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 }, //1 is for ascending
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', //it destructure the array fields into one field
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' }, //it represents the month in number{Jan=1 and so on}
          numToursStarts: { $sum: 1 },
          tours: { $push: '$name' }, //$push helps to arrange the field in array
        },
      },
      {
        $project: {
          _id: 0, //0 means dont show
          month: '$_id',
          numToursStarts: '$numToursStarts',
          tours: '$tours',
        },
      },
      {
        $sort: { numToursStarts: -1 }, //-1 stands for descending
      },
      {
        $limit: 12,
      },
    ]);
    console.log(year);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    next(err);
  }
};

//tours/tours-within/233/45,-40/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // 3963 is the radius of the earth in miles and 6378 in km
  //we do this to convert into radian unit for radius

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the correct format',
        400
      )
    );
  }

  //we need to first specify longitude first
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, //gets the start location of every tour within the given radius
  }); //this is called geospatial operator
  //centerSphere takes an array of coordinates(lat,lng) and the radius(distance)
  //for this to work we need to declare index for our geospatial data(startLocation)...Now in tourModel......
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

//this part does not work....lecture 172..geospatial distances
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  //console.log(lat, lng);

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the correct format',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      //this is the only geospatial aggregation pipline that exists
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distances',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
