//2014-04-25 

// line 4-9 작업에 필요한 모듈 호출
var  express = require('express')
	, routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path')
    , socketio = require('socket.io');

//app 객체선언후 express()함수로 생성한다.
var app = express();

//line 15-35 app객체에 대한 특징, 생성할 웹서버의 특징을 기술하는 부분.
app.configure(function(){
    app.set('port', process.env.PORT || 3000);//포트설정
    app.set('views',__dirname + '/views');//뷰 디렉토리 설정 
    app.set('view engine', 'jade');//뷰 엔진설정
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    // 라우터 설정(사용자의 요청에 따라 어떻게 응답할지 결정하는 것이 라우터 역활. 
    //라우터는 별도의 모듈로 정의하는것이 일반적이며, 해당 모듈로 정의된 객첼르 app객체에 연결해줌)
    app.use(app.router);
    
    /*
    정적 디렉토리 설정
    디렉토리 구조를 URL에 반영하여 쉽게 접근 가능한 정적 디렉토리를 설정한다.
    클라이언트에서 사용되는 정적인 HTML 페이지나 동적인 페이지 구성을 위한 
    클라이언트 측의 자바스크립트, CSS, 이미지 파일 등과 같은 리소스를 이렇게 설정한 디렉토리에 두는것이 일반적이다.
    */    
    app.use(express.static(path.join(__dirname, 'public')));//    
});

app.configure('development', function(){
    app.use(express.errorHandler());
});
//41-43 routes모듈에서 /mian접속시 /views/main.jade 읽어들이며 이파일에서 다시 layout.jade파일을 확장하며 읽어들인다 - css,socket.in,jquery, main.js(메소드설정파일)
app.get('/', routes.index);
app.get('/main', routes.main);//클라이언트에서 main으로 접속하면 routes 모듈의 main()메서드가 실행되도록 연결하는 코드.(실제 라우팅 담당 파일 routes/index.js) main.jade 파일 랜더링한다.
app.get('/users', user.list);
//app.get <- get방식으로 정보롤 받아오는것을 의미한다.(app.post 는 포스트 방식을 의미)
//line 46-52 express, socket.io 연동코드 
var server = http.createServer(app);// 웹서버 생성
var io = socketio.listen(server);//웹서버 소켓통신 연결

//서버 연결시 해당 포트번호를 가져와서 콘솔 창에 정보를 출력한다.
server.listen(app.get('port'), function(){
    console.log("express server listening on port" + app.get('port'));
});

//line 55-57 사용자저장을 위한 객체, 현재 접속한 사용자수, 누구의 차례인지 기록하는 변수
var users = {};
var user_count = 0;
var turn_count = 0;

//웹소켓으로 연결이 이루어 졌을때 의 이벤트에 대응하는 콜백함수 설정
io.sockets.on('connection', function(socket){
    
    /*
    lind 68-80 사용자가 접속했을때 join 이벤트에 대응하는 내용,
    사용자의 이름을 가져와서 소켓의 사용자 이름으로 설정하고 사용자 객체를 생성하여 이름과
    턴 값을 설정한다. 그리고 클라이언트에게 새로운 사용자가 접속 했으니 사용자 목록을 업데이트하여 
    출력하라고 update_users 라는 이벤트를 전송하여 알려준다.
    */
    socket.on('join', function(data){
        var username = data.username;//사용자의 이름을 가져와서 사용자 이름으로 설정
        
        socket.username = username;//사용자이름을 소켓의 사용자 이름으로 설정
        //사용자 객체생성
        users[user_count] = {};//카운트
        users[user_count].name = username;//이름
        users[user_count].turn = false;//턴값
        
        io.sockets.emit('update_users', users);//클라이언테에게 새로운 사용자가 접속했으니 사용자 목록을 업데이트 하여 출력하라고 update_users 라는 이벤트를 전송하여알려준다.
        
        user_count++;//유저 카운트수 업데이트
    });//socket.on join -end
    
    /*
    line 87-92 줄까지는 게임 시작을 알리는 이벤트이다.
    현재 순서에 따라 해당 사용자의 턴 값을 true로 바꾸어 해당 사용자가 빙고판의 숫자를 선택할수 있게한다.
    또한, 해당 사용자의 순서를 update_users라는 이벤트를 전송하여 알려준다.
    */
    socket.on('game_start', function(data){
        socket.broadcast.emit("game_started", data);//main.js 파일의 game_started 에 data전송 game_started에서 data.username객체를 이용 유저가 게임을 시작했다고 알림 시작버튼은 숨긴다.
        users[turn_count].turn  = true;//사용자 턴값이 true가 되어 숫자를 선택할수있는 상태가 된다.
        
        io.sockets.emit('update_users', users);//사용자의 순서를 update_users라는 이벤트를 전송 -> main.js 파일에서 update_userlist 함수를 호출하여 사용자의 목록화 순서를 표시한다.
    });//socket.on game_start - end
    
    /*
    line 99-112 숫자를 선택할때 발생하는 이벤트를 처리하는 부분이다.
    현재 사용자의 턴을 종료시키고 다음 사용자의 턴을 참값으로 바꾸도록한다.
    마찬가지로 다음 사용자의 순서를 알려주고자 이번에도 update_users라는 이벤트를 전송한다.
    */
    socket.on('select', function(data){//숫자 선택 이벤트 발생
        
        //check_number 이벤트 전송 main.js에서 해당 이벤트를 받아서 선택한 숫자가 어디인지 찾아서 체크하는 함수,유저네임과 체크했다는 메세지와 체크된 번호를 출력한다.
        socket.broadcast.emit("check_number", data);
        //현재 사용자가 숫자를 선택했기때문에 턴값이 false가 되면 숫자를 선택할수없게 된다.
        users[turn_count].turn = false;
        turn_count++;//턴가운트 수 업데이트
        if(turn_count >= user_count){//턴카운트와 유저카운트 비교후 턴가운트가 같거나 크면 턴카운트를 0으로 초기화한다.
            turn_count = 0;           
        }
        users[turn_count].turn = true;//유저의 턴값을 true로 변경
        
        io.sockets.emit('update_users', users);//변경된 유저의 정보를 update_users 이벤트로전송 -> main.js 파일에서 update_userlist 함수를 호출하여 사용자의 목록화 순서를 표시한다.
    });//socket.on select - end
    
    /*
    line 115-120 사용자의 접속 종료를 처리하는 부분이다.
    */
    socket.on('disconnect', function(){
        delete users[socket.username];
        io.sockets.emit('update_users', users);
        
        user_count--;        
    });//socket.on disconnect - end
    
    
});//io.socket.on - end


//http://ec2-54-178-167-173.ap-northeast-1.compute.amazonaws.com:3000/main?username=test1
//http://ec2-54-178-167-173.ap-northeast-1.compute.amazonaws.com:3000/main?username=test2

/*

check_number 이벤트로 번호를 선택하면 어떤번호를 선택했는지 main.js 파일에서 
where_is_it 함수를 호출한다.
where_is_it 함수는 table.bingo-board td 빙고판에서 해당 숫자를 찾아서 select_num 함수를 호출하여
선택된 숫자를 서버에 전달하고 빙고판에서 해당숫자를 체크(chek_num 함수를 호출하여 해당숫자에 체크)하고 상대방에게 자기 차례라고 알려준다.

위처럼 숫자를 선택할때 자기차례는 없어지고 상대방 차례로 되는것을 반복하면서 빙고 게임을 서로 대전으로 할수있게 한다.
*/


