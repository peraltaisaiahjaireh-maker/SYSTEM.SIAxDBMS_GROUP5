// serves the API and the frontend files.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const db = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const { sendError, handleError } = require('./controllers/helpers');

const app = express();

app.use(express.json());

// API
app.use('/api', apiRoutes);
app.use('/api', function (req, res) {
  sendError(res, 404, 'That API address does not exist');
});

// frontend 
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// errors
app.use(function (err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'The request body is not valid JSON');
  }
  handleError(res, err);
});

const PORT = process.env.PORT || 3000;

// check the database first
db.query('SELECT 1')
  .then(function () {
    app.listen(PORT, function () {
      console.log('SoundSync is running. Open http://localhost:' + PORT);
    });
  })
  .catch(function (err) {
    console.error('Could not connect to MySQL: ' + err.message);
    console.error('Check DB_USER and DB_PASSWORD in the .env file, and that you ran database/schema.sql and database/data.sql.');
    process.exit(1);
  });


/*
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const db = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const controller = require('./controllers/soundSyncController');

const app = express();

app.use(express.json());

// API
app.use('/api', apiRoutes);
app.use('/api', function (req, res) {
  controller.sendError(res, 404, 'That API address does not exist');
});

// the frontend 
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// for errors
app.use(function (err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return controller.sendError(res, 400, 'The request body is not valid JSON');
  }
  controller.handleError(res, err);
});

const PORT = process.env.PORT || 5000;

//CSS bg image 
app.use('/bg-image', express.static(path.join(__dirname, '..', 'bg-image')));
// checks the database connection, then start 
db.query('SELECT 1')
  .then(function () {
    app.listen(PORT, function () {
      console.log('SoundSync is running. Open http://localhost:' + PORT);
    });
  })
  .catch(function (err) {
    console.error('Could not connect to MySQL: ' + err.message);
    console.error('Check DB_USER and DB_PASSWORD in the .env file, and that you ran database/schema.sql and database/data.sql.');
    process.exit(1);
  });
*/ 