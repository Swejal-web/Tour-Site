const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

//const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);
//do this if you use atlas to replace password

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('database connection is successful'));

const tourSchema = new mongoose.Schema(
  {
    // name: String,
    // rating: Number,
    // price: Number,

    //if we need want more features and not just types

    name: {
      type: String,
      required: [true, 'A name is required'],
      //it is a type of validator to validate if the collection has name or not
      unique: true, //it defines that there should not be datas of same name
      trim: true,
      maxlength: [40, 'A tour must have less or equal to 40 characters'],
      minlength: [10, ' A tour must have more or quals to 10 characters '],
      //runValidator in the update section must be set to true to make this work while updating
      validate: [
        //validator.isAlpha,
        //' Tour name must only contain alphabet characters',
      ],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    slug: String,
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy.medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, ' The rating must be above 1 '],
      max: [5, 'Rating must be below 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666666 => 46.666 => 47 => 4.7
      //set will be called everytime the field is updated
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'rating is required'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only works for create and not for update
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    }, //here value is not a js but a function of mongodv..it stands for val
    summary: {
      type: String,
      trim: true,
      //trim is used for string which removes white space from front and back
      //  "   This tour  " = "This Tour"
      required: [true, 'A tour must have the summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //name of the image instead of entire image
      //required: [true, 'A tour must have a cover image'],
    },
    images: [String], //array of strings
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //we use this if sensitive data are not to be shown to the user
    },
    startDates: [Date], //the dates at which the same tour starts
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //Geo JSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //first longitude then latitude in GeoJSON
      address: String,
      description: String,
    },
    locations: [
      //this means embedding location with tours
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      //this is child referencing
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //so that the json file may contain the virtual properties
    toObject: { virtuals: true },
  }
); //one object for defintion of scheme and another object for schema options
//this is called mongoose schema

//with the help of indexes,mongodb does not have to search through every document..and makes our performance faster since the price is ordered in terms of index
//it is called single field index(which consists of one index)
//tourSchema.index({ price: 1 });

//this is compound field index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //this is for indexing geospatial data
//also needed for calculating geospatial distances

//Virtual Properties
tourSchema.virtual('durationweeks').get(function () {
  return this.duration / 7;
}); //we used normal function so that we can use this
//now for mongoose model

//Document Middleware: runs between .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
}); //save is also called hook..it is called pre save hook

//this is called embedding process for guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reviews',
    select: '-__v -passwordChangedAt',
  }).populate({
    path: 'guides',
  }); //this will deselect these two fields while showing in thw route
  next();
});

//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// tourSchema.pre('save', (next) => {
//   console.log('we will be svaed');
//   next();
// });

// //post means after the documnet has been saved
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// }); //doc means documents after being saved

//Query Middleware

// /^find/ will run for all the find like findOne ,findandDelete etc
// i.e all stings  that starts wqith find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
}); //this is query middleware since it has find method..and we cn chain the queries

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  //  console.log(docs);
  next();
});

//Aggregation Middleware

//so that the geospatial aggregation can work in lecture 171...we disable this middleware functikn

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //unshift adds elememt in the array at the beginning
//   console.log(this.pipeline()); //pipeline has all the function defined in the aggregate part of the model
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

//it is good convention to writing capital variables for model

module.exports = Tour;
