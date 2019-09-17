
var McWaterfallDriver = {
	createNew : function(option){
		var ins = {};
		var prv = {};
		
		ins.sid = null; //曲谱ID
		prv.midiPlayer = McMidiPlayer.createNew();
		prv.audioPlayer = McAudioContext.createNew();
		prv.jsonLoaded = false;
		prv.isJsBridgeReady = false;
		prv.isCallOnReady = false;
		
		prv.scores = null;      //score.json直接转换成的对象
		prv.scoreBPM = -1;		//谱面速度
		prv.currentBPM = -1;    //当前速度
		prv.staffNoteList = [];    //每行所有音符按先后顺序排列
		prv.noteMap = {};          //noteid->note的映射，根据score.json生成
		prv.measureMap = {};       //measureid->measure的映射，根据score.json生成
		prv.note2MeasureMap = {};  //noteId -> measureId 二元关系
		prv.playingNote = [];			//正在演奏中的音符	
		prv.metronome = McMetronome.createNew();
		
		prv.mcClass = null;
		
		prv.loop = {};          //循环对象		
		prv.loop.aTick = null;          //循环A点
		prv.loop.bTick = null;       //循环B点
		prv.loop.isLooping = false;  //是否处于循环中


		/**
			配置项：
			enableJsBridge: boolean 是否启用jsBridge
			onReady:  function() 资源全部加载完毕之后回调
			onFinish: function() 当乐曲播放完成时的回调
			onNoteOff: function() 当一个音符停止发音时
			previewLen: int 预览区长度(毫秒) 
			onFramePreview: function(frame) 一个frame(一组同时发声的音符)进入预览区	
			onFrame: function(frame) 一个frame开始发声
		*/
		ins.setOption = function (option){
			prv.option = option;
		};
		
		prv.registerHandler = function(){
			if(prv.option.enableJsBridge){
				var jsbridge = prv.jsBridge;
				if(jsbridge){
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
						if(responseCallback != null && typeof(responseCallback)=="function"){
							responseCallback("I know");
						}
					});
				}
			}
		};
		
		prv.onFrame = function(frameNotes){
			if(frameNotes.length < 1){
				return;
			}
			
			var noteMap = {};
			for(var i=0;i<frameNotes.length;i++){
				//noteMap[frameNotes[i].pitch] = frameNotes[i].pitch;
				noteMap[frameNotes[i].pitch] = {"pitch":frameNotes[i].pitch, "id": frameNotes[i].id, "idx": frameNotes[i].id+"-"+frameNotes[i].times};
			}
			console.log(JSON.stringify(noteMap));
			//通知js层
			if(prv.option.onFrame && typeof(prv.option.onFrame)=="function"){
				prv.option.onFrame(frameNotes);
			}
			//通知native层
			if(prv.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_onFrame', 
											JSON.stringify(noteMap), null); 
			}	
		}
		
		prv.onFinish = function(){
			console.log("finish");
			ins.stop();
			if(prv.option.onFinish && typeof(prv.option.onFinish)=="function"){
				prv.option.onFinish();
			}
		}
		
		prv.onNoteOn = function(note){
			//记录
			prv.playingNote.push(note);
			
			/*
			//回调客户定义的方法
			if(ins.option.onNoteOn && typeof(ins.option.onNoteOn)=="function"){
				ins.option.onNoteOn(note);
			}
			*/
			//通知native层
			if(prv.option.enableJsBridge){
				var dur = note.offtime - note.ontime;
				prv.jsBridge.callHandler('McMidiPlayer_onNoteOn', 
											{'id':note.id, "pitch":note.pitch, "chan":note.chan, "velo":note.velo, "duration": dur},null); 
			}		
							
		};

		prv.onNoteOff = function(note){
			//回调客户定义的方法
			if(prv.option.onNoteOff && typeof(prv.option.onNoteOff)=="function"){
				prv.option.onNoteOff(note);
			}
			
			
			//通知native层
			if(prv.option.enableJsBridge){
				var dur = note.offtime - note.ontime;
				prv.jsBridge.callHandler('McMidiPlayer_onNoteOff', 
											{'id':note.id, "pitch":note.pitch, "duration": dur},null); 
			}	
							
		};
		
		/**
			检查所有on状态的音符是否已关闭
		*/
		prv.checkNoteOffTick = function(tick){
			for(var i=0; i<prv.playingNote.length;){
			    var note = prv.playingNote[i];
			    if(note.offtick <= tick){
				    prv.playingNote.splice(i,1);
				    prv.onNoteOff(note);
				    continue;        
			    }
			    i++;
		    }
		}
		
		ins.tick2time = function(tick){
			if(tick == 0){
				return 0;
			}
			if(ins.mode == 'WAIT'){
				return tick/prv.scoreBPM/8.00;
			}
			
			if(ins.player.type() == "McAudioPlayer"){
				return tick/prv.scoreBPM/8.00;
			} else {
				return tick/ins.player.getBPM()/8.00;
			}
		};
		
		/**
			时间转换为tick
		**/
		ins.time2tick = function(ms){
			if(ms <= 0 || prv.currentBPM <= 0){
				return 0;
			}
			
			return ms*prv.currentBPM * 8.00;
		}

		prv.onPlaySync = function (tick){			
			prv.currentTick = tick;
			
			prv.checkNoteOffTick(tick);
			
			var frameNotes = [];
		    for(var i=0;i<prv.staffNoteList.length;i++){
			    if(i == prv.disableStaff){
				    continue;
			    }
			    
			    while(prv.staffOff[i] < prv.staffNoteList[i].length){
			        var note = prv.staffNoteList[i][prv.staffOff[i]];
			        note = prv.noteMap[note.id+"-"+note.times];
			        if(note){
			            if(note.ontick < tick) {
			                prv.staffOff[i]++;
			                		        
			                frameNotes.push(note);	
			                prv.onNoteOn(note);		                
			            }else{
				            break;
			            }   
			        }
		        }		    
		    }
			
			return frameNotes;
		}
		
		prv.previewOnTick = function(previewTick){
			if(prv.option.previewLen < 1){
				return;
			}
			console.log("current sync preview:  " + previewTick);
			var previewNotes = [];
			//console.log(Date.parse(new Date())+", preview tick: " + dropTick);
			for(var i=0;i<prv.staffNoteList.length;i++){
			    if(i == prv.disableStaff){
				    continue;
			    }
			    
			    while(prv.previewStaffOff[i] < prv.staffNoteList[i].length){
			        var note = prv.staffNoteList[i][prv.previewStaffOff[i]];
			        note = prv.noteMap[note.id+"-"+note.times];
			        //console.log("preview tickOrTime: "+ tickOrTime +", score time: " + note.ontime + ", score tick: " + note.ontick);
			        if(note){
			            if(note.ontick < previewTick) {
			                prv.previewStaffOff[i]++;
			                //ins.option.onNotePreview(note);
			                previewNotes.push(note);
			            }else{
				            break;
			            }   
			        }
		        }		    
		    }
			if(previewNotes.length > 0){
				prv.option.onFramePreview(previewNotes);
			}
		}
		
		prv.eventOnTick = function(tick) {
			if(!prv.loopTest(tick)){
				ins.pause();
				setTimeout(prv.onLoopOut, 0);
			}
			
			if(tick > 0){
		    	ins.curTick = tick;
				
		    	var frameNotes = prv.onPlaySync(tick);
		    	if(frameNotes.length > 0){
		    		console.log("current tick: " +  tick + " mode " + ins.mode + ", frameNotes length " + frameNotes.length + ", bpm " + prv.scoreBPM);
		    	}

				if(ins.mode == "WAIT" && frameNotes.length > 0){
					ins.pause();
				}
				prv.onFrame(frameNotes);
				
			} 
			
			if(ins.status != 'PLAYING'){
				return;
			}
/*
	    	if(!prv.loopTest(tick)){
		    	ins.player.pause();
				setTimeout(prv.onLoopOut, 0);
				return;
			}
*/
			prv.playTimer = setTimeout(function(){prv.genMidiEventByFrame()}, 10);
		}
		
		prv.genMidiEventByFrame = function (){
			if(ins.status != 'PLAYING'){
				return;
			}

			if(ins.mode == "WAIT"){
				prv.mcClass.getTick(function(tick){
					prv.eventOnTick(tick);							
				})	
			} else {
				if(ins.player.type() == "McAudioPlayer"){
					ins.player.getCurrentTime(function(time){
						console.log("current time: "+time);
						prv.eventOnTick(ins.time2tick(time));
					});	
				} else {
					prv.mcClass.getTick(function(tick){
					    prv.eventOnTick(tick);							
				    });
			    }
		    }
		};

		ins.play = function(){
			console.log("McWaterfallDriver.start()");

			ins.status = 'PLAYING';
			ins.startTimestamp = Date.now();
			//ins.player.start();
			prv.mcClass.waterfallStart();
			prv.genMidiEventByFrame();			
		};

		ins.pause = function(){
			console.log("McWaterfallDriver.pause()");

			ins.status = 'PAUSE';
			//ins.player.pause();
			prv.mcClass.waterfallPause();

			//清理定时器
			if(prv.playTimer != null){
				clearTimeout(prv.playTimer);
				prv.playTimer = null;
			}
		};
		
		ins.stop = function(){
			console.log("McWaterfallDriver.stop()");
			//ins.pause();
			ins.status = 'STOP';
			//ins.player.stop();
			prv.mcClass.waterfallStop();

			//清理定时器
			if(prv.playTimer != null){
				clearTimeout(prv.playTimer);
				prv.playTimer = null;
			}
			ins.clean();
		};
		
		ins.setMcClass = function(mcClass){
			prv.mcClass = mcClass;
		}
		
		ins.setMode = function(mode){
			ins.mode = mode;
			if(prv.option.enableJsBridge){
				prv.mcClass.waterfallSetMode(mode);							
			}
		};
		
		ins.getMode = function(mode){
			return ins.mode;
		};
		
		ins.setPlayer = function(player){
			ins.player = player;
		};
		
		ins.setPreviewLen = function(len){
			prv.option.previewLen = len;
		}
		
		ins.getStatus = function(){
			return ins.status;
		};
		
		ins.disableStaff = function(n){
			prv.disableStaff = n;
			if(prv.option.enableJsBridge){
				prv.mcClass.waterfallDisableStaff(n);							
			}		
		};
		
		ins.frameComplete = function(){
			ins.play();
		}

		//获取最后一个音符
		ins.getLastNote = function(){
			var lastNote = null;
			for(var i=0;i<prv.staffNoteList.length;i++){
				if(prv.staffNoteList[i].length == 0){
					continue;
				}
				var note = prv.staffNoteList[i][prv.staffNoteList[i].length-1];
			    if(lastNote == null || lastNote.offtick < note.offtick){
				    lastNote = note;				  
			    }
			}
			return lastNote;
		}
		
		//获取第一个音符
		ins.getFirstNote = function(){
			var firstNote = null;
			for(var i=0;i<prv.staffNoteList.length;i++){
				if(prv.staffNoteList[i].length == 0){
					continue;
				}
				var note = prv.staffNoteList[i][0];
			    if(firstNote == null || firstNote.offtick > note.offtick){
				    firstNote = note;			  
			    }
			}
			return firstNote;
		}
		
		/**
			获取所有行的所有音符，按时间先后排列。钢琴谱一般有两行(左右手各一行，不是文本意义上的“行”)，staffNoteList[0][1]是第0行(右手)的第一个音符。
		*/
		ins.getAllStaffNotes = function(){
			return prv.staffNoteList;
		}
		
		ins.setBPM = function(bpm){
			if(ins.player.type() != "McAudioPlayer"){
				//ins.player.setBPM(bpm);
				prv.mcClass.waterfallSetBPM(bpm);
				prv.currentBPM = bpm;
			}	
		}
		
		ins.getBPM = function(){
			return prv.currentBPM;
		}
		
		ins.setA = function(aTick){
			prv.loop.aTick = aTick;
		}
		
		ins.setB = function(bTick){
			prv.loop.bTick = bTick;
		}
		
		prv.setLoop = function(aTick, bTick){
			if(prv.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_setLoop', 
											{a: aTick, b:bTick},null); 
			}		
		};
		
		prv.cancelLoop = function(){
			if(prv.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_cancelLoop', 
											{},null); 
			}		
		};
		
		ins.loop = function(){
			if(prv.loop.aTick == null || prv.loop.bTick == null){
				console.log("请先设置好A、B点");
				return false;
			}
			prv.loop.isLooping = true;
			
			/*
			//通知native层
			if(ins.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_loop', "", null); 
			}
			*/
			prv.setLoop(prv.loop.aTick, prv.loop.bTick);
			ins.seek2Tick(prv.loop.aTick);

			return true;
		}
	
		ins.cancelLoop = function(){
			prv.loop.isLooping = false;
			prv.loop.aTick = null;
			prv.loop.bTick = null;
			
			/*
			//通知native层
			if(ins.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_cancelLoop', "", null); 
			}
			*/
			prv.cancelLoop();
		}
		
		ins.isLooping = function(){
			return prv.loop.isLooping;
		}
		
		/**
			检查时间是否在循环内部
		*/
		prv.loopTest = function(t){
			//检查是否在循环里面
			if(prv.loop.isLooping){
				if(t >= prv.loop.bTick){
				//if(t > prv.loop.noteB.ontick){
					return false;
				}
			}
			return true;
		}
		
		//超出loop B点后的回调
		prv.onLoopOut = function(){
			console.log('loop out');
			
			setTimeout(function(){
				ins.seek2Tick(prv.loop.aTick);			
				ins.play();
			}, 500);
		}
		
		/**
			跳到指定的时间播放
		*/
		ins.seek2Tick = function(ticks){
			console.log("seek to "+ticks);
			ins.curTick = ticks;
			//ins.frameSeek(ticks);
			//ins.player.seek(ticks);
			prv.mcClass.seek2Tick(ticks);
			
			for(var i=0;i<prv.staffNoteList.length;i++){
				prv.staffOff[i] = 0;
				for(var j=0;j<prv.staffNoteList[i].length;j++){
			        var note = prv.staffNoteList[i][j];
			        if(note){
			            if(note.ontick <= ticks) {
				            prv.staffOff[i] = j;
				            continue;
			            }else{
				            break;
			            }
			        }
		        }		    
		    }
		}
		
		ins.getTotalRealTime = function(){
			var lastNote = ins.getLastNote();
			return lastNote.offtime * prv.currentBPM / prv.scoreBPM;
		}
		
		ins.getCurrentRealTime = function(){
			var lastNote = ins.getLastNote();
			return (prv.currentTick/lastNote.offtick*ins.getTotalRealTime()).toFixed(4);
		}
		
		//获取每一小节的拍号
		ins.getTimeSig = function(){
			return prv.scores.staves[0].measures[0].timesig;
		}
		
		ins.clean = function(){
			//清理高亮的音符
		    for(var i=0; i<prv.playingNote.length;i++){
			    var note = prv.playingNote[i];
			    prv.playingNote.splice(i,1);
			    prv.onNoteOff(note);
		    }

			prv.initStatus();
		}
		
		ins.getJsBridge = function(){
			if(prv.option.enableJsBridge){
				return prv.jsBridge;
			}
			return null;
		}

		ins.metronomePlayStress = function (){
			prv.metronome.playStress();
		}
		
		ins.metronomePlayWeakness = function(){
			prv.metronome.playWeakness();
		}

		prv.initStatus = function(){
			prv.currentTick = 0;
			prv.previewTimeSec = 0;
			
			prv.staffOff = []; 		   //staffOff[n] 代表第n行的当前note在数组staffNoteList[n][]中的偏移量
		    for(var i=0;i<prv.scores.staves.length;i++){
		        prv.staffOff.push(0); //给每个staff的off置0
		    }
		    
		    if(prv.option.previewLen > 0){
				//preview相关状态初始化		    
			    prv.previewTimeSec = 0;
			    prv.previewStaffOff = [];
			    for(var i=0;i<prv.scores.staves.length;i++){
		        	prv.previewStaffOff.push(0);  //给每个staff的off置0
		    	}
	    	}
	    	
	    	prv.waitTimer = McTimer.createNew();
		}
		
		ins.init = function(id){
			ins.sid = id;

			prv.metronome.setup(120, 4);
			var fonts = prv.metronome.getSoundFonts();
			prv.metronome.setSoundFont(fonts[0], function(){console.log("节拍器加载完成");});

			if(prv.option.enableJsBridge){
				McJsBridge.createNew( function(bridge) {
					prv.isJsBridgeReady = true;
					prv.jsBridge = bridge;	
					prv.registerHandler();
					ins.setPlayer(prv.midiPlayer);
					ins.player.setBridge(bridge);
					ins.player.open(id, prv.onPlayerLoaded);					
					prv.isReady();			
				});
			}else{
				ins.setPlayer(prv.audioPlayer);
				ins.player.open(id, prv.onPlayerLoaded);
				prv.isReady();
			}
			
			console.log("loading...");
		    prv.load(); 
		};
		
		
		prv.load = function (){
			var jsonUrl = "./scores/"+ins.sid+"/score.json";
		    $.ajax({
		        type:"get",
		        dataType:"text",
		        url: jsonUrl,
		        success:function(data){
		            prv.scores = jQuery.parseJSON(data); 
		            prv.genDataStructure();
		            prv.jsonLoaded = true;
		            prv.isReady();
		        }
		    });		
		};
		
		/**
			根据json生成noteMap、measureMap、staffNoteList
		*/	
		prv.genDataStructure = function(){
			
			for(var i=0;i<prv.scores.staves.length;i++){
				var n = 0;
				prv.staffNoteList[i] = [];
				for(var j=0; j< prv.scores.staves[i].measures.length; j++){
					var mr = prv.scores.staves[i].measures[j];
					mr.idx = j+1; //从1开始计数的小节序号
					var mid = prv.scores.staves[i].measures[j].id;
					prv.measureMap[mid] = mr;
					
					for(var k=0; k<prv.scores.staves[i].measures[j].notes.length; k++){
						var note = prv.scores.staves[i].measures[j].notes[k];
						prv.staffNoteList[i][n++] = note;
						
						var idx = note.id+"-"+note.times;
						note.staff = i;
						note.idx = idx;
						prv.noteMap[idx] = note;
						
						prv.note2MeasureMap[idx] = mr;
					}
				}
			}
			var lastNote = ins.getLastNote();

			prv.scoreBPM = Math.round(lastNote.offtick/lastNote.offtime/8);
			prv.currentBPM = prv.scoreBPM;
			console.log("socre BPM : " + prv.scoreBPM);
		};
		

		prv.isReady = function(){
			if(prv.jsonLoaded){
				if(prv.option.enableJsBridge && prv.isJsBridgeReady == false){
					console.log("jsbirdge尚未就绪");
					return;
				}
				
				if(ins.player == null || ins.player.isReady() == false){
					console.log("播放器尚未就绪");
					return;
				}
				
				if(!ins.isCallOnReady){
					prv.isCallOnReady = true;
					prv.initStatus();
				    console.log("一切就绪");
				    prv.option.onReady();
			    }				
			}
		};
		
		prv.onPlayerLoaded = function(){
			prv.isReady();
		};
					
		
		prv.resize = function  (svgDom){
			console.log("window width "+ $(window).width());
			var width = $(window).width()*1;
			var oldWidth = $(svgDom).width();
		
			var s = width/oldWidth;
			//$(svgDom).attr("transform", "scale("+s+" 1) translate(0 0) ");
			$(svgDom).attr("transform", "scale(2 1)");
		};

		
		ins.setOption(option);
		return ins;
	}	
};