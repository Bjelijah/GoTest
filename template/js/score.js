var scoreId = 80;

var player = null;
var mcScore = null;
var countdown = null;
var curNote = null;
var noteA = null;
var noteB = null;
var isLoop = false;
var isPlay = false;
var isPause = false;
var totalTime = 0;
var currentTime = 0;
var oribpm = 0;

var viewWhiteKeyNum = 0;
var leftKey = 1;
var showMiniature = false;
var showControl = false;

var totalNotes = 0;
var hitNotes = [];
var curHitKey = 0;
var hitTime = 0;
var startHitTime = 0;
var endHitTime = 0;
var isHit = false;

var progressWidth = 0;//进度条宽度

var mcClass = null;

var interval;
var waitKeys = {}; //正在等待的key

var scoreKeeper = McScoreKeeper.createNew();
var errorNotes = []; //弹错的音符
var mode = 'listen'; //当前练习模式

var isFirstBeat = true; //是否是第一拍

var keyboard = null;

$(function() {
	$('.loading .wrap').css('display', 'block');

  initKeyboard();

});

function onScoreReady() {
	$('.loading').css('display', 'none');
	
	McClass.createNew(function(obj){
		mcClass = obj;
		mcClass.setBlueConnectedChangeListener(blueConnectedChange);

		mcClass.setOnUserKeyDown(keyDown);
		mcClass.setOnUserKeyUp(keyUp);

		mcClass.isConnected(function (responseData){
			if(responseData == "true"){
				$('#connect').css('display', 'block');
				$('#disconnect').css('display', 'none');
			} else {
				$('#disconnect').css('display', 'block');
				$('#connect').css('display', 'none');
			}
		});
		
		$('.btn_back').bind('touchend', function() {
            stop();
            history.back(-1);
		});
		
		$('#connect').bind('touchend', function(){
			mcClass.disconnect(function (responseData){
				console.log("connect return "+responseData);
				if(responseData == "false"){
					$('#disconnect').css('display', 'block');
					$('#connect').css('display', 'none');
				}
			});
		});
		
		$('#disconnect').bind('touchend', function(){
			mcClass.connect(function (responseData){
				console.log("connect return "+responseData);
				if(responseData == "true"){
					$('#connect').css('display', 'block');
					$('#disconnect').css('display', 'none');
				}
			});	
		});
		
		$('#audioPlay').bind('touchend', function() {
    		if(!isPlay) {
        			play();
       		} else {
        			pause();
        	}
		});
	});

	$('#audioRestart').bind('touchend', function() {
		if($(this).hasClass('disable')) {
			return;
		}
		restart();
	});
	
	$('#bpmChange').bind('touchend', function() {
		if($(this).hasClass('disable')) {
			return;
		}
		
		if(showBPMPanel) {
			if(isPlay) {
				pause();
				isPause = true;
			}
			$(this).addClass('active');
			showBPMPanel = false;
			$('.panel_speed').show();
			setBackgroundSizeOfSpeedPanel();
			$('#bpm').text($('#bpmRange').val() + 'bpm');
		} else {
			$(this).removeClass('active');
			showBPMPanel = true;
			$('.panel_speed').hide();
			
			console.log("set BPM "+parseInt($('#bpmRange').val()));
			mcScore.setBPM(parseInt($('#bpmRange').val()));
			totalTime = mcScore.getTotalRealTime();
			
			if(isPause) {
				play();
				isPause = false;
			}
		}
	});

  var lastSelectBtn;
  [].slice.call(document.querySelectorAll('select.cs-select')).forEach(function(el) {
    new SelectFx(el, {
      onShow: function () {
        $('.toolbtn').removeClass('active');
        $('.panel_speed').hide();

        toolBtn = $(el).parent().prev();
        toolBtn.addClass('active');

        if(isPlay) {
          pause();
          isPause = true;
        }

        lastSelectBtn = toolBtn;
      },
      onHide: function () {
        toolBtn = $(el).parent().prev();
        toolBtn.removeClass('active');

        if(lastSelectBtn.hasClass('active')) {
          return;
        }

        if(isPause) {
          play();
          isPause = false;
        }
      },
      onChange: function () {

      }
    });
  });
	
	$('#bpmRange').bind("input", function() {
		$('#bpm').text($('#bpmRange').val() + 'bpm');
		
		setBackgroundSizeOfSpeedPanel();
	});
	
	$('#bpmReduce').bind('touchend', function() {
		var current = parseInt($('#bpmRange').val());
		$('#bpmRange').val(current - 1);
		$('#bpm').text($('#bpmRange').val() + 'bpm');
		
		setBackgroundSizeOfSpeedPanel();
	});
	
	$('#bpmRaise').bind('touchend', function() {
		var current = parseInt($('#bpmRange').val());
		$('#bpmRange').val(current + 1);
		$('#bpm').text($('#bpmRange').val() + 'bpm');
		
		setBackgroundSizeOfSpeedPanel();
	});
	
	$('#cancelLoop').bind('touchend', function(){
		$('#cancelLoop').css('display', 'none');
		cancelLoop();
		noteA = null;
		noteB = null;
		$('#audioLoop').removeClass('btn_ab');
		$('#audioLoop').addClass('btn_no');
	});

	$('#audioLoop').bind('touchend', function(){
		console.log("option loop");
		if(!$(this).prop("disabled")) {
			if($(this).hasClass('btn_no')) {
			
				if(curNote == null) {
					alert("请点击选择一个音符");
					return;
				}
				noteA = curNote;
				mcScore.setA(noteA);
				
				$(this).removeClass('btn_no');
				$(this).addClass('btn_a');
				$('#cancelLoop').css('display', 'block');
				
			} else if($(this).hasClass('btn_a')) {
				if(noteA.id == curNote.id) {
					alert("不能与A点相同");
					return;
				}
				if(noteA.ontick > curNote.ontick) {
					alert("B点不能小于A点");
					return;
				}
				noteB = curNote;
				mcScore.setB(noteB);
				
				$(this).removeClass('btn_a');
				$(this).addClass('btn_ab');
				
				isLoop = true;
				mcScore.loop();
				play();
				
			} else if($(this).hasClass('btn_ab')) {
				isLoop = false;
				cancelLoop();
				$('#cancelLoop').css('display', 'none');
				$(this).removeClass('btn_ab');
				$(this).addClass('btn_no');
			}
		}
	});

  $('#keyboardBtn').bind('touchend', function () {
    $('#keyboardBtn').toggleClass('open')
    keyboard.show($('#keyboardBtn').hasClass('open'))
  })
	
	$(window).bind('unload', function() {
		stop();
	});

  var showBPMPanel = true;

  initScore();
}

