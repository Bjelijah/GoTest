
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

		prv.scrollTop = 0;
		prv.screenLeft = 0;
		prv.screenRight = $(window).width();
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
			//console.log(JSON.stringify(noteMap));
			
			ins.scrollToFrame(frameNotes);
			
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
			
			//通知native层
			if(ins.option.enableJsBridge){
				var dur = note.offtime - note.ontime;
				prv.jsBridge.callHandler('McMidiPlayer_onNoteOn', 
											{'id':note.id, "pitch":note.pitch, "chan":note.chan, "velo":note.velo, "duration": dur},null); 
			}		
			*/				
		};

		prv.onNoteOff = function(note){
			//回调客户定义的方法
			if(prv.option.onNoteOff && typeof(prv.option.onNoteOff)=="function"){
				prv.option.onNoteOff(note);
			}
			
			/*
			//通知native层
			if(ins.option.enableJsBridge){
				var dur = note.offtime - note.ontime;
				prv.jsBridge.callHandler('McMidiPlayer_onNoteOff', 
											{'id':note.id, "pitch":note.pitch, "duration": dur},null); 
			}	
			*/					
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
			//console.log("current sync preview:  " + previewTick);
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
			if(tick <= 0) {
				prv.previewTimeSec = (Date.now() - ins.startTimestamp)/1000;
			} else {
				prv.previewTimeSec = ins.tick2time(tick)+prv.option.previewLen/1000.0;
			}
	    	//console.log("tick: "+tick+", previewTime: "+prv.previewTimeSec);

			prv.previewOnTick(ins.time2tick(prv.previewTimeSec));

			if(tick > 0){
		    	ins.curTick = tick;
		    	//console.log("current tick: " +  tick);
				
		    	var frameNotes = prv.onPlaySync(tick);

				if(ins.mode == "WAIT" && frameNotes.length > 0){
					ins.pause();
				}
				prv.onFrame(frameNotes);
				
			} else {
				//prv.scrollToTick(ins.time2tick(prv.previewTimeSec));
			}
			setTimeout(function(){prv.scrollToTick(ins.time2tick(prv.previewTimeSec))}, 0);

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
			//ins.startTimestamp = Date.now();
			if(ins.mode == "WAIT"){
				var time = prv.waitTimer.getTime()/1000.0;
				console.log("current time: "+time);
				prv.eventOnTick(ins.time2tick(time));				
			} else {
				if(ins.player.type() == "McAudioPlayer"){
					ins.player.getCurrentTime(function(time){
						//console.log("current time: "+time);
						prv.eventOnTick(ins.time2tick(time));
					});	
				} else {
			    	ins.player.getCurrentTicks(function(tick){
						prv.eventOnTick(tick);
			    	});
			    }
		    }
		};

		ins.play = function(){
			//ins.mode = "WAIT";
			ins.status = 'PLAYING';
			ins.startTimestamp = Date.now();

			console.log(prv.option.previewLen +" - "+ prv.previewTimeSec*1000);
			var p = prv.option.previewLen - prv.previewTimeSec*1000;
			//ins.player.start();
			if(p < 0){
				prv.previewTimer = null;
				console.log("player start");
				if(ins.mode == "WAIT"){
					prv.waitTimer.start();
				}else{
					ins.player.start();										
				}
			}else{
				prv.previewTimer = setTimeout(function(){
									prv.previewTimer = null;
									console.log("player start");
									if(ins.mode == "WAIT"){
										prv.waitTimer.start();
									} else {
										ins.player.start();										
									}
								},p);
			}
			
			prv.genMidiEventByFrame();
			
		};

		ins.pause = function(){
			console.log("McWaterfallDriver.pause()");

			ins.status = 'PAUSE';
			ins.player.pause();
			//清理定时器
			if(prv.playTimer != null){
				clearTimeout(prv.playTimer);
				prv.playTimer = null;
			}
			if(prv.previewTimer != null){
				console.log("clearTimeout prv.previewTimer");
				clearTimeout(prv.previewTimer);
				prv.previewTimer = null;
			}
			
			prv.waitTimer.pause();
		};
		
		ins.stop = function(){
			console.log("McWaterfallDriver.stop()");
			//ins.pause();
			ins.status = 'STOP';
			ins.player.stop();
			//清理定时器
			if(prv.playTimer != null){
				clearTimeout(prv.playTimer);
				prv.playTimer = null;
			}
			if(prv.previewTimer != null){
				clearTimeout(prv.previewTimer);
				prv.previewTimer = null;
			}
			prv.waitTimer.stop();
			ins.clean();
		};
		
		ins.setMode = function(mode){
			ins.mode = mode;
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
		
		ins.disableStaff = function(n){
			prv.disableStaff = n;
			if(prv.option.enableJsBridge){
				prv.jsBridge.callHandler('McMidiPlayer_disableStaff', 
											{'staff':n},null); 
			}
			
			if(n == -1){
				$(".note_0", prv.svgIframe.contentDocument).each(function(){
					console.log("note_"+n);
					this.setAttribute("fill-opacity", 0.9);
				});	
				$(".note_1", prv.svgIframe.contentDocument).each(function(){
					console.log("note_"+n);
					this.setAttribute("fill-opacity", 0.9);
				});	
			}else if(n == 0){
				$(".note_0", prv.svgIframe.contentDocument).each(function(){
					console.log("note_"+n);
					this.setAttribute("fill-opacity", 0.1);
				});				
				$(".note_1", prv.svgIframe.contentDocument).each(function(){
					console.log("note_"+n);
					this.setAttribute("fill-opacity", 0.9);
				});				
			}else if(n == 1){
				$(".note_0", prv.svgIframe.contentDocument).each(function(){
					console.log("note_"+n);
					this.setAttribute("fill-opacity", 0.9);
				});				
				$(".note_1", prv.svgIframe.contentDocument).each(function(){
					console.log("note_"+n);
					this.setAttribute("fill-opacity", 0.1);
				});				
				
			}
			//$(".note_"+n).hide();		
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
				ins.player.setBPM(bpm);
				prv.currentBPM = bpm;
			}	
		}
		
		ins.getBPM = function(){
			return prv.currentBPM;
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
		
		ins.scrollToFrame = function(frameNotes){
			var min = 0;
			var max = 0;
			for(var i=1;i<frameNotes.length;i++) {
				if(frameNotes[i].pitch > frameNotes[max].pitch){
					max = i;
				} else if(frameNotes[i].pitch < frameNotes[min].pitch){
					min = i;
				}
			}
			
			//console.log("max: " + max);

			//console.log(JSON.stringify(frameNotes)+ "min: " + min + ", max: " + max);
			
			ins.scrollToPitch(frameNotes[max]);
		}
		
		ins.scrollToPitch = function(note){
			var noteWidth = $(window).width()/52*2;
			var off = prv.pitch2left(note.pitch) * noteWidth;
			
			//console.log("off: " + off);
			if(off < prv.screenLeft || off > prv.screenRight - noteWidth){
				
				if(note.staff == 0){ //右手
					off = off - $(window).width() + noteWidth;
				}else{ //左手
					if(off > noteWidth *2){
						off = off - noteWidth *2;
					}else{
						off = 0;
					}
				}
				
				console.log("scrollTop:" + prv.scrollTop);
				prv.svgIframe.contentWindow.scroll(off, prv.scrollTop - 100);
				//prv.svgIframe.contentWindow.scroll(off, 0);

				prv.screenLeft = off;
				prv.screenRight = off+$(window).width();
			}		    
		}
		
		ins.onScroll = function(){
			var off = prv.svgIframe.contentWindow.document.body.scrollLeft;
			//$('.keys_area').css({'left': off*-1});
			prv.keyboard.scrollLeft(off);
			prv.screenLeft = off;
			prv.screenRight = off + $(window).width();
		}	
		
		/*
		ins.autoScroll = function(){
			if(ins.status != 'PLAYING'){
				return;
			}	
			setTimeout(ins.autoScroll, 1000/60);
			
			var previewTime = (Date.now() - ins.startTimestamp)/1000;
			prv.scrollToTick(ins.time2tick(previewTime));
		}
		*/		
		ins.scroll = function(){
			var h =  mcScore.getLastNote().offtick + ins.time2tick(prv.option.previewLen/1000.)*2;
			$("html, body").scrollTop(h*prv.tick2pix);
			$("html, body").animate({      
		      scrollTop: 0
		    }, {
		      duration: mcScore.getLastNote().offtime*1000,
		      easing: "linear"
		      //duration: mcScore.getLastNote().offtime*1000
		      //easing: "linear"
		    }); 
		}			
		
		/*
		var test = $('#test'),
	    bodyScroll = 0;
		$(window).on('scroll',function(){
		     bodyScroll = $(window).scrollTop();
		});
		
		function loop(){
		    requestAnimationFrame(loop);
		    $("html, body").css("top",bodyScroll + 100 + "px");
		};
		
		requestAnimationFrame(loop);
		*/
		
		prv.scrollToTick = function (tick){
			//return;
			if(prv.scrollTick == tick){
				return;
			}
			
			prv.scrollTick = tick;

			var off = mcScore.getLastNote().offtick + ins.time2tick(prv.option.previewLen/1000.)*2 - tick;
			//console.log("off: " + off+" "+prv.tick2pix+" "+prv.previewPix);
			off = off * prv.tick2pix - prv.previewPix;
			
			prv.scrollTop = off;
			//off = off - prv.marginTop;
			
			//$("html, body").scrollTop(off);
			//$("#wfsvg").css("top", off + "px");
			//console.log("off: "+off);
			$("#wfsvg").scrollTop(off);

			//prv.svgIframe.contentWindow.scroll(0, off);
			/*
		    $("html, body").animate({      
		      scrollTop: off + "px"
		    }, {
		      duration: 2,
		      easing: "swing"
		    });    	
		    */		
		};	
		
	    prv.makeSVG = function (tag, attrs) {
			var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
		    for (var k in attrs)
		        el.setAttribute(k, attrs[k]);
		    return el;
		};
		
		//返回当前音高中心线距离键盘左边界有多少个键宽度(白键的宽度)
		prv.pitch2left = function (pitch){
			var octave = Math.floor((pitch-12)/12); //八度，最左侧的三个键算0
			var n = (pitch-12)%12+1; //八度内第几个键，是从1开始的
			
			var left = octave*7-5; //当前八度的左边缘距键盘左边界有多少个白键的宽度
			if(n < 6){
				left += n/2.0;
				if(n % 2 == 0) //黑键向右偏移
					left += 0.05;
			} else {
				left += n/2.0 + 0.5;
				if(n % 2 == 1) //黑键向右偏移
					left += 0.05;
			}
		
		    //console.log(pitch+" "+ octave +" "+n + " " + left);
		    return left;
		}
		
		prv.showHelpLines = function (svgDom, svgHeight, noteWidth){
			
			for(var i = 0;i<52;i++){
				var e = prv.makeSVG('line', {x1: noteWidth*i, y1: 0, x2:noteWidth*i, y2: svgHeight, stroke: 'black', 'stroke-width': 1, fill: 'blue','fill-opacity':0.0001});
				
				svgDom.appendChild(e);
			}
		}
		
		
		prv.resize = function  (svgDom){
			console.log("window width "+ $(window).width());
			var width = $(window).width()*1;
			var oldWidth = $(svgDom).width();
		
			var s = width/oldWidth;
			//$(svgDom).attr("transform", "scale("+s+" 1) translate(0 0) ");
			$(svgDom).attr("transform", "scale(2 1)");
		};
		
		ins.createiFrame = function(elem, height){
			var iframe = document.createElement("iframe"); 
			iframe.setAttribute('frameborder', '0');
			//iframe.scrolling="no";
			//iframe.src = "svg_waterfall.html?v="+  Date.parse( new Date());
			iframe.width = "100%";
			iframe.height = height;
			iframe.id = "svgframe";
			
			elem.append(iframe);
			
			prv.svgIframe = iframe; 
			
			prv.svgIframe.contentWindow.onscroll = ins.onScroll;
			ins.onScroll();
			
			$("#svgframe").contents().find("body").css('padding', 0);
			$("#svgframe").contents().find("body").css('margin', 0);
			return iframe;
		}
			
		ins.createSVG = function (elem, scale, previewPix, keyboard){
			console.log("previewPix: "+previewPix + "previewLen(msec): "+ prv.option.previewLen);
			prv.previewPix = previewPix;
			prv.keyboard = keyboard;
			//prv.tick2pix = prv.previewPix / ins.time2tick(prv.option.previewLen/1000.0);
			
			prv.tick2pix = 0.3;

			var noteWidth = $(window).width()/52*scale;
			var previewTick = ins.time2tick(prv.option.previewLen/1000.0);

			var svgWidth = $(window).width() * scale;
			//var svgHeight = (mcScore.getLastNote().offtick + previewTick*2) * prv.tick2pix;
			var svgHeight = mcScore.getLastNote().offtick * prv.tick2pix + previewPix*2;

			var rectWidth = noteWidth/2.0;
			console.log("svg: "+svgWidth +"  "+svgHeight);
			
			var iframeRoot = ins.createiFrame(elem, svgHeight);
			//var iframeRoot = prv.svgIframe;

			var svgDom = document.createElementNS('http://www.w3.org/2000/svg','svg');
			prv.svgDom = svgDom;
			svgDom.setAttribute('width', svgWidth);
			svgDom.setAttribute('height', svgHeight);
			var allStaffNotes = prv.staffNoteList;
			
			//prv.showHelpLines(svgDom, svgHeight, noteWidth);
			
			for(var i=0;i<allStaffNotes.length;i++) {
				for(var j=0;j<allStaffNotes[i].length;j++){
					var note = allStaffNotes[i][j];
					var left = prv.pitch2left(note.pitch);
					var noteX = (left * noteWidth - rectWidth/2.0);
					var height = (note.offtick - note.ontick) * prv.tick2pix - 2;
					var noteY = svgHeight - note.offtick * prv.tick2pix - previewPix + 2;
					var e = prv.makeSVG('rect', {x: noteX, y: noteY, rx:3, ry:3, width: rectWidth, height: height, stroke: 'black', 'stroke-width': 0, fill: '#ff6096','fill-opacity':0.9, 'stroke-opacity': 0.1,'class': "note_"+i});
					note.element = e;
					svgDom.appendChild(e);
				}
			}
			
			$("#svgframe").contents().find("body").append(svgDom);
			//iframeRoot.contentWindow.document.body.append(svgDom);
			//iframeRoot.contentWindow.document.body.append('<div>hello</div>');
			//var kb = "<div  class='keyboard theme_real' id='keyboard'> hello </div>";
			//$(iframeRoot.contentWindow.document.body).append(kb);
			//elem.append(svgDom);
		}

		
		ins.setOption(option);
		return ins;
	}	
};