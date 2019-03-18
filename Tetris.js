/*---------------------------------------------\
|  pushbox game                                |
|----------------------------------------------|
|author: 郑志刚, 286584758@qq.com              |
|version 1.0.0                                 |
|Created 2006-04-11                            |
\---------------------------------------------*/

var TetrisGame = function(speed, parentFrame){
	this.speed = speed;
	if("string" == typeof(parentFrame))
		parentFrame = document.getElementById(parentFrame);
	this.parentFrame = parentFrame || document.body || document;
	this.cols = 16;
	this.rows = 24;
	this.blockWidth = 20;
	this.blockHeight = 20;
	window.tetrisGame = this;
	this.allPoints = [];
	this.isStart = false;
	this.currentBlock = null;
	this.nextBlock = null;
	this.timer = null;
	this.isOver = false;
	this.score = 0;
	this.blockColors = ["url(resource/block0.png)","url(resource/block1.png)", "url(resource/block2.png)","url(resource/block3.png)","url(resource/block4.png)", "url(resource/block5.png)","url(resource/block6.png)"];
	this.frameColor = "url(resource/floor.bmp)";
	this.outlandColor = "#959F84";
	this.blankColor = "url(resource/bg0.bmp)";
	this.initialize = function(){
		drawFrame(this);
		var _game = this;
		this.timer = new Timer(this);
		var intervalId = null;
		this.scoreInput.value="";	
		if(this.seedInput.value){
			this.speed = parseInt(this.seedInput.value);
		}
		document.onkeydown= function(event){
			if(_game.isOver || !_game.isStart) return false;
			_game.pointFrame.focus();
			var event = event||window.event;
			switch(event.keyCode){
				case 37:
					intervalId = setTimeout("tetrisGame.currentBlock.moveLeft()", 100);
					break;
				case 38:
					intervalId = setTimeout("tetrisGame.currentBlock.turn()", 100);
					break;
				case 39:
					intervalId = setTimeout("tetrisGame.currentBlock.moveRight()", 100);
					break;
				case 40:
					intervalId = setTimeout("tetrisGame.currentBlock.moveDown()", 100);
					
			}

			return false;
		}
		
		/*
		document.onkeyup= function(event){
			if(intervalId) clearTimeout(intervalId);
			return false;
		}
		*/
		//this.pointFrame.onkeyup= function(event){
		//	if(intervalId) clearTimeout(intervalId);
		//}		
	};

	var Point = function(x, y, element,status, flag){
		this.x = x;
		this.y = y;
		this.element = element;	
		this.isBlock = flag=="block";
		this.isOutland = flag=="outland";
		this.setStatus = function(status, attrs){
			this.status = status;
			//this.element.innerHTML = status;
			var background = this.isOutland?tetrisGame.outlandColor:tetrisGame.blankColor;
			if(attrs){
				this.isBlock = attrs.isBlock;
				background = attrs.color;
			}
			
			if(status){
				this.element.style.background = background;
				//this.isBlock = true;
			}
			else{
				this.element.style.background = tetrisGame.blankColor;
				//this.element.innerHTML = "";
				//this.isBlock = false;
			}
		}
		//this.setStatus(status, this.isOutland);
	};	
	
	/** 构成所有基本方块的数据值 **/
	var BlockValues = [
	  [
		[0,0,0],
		[1,1,1],
		[0,1,0]
	  ],
	  [
		[0,0,0],
		[1,1,1],
		[0,0,1]
	  ],
	  [
		[0,0,0],
		[1,1,1],
		[1,0,0]
	  ],
	  [
		[0,0,0],
		[1,1,0],
		[0,1,1]
	  ],
	  [
		[0,0,0],
		[0,1,1],
		[1,1,0]
	  ],
	  [
	  	[0,0,0,0],
		[0,1,1,0],
		[0,1,1,0],
		[0,0,0,0]
	  ],
	  [	
	  	[0,0,0,0],
		[0,0,0,0],
		[1,1,1,1],
		[0,0,0,0]
	  ]
	];
	
	
	/** 方块类 **/
	var Block = function(values, leftTopPoint, color){
		this.points = [];  		//本方块占据的点
		this.values = values;	//本方块的数据值		
		this.leftTopPoint = leftTopPoint; //左上角点
		this.color = color;    //方块的颜色
		
		/** 将刚产生的方块渲染到页面 **/
		this.render = function(){
			var x = this.leftTopPoint.x;
			var y = this.leftTopPoint.y;
			for(var i = 0; i < this.values.length; i++){
				this.points[i] = [];
				for(var j = 0; j < this.values[i].length; j++){
					var val = this.values[i][j];
					var _point = tetrisGame.allPoints[y+i][x+j];
					if(!_point.isBlock && !_point.isOutland)
						_point.setStatus(val, {isBlock:false,color:this.color});
					this.points[i][j] = tetrisGame.allPoints[y+i][x+j];
				}
			}
		};
		/** 翻转 **/
		this.turn = function(){
			var points = this.points; //方块的点
			var N = points.length-1; //方块矩阵边长
			var oldValues =  this.values; //翻转前的数据值
			var newValues = [];  //翻转后的数据值
			/** 生成翻转后的数据值 **/
			for(var i = 0; i <= N; i++){ 
				newValues[i] = [];
				for(var j = 0; j <= N; j++){
					newValues[i][j] = oldValues[N-j][i];
					var point = tetrisGame.allPoints[points[i][j].y][points[i][j].x];
					if(newValues[i][j] && (point.isBlock||point.isOutland)) return;	
				}
			}

			this.values = newValues; //翻转后的数据值重新作为方块的数据值
			/** 按新数据值设置点 **/
			for(var i = 0; i <= N; i++){
				for(var j = 0; j <= N; j++){
					var val = newValues[i][j];
					var point = tetrisGame.allPoints[points[i][j].y][points[i][j].x];
					if(!point.isBlock && !point.isOutland)
						point.setStatus(val, {isBlock:false,color:this.color});	
				}
			}
		};
		/** 左移 **/
		this.moveLeft = function(){
			if(!this.checkMove("left")) return;
			var x = this.leftTopPoint.x;
			if(x == 0) return;
			var y = this.leftTopPoint.y;
			for(var i= 0; i <this.values.length; i++){				
				for(var j=0; j < this.values[i].length; j++){
					var val = this.values[i][j];
					var point = tetrisGame.allPoints[y+i][x+j-1]; //块左边的点
					this.points[i][j] = point;
					if(!point.isBlock && !point.isOutland){  //判断左边的点为块阻塞或到达边界
						point.setStatus(val, {isBlock:false,color:this.color}); //块移动到左边的点
						var rightPoint = tetrisGame.allPoints[y+i][x+j];
						if(!rightPoint.isBlock && !rightPoint.isOutland)  //满足条件则右边的点置空
							 rightPoint.setStatus("");
					}
				}
			}
			this.leftTopPoint = tetrisGame.allPoints[y][x-1]; //重设左上角
		};
		
		/** 右移 **/
		this.moveRight = function(){
			if(!this.checkMove("right")) return;
			var x = this.leftTopPoint.x;
			var y = this.leftTopPoint.y;			
			for(var i = 0; i < this.values.length; i++){
				var j = this.values[i].length;
				for(; j > 0; j--){
					var val = this.values[i][j-1];
					var point = tetrisGame.allPoints[y+i][x+j]; //块右边的点
					this.points[i][j-1] = point;
					if(!point.isBlock && !point.isOutland){ //判断右边的点为块阻塞或到达边界
						point.setStatus(val, {isBlock:false,color:this.color});  //块移动到右边的点
						var leftPoint = tetrisGame.allPoints[y+i][x+j-1];
						if(!leftPoint.isBlock && !leftPoint.isOutland) //满足条件则左边的点置空
							leftPoint.setStatus("");
					}
				}
			}
			this.leftTopPoint = tetrisGame.allPoints[y][x+1]; //重设左上角
		};
		
		/** 下移 **/
		this.moveDown = function(){
			if(tetrisGame.isOver) return;
			var x = this.leftTopPoint.x;
			var y = this.leftTopPoint.y;
			if(!this.checkMove("down")){  //当块不能下移时
				this.setFixed();  //将点设为块阻塞状态
				this.points = null;
				if(y==0){  //游戏结束
					tetrisGame.setOver();
					return;
				}
				//将下一个块作为当前块
				tetrisGame.currentBlock =tetrisGame.nextBlock;
				tetrisGame.currentBlock.render(); //在页面渲染当前块
				tetrisGame.nextBlock = tetrisGame.getBlock(); //获取下一个块作准备
				return;
			}
			for(var i = this.values.length; i >0 ; i--){
				for(var j =0; j < this.values[i-1].length; j++){
					var val = this.values[i-1][j];
					if(y+i > tetrisGame.rows-1)continue;
					var point = tetrisGame.allPoints[y+i][x+j];
					this.points[i-1][j] = point;
					//设置下移
					if(!point.isBlock && !point.isOutland) 
						tetrisGame.allPoints[y+i][x+j].setStatus(val, {isBlock:false,color:this.color});
					//下移后上面点置空
					if(!tetrisGame.allPoints[y+i-1][x+j].isBlock && !tetrisGame.allPoints[y+i-1][x+j].isOutland){
						tetrisGame.allPoints[y+i-1][x+j].setStatus("");
					}
				}
			}
			this.leftTopPoint = tetrisGame.allPoints[y+1][x]; //重设左上角
		};
		
		/** 检查是否可移动 **/
		this.checkMove = function(direction){
			var x = this.leftTopPoint.x;
			var y = this.leftTopPoint.y;
			switch(direction){
				case "left":  //是否能左移
					var points = this.points;
					var N = points.length-1;
					for(var j = 0;j<= N;j++){
						for(var i=N;i>=0;i--){
							if(this.values[i][j]){
								var leftPoint = tetrisGame.allPoints[points[i][j].y][points[i][j].x-1];
								if(leftPoint.isBlock || leftPoint.isOutland)
									return false;
							}
						}
					}
					return true;
				case "right":  //是否能右移
					var points = this.points;
					var N = points.length-1;
					for(var j = 0;j<= N;j++){
						for(var i=N;i>=0;i--){
							if(this.values[i][j]){
								var rightPoint = tetrisGame.allPoints[points[i][j].y][points[i][j].x+1];
								if(rightPoint.isBlock || rightPoint.isOutland)
									return false;
							}
						}
					}
					return true;
				case "down":  //是否能下移
					var points = this.points;
					var N = points.length-1;					
					for(var i=N;i>=0;i--){
						for(var j = 0;j<= N;j++){
							if(this.values[i][j]){
								var underPoint = tetrisGame.allPoints[points[i][j].y+1][points[i][j].x];
								if(underPoint.isBlock || underPoint.isOutland)
									return false;
							}
						}
					}
					return true;
			}
			return false;	
		}
		
		//当块不能下移时将点设为块阻塞状态
		this.setFixed = function(){
			var points = this.points;
			//this.fixed = true;
			for(var i = 0; i < points.length; i++){
				for(var j = 0; j < points[i].length; j++){
					if(this.values[i][j]){
						points[i][j].isBlock = true;
						//points[i][j].element.innerHTML = "B";
					}
					else{
						//points[i][j].element.innerHTML = "";
					}
				}
			}
			tetrisGame.checkAndCalcScore(this);
		}
	}; // Block
	
	/** 定时器类 **/
	var Timer = function(game){
		this.speed = game.speed;
		this.intervalId = null;
		this.game = game;
		this.start = function(){ //定时器开始
			if(this.game.isOver){
				return;
			}
			this.game.pointFrame.focus();
			this.game.currentBlock.moveDown();
			var speed = 1000-(parseInt(this.game.score/1000))*100;
			if(speed < 10 ) speed = 10;
			this.speed = speed;
			game.seedInput.value = this.speed;
			this.intervalId = setTimeout("tetrisGame.timer.start()", speed);			
		};
		this.stop = function(){ //定时器停止
			if(this.intervalId) 
				clearTimeout(this.intervalId);
		};
	};
	
	this.initialize(); //初始化
	
	//随机获取一个块
	this.getBlock = function(){
		var rand = 10*Math.random();
		var n = parseInt(rand) % BlockValues.length;
		var color = this.blockColors[n]; //块的颜色
		var values = BlockValues[n];  //基本块的数据值
		var N = values.length-1;
		var turnCount = parseInt(10*Math.random()) % 4; //获取0-3的随机次数
		
		//以基本块的数据值为基础，按随机次数turnCount旋转变换为一个新的数据值
		for(var count = 0 ; count < turnCount; count++){
			var newValues = [];
			for(var i = 0; i <= N; i++){
				newValues[i] = [];
				for(var j = 0; j <= N; j++){
					newValues[i][j] = values[N-j][i];
				}
			}
			values = newValues;
		}
		
		var point = this.allPoints[0][6]; //边长不为4的块左上角点
		if(values.length == 4)  //边长为4的块左上角点
		 	point = this.allPoints[0][5];
		var block = new Block(values, point, color); 	
		this.showBlock(block);
		return block;
	};

	this.startOrPause = function(btn){
		if(this.isStart){
			this.isStart = false;
			this.timer.stop();
			btn.value = "Start";
		}
		else{
			if(this.isOver){
				this.isOver = false;
				this.initialize(); 
			}
			if(this.currentBlock == null){
			 	this.currentBlock = this.getBlock();
			 	this.nextBlock = this.getBlock();
			 	this.currentBlock.render();
			 	this.scoreInput.value="";
			}
			this.isStart = true;
			if(this.timer) this.timer.start();
			btn.value = "Pause";
		}
		this.pointFrame.focus();
	}
	
	/**显示下一个块**/
	this.showBlock = function(block){
		var values = block.values;
		var box = this.showNextBlockBox;
		var rows = box.rows;
		var cells = [];
		for(var i = 0; i < rows.length; i++){
			cells[i] = [];
			for(var j = 0;j < rows[i].cells.length; j++){
				cells[i][j] = rows[i].cells[j];
				//cells[i][j].innerHTML ="";
				cells[i][j].style.background = "";				
			}
		}
		for(var i = 0; i < values.length; i++){
			for(var j = 0; j < values[i].length; j++){
				if(values[i][j]){
					//cells[i][j].innerHTML = values[i][j];	
					cells[i][j].style.background = block.color;
				}	
			}
		}
	}
	
	this.setOver = function(){
		this.timer.stop();
		alert("game over!");
		this.playButton.value = "Start";
		 
		this.allPoints = [];	
		this.isStart = false;
		this.currentBlock = null;
		this.nextBlock = null;
		this.isOver = true;
	}
	
	this.checkAndCalcScore = function(block){
		var score = 0;
		var points = block.points;
		var rows = points.length;
		var multiLine = 0;
		for(var i = rows-1; i >= 0; i--){
			var isBlockLine = true;
			var y1 = points[i][0].y;
			var j=2, cols = this.allPoints[y1].length-2;
			for(; j < cols; j++){
				var point = this.allPoints[y1][j];
				if(!point.isBlock){
					isBlockLine = false;
					//multiLine = 0;
					break;
				}
			}
			if(j < cols) continue;
			if(isBlockLine){
				multiLine++;
				score+=100;
				destroyLine(y1, this);
				i++;
			}
		}

		if(score){
			this.score = this.score + score + (multiLine-1)*25;
			this.scoreInput.value = this.score;	
		}
		
		function  destroyLine(y, game){
			for(var j = 2; j < game.allPoints[y].length-2; j++){
				var point = game.allPoints[y][j];
				for(var i = y; i > 1; i--){
					var upPoint = game.allPoints[i-1][j];
					game.allPoints[i][j].setStatus(upPoint.status, {isBlock:upPoint.isBlock,color:upPoint.element.style.background});
					
				}
			}
		}
	}
	
	this.testShowPointXY = function(point, msg){
		var str = point?"x="+point.x+",y="+point.y +",isBlock="+point.isBlock:"";
		this.msgCell.innerHTML = str +(msg?(";"+msg):"");
		
	}
	
	function drawFrame(game){
		game.parentFrame.innerHTML = "";
		var parentTable = document.createElement("table");
		parentTable.style.background = game.frameColor;
		parentTable.setAttribute('border', '0');
		var parentTr = parentTable.insertRow(0);
		var frame_td1 = parentTr.insertCell(0);		
		var frame_td2 = parentTr.insertCell(1);		
		var pointTable = document.createElement("table");
		pointTable.setAttribute('border', '0');
		pointTable.style.borderTop = "0px";
		pointTable.style.borderCollapse = "collapse";	
		for(var y = 0; y < game.rows; y++){
			var tr=pointTable.insertRow(y);
			game.allPoints[y] = [];
			for(var x = 0; x < game.cols; x++){
				var td= tr.insertCell(x);
				td.setAttribute('width', game.blockWidth);
				td.setAttribute('height', game.blockHeight);				
				var status = "";
				var flag = "";
				var isOutland = false;
				if(y == 0 || y >= game.rows-2){
					status = x+1;
					flag = "outland";
					td.style.background = game.frameColor;
					if(y ==0 && x>1 && x < game.cols-2) td.style.borderBottom = "1px solid #353535";
					else if(y == game.rows-2 && x>1 && x<game.cols-2) td.style.borderTop = "1px solid #FFFFFF";
					//td.style.visibility = "hidden";
					 
				}
			 	else if(x <= 1 || x >= game.cols-2){
			 		 status = y+1;
			 		 flag = "outland";
			 		 td.style.background = game.frameColor;
			 		if(x==1 ) td.style.borderRight = "1px solid #191919";
					else if(x == game.cols-2) td.style.borderLeft = "1px solid #FFFFFF";
			 		//td.style.visibility = "hidden";
			 	}
			 	else{
			 		td.style.background = game.blankColor;
			 	}
				var point = new Point(x, y, td, status, flag);
				game.allPoints[y][x] = point;
			}
		}
		frame_td1.appendChild(pointTable);		
		frame_td2.style.textAlign = "center";
		frame_td2.style.verticalAlign="top";
		//frame_td2.setAttribute('width', "100px");
		var rightTable = document.createElement("table");
		rightTable.setAttribute('border', '0');
		var rightTable_row = 0;
		var _tr = rightTable.insertRow(rightTable_row++);
		var showNextBlockCell = _tr.insertCell(0);
		showNextBlockCell.style.textAlign = "left";
		showNextBlockCell.style.verticalAlign="middle";		
		showNextBlockCell.innerHTML = "Next:<br><table id='showNextBox' border=0 style='border-collapse:collapse;border-top:1px solid #717A70;border-left:1px solid #717A70;border-right:1px solid #E6E6E6;border-bottom:1px solid #E6E6E6;'><tr height="+game.blockHeight+"><td width="+game.blockWidth+"></td><td width="+game.blockWidth+"></td><td width="+game.blockWidth+"></td><td width="+game.blockWidth+"></td></tr><tr height="+game.blockHeight+"><td></td><td></td><td></td><td></td></tr><tr height="+game.blockHeight+"><td></td><td></td><td></td><td></td></tr><tr height="+game.blockHeight+"><td></td><td></td><td></td><td></td></tr></table>";
		_tr = rightTable.insertRow(rightTable_row++);
		var putSpeedCell = _tr.insertCell(0);
		putSpeedCell.innerHTML = 'speed: <input type="text" id="seedInput" readonly="readonly" size="3">';
		putSpeedCell.style.textAlign = "left";
		_tr = rightTable.insertRow(rightTable_row++);
		var scoreCell = _tr.insertCell(0);
		scoreCell.innerHTML = 'score: <input type="text" id="scoreInput" size="8" readonly="readonly" value="" style="border:0;">';
		scoreCell.style.textAlign = "left";
		_tr = rightTable.insertRow(rightTable_row++);
		var StartPauseBtnCell = _tr.insertCell(0);
		StartPauseBtnCell.innerHTML = '<input type="button" id="playBtn" value = "Start" onclick="tetrisGame.startOrPause(this)">';
		
		frame_td2.appendChild(rightTable);
		game.pointFrame = pointTable;
		game.parentFrame.appendChild(parentTable);
		game.showNextBlockBox = document.getElementById("showNextBox");
		game.seedInput = document.getElementById("seedInput");
		game.scoreInput = document.getElementById("scoreInput");
		game.playButton = document.getElementById("playBtn");
		_tr = rightTable.insertRow(rightTable_row++);
		game.msgCell = _tr.insertCell(0);
	}
};
