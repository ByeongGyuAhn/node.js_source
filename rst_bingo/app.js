//2014-04-25 

//
var  express = require('express')
	, routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path')
    , socketio = require('socket.io');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views',__dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));    
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/main', routes.main);
app.get('/users', user.list);

//line 34-40 express, socket.io 연동코드 
var server = http.createServer(app);

var io = socketio.listen(server);

server.listen(app.get('port'), function(){
    console.log("express server listening on port" + app.get('port'));
});

//line 42-44 사용자저장을 위한 객체, 현재 접속한 사용자수, 누구의 차례인지 기록하는 변수
var users = {};
var user_count = 0;
var turn_count = 0;

//웹소켓으로 연결이 이루어 졌을때 의 이벤트에 대응하는 콜백함수 설정
io.sockets.on('connection', function(socket){
    
    /*
    lind 56-67 사용자가 접속했을때 join 이벤트에 대응하는 내용,
    사용자의 이름을 가져와서 소켓의 사용자 이름으로 설정하고 사용자 객체를 생성하여 이름과
    턴 값을 설정한다. 그리고 클라이언트에게 새로운 사용자가 접속 했으니 사용자 목록을 업데이트하여 
    출력하라고 update_users 라는 이벤트를 전송하여 알려준다.
    */
    socket.on('join', function(data){
        var username = data.username;
        
        socket.username = username;
        
        users[user_count] = {};
        users[user_count].name = username;
        users[user_count].turn = false;
        
        io.sockets.emit('update_users', users);
        
        user_count++;
    });//socket.on join -end
    
    /*
    line 75-80 줄까지는 게임 시작을 알리는 이벤트이다.
    현재 순서에 따라 해당 사용자의 턴 값을 true로 바꾸어 해당 사용자가 빙고판의 숫자를 선택할수 있게한다.
    또한, 해당 사용자의 순서를 update_users라는 이벤트를 전송하여 알려준다.
    */
    socket.on('game_start', function(data){
        socket.broadcast.emit("game_started", data);
        users[turn_count].turn  = true;
        
        io.sockets.emit('update_users', users);        
    });//socket.on game_start - end
    
    /*
    line 85-96 숫자를 선택할때 발생하는 이벤트를 처리하는 부분이다.
    현재 사용자의 턴을 종료시키고 다음 사용자의 턴을 참값으로 바꾸도록한다.
    마찬가지로 다음 사용자의 순서를 알려주고자 이번에도 update_users라는 이벤트를 전송한다.
    */
    socket.on('select', function(data){
        socket.broadcast.emit("check_number", data);
        
        users[turn_count].turn = false;
        turn_count++;
        if(turn_count >= user_count){
            turn_count = 0;            
        }
        users[turn_count].turn = true;
        
        io.sockets.emit('update_users', users);
    });//socket.on select - end
    
    /*
    line 103-108 사용자의 접속 종료를 처리하는 부분이다.
    */
    socket.on('disconnect', function(){
        delete users[socket.username];
        io.sockets.emit('update_users', users);
        
        user_count--;        
    });//socket.on disconnect - end
    
    
});//io.socket.on - end


//http://ec2-54-178-167-173.ap-northeast-1.compute.amazonaws.com:3000/main?username=test1
//http://ec2-54-178-167-173.ap-northeast-1.compute.amazonaws.com:3000/main?username=test2