function setLoopButton() {
	if(isLoop) {
		$('#audioLoop').css('opacity', 1);
		$('#audioLoop').attr('disabled',false);
	} else {
		if(mcScore.getStatus() == 'PLAYING') {
			$('#audioLoop').css('opacity', 0.5);
			$('#audioLoop').attr('disabled',true);
		} else {
			if($('#audioAccompany').hasClass('active')) {
				$('#audioLoop').css('opacity', 0.5);
				$('#audioLoop').attr('disabled',true);
			} else {
				$('#audioLoop').css('opacity', 1);
				$('#audioLoop').attr('disabled',false);
			}
		}
	}

	if(noteA == null && noteB == null) {
		$('#audioLoop').removeClass('btn_a');
		$('#audioLoop').removeClass('btn_ab');
		$('#audioLoop').addClass('btn_no');
	}
}

function cancelLoop() {
	isLoop = false;
	noteA = null;
	noteB = null;
	mcScore.cancelLoop();
	setLoopButton();
	$('#cancelLoop').hide();
}


function onCount(count) {
	$('#cd').text(count);
	if(isFirstBeat){
	   isFirstBeat = false;
	   mcScore.metronomePlayStress();
	}else{
	   mcScore.metronomePlayWeakness();
	}
}

//根据拍号和当前速度设置倒计时
function setupCountdown(){
	var timesig = mcScore.getTimeSig();
	var bpm = mcScore.getBPM();	
	var count = timesig[0];
	var dur = 60000/bpm;	
	countdown.setup(count, true, dur);
}

