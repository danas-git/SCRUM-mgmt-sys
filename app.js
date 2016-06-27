//var express = require('express');
var express = require('express'),
    app = express(),
    server = require('http').createServer(app).listen(3000),
    io = require('socket.io').listen(server);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport= require('passport');
var session = require('express-session');
require('./models/models.js');
var api = require('./routes/api');
var index = require('./routes/index');
var projectapi=require('./routes/projectapi');
var backlogapi=require('./routes/backlogapi');
var sprintapi=require('./routes/sprintapi');
var taskapi=require('./routes/taskapi');
var authenticate = require('./routes/authenticate')(passport);
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/MyDB");
var Chat=mongoose.model('Chat');
//var app = express();

//chat
io.sockets.on('connection', function(socket){

  socket.on('room', function(room) {
    socket.leave(room.roomold);
    socket.join(room.room);
    Chat.find({room:room.room},function(err,data){
      if(err){
        console.log("Error retrieving chat history");
      }else{
        //console.log("retrieved old chat" + data);
        io.sockets.connected[socket.id].emit('oldmessage',data);
      }
    }).sort({_id:-1}).limit(10);

  });
  console.log("socket onconnect");
  socket.on('send message', function(data){
   // console.log("socket on" + data.msg);
    var newChat= new Chat();
    newChat.room=data.room;
    newChat.username=data.username;
    newChat.message=data.msg;
    newChat.save(function(err){
      if(err){
        console.log("Error in saving chat message" +err);
        throw err;
      }else{
        console.log("chat saved");
      }
    });
    io.sockets.in(data.room).emit('new message', data);

  });
  socket.on('disconnect', function(){

  });
});
//chat

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(session({
    secret: 'keyboard cat'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

//// Initialize Passport
var initPassport = require('./passport-init');
initPassport(passport);

app.use('/',index);
app.use('/api', api);
app.use('/auth', authenticate);
app.use('/project',projectapi);
app.use('/backlog',backlogapi);
app.use('/sprint',sprintapi);
app.use('/task',taskapi);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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


module.exports = app;
