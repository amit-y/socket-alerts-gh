var express = require('express');
//var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var hooks = require('./routes/hooks');

var marked = require('marked');

var alert = '';

var _ = require('lodash');
var Q = require('q');
var request = require('request');
var config = require('./config.json');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes());
//app.use('/hooks', hooks);
var router = express.Router();

// home page route (http://localhost:8080)
router.get('/', function(req, res) {
  //res.render('index', { title: 'socket-alerts-gh' });
  res.sendfile('views/index.html');
});

// about page route (http://localhost:8080/about)
router.post('/hooks/gh-default', function(req, res) {
  var ref = req.body.ref;
  var mods = req.body.commits[0].modified;
  var alert_found = _.indexOf(mods,'alert.md');
  //var debug_message = {ref: ref, mods: mods, af: alert_found }
  if (ref==='refs/heads/master' && alert_found>-1) {
    getContent().then(function() {
      if (alert) {
        io.emit('alert message', alert);
      } else {
        io.emit('no alert','');
      }
      res.send('success');
    });
  }
});

// apply the routes to our application
app.use('/', router);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

io.on('connection', function(socket){
  //if (alert) socket.emit('alert message', alert);
  if (alert) {
    socket.emit('alert message', alert);
  } else {
    socket.emit('no alert','');
  }  
  /* socket.on('alert message', function(msg){
    alert = marked(msg);
    io.emit('alert message', alert);
  }); */
});

var getContent = function() {
  return Q.Promise(function(resolve, reject) {
    request(config.github, function(err, response, body) {
      if (err) {
        console.log(err);
      } else  if (response.statusCode!=200) {
        console.log(body);
      } else {
        var content = JSON.parse(body).content;
        var content_buffer = new Buffer(content, 'base64');
        alert = marked(content_buffer.toString());
      }
      resolve();
    });
  });
}

getContent();

server.listen(app.get('port'));