function play() {
	if(!isPlay) {
    keyboard.lightOffAll();

		$('#audioPlay').addClass('active');
		
		if($('#bpmChange').hasClass('active')) {
			$("#bpmChange").trigger("touchend");
		}
		
		showMask();
		
		for(var i=0; i< errorNotes.length; i++){ //清理错语音符的高亮
			errorNotes[i].element.setAttribute('fill','black');
		}
		errorNotes = [];

		$('#audioPlay').removeClass('btn_play');
		$('#audioPlay').addClass('btn_pause');
		$('#audioRestart').removeClass('active');

		setupCountdown();
		//countdown.setup(3, true, 1000);
		isFirstBeat = true;
		countdown.start(onCount, function() {
			$('#cd').text('');
			console.log("倒计时结束，开始播放");

      var hands = $('#hands').val();
      if (hands == 'left') {
        mcScore.disableStaff(0);
      } else if (hands == 'right') {
        mcScore.disableStaff(1);
      } else {
        mcScore.disableStaff(-1);
      }

      mode = $('#modes').val();
      console.log("setMode : " + mode);
      mcClass.menuOption({'op': 'setMode', 'params': ['' + mode]});
      if (mode == 'listen') {
        mcScore.setMode("PLAY");
        mcScore.play();
      } else if (mode == 'follow') {
        mcScore.setMode("PLAY");
        mcScore.play();
      } else if (mode == 'waitFollow') {
        mcScore.setMode("WAIT");
        mcScore.play();
        wait();
      } else if (mode == 'pk') {
        mcScore.setMode("PLAY");
        mcScore.disableStaff(-1);
        mcScore.setBPM(oribpm);
        mcScore.play();
      }
			
			setLoopButton();
			hideMask();
			
			progressWidth = $('.progress').width();
			startProgress();
		});
		
		isPlay = true;
	}
}

function wait() {
	waitKeys = {};
	var waitNotes = mcScore.nextFrame();
	var n = 0;
	for (var key in waitNotes) {
	    //waitKeys.push(pitchToKey(key));
	    waitKeys[pitchToKey(key)] = false;
	    //scoreKeeper.noteOn(waitNotes[key]);
	    n++;
	}
	
	if(!scoreKeeper.isWaitUserKey()){
		if(n == 0){
			console.log("wait finish");
			stop();
			return;
		}
		setTimeout(wait, 100);
	}
}

function pause() {
	if(isPlay){
		$('#audioPlay').addClass('btn_play');
		$('#audioPlay').removeClass('btn_pause');
		$('#audioPlay').removeClass('active');
		
		clearInterval(interval);
		mcScore.pause();
		setLoopButton();
		isPlay = false;
	}
}

function restart() {
	if($('#bpmChange').hasClass('active')) {
		$("#bpmChange").trigger("touchend");
	}
	$('#audioRestart').addClass('active');
	
	stop();
	
	setTimeout(function(){							
		$('#audioRestart').attr('checked', false);
		$('#audioRestart').removeClass('active');
		play();												
	},500);
}

function stop() {
		cancelLoop();
		mcScore.stop();
		$('#audioPlay').removeClass('btn_pause');
		$('#audioPlay').addClass('btn_play');
		$('#audioPlay').removeClass('active');
		
		clearInterval(interval);
		resetProgress();
		setLoopButton();
		isPlay = false;
}

function waitModeDemo() {
	mcScore.nextFrame();
	setTimeout(waitModeDemo, 500);
}

function onNoteClick(note) {
	if(curNote) {
		curNote.element.setAttribute('fill', 'black');
    //keyboard.lightOff(pitchToKey(curNote.pitch));
	}
	note.element.setAttribute('fill', '#D4145A');
  //keyboard.lightUp(pitchToKey(note.pitch), '#D4145A');
	mcScore.pointToNote(note);
	curNote = note;
}

function onNoteOn(note) {
	totalNotes++;
	if(note.staff == 0) {		
		note.element.setAttribute('fill', '#D4145A');
    keyboard.lightUp(pitchToKey(note.pitch), '#D4145A');
	} else if (note.staff == 1) {
		note.element.setAttribute('fill', '#ffc90f');
    keyboard.lightUp(pitchToKey(note.pitch), '#ffc90f');
	}
	curNote = note;
	if(mode != "listen"){ //欣赏模式不要打分
		scoreKeeper.noteOn(note);
	}
}

function onNoteOff(note) {
	note.element.setAttribute('fill', 'black');
  keyboard.lightOff(pitchToKey(note.pitch));
	if(mode != "listen") {
		//scoreKeeper.noteOff(note);
		setTimeout(function() {scoreKeeper.noteOff(note);}, 10000);
	}
}

function onError(msg) {
	//alert(msg);
}


function onFinish(){
	clearInterval(interval);
	console.log("===========  finish");
	stop();

  mcClass.finish(function (responseData){
    console.log("connect return "+responseData);
  });
}

//显示遮罩层    
function showMask() {
	$("#mask").css("height", $(document).height());
	$("#mask").css("width", $(document).width());
	$("#mask").show();
}
//隐藏遮罩层  
function hideMask() {

	$("#mask").hide();
}

