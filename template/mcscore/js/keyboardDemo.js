var scoreId = -1;
var mcScore = null;

var keyboard = null;
var waterfall = null;
var viewWhiteKeyNum = 14;
var leftKey = 34;
var showMiniature = true;
var showControl = false;
var dropSpeed = 0.2;
var noteType = "block";

var countdown = null;
var isPlay = false;
var isPause = false;
var pausedNotes = [];
var showBPMPanel = true;
var noteLength = 80;

$(function() {
	initPage();
	initScore();
});

function initPage() {
	$('html').css("font-size", $('html').width() / 19.2);
	
	[].slice.call(document.querySelectorAll('select.cs-select')).forEach(function(el) { 
        new SelectFx(el); 
    });
    
    $('html').bind('touchstart', function(ev){
		ev.preventDefault(); 
	});
	
	$('input').bind('touchstart', function(ev){
		ev.stopPropagation();
	});
	
	countdown = McCountDown.createNew();
	var cdTop = ($(window).height() - $('#cd').height()) / 2;
	var cdLeft = ($(window).width() - $('#cd').width()) / 2;
	$('#cd').css({'top' : cdTop, 'left' : cdLeft});
}

function initScore() {
	scoreId = GetQueryString("id");
	
	var option = {
	    enableJsBridge: false,
	    onNoteClick : null,  //绑定用户点击某个音符后执行的回调，设定AB循环时要用这个
	    onNoteOn : onNoteOn,          //绑定某个音符触发(开始发声)后执行的回调，与seek方法配合可实现任意区间循环
	    onNoteOff : onNoteOff,
	    onError: onError,
	    onReady: onScoreReady,  //绑定乐谱资源加载完毕后执行的回调
	    showScore: false,
	    previewLen: ($('#waterfall').height() - noteLength) / dropSpeed,
	    onNotePreview: onNotePreview  //音符进入预览区的回调
    };
    mcScore = McScore.createNew(option);
    
    mcScore.init(scoreId);
}

function onScoreReady() {
	initKeyboard();
	initWaterfall();
	
	$('#bpmRange').val(mcScore.getBPM());
	
	$('#audioPlay').bind('touchend',function() {
		play();
	});
	
	$('#audioPause').bind('touchend', function() {
		pause();
	});
	
	$('#audioRestart').bind('touchend', function() {
		isPlay = false;
		$(this).siblings().removeClass('active');
		waterfall.stop();
		mcScore.stop(function() {
			setTimeout(function() {
				$(this).attr('checked', false);
				play();
			}, 500);
		});
	});
	
	$('#bpmChange').bind('touchend', function() {
		if(showBPMPanel) {
			if(isPlay) {
				pause();
				isPause = true;
			}
			$(this).addClass('active');
			showBPMPanel = false;
			$('.panel_speed').show();
			$('#bpm').text($('#bpmRange').val() + 'bpm');
		} else {
			$(this).removeClass('active');
			showBPMPanel = true;
			$('.panel_speed').hide();
			
			if(isPause) {
				play();
				isPause = false;
			}
		}
	});
	
	$('#bpmRange').bind("input", function() {
		$('#bpm').text($('#bpmRange').val() + 'bpm');
		mcScore.setBPM(parseInt($('#bpmRange').val()));
	});
	
	$('#bpmReduce').bind('touchend', function() {
		var current = parseInt($('#bpmRange').val());
		$('#bpmRange').val(current - 1);
		$('#bpm').text($('#bpmRange').val() + 'bpm');
		mcScore.setBPM(current - 1);
	});
	
	$('#bpmRaise').bind('touchend', function() {
		var current = parseInt($('#bpmRange').val());
		$('#bpmRange').val(current + 1);
		$('#bpm').text($('#bpmRange').val() + 'bpm');
		mcScore.setBPM(current + 1);
	});
	
	$('.btn_hands').bind('touchend', function(){
		$(this).siblings().removeClass('active');
		$('.panel_speed').hide();
		
		if($('.btn_hands .cs-select').hasClass('cs-active')){
			if(isPlay) {
				pause();
				isPause = true;
			}
		} else {
			if(isPause) {
				play();
				isPause = false;
			}
		}
	});
	
	$('.btn_mode').bind('touchend', function(){
		$(this).siblings().removeClass('active');
		$('.panel_speed').hide();
		
		if($('.btn_mode .cs-select').hasClass('cs-active')){
			if(isPlay) {
				pause();
				isPause = true;
			}
		} else {
			if(isPause) {
				play();
				isPause = false;
			}
		}
	});
}

function initKeyboard() {
	keyboard = McKeyboard.createNew();
	keyboard.setup(viewWhiteKeyNum, leftKey, showMiniature, showControl);	
	keyboard.showKeyName(true);
	keyboard.loadSoundFonts(function(){
		keyboard.bindTouchEvent(keyDown, keyUp);
	});
}

function initWaterfall() {
	waterfall = McWaterfall.createNew();
	waterfall.setup(viewWhiteKeyNum, leftKey, dropSpeed, noteType, true);
}

function keyDown(key) {
	console.log('key ' + key + ' down');
}

function keyUp(key) {
	console.log('key ' + key + ' up');
}

function GetQueryString(name)
{
	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if(r!=null)return  unescape(r[2]); return null;
}

function play() {
	if(!isPlay) {
		showMask();
		$('#audioPlay').addClass('active');
		$('#audioPlay').siblings().removeClass('active');
		
		countdown.setup(3, true, 1000);
		countdown.start(onCount, function() {
			$('#cd').text('');
			console.log("倒计时结束，开始播放");
			
			var hands = $('#hands').val();
			if(hands == 'left') {
				mcScore.disableStaff(0);
			} else if (hands == 'right') {
				mcScore.disableStaff(1);
			} else {
				mcScore.disableStaff(-1);
			}
			
			var mode = $('#mode').val();
			if(mode == 'play') {
				mcScore.setMode("PLAY");
			} else if(mode == 'wait') {
				mcScore.setMode("WAIT");
			}
			
			for(var i = 0; i < pausedNotes.length; i++) {
				var pausedNote = pausedNotes[i];
				waterfall.noteDrop(pausedNote);
			}
			
			mcScore.play();
			
			hideMask();
		});
		isPlay = true;
	}
}

function pause() {
	if(isPlay) {
		$('#audioPause').addClass('active');
		$('#audioPause').siblings().removeClass('active');
		
		mcScore.pause();
		pausedNotes = waterfall.pause();
		isPlay = false;
	}
}

function onNoteOn(note) {
	
}

function onNoteOff(note) {
	
}

function onError(msg) {
	//alert(msg);
}

function onNotePreview(note) {
	var dropNote = waterfall.setNote(note);
	waterfall.noteDrop(dropNote);
	curNote = note;
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

function onCount(count) {
	$('#cd').text(count);
}