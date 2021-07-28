const dotenv = require('dotenv');

//this process is called uncaught exceptions and is used for synchronous errors
//these handlers are defined before  we define app.

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception !!');
  process.exit(1);
});

dotenv.config({ path: './config.env' }); //reads the file from config.env and stores in node

const app = require('./app'); //this should be read only after reading the environment variables
//as app.js uses that environment variables

//console.log(process.env); //this is used to show environmnet variable of
//node_env in the terminal

//node_env = it defines whether we are in
//development or production
//express does not defines this so we must do manually

// const newTour = new Tour({
//   name: 'The King',
//   price: 500,
// });

// newTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log('The ERROR: ', err));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//This process is called handling unhandled rejection .for example when the database is not properly connected

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandles Rejection!!');
  server.close(() => {
    //we use server.close because the server closes and exits the process only after all the other requests has been handled
    process.exit(1);
  });
});
