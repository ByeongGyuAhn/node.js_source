//2014-04-24 p.245 추가
var bingo = {
        is_my_turn: Boolean,
        socket: null,

        init: function () {
            var self = this;
            
            //initialize
            this.is_my_turn = true;
            
            this.socket = io.connect('http://localhost:3000');
            
            this.socket.on("check_number",function(){
                self.where_is_it(data.num);
                self.print_msg(data.username + " checked '" +  data.num + "'");
            });
            
            this.socket.on("game_started", function(data){
                self.print_msg(data.username + " started this game ");
                $("#start_button").hide;
            });
            
            this.socket.on("update_users", function(data){
                self.update_userlist(data);
            });
            
            //join
            this.socket.on("connect",function(){
                self.socket.emit("join", { username: $("#username").val() });
            });
            
            var numbers = [];
            for(var i=1; i<=25; i++){
                numbers.push(i);
            }
            
            numbers.sort(function(a, b){
                var temp = parseInt(Math.random() * 10);
                var isOddOrEven = temp % 2;
                var isPosOrNeg = temp > 5 ? 1 : -1;
                return(isOddOrEven*isPosOrNeg);
            });
            
            $("table.bingo-board td").each(function(){
                $(this).html(numbers[i]);
                
                $(this).click(function(){
                    self.select_num(this);
                });
            });
            
            $("#start_button").click(function(){
                self.socket.emit("game_start",{ username  : $("username").val()});
                self.print_msg("You started this game.");
                $("#start_button").hide();
            });            
        },//init - end
    

        select_num: function (obj){
            if(this.is_my_turn && !$(obj).attr("checked")){
                
                
            }

        },//select_num - end

        where_is_it: function(num){

        },//where_is_it - end

        chek_num: function(obj){

        },//chek_num - end

        update_userlist: function(data){

        },//update_userlist - end

        leave: function(){

        },//leave - end

        print_msg: function(msg){

        }//print_msg -end
};

$(document).ready(function(){
        bingo.init();
});
