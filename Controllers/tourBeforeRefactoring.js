// const Tour = require('../Models/tourModel');

// exports.aliasTourRouting = (req, res, next) => {
//   req.query.limit = '5';
//   req.query.sort = '-ratingsAverage, price';
//   req.query.fields = 'name, ratingsAverage, difficulty, price, summary';
//   next();
// };

// exports.getAllTours = async (req, res) => {
//   try {
//     //console.log(req.requestTime);
//     console.log(req.query);
//     //shows what params are in the request link
//     // Build Query   ///////////

//     // 1.a) Filtering without page ,sort,etc

//     const queryObj = { ...req.query }; //destructures the fields in req.query
//     const excludeFields = ['page', 'sort', 'limit', 'fields'];
//     excludeFields.forEach((el) => delete queryObj[el]);

//     //  1.b) Advanced filtering for gte,gt,lte,le
//     // {difficulty: "easy", duration: {$gte: 5}}     =>but in queryObj there will be gte
//     //so we must change gte into $gte

//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //This is called regular expression
//     console.log(JSON.parse(queryStr));

//     let query = Tour.find(JSON.parse(queryStr));
//     //we cant use await here because once the query is awaited
//     //we can no longer again do sort,paging,ect

//     //OR////////

//     // const tours =  Tour.find()
//     //   .where('difficulty')
//     //   .equals('easy')
//     //   .where('duration')
//     //   .equals(5);

//     // 2) Sorting
//     if (req.query.sort) {
//       //if the first criteria is same,to add second criteria
//       //in mongoose it works as {price, ratingsAverage}
//       const sortBy = req.query.sort.split(',').join(' ');
//       // slice(',') splits the value of sort with a comma
//       //join(' ') then joins them

//       query = query.sort(sortBy);
//     } else {
//       query = query.sort('-createdAt');
//     } //this is done by default if user does not specify which sort

//     // 3) Field Limiting
//     if (req.query.fields) {
//       const fields = req.query.fields.split(',').join(' ');
//       query = query.select(fields);
//     } else {
//       query = query.select('-__v');
//       // - excludes the fields
//     }

//     // 4) Pagination

//     const page = req.query.page * 1 || 1; //which means either the given page number or 1 by default
//     const limit = req.query.limit * 1 || 100;
//     const skip = (page - 1) * limit;

//     // page=3&limit=10, page-1= 1-10,page2=11-20 and so on
//     query = query.skip(skip).limit(limit);

//     if (req.query.page) {
//       const numTours = await Tour.countDocuments(); //counts total number of documnets
//       if (skip >= numTours) throw new Error('This page does not exist');
//       //after this throw it skips everything and goes straight to catch
//     }

//     //Execute query
//     const tours = await query; //after building sorts,paging,filter.ect only
//     //we can await the results

//     //Send Response

//     res.status(200).json({
//       status: 'success',
//       // time: req.requestTime,
//       result: tours.length,
//       data: {
//         tours: tours, //or tours only
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'failed',
//       message: err,
//     });
//   }
// };

// exports.getSelectedTour = async (req, res) => {
//   //get('/api/v1/tours/:id/:x/:y?) //we can add as many parameters as we want..? stands for optional

//   // console.log(req.params);
//   // const id = req.params.id * 1; //this changes string into nunber as string multiplied by number is a number
//   try {
//     const tour = await Tour.findById(req.params.id);
//     // Tour.findOne({ _id : req.params.id})
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'failed',
//       message: err,
//     });
//   }
// };

// exports.createTour = async (req, res) => {
//   try {
//     // const newTour = new Tour({})
//     // newTour.save().then();
//     //this means Model.prototype.save()

//     ///////////OR//////////////////////

//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       //201 stands for created
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'failed',
//       message: err,
//     });
//   }
// };

// exports.updateSelectedTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       //returns modified object rather than the original
//       runValidators: true,
//       //this means validators should be run again
//       //if price is written in string ,it will give error
//       //because in the schema we defined price to be number
//     });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'failed',
//       message: err,
//     });
//   }
// };

// exports.deleteSelectedTour = async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 'success',
//       data: null, //it means that the data no longer exists
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'failed',
//       message: 'deleted',
//     });
//   }
// };
