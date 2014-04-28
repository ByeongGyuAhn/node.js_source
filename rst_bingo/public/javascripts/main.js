//2014-04-24 p.245 추가
var bingo = {
        is_my_turn: Boolean,
        socket: null,

        init: function () {
            var self = this;
            
            //initialize
            
            //자신의 순서를 확인
            this.is_my_turn = true;
            
            this.socket = io.connect('http://ec2-54-178-167-173.ap-northeast-1.compute.amazonaws.com:3000');
            
            //체크된 번호를 소캣통신으로 처리한다. 
            this.socket.on("check_number",function(data){
                self.where_is_it(data.num);
                self.print_msg(data.username + " checked '" +  data.num + "'");
            });
            
            //게임시작 버튼을 누르면 게임 시작을 알리고 시작버튼은 사라진다.
            this.socket.on("game_started", function(data){
                self.print_msg(data.username + " started this game ");
                $("#start_button").hide();
            });
            
            //유저의 현재 상태 업데이트(순서,체크한 숫자)
            this.socket.on("update_users", function(data){
                self.update_userlist(data);
            });
            
            //join
            //
            this.socket.on("connect",function(){
                self.socket.emit("join", { username: $("#username").val() });
            });
            
            //빙고 숫자 1-25 설정
            var numbers = [];
            for(var i=1; i<=25; i++){
                numbers.push(i);
            }
            
            //빙고 숫자 랜덤함수 이용 무작위로 숫자 생성
            numbers.sort(function(a, b){
                var temp = parseInt(Math.random() * 10);
                var isOddOrEven = temp % 2;
                var isPosOrNeg = temp > 5 ? 1 : -1;
                return(isOddOrEven*isPosOrNeg);
            });
            
            $("table.bingo-board td").each(function(i){
                $(this).html(numbers[i]);
                
                $(this).click(function(){
                    self.select_num(this);
                });
            });
            
            $("#start_button").click(function(){
                self.socket.emit("game_start",{ username  : $("#username").val()});
                self.print_msg("You started this game.");
                $("#start_button").hide();
            });            
        },//init - end
    

        select_num: function (obj){
            if(this.is_my_turn && !$(obj).attr("checked")){
                //send num to other players
                this.socket.emit("select", {username : $("#username").val(), num: $(obj).text() } );
                
                this.chek_num(obj);
                
                this.is_my_turn = false;
                
            }else{
                this.print_msg("it is not your turn!");
            }
        },//select_num - end

        where_is_it: function(num){
            var self = this;
            var obj = null;
            
            $("table.bingo-board td").each(function(i){
                if($(this).text() == num){
                    self.chek_num(this);
                }
            });

        },//where_is_it - end

        chek_num: function(obj){
            $(obj).css("text-decoration", "line-through");
            $(obj).css("color", "#ff2300");
            $(obj).attr("checked", true);

        },//chek_num - end

        update_userlist: function(data){
            var self = this;
            $("#list").empty();
            
            console.log(data);
            
            $.each(data, function(key, value){
                var turn = "(-)&nbsp;";
                if(value.turn == true){
                    turn = "(*)&nbsp;";
                    console.log(value.name);
                    console.log($("#username").val());
                    if(value.name == $("#username").val()){
                        self.is_my_turn = true;
                    }
                }
                $("#list").append(turn + value.name + "<br />");
            });

        },//update_userlist - end

        
        print_msg: function(msg){
            $("#logs").append(msg + "<br />");
        }//print_msg -end
};

$(document).ready(function(){
        bingo.init();
});
