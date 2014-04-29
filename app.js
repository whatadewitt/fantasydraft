
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var conf = require('./lib/conf.js');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/players/get', routes.getPlayers);
app.get('/read/:pos', routes.readData);
app.get('/import', routes.importKeepers);
app.get('/import/updateCosts', routes.updateKeptCosts);
app.get('/import/skipKeepers', routes.importSkipKeepers);
app.get('/calculate', routes.calculateInflation);

// app.get('/player/:id/draft', routes.draftPlayer);
//app.get('/player/:id/notes', routes.addPlayerNote);
app.post("/player/update", routes.updatePlayer);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});