const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ApiFeature = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('Could not find this ID', 404));
    } //we use return so that res.status does not run

    res.status(204).json({
      status: 'success',
      data: null, //it means that the data no longer exists
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      //returns modified object rather than the original
      runValidators: true,
      //this means validators should be run again
      //if price is written in string ,it will give error
      //because in the schema we defined price to be number
    });
    if (!doc) {
      return next(new AppError('Could not find this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({})
    // newTour.save().then();
    //this means Model.prototype.save()

    ///////////OR//////////////////////

    const newdoc = await Model.create(req.body);

    res.status(201).json({
      //201 stands for created
      status: 'success',
      data: {
        data: newdoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    // console.log(req.params);
    // const id = req.params.id * 1; //this changes string into nunber as string multiplied by number is a number

    const doc = await query;
    // Tour.findOne({ _id : req.params.id})

    if (!doc) {
      return next(new AppError('Could not find this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    //Execute query

    //to allow for nested Get reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new ApiFeature(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); //since we returned this..so it works
    const doc = await features.query;
    // const doc = await features.query.explain(); //after building sorts,paging,filter.ect only
    //we can await the results

    //Send Response

    res.status(200).json({
      status: 'success',
      // time: req.requestTime,
      result: doc.length,
      data: {
        data: doc, //or tours only
      },
    });
  });
