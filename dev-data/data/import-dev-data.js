//for importing all deleting data using command line script

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const Tour = require('../../Models/tourModel');
const User = require('../../Models/userModel');
const Review = require('../../Models/reviewModel');

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
  })
  .then(console.log('Database connected successfully'));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); //since  the data doesnt have password confirm and it will cause error when importing..so we temporariry disable this feature
    await Review.create(reviews);
    console.log('data successfully loaded');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deletData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successfully deleted');
    process.exit();
  } catch (err) {
    console.log('There is an error');
  }
};

console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
}
if (process.argv[2] === '--delete') {
  deletData();
}
