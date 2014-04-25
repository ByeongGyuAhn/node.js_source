//2014-04-25 

//
var  express = require('express')
	, routes = require('./routes')
    , user = require('./routes/usr')
    , http = require('http')
    , path = require('path')
    , socketio = require('socket.io');

var app = express();

app.configure(function(){
    app.set('port',process.env.port || 3000);
    app.set('views',__dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyPaser());
    app.use(express.methodOverride());
    app.use(app.Router);
    app.use(express.static(path.join(__dirname, 'public')));    
});

app.configure('development', function(){
    app.use(express.errorHandler);
});

app.get('/', routes.index);
app.get('/main', routes.main);
app.get('users', user.list);


