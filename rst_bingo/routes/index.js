
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

//p.229 추가 main.jade 파일을 랜더링
exports.main = function(req, res){
	res.render('main', {title: 'bingo!', username: req.query.username});
};
