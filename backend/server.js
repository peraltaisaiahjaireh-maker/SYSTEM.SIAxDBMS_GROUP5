cons path = require ('path');
require ('dotenv').config ({ path: path.join(_dirname, '..','.env')});

const express = require ('express');
const db = require ('./config/db');
const apiRoutes = require ('./routes/apiRoutes');
const controller = require ('./controllers/soundSyncController');

const app= express();

app.use(express.json());

app.use('/api', apiRoutes);
app.use('/api', function (req, res) {
    controller.sendError(res, 404, 'That API address does not exist');
});

app.use (express.static(path.join(_dirname, '..','frontend')));

app,use(function(err, req,res,next){
    if (err.type === 'entity.parse.failed') {
        return controller.sendError(res, 400, 'The request body is not valid JSON');
    }
    controller.handleError(res,err);
});

const PORT = process.env.PORT || 3000;

db.query('SELECT 1')
.then(function (){
    app.listen(PORT, function () {
        console.log('SoundSync is running. Open htpp://localhost:' + PORT);
    });
})
.catch(function (err){
        console.error('Could not connect to MySQL: ' + err.message);
        console.error('Check DB_USER and DB_PASSWORD in the .env file, and that you ran database/schema.sql and database/data.sql.');
        process.exit(1);
});