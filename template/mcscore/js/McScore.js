/**
	乐谱显示、同步控制
	@class McScore
*/
var McScore = {
	/**
		构造器
	*/
	createNew: function(option) {
		var ins = {};

		ins.mode = "PLAY";
		ins.status = "INIT"; //当前状态 INIT PAUSE PLAYING STOP
		ins.player = null; //当前使用的播放器
		ins.sid = -1; //乐谱id
		ins.lineSpacing = 2.5; //乐谱线行间距
		ins.pages = 0; //乐谱总页数
		ins.scores = null; //score.json直接转换成的对象
		ins.scoreBPM = -1; //谱面速度
		ins.currentBPM = -1; //当前速度
		ins.staffNoteList = []; //每行所有音符按先后顺序排列
		ins.noteMap = {}; //noteid->note的映射，根据score.json生成
		ins.measureMap = {}; //measureid->measure的映射，根据score.json生成
		ins.note2MeasureMap = {}; //noteId -> measureId 二元关系
		ins.curTick = 0;
		ins.isEnableAccompany = false; //是否开启伴奏

		ins.iframeRoot = []; //保存每页iframe的根结点
		ins.iframeRoot.push(""); //下标0不用，从1开始
		ins.svgRoot = []; //保存每页svg的根结点
		ins.svgRoot.push(""); //下标0不用，从1开始
		ins.svgPageLines = []; //保存每页svg中的每行乐谱空间范围，用于计算音符位于哪一行
		ins.svgPageLines.push(""); //下标0不用，从1开始
		ins.jsonLoaded = false; //json是否加载完毕
		ins.isCallOnReady = false; //是否已经回调过onReady方法
		ins.isEnableMetronome = false; //是否开启节拍器
		ins.metronomeStatus = 0; //节拍器状态，当前是本小节的第几拍
		ins.metronome = McMetronome.createNew();

		//私有成员
		var prv = {};
		prv.isJsBridgeReady = false; //js bridge 是否已加载好
		prv.jsBridge = null;
		prv.playingNote = []; //正在演奏中的音符		
		prv.disableStaff = -1;
		prv.onStoped = null;
		prv.currentFrameTick = 0; //当前frame的开始tick
		prv.playTimer = null;
		prv.vernier = {}; //游标线
		prv.scrollOff = -1; //当前滚动位置
		prv.marginTop = 100; //游标上边距
		prv.currentTick = 0; //当前时间
		prv.loop = {}; //循环对象		
		prv.loop.noteA = null; //循环A点
		prv.loop.noteB = null; //循环B点
		prv.loop.noteABorder = null;
		prv.loop.noteBBorder = null;
		prv.loop.isLooping = false; //是否处于循环中
		prv.midiPlayer = McMidiPlayer.createNew();
		prv.audioPlayer = McAudioContext.createNew();
		prv.startTimestamp = 0;

		//ins.metronome.setup(120, 4);
		//var fonts = ins.metronome.getSoundFonts();
		//ins.metronome.setSoundFont(fonts[0]);
		/**
			配置项：
			enableJsBridge: boolean 是否启用jsBridge
			onNoteClick: function(element, note) 音符点击事件
			onNoteOn: function(element, note) 开始播放某个音符的事件
			onNoteOff: function(element, note) 结束播放某个音符的事件
			onError: function(msg) 发生错误时产生的事件
			onReady:  function() 资源全部加载完毕之后回调
			onFinish: function() 当乐曲播放完成时的回调
			showScore: boolean 是否显示五线谱
		*/
		ins.option = {
			enableJsBridge: true,
			onNoteClick: function(element, note) {},
			onNoteOn: function(element, note) {},
			onNoteOff: function(element, note) {},
			onError: function(msg) {
				alert(msg)
			},
			onReady: function() {},
			onFinish: function() {},
			showScore: true,
		};

		ins.setOption = function(option) {
			ins.option = option;
		};

		ins.metronomePlayStress = function() {
			ins.metronome.playStress();
		};

		ins.metronomePlayWeakness = function() {
			ins.metronome.playWeakness();
		}

		ins.enableMetronome = function(b) {
			ins.isEnableMetronome = b;
		};

		ins.enableAccompany = function(b, onError) {
			var canPlay = false;
			if (ins.status == 'PLAYING') {
				canPlay = true;
			}
			ins.pause();
			var curTime = 0;
			
			if (ins.isEnableAccompany != b) {
				ins.isEnableAccompany = b;
				if (ins.isEnableAccompany == true) {
					ins.setPlayer(prv.audioPlayer);
					ins.player.open(ins.sid, function() {
						curTime = ins.tick2time(prv.currentTick);
						ins.player.seek(curTime);
						if (canPlay) {
							ins.play();
						}
					}, true, onError);
				} else {
					if (ins.option.enableJsBridge) {
						curTime = prv.currentTick;
						ins.setPlayer(prv.midiPlayer);
					} else {
						curTime = ins.tick2time(prv.currentTick);
						ins.setPlayer(prv.audioPlayer);
					}
					ins.player.open(ins.sid, function() {
						console.log(curTime);
						ins.player.seek(curTime);
						if (canPlay) {
							ins.play();
						}
					});
				}
			}
		};

		ins.setPlayer = function(player) {
			ins.player = player;
		};

		ins.getStatus = function() {
			return ins.status;
		};

		ins.getMode = function() {
			return ins.mode;
		};

		ins.getJsBridge = function() {
			if (ins.option.enableJsBridge) {
				return prv.jsBridge;
			}
			return null;
		}

		prv.registerHandler = function() {
			if (ins.option.enableJsBridge) {
				var jsbridge = prv.jsBridge;
				if (jsbridge) {
					jsbridge.registerHandler('McMidiPlayer_userNoteOn', function(data, responseCallback) {
						console.log("McMidiPlayer_userNoteOn: ", data)
						//alert(JSON.stringify(data));
						responseCallback("hello,jack");
					});

					jsbridge.registerHandler('McMidiPlayer_nextFrame', function(data, responseCallback) {
						console.log("java call McMidiPlayer_nextFrame: " + data)
						var notes = ins.nextFrame();
						responseCallback(JSON.stringify(notes));
					});

					jsbridge.registerHandler('McMidiPlayer_onFinish', function(data, responseCallback) {
						console.log("java call McMidiPlayer_onFinish");
						prv.onFinish();
						if (responseCallback != null && typeof(responseCallback) == "function") {
							responseCallback("I know");
						}
					});
				}
			}
		};

		ins.setMode = function(mode) {
			ins.mode = mode;
			//通知native层
			if (ins.option.enableJsBridge) {
				prv.jsBridge.callHandler('McMidiPlayer_setMode', {
					"mode": mode
				}, null);
			}
		};

		ins.setBPM = function(bpm) {
			if (bpm <= 0) {
				return;
			}
			if (ins.player.type() != "McAudioPlayer") {
				ins.player.setBPM(bpm);
				ins.currentBPM = bpm;
			}

		}

		ins.getBPM = function() {
			return ins.currentBPM;

			/*			if(ins.player.type() == "McAudioPlayer"){
							return Math.round(ins.scoreBPM);
						}
						return ins.player.getBPM();
						*/
		}

		ins.getNote = function(idx) {
			return ins.noteMap[idx];
		}

		ins.setMarginTop = function(n) {
			if (n > 0 && n < 800) {
				prv.marginTop = n;
			}
		}

		ins.getTotalRealTime = function() {
			//var last = ins.staffNoteList[0].length-1;
			//var lastNote = ins.staffNoteList[0][last];
			var lastNote = ins.getLastNote();
			return lastNote.offtime * ins.currentBPM / ins.scoreBPM;
		}

		ins.getCurrentRealTime = function() {
			//var last = ins.staffNoteList[0].length-1;
			//var lastNote = ins.staffNoteList[0][last];
			var lastNote = ins.getLastNote();
			return (prv.currentTick / lastNote.offtick * ins.getTotalRealTime()).toFixed(4);
		}

		//获取最后一个音符
		ins.getLastNote = function() {
			var lastNote = null;
			for (var i = 0; i < ins.staffNoteList.length; i++) {
				if (ins.staffNoteList[i].length == 0) {
					continue;
				}
				var note = ins.staffNoteList[i][ins.staffNoteList[i].length - 1];
				if (lastNote == null || lastNote.offtick < note.offtick) {
					lastNote = note;
				}
			}
			return lastNote;
		}

		//获取第一个音符
		ins.getFirstNote = function() {
			var firstNote = null;
			for (var i = 0; i < ins.staffNoteList.length; i++) {
				if (ins.staffNoteList[i].length == 0) {
					continue;
				}
				var note = ins.staffNoteList[i][0];
				if (firstNote == null || firstNote.offtick > note.offtick) {
					firstNote = note;
				}
			}
			return firstNote;
		}

		//获取每一小节的拍号
		ins.getTimeSig = function() {
			return ins.scores.staves[0].measures[0].timesig;
		}


		prv.onFrame = function(frameNotes) {
			if (frameNotes.length < 1) {
				return;
			}

			var noteMap = {};
			for (var i = 0; i < frameNotes.length; i++) {
				noteMap[frameNotes[i].pitch] = {
					"pitch": frameNotes[i].pitch,
					"id": frameNotes[i].id,
					"staff": frameNotes[i].staff,
					"idx": frameNotes[i].id + "-" + frameNotes[i].times
				};
			}
			//通知js层
			if (ins.option.onFrame && typeof(ins.option.onFrame) == "function") {
				ins.option.onFrame(frameNotes);
			}
			//通知native层
			if (ins.option.enableJsBridge) {
				prv.jsBridge.callHandler('McMidiPlayer_onFrame',
					JSON.stringify(noteMap), null);
			}
		}

		prv.onNoteOn = function(note) {
			//记录
			prv.playingNote.push(note);

			//回调客户定义的方法
			if (ins.option.onNoteOn && typeof(ins.option.onNoteOn) == "function") {
				ins.option.onNoteOn(note);
			}

			//通知native层
			if (ins.option.enableJsBridge) {
				var dur = note.offtime - note.ontime;
				prv.jsBridge.callHandler('McMidiPlayer_onNoteOn', {
					'id': note.id,
					"pitch": note.pitch,
					"chan": note.chan,
					"velo": note.velo,
					"duration": dur
				}, null);
			}
		};

		prv.onNoteOff = function(note) {
			//回调客户定义的方法
			if (ins.option.onNoteOff && typeof(ins.option.onNoteOff) == "function") {
				ins.option.onNoteOff(note);
			}

			//通知native层
			if (ins.option.enableJsBridge) {
				var dur = note.offtime - note.ontime;
				prv.jsBridge.callHandler('McMidiPlayer_onNoteOff', {
					'id': note.id,
					"pitch": note.pitch,
					"duration": dur
				}, null);
			}
		};

		prv.onError = function(msg) {
			if (ins.option.onError && typeof(ins.option.onError) == "function") {
				ins.option.onError(msg);
			}
			console.log(msg);
		}

		prv.onFinish = function() {
			console.log("finish");
			ins.stop();
			if (ins.option.onFinish && typeof(ins.option.onFinish) == "function") {
				ins.option.onFinish();
			}
		}

		//===================================== 等待模式相关逻辑 ========================================================

		ins.frameSeek = function(tick) {
			prv.currentFrameTick = tick;
		}

		ins.nextFrame = function() {
			var cTick = prv.currentFrameTick;
			//检查是否已到曲尾
			var lastNote = ins.getLastNote();
			if (lastNote == null || cTick > lastNote.offtick) {
				return {};
			}

			var frameNotes = []; //下一帧的note暂存在这里
			for (; cTick < lastNote.offtick; cTick++) { //时间线向前推进
				console.log("currentFrame tick " + cTick);
				var t = (ins.player.type() == 'McAudioPlayer') ? ins.tick2time(cTick) : cTick; //如果当前播放的是mp3，需要将秒转换为tick
				if (!prv.loopTest(t)) { //如果是在循环模式，而且到达了循环的B点，那么返回到A点，并退出本次调用
					ins.player.pause();
					setTimeout(prv.onLoopOut, 0);
					return {};
				}

				//console.log("nextFrame tick " + cTick);
				for (var i = 0; i < ins.staffNoteList.length; i++) { //遍历检查每个音符的ontick是否和当前时间相等
					if (i == prv.disableStaff) { //已经关闭掉的分谱
						continue;
					}
					for (var j = 0; j < ins.staffNoteList[i].length; j++) {
						var note = ins.staffNoteList[i][j];

						if (note.ontick == cTick) { //相等即是下一帧的音符
							frameNotes.push(note);
						} else if (note.ontick > cTick) {
							break;
						}
					}
				}

				if (frameNotes.length > 0) {
					break;
				}
			}

			prv.currentFrameTick = cTick + 1; //把当前时刻向前推进，为下一次调用做准备

			console.log("nextFrame tick " + prv.currentFrameTick);

			prv.checkNoteOffTick(cTick);

			var noteMap = {}; //结果集
			for (var i = 0; i < frameNotes.length; i++) { //取出每个note需要返回给调用者的属性存到结果集中
				var note = frameNotes[i];
				var id = note.id;
				var times = note.times;
				noteMap[note.pitch] = {
					"pitch": note.pitch,
					"id": id,
					"ontick": note.ontick,
					"staff": note.staff,
					"idx": id + "-" + times
				};
				var e = ins.noteMap[id + "-" + times].element; //取出页面元素

				ins.pointToNote(note) //游标向前推进
				//e.setAttribute('fill','red');

				prv.onNoteOn(note); //触发NoteOn事件
			}

			return noteMap;
		};

		//==============================================================================================================

		ins.makeSVG = function(tag, attrs) {
			var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
			for (var k in attrs)
				el.setAttribute(k, attrs[k]);
			return el;
		};

		ins.resize = function(page) {
			var width = $('#score').width();
			var oldWidth = $(ins.svgRoot[page]).width();
			var oldHeight = $(ins.svgRoot[page]).height();
			$(ins.svgRoot[page]).height(width / oldWidth * oldHeight);
			$(ins.svgRoot[page]).width(width);
		};

		ins.findNearestNoteByPos = function(page, row, x) {
			console.log("click page: " + page + " row: " + row + " x:" + x);
			var nearest = null;
			var d = 10000;
			for (var i = 0; i < ins.staffNoteList.length; i++) {
				for (var j = 0; j < ins.staffNoteList[i].length; j++) {
					var note = ins.staffNoteList[i][j];
					if (note == null) {
						continue;
					}
					if (note.page != page) {
						continue;
					}
					if (note.pageLine != row) {
						continue;
					}
					//console.log(Math.abs(nearest.x-x));
					if (nearest == null) {
						nearest = note;
						d = Math.abs(nearest.x - x);
						continue;
					}
					if (Math.abs(note.x - x) < d) {
						d = Math.abs(note.x - x);
						nearest = note;
					}
				}
			}
			return nearest;
		}


		//顶层透明浮层被点击
		prv.onTopRectClick = function(rect, e) {
			if (ins.status == 'PLAYING') {
				return;
			}
			var page = $(rect).attr("page");
			var row = $(rect).attr("line");

			var pageLeft = ins.svgRoot[page].getBoundingClientRect().x;
			//alert(pageLeft);
			var realX = e.pageX;
			var realWidth = rect.getBoundingClientRect().width;
			var svgWidth = $(rect).attr("w");
			var svgX = realX * svgWidth / realWidth; //减svg的边距
			var info = page + ":" + row;
			//var box = JSON.stringify(rect.getBoundingClientRect());
			var sPosPage = "(" + e.pageX + "," + e.pageY + ")";
			var sPosScreen = "(" + svgX + ")";

			var note = ins.findNearestNoteByPos(page, row, svgX);
			ins.pointToNote(note);
			ins.onNoteClick(note);
			//alert(JSON.stringify(e) + JSON.stringify(this) );
		};

		prv.analyzeLines = function(page) {

			var sLines = ins.svgRoot[page].getElementsByClassName("StaffLines"); //所有的线
			//alert(JSON.stringify(sLines));
			var sn = ins.scores.staves.length; //谱表数

			//计算每一行的rect
			var linesInfo = [];
			for (var i = 0; i < sLines.length / sn / 5; i++) {
				var pbs = sLines[sn * 5 * i].getAttribute("points").split(/[, ]/);
				var pes = sLines[sn * 5 * (i + 1) - 1].getAttribute("points").split(/[, ]/);

				var ln = new Object();
				ln.bs = sLines[sn * 5 * i]; //当前行的第一条线（五线谱上叫第5线）
				ln.x = parseFloat(pbs[0]);
				ln.y = parseFloat(pbs[3]);
				ln.w = parseFloat(pbs[2]) - parseFloat(pbs[0]);
				ln.h = parseFloat(pes[1]) - parseFloat(pbs[1]);
				ln.bottom = parseFloat(pes[1]);

				console.log("line: " + linesInfo.length + " top: " + ln.y + "-" + (ln.y - 35).toFixed(0) + " bottom: " + ln.bottom +
					"-" + (ln.bottom + 35).toFixed(0) + " h: " + ln.h);

				linesInfo.push(ln);

				//画辅助线
				var w = ln.w + 20;
				var lineHelper = ins.makeSVG('rect', {
					x: ln.x - 10,
					y: ln.y - 30,
					width: w,
					height: ln.h + 60,
					stroke: 'green',
					'stroke-width': 0,
					fill: 'blue',
					'fill-opacity': 0,
					'stroke-opacity': 1
				});

				$(lineHelper).addClass('toprect');
				$(lineHelper).attr("page", page);
				$(lineHelper).attr("line", i);
				$(lineHelper).attr("w", w);
				$(lineHelper).click(function(e) {
					prv.onTopRectClick(this, e);
				});
				ins.svgRoot[page].appendChild(lineHelper);
				//
			}
			ins.svgPageLines[page] = linesInfo;
			//console.log(JSON.stringify(ins.svgPageLines[page]));

		};

		prv.makeVernier = function(page) {
			var vx = ins.svgPageLines[page][0].x;
			var vy = ins.svgPageLines[page][0].y - 10;
			var vh = ins.svgPageLines[page][0].h + 20;
			prv.vernier = {
				"page": page
			};
			prv.vernier.element = ins.makeSVG('rect', {
				x: vx,
				y: vy,
				width: 5,
				height: vh,
				stroke: 'black',
				'stroke-width': 0,
				fill: 'blue',
				'fill-opacity': 0.2,
				'stroke-opacity': 0.9
			});


			ins.svgRoot[page].appendChild(prv.vernier.element);
		};

		ins.pointToPage = function(page) {
			//console.log("point to page: " + page);
			if (page && page != prv.vernier.page) {
				if (prv.vernier.element) {
					$(prv.vernier.element).remove();
				}
				console.log("move to page: " + page);
				prv.makeVernier(page);
			}
		}
		//===============================================  循环处理逻辑  ====================================================
		prv.makeLoopBorder = function(note, isA) {
			var page = note.page;
			var x = note.x;
			if (isA) {
				x = x - 2;
			} else {
				x = x + 5;
			}
			var y = ins.svgPageLines[page][note.pageLine].y - 20;
			var h = ins.svgPageLines[page][note.pageLine].h + 40;
			var border = ins.makeSVG('rect', {
				x: x,
				y: y,
				width: 3,
				height: h,
				stroke: 'black',
				'stroke-width': 0,
				fill: 'green',
				'fill-opacity': 0.5,
				'stroke-opacity': 0.9
			});

			var page = note.page;
			ins.svgRoot[page].appendChild(border);
			return border;
		}

		/**
			检查时间是否在循环内部
		*/
		prv.loopTest = function(t) {
			//检查是否在循环里面
			if (prv.loop.isLooping) {
				if (ins.player.type() == "McAudioPlayer") {
					if (t >= prv.loop.noteB.offtime) {
						//if(t > prv.loop.noteB.ontime){
						return false;
					}
				} else {
					if (t >= prv.loop.noteB.offtick + (prv.loop.noteB.offtick - prv.loop.noteB.ontick)) {
						//if(t > prv.loop.noteB.ontick){
						return false;
					}
				}
			}
			return true;
		}

		/**
			检查note是否在循环内部
			结循环的结尾有这种情况：note的时值在循环里，但是note不在，这时指针、onFrame、onNoteOn事件都要取消）
		*/
		prv.loopTestNote = function(note) {
			if (prv.loop.isLooping) {
				if (ins.player.type() == "McAudioPlayer") {
					if (note.ontime > prv.loop.noteB.ontime) {
						return false;
					}
				} else {
					//if(t >= prv.loop.noteB.offtick){
					if (note.ontick > prv.loop.noteB.ontick) {
						return false;
					}
				}
				return true;
			}
			return true;
		}

		//超出loop B点后的回调
		prv.onLoopOut = function() {
			console.log('loop out');
			ins.seek2time(prv.loop.noteA.ontime, prv.loop.noteA.ontick);

			ins.frameSeek(prv.loop.noteA.ontick);
			setTimeout(function() {
				ins.pointToNote(prv.loop.noteA);
				ins.play();
			}, 500);
			//ins.play();			
		}

		//查找一个音符最后一次出现时的对象
		prv.findTheLastTime = function(note) {
			var lastest = note;
			for (var i = 1; i < 10; i++) { //默认最多重复10次
				var idx = note.id + "-" + i;
				if (ins.noteMap[idx]) {
					lastest = ins.noteMap[idx];
					console.log("The last time is : " + idx);
				}
			}
			console.log(lastest);
			return lastest;
		}

		ins.setA = function(noteA) {
			if (noteA == null) {
				prv.onError("没有选定A点");
				return false;
			}
			//找最后一次出现的note，避免出现选定的区间内又出现重复标记
			noteA = prv.findTheLastTime(noteA);

			if (prv.loop.noteB != null && noteA.ontick >= prv.loop.noteB.ontick) {
				prv.onError("A点必须小于B点");
				return false;
			}
			//console.log(JSON.stringify(noteA));

			prv.loop.noteA = noteA;
			if (prv.loop.noteABorder != null) {
				$(prv.loop.noteABorder).remove();
			}
			prv.loop.noteABorder = prv.makeLoopBorder(noteA, true);
			console.log('noteA:' + prv.loop.noteA.ontick);
		}

		ins.setB = function(noteB) {
			if (noteB == null) {
				prv.onError("没有选定B点");
				return false;
			}

			//找最后一次出现的note，避免出现选定的区间内又出现重复标记
			noteB = prv.findTheLastTime(noteB);

			if (prv.loop.noteA != null && noteA.ontick >= noteB.ontick) {
				prv.onError("B点必须大于A点");
				return false;
			}

			prv.loop.noteB = noteB;
			if (prv.loop.noteBBorder != null) {
				$(prv.loop.noteBBorder).remove();
			}
			prv.loop.noteBBorder = prv.makeLoopBorder(noteB, false);
			console.log('noteB:' + prv.loop.noteB.ontick);
		}

		ins.loop = function() {
			if (prv.loop.noteA == null || prv.loop.noteB == null) {
				prv.onError("请先设置好A、B点");
				return false;
			}
			prv.loop.isLooping = true;

			/*
			//通知native层
			if(ins.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_loop', "", null); 
			}
			*/
			prv.setLoop(prv.loop.noteA.ontick, prv.loop.noteB.ontick);

			//ins.seek2note(prv.loop.noteA.id);
			ins.seek2time(prv.loop.noteA.ontime, prv.loop.noteA.ontick)
			ins.pointToNote(prv.loop.noteA);

			return true;
		}

		ins.cancelLoop = function() {
			prv.loop.isLooping = false;
			$(prv.loop.noteABorder).remove();
			$(prv.loop.noteBBorder).remove();
			prv.loop.noteABorder = null;
			prv.loop.noteBBorder = null;
			prv.loop.noteA = null;
			prv.loop.noteB = null;

			/*
			//通知native层
			if(ins.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_cancelLoop', "", null); 
			}
			*/
			prv.cancelLoop();
		}

		prv.setLoop = function(aTick, bTick) {
			if (ins.option.enableJsBridge) {
				prv.jsBridge.callHandler('McMidiPlayer_setLoop', {
					a: aTick,
					b: bTick
				}, null);
			}
		};

		prv.cancelLoop = function() {
			if (ins.option.enableJsBridge) {
				prv.jsBridge.callHandler('McMidiPlayer_cancelLoop', {}, null);
			}
		};

		ins.isLooping = function() {
			return prv.loop.isLooping;
		}
		//==================================================================================================================

		/**
			根据json生成noteMap、measureMap、staffNoteList
		*/
		ins.genDataStructure = function() {

			for (var i = 0; i < ins.scores.staves.length; i++) {
				var n = 0;
				ins.staffNoteList[i] = [];
				for (var j = 0; j < ins.scores.staves[i].measures.length; j++) {
					var mr = ins.scores.staves[i].measures[j];
					mr.idx = j + 1; //从1开始计数的小节序号
					var mid = ins.scores.staves[i].measures[j].id;
					ins.measureMap[mid] = mr;

					for (var k = 0; k < ins.scores.staves[i].measures[j].notes.length; k++) {
						var note = ins.scores.staves[i].measures[j].notes[k];
						ins.staffNoteList[i][n++] = note;

						var idx = note.id + "-" + note.times;
						note.staff = i;
						note.idx = idx;
						ins.noteMap[idx] = note;

						ins.note2MeasureMap[idx] = mr;
					}
				}
			}
			/*
				var maxStaff = 0;
				var maxNoteNum = 0;
				for(var i=0;i<ins.staffNoteList.length;i++){
				  if(maxNoteNum < ins.staffNoteList[i].length){
					  maxNoteNum = ins.staffNoteList[i].length;
					  maxStaff = i;				  
				  }
				}
				//var last = ins.staffNoteList[maxStaff].length-1;
				//var lastNote = ins.staffNoteList[maxStaff][maxNoteNum-1];
			*/
			var lastNote = ins.getLastNote();

			ins.scoreBPM = Math.round(lastNote.offtick / lastNote.offtime / 8);
			ins.currentBPM = ins.scoreBPM;
			console.log("socre BPM : " + ins.scoreBPM);
		};




		/**
			加载乐谱json、svg等资源
		*/
		ins.load = function() {
			var jsonUrl = "./scores/" + ins.sid + "/score.json";
			$.ajax({
				type: "get",
				dataType: "text",
				url: jsonUrl,
				success: function(data) {
					ins.scores = jQuery.parseJSON(data);
					ins.genDataStructure();

					ins.jsonLoaded = true;
					ins.isReady();
					ins.pages = ins.scores.p;
					ins.loadPageSvg(1); //加载第一页svg，后面的会用定时器自动加载
				}
			});
		};

		ins.pointToNote = function(note) {
			if (ins.option.showScore == false) {
				return;
			}
			//console.log("point to page "+ note.page+ " note: "+note.id);

			//移动到指定的页
			if (prv.vernier.page != note.page) {
				ins.pointToPage(note.page);
			}

			//移动x坐标
			//console.log(prv.vernier.element.getAttribute('x')+":"+prv.vernier.element.getAttribute('y'));
			if (Math.abs(prv.vernier.element.getAttribute('x') - note.x) > 0.1) {
				//console.log("move to x : " + note.x);
				prv.vernier.element.setAttribute('x', note.x + 1);
			}

			//移动y坐标
			var page = note.page;
			var lines = ins.svgPageLines[note.page];
			var pageLine = note.pageLine;
			//console.log("move to line " + pageLine +", y: " + lines[pageLine].y);

			if (Math.abs(prv.vernier.element.getAttribute('y') - (lines[pageLine].y - 10)) > 0.1) {
				//console.log("move to y : " + (lines[pageLine].y-10));
				prv.vernier.element.setAttribute('y', lines[pageLine].y - 10);
			}
			//prv.vernier.element.setAttribute('y',lines[pageLine].y-10);

			//页内偏移
			var pageOff = prv.vernier.element.getBoundingClientRect().top;

			//计算总偏移，滚动页面
			var off = $(ins.iframeRoot[page]).offset().top + pageOff;
			ins.scrollTo(off);
		}

		/**
			页面滚动到指定位置，因为要有延时滚动，会持续一段时间，不能把主线程阻塞，一定要异步执行
		    TODO: 
		    1. async关键字在有些chrome版本上不能使用，要研究一下怎样实现异步执行 
		    2.有时候滚动不成功，特别是向上滚动时，原因不明
		
		*/
		ins.scrollTo = function(off) {
			if (prv.scrollOff == off) {
				return;
			}

			prv.scrollOff = off;
			off = off - prv.marginTop;
			$("html, body").animate({
				scrollTop: off + "px"
			}, {
				duration: 50,
				easing: "swing"
			});

		};


		/**
			根据note信息和svg上的element信息确定当前音符在哪一行，然后移动游标
			@param e svg上的element
			@param note json中的note
		*/
		prv.findNoteLine = function(note, page) {
			var lines = ins.svgPageLines[page];
			var y = note.y;
			var h = note.h;
			for (var i = 0; i < lines.length; i++) {
				if (y >= lines[i].y && y <= lines[i].bottom) { //最简单的情况，刚好落在当前行的内部
					return i;
				} else if (i == 0 && y < lines[i].y) { //落在第0行的上部
					return 0;
				} else if (i == lines.length - 1 && y > lines[i].bottom) { //落在最后一行的下部
					return i;
				} else if (y > lines[i].bottom) { //落在当前行的下部，暂不能确定位置
					continue;
				} else if (y < lines[i].y && y > lines[i - 1].bottom) { //落在当前行的上部，上一行的下部，计算距离哪一个更近
					if (lines[i].y - y > y - lines[i - 1].bottom) {
						return i - 1;
					} else {
						return i;
					}
				}
			}
			console.log("无法定位对应的行");
			return -1;
		};

		/**
			tick转换为时间
		**/
		ins.tick2time = function(tick) {
			if (tick == 0) {
				return 0;
			}
			if (ins.player.type() == "McAudioPlayer") {
				return tick / ins.scoreBPM / 8.00;
			} else {
				return tick / ins.getBPM() / 8.00;

			}
		};

		/**
			时间转换为tick
		**/
		ins.time2tick = function(ms) {
			if (ms <= 0 || ins.currentBPM <= 0) {
				return 0;
			}

			return ms * ins.currentBPM * 8.00;
			/*			
						if(ins.player.type() == "McAudioPlayer"){
							return ms * ins.scoreBPM * 8.00;
						} else {
							var bpm = ins.player.getBPM();
							if(bpm <= 0){
								return 0;
							}else{
								return ms * bpm * 8.00;
							}
						}
						*/
		};

		/**
			声音播放与画页同步,内部通过异步请求播放器的当前时间，获得结果后回调同步处理函数
			按帧同步
		*/
		ins.playSyncByFrame = function() {
			if (ins.status != 'PLAYING') {
				return;
			}
			//ins.startTimestamp = Date.now();

			if (ins.player.type() == "McAudioPlayer") {
				ins.player.getCurrentTime(function(time) {
					ins.curTick = ins.time2tick(time);

					//ins.onMetronomeSync(time);
					ins.metronomeSync(ins.time2tick(time));
					var frameNotes = ins.onPlaySync(time);
					prv.onFrame(frameNotes);

					if (ins.status != 'PLAYING') {
						return;
					}

					if (!prv.loopTest(time)) {
						ins.player.pause();
						setTimeout(prv.onLoopOut, 0);
						return;
					}

					prv.playTimer = setTimeout(function() {
						ins.playSyncByFrame()
					}, 10);
				});
			} else {
				ins.player.getCurrentTicks(function(tick) {
					ins.curTick = tick;
					console.log("current tick: " + tick);
					ins.metronomeSync(tick);
					//ins.onMetronomeSync(tick);
					var frameNotes = ins.onPlaySync(tick);
					prv.onFrame(frameNotes);


					if (ins.status != 'PLAYING') {
						return;
					}

					if (!prv.loopTest(tick)) {
						ins.player.pause();
						setTimeout(prv.onLoopOut, 0);
						return;
					}

					prv.playTimer = setTimeout(function() {
						ins.playSyncByFrame()
					}, 10);
				});
			}
		};


		/**
			画面与播放器时间同步
			@param t 播放器的当前时间，如果是音频播放器，这个值是的单位是s；如果是midi播放器，单位是tick。
		*/
		ins.onPlaySync = function(tickOrTime) {
			//console.log("current sync note: " + tickOrTime);
			if (ins.player.type() == "McAudioPlayer") {
				prv.currentTick = ins.time2tick(tickOrTime);
				prv.checkNoteOffTime(tickOrTime);
			} else {
				prv.currentTick = tickOrTime;
				prv.checkNoteOffTick(tickOrTime);
			}

			var frameNotes = [];
			for (var i = 0; i < ins.staffNoteList.length; i++) {
				if (i == prv.disableStaff) {
					continue;
				}
				while (ins.staffOff[i] < ins.staffNoteList[i].length) {
					var note = ins.staffNoteList[i][ins.staffOff[i]];
					note = ins.noteMap[note.id + "-" + note.times];
					//console.log("player tickOrTime: "+ tickOrTime +", score time: " + note.ontime + ", score tick: " + note.ontick);
					if (note) {
						if ((ins.player.type() == "McAudioPlayer" && note.ontime < tickOrTime) ||
							(note.ontick < tickOrTime)) {
							ins.staffOff[i]++;

							if (prv.loopTestNote(note)) {
								ins.pointToNote(note);
								frameNotes.push(note);
								prv.onNoteOn(note);
							}

						} else {
							break;
						}
					}
				}
			}

			return frameNotes;
		}

		prv.tick2measure = function(tick) {
			var m = null;
			if (ins.curMeasure >= 0) {
				m = ins.scores.staves[0].measures[ins.curMeasure]; //先对比当前小节
				if (tick >= m.tick[0] && tick <= m.tick[1]) {
					return ins.curMeasure;
				}
			}

			if (ins.curMeasure + 1 < ins.scores.staves[0].measures.length) {
				m = ins.scores.staves[0].measures[ins.curMeasure + 1]; //再对比下一小节
				if (tick >= m.tick[0] && tick <= m.tick[1]) {
					return ins.curMeasure + 1;
				}
			}

			for (var i = 0; i < ins.scores.staves[0].measures.length; i++) { //全部比一遍
				var m = ins.scores.staves[0].measures[i];
				if (tick >= m.tick[0] && tick <= m.tick[1]) {
					return i;
				}
			}
			return -1;
		}

		ins.metronomePlay = function(n, t) {
			if (ins.isEnableMetronome == false) {
				return;
			}
			//console.log("当前BPM:"+ins.getBPM()+" 当前tick:"+n+", " + t +" msec 后击出");
			if (n == 0) {
				setTimeout(function() {
					if (ins.getStatus() == 'PLAYING') {
						ins.metronome.playStress();
					}
				}, t);
			} else {
				setTimeout(function() {
						if (ins.getStatus() == 'PLAYING') {
							ins.metronome.playWeakness();
						}
					},
					t);
			}
		}

		ins.metronomeSync = function(curTick) {
			var n = prv.tick2measure(curTick);
			if (n < 0) {
				return;
			}
			//console.log("当前小节： "+ n);
			if (n != ins.curMeasure) {
				ins.curMeasure = n;
				var m = ins.scores.staves[0].measures[n];
				var len = m.tick[1] - m.tick[0];
				var eachlen = len / m.len[0];
				//console.log("当前小节： "+ n + " , 每拍: " + eachlen);
				for (var i = 0; i < m.len[0]; i++) {
					var t = curTick - (m.tick[0] + eachlen * i);
					//console.log('mtick: ' + t+", "+ m.tick[0]+" , "+curTick);
					if (t < 0) {
						t = ins.tick2time(-1.0 * t) * 1000;
						//console.log('mtick: ' + t);
						ins.metronomePlay(i, t);
					} else {
						if (t < 150) {
							ins.metronomePlay(i, 0);
						}
					}
				}


			}
		}

		/**
			检查所有on状态的音符是否已关闭
		*/
		prv.checkNoteOffTick = function(tick) {
			for (var i = 0; i < prv.playingNote.length;) {
				var note = prv.playingNote[i];
				if (note.offtick <= tick) {
					prv.playingNote.splice(i, 1);
					prv.onNoteOff(note);
					continue;
				}
				i++;
			}
		}
		prv.checkNoteOffTime = function(time) {
			for (var i = 0; i < prv.playingNote.length;) {
				var note = prv.playingNote[i];
				if (note.offtime <= time) {
					prv.playingNote.splice(i, 1);
					prv.onNoteOff(note);
					continue;
				}
				i++;
			}
		}

		ins.findNearNote = function(time) {
			var near = null;
			for (var i = 0; i < ins.staffNoteList.length; i++) {
				for (var j = 0; j < ins.staffNoteList[i].length; j++) {
					var note = ins.staffNoteList[i][j];
					if (note) {
						if (note.ontime < time) {
							continue;
						} else {
							if (near == null || note.ontime < near.ontime) {
								near = note;
							}
							break;
						}
					}
				}
			}
			return near;
		}

		/**
			跳到指定的note播放
		*/
		ins.seek2note = function(noteId) {
			console.log("seek to note " + noteId);
			var note = ins.noteMap[noteId + "-0"];
			ins.seek2time(note.ontime, note.ontick);
		}

		/**
			跳到指定的时间播放
		*/
		ins.seek2time = function(time, ticks) {
			console.log("seek to " + time + " " + ticks);
			ins.curTick = ticks;
			ins.frameSeek(ticks);
			if (ins.player.type() == "McAudioPlayer") {
				ins.player.seek(time);
			} else {
				ins.player.seek(ticks);
			}

			for (var i = 0; i < ins.staffNoteList.length; i++) {
				ins.staffOff[i] = 0;
				for (var j = 0; j < ins.staffNoteList[i].length; j++) {
					var note = ins.staffNoteList[i][j];
					if (note) {
						if ((ins.player.type() == "McAudioPlayer" && note.ontime <= time) ||
							(note.ontick <= ticks)) {
							ins.staffOff[i] = j;
							continue;
						} else {
							break;
						}
					}
				}
			}
		}

		ins.disableStaff = function(n) {
			prv.disableStaff = n;
			if (ins.option.enableJsBridge) {
				prv.jsBridge.callHandler('McMidiPlayer_disableStaff', {
					'staff': n
				}, null);
			}
		};

		ins.play = function() {
			ins.status = 'PLAYING';
			ins.startTimestamp = Date.now();

			if (ins.player.type() == 'McAudioPlayer') {
				if (ins.mode != 'WAIT') {
					ins.player.start();
					ins.metronomeSync(ins.curTick);
					ins.playSyncByFrame();
				} else {
					ins.playSyncByFrame();
				}
			} else {
				ins.player.start(); //如果是wait mode，不会启动合成器，只是生成一个start事件
				if (ins.mode != "WAIT") {
					ins.metronomeSync(ins.curTick);
					ins.playSyncByFrame();
				}
			}

		};

		ins.pause = function() {
			ins.status = 'PAUSE';
			ins.player.pause();
			//清理定时器
			if (prv.playTimer != null) {
				clearTimeout(prv.playTimer);
				prv.playTimer = null;
			}
		}

		ins.clean = function() {
			//清理高亮的音符
			for (var i = 0; i < prv.playingNote.length; i++) {
				var note = prv.playingNote[i];
				prv.playingNote.splice(i, 1);
				prv.onNoteOff(note);
			}

			ins.initStatus();
		}

		ins.stop = function() {
			console.log("McScore.stop()");
			//ins.pause();
			ins.status = 'STOP';
			ins.player.stop();
			//清理定时器
			if (prv.playTimer != null) {
				clearTimeout(prv.playTimer);
				prv.playTimer = null;
			}
			ins.clean();
			
			prv.currentTick = 0;
		}

		/**
			检查各类资源加载状态，如果就绪了，就回调客户的OnReady函数，但要保证只调一次
		*/
		ins.isReady = function() {
			if (ins.jsonLoaded) {
				if (ins.option.showScore != false && ins.svgRoot.length < 2) {
					console.log("svg尚未就绪");
					return;
				}
				if (ins.option.enableJsBridge && prv.isJsBridgeReady == false) {
					return;
				}

				if (ins.player == null || ins.player.isReady() == false) {
					console.log("播放器尚未就绪");
					return;
				}

				if (!ins.isCallOnReady) {
					ins.isCallOnReady = true;
					ins.initStatus();
					console.log("一切就绪");
					ins.option.onReady();
				}
			}
		}

		ins.note2Measure = function(note) {
			return ins.note2MeasureMap["" + note.id];
		}

		ins.onNoteClick = function(note) {
			if (ins.option.onNoteClick && typeof(ins.option.onNoteClick) == "function") {
				//var id=$(e).attr("id");
				ins.option.onNoteClick(note);
				//ins.option.onNoteClick(e, ins.noteMap[id+"-0"]);
			}
		}

		/**
			载入指定页面及其后续全部页面的SVG，为了使前面的页面更快的显示出来，不是一次性加载，而是通过定时器每隔一秒加载一个
		*/
		ins.loadPageSvg = function(page) {
			if (ins.option.showScore == false) {
				ins.isReady();
				return;
			}
			if (page > ins.pages) {
				return;
			}
			var width = $('#score').width();
			var iframe = document.createElement("iframe");
			iframe.id = 'page-' + page;
			iframe.src = "./scores/" + ins.sid + '/pages/' + page + '.svg';
			iframe.setAttribute('frameborder', '0');
			iframe.scrolling = "no";
			iframe.width = 0;
			iframe.height = 0;

			iframe.onload = function() { //此事件不兼容IE   
				var rt = iframe.getSVGDocument().rootElement;
				var sw = parseInt($(rt).attr("width"));
				var sh = parseInt($(rt).attr("height"));
				iframe.width = width;
				iframe.height = width / sw * sh;
				ins.svgRoot.push(rt);
				ins.resize(page);

				prv.analyzeLines(page);

				$('.Note', this.contentDocument).each(function() {
					//$(this).click(function(){
					//	ins.onNoteClick(this);
					//});

					//为note绑定element
					var id = this.attributes["id"].value;
					for (var i = 0; i < 100; i++) {
						var note = ins.noteMap[id + "-" + i];
						if (!note) {
							break;
						}
						var line = prv.findNoteLine(note, page);

						note.page = page;
						note.pageLine = line;
						note.element = this;
						//console.log("Note: " + JSON.stringify(note) );
					}
				});


				ins.isReady();
				setTimeout(function() {
					ins.loadPageSvg(page + 1)
				}, 1000);

			};

			document.getElementById('score').appendChild(iframe);
			ins.iframeRoot.push(iframe);
		};

		prv.onPlayerLoaded = function() {
			//alert("playerLoaded");
			ins.isReady();
		}

		ins.onStoped = function() {
			if (prv.onStoped && typeof(prv.onStoped) == "function") {
				prv.onStoped();
			}
		}

		ins.initStatus = function() {
			//$(prv.vernier.element).remove();
			//prv.vernier = {};
			ins.curPage = 1; //当前行
			ins.curLine = -1; //当前行
			ins.curMeasure = -1; //当前小节
			ins.curTick = 0;
			ins.staffOff = []; //staffOff[n] 代表第n行的当前note在数组staffNoteList[n][]中的偏移量
			for (var i = 0; i < ins.scores.staves.length; i++) {
				ins.staffOff.push(0); //给每个staff的off置0
			}
			prv.currentFrameTick = 0;
			if (ins.option.showScore != false) {
				//指向第一页
				ins.pointToPage(1);

			}
		}

		ins.init = function(id) {
			console.log("init score " + id);

			ins.sid = id;

			ins.metronome.setup(120, 4);
			var fonts = ins.metronome.getSoundFonts();
			ins.metronome.setSoundFont(fonts[0], function() {
				console.log("节拍器加载完成");
			});

			if (ins.option.enableJsBridge) {
				McJsBridge.createNew(function(bridge) {
					prv.isJsBridgeReady = true;
					prv.jsBridge = bridge;
					prv.registerHandler();
					ins.setPlayer(prv.midiPlayer);
					ins.player.setBridge(bridge);
					ins.player.open(id, prv.onPlayerLoaded);
					ins.isReady();
				});
			} else {
				ins.setPlayer(prv.audioPlayer);
				ins.player.open(id, prv.onPlayerLoaded);
				ins.isReady();
			}

			console.log("loading...");
			ins.load();

		}
		if (option.showScore != false) {
			option.showScore = true;
		}
		ins.setOption(option);
		return ins;
	}
};
