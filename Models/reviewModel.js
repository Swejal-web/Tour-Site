const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Cannot be emptied'],
    },
    ratings: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to the user'],
    },
  },
  {
    toJSON: { virtuals: true }, //so that the json file may contain the virtual properties
    toObject: { virtuals: true },
  }
);

//this is done so the  user cannot write multiple reviews for thw same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //it means each combination of the tour and the user must be unique
//this can take a day or 2 to actually work

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   })
  this.populate({
    path: 'user',
    select: 'name photo ',
  });
  next();
});

//this is called statics method...which is similar to instance method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$ratings' },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, //stats[0] means first object in the array of stats
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //dont use pre because at that point in time the review collection has not been created
  //using post the document is already saved in the database
  //post does not use next
  //this points to the curent review Model
  this.constructor.calcAverageRatings(this.tour);
});

// findByIDAndUpdate
// findByIDAndDelete

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //since it is a query and not a document
  this.r = await this.findOne(); //we do this to get the review after the execution of query to get the tourID
  //this.r means that we create new property
  console.log(this.r);
  next();
});

//the value from post is then passed to pre
//this is also a static method
//this.constructor is used in static model
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