function timeLog(msg) {
	//$('#timeLog').text("time: "+msg);	
}

function posLog(msg) {
	//$('#posLog').text("pos: "+msg);	
}

function userNoteLog(msg) {
	$('#userNoteLog').text("note: " + msg);
}

function pitchToKey(pitch) {
	return pitch - 20;
}

function initScore() {
	mcScore.setMarginTop($('.toolbar').outerHeight(true) + $('.panel_loop').outerHeight(true) + 200);
	
	oribpm = mcScore.getBPM();
	$('#bpmRange').val(oribpm);
	mcScore.setBPM(oribpm);
	
	totalTime = mcScore.getTotalRealTime();
	
	var cdTop = ($(window).height() - $('#cd').height()) / 2;
	var cdLeft = ($(window).width() - $('#cd').width()) / 2;
	$('#cd').css({'top' : cdTop, 'left' : cdLeft});
}

function initKeyboard() {
  keyboard = McKeyboard.createNew();
  keyboard.setup(viewWhiteKeyNum, leftKey, showMiniature, showControl);
  keyboard.loadSoundFonts(function(){
    keyboard.bindTouchEvent(keyDown, keyUp);

    initPage();
  });
}

function initPage() {
	var option = {
		enableJsBridge: enableJsBridge,
		onNoteClick: onNoteClick, //绑定用户点击某个音符后执行的回调，设定AB循环时要用这个
		onNoteOn: onNoteOn, //绑定某个音符触发(开始发声)后执行的回调，与seek方法配合可实现任意区间循环
		onNoteOff: onNoteOff,
		onFinish: onFinish,
		onError: onError,
		onReady: onScoreReady, //绑定乐谱资源加载完毕后执行的回调
	};
	mcScore = McScore.createNew(option);
	
	mcScore.init(scoreId);
	
	countdown = McCountDown.createNew();
}

function keyDown(keys) {
  console.log("keyDown :" + keys);
  if(!isPlay){
    return;
  }
  if(mode != "listen"){
    for(var i = 0; i < keys.length; i++){
      scoreKeeper.keyDown(keys[i]);
    }
  }

  if(mode == 'waitFollow') {
    for(var i = 0; i < keys.length; i++){
      scoreKeeper.keyDown(keys[i]);
    }
    if(!scoreKeeper.isWaitUserKey()){
      setTimeout(wait, 100);
    }
  } else {
    for(var i = 0; i < keys.length; i++) {
      if(curNote) {
        if(pitchToKey(curNote.pitch) == keys[i]) {
          console.log('hit');
          curHitKey = keys[i];
          hitNotes.push(curNote);
          startHitTime = new Date().getTime();
          isHit = true;
        }
      }
    }
  }
}

function keyUp(keys) {
  if(mode != "listen"){
    for(var i = 0; i < keys.length; i++){
      scoreKeeper.keyUp(keys[i]);
    }
  }

  if(isHit) {
    if(pitchToKey(curNote.pitch) == curHitKey) {
      endHitTime = new Date().getTime();
      hitTime += endHitTime - startHitTime;
    } else {
      hitTime += 60000 / mcScore.getBPM();
    }
    isHit = false;
  }
}

function startProgress() {
	var startTime = mcScore.getCurrentRealTime();
	interval = setInterval(function() {
		var speed =  progressWidth / totalTime;

		currentTime = mcScore.getCurrentRealTime();
		if((currentTime < totalTime) || isLoop) {
			var widthTemp = speed * currentTime;
			$('#current').css('width', widthTemp);
			$('#indicate').css('left', widthTemp);
		} else {
			if(!enableJsBridge){
				onFinish();
			}
		}
	}, 50);
}

function resetProgress() {
	$('#current').css('width', 0);
	$('#indicate').css('left', 0);
}

function setBackgroundSizeOfSpeedPanel() {
	var width = (parseInt($('#bpmRange').val()) - 30) * parseInt($('#bpmRange').css('width')) / 230;
	var backgroundSize = width + 'px 100%';
	$('#bpmRange').css('background-size', backgroundSize);
}

function blueConnectedChange(isConnected) {
	console.log("isConnected: " + isConnected);
	if(isConnected == "true"){
		$('#connect').css('display', 'block');
		$('#disconnect').css('display', 'none');
	} else {
		$('#disconnect').css('display', 'block');
		$('#connect').css('display', 'none');
	}
}