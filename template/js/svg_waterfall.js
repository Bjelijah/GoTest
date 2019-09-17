var token = '';
var courseId = -1;
var scoreId = -1;

var mcScore = null;
var keyboard = null;
var waterfall = null;
var viewWhiteKeyNum = 52;
var leftKey = 1;
//var viewWhiteKeyNum = 14;
//var leftKey = 34;
var showMiniature = true;
var showControl = false;
var dropSpeed = 0.15;
var noteType = "";

var countdown = null;
var isPlay = false;
var isPause = false;
var pausedNotes = [];
var showBPMPanel = true;
var noteLength = 0;
var totalTime = 0;
var currentTime = 0;
var oribpm = 0;
var difficulty = '';

var totalNotes = 0;

var interval;

var waitKeys = [];

var fallingNotes = [];
var isFirst = true;
var nextIndex = 0;
var preFrameIndex = -1;

var canMove = true;

var waitNotes = [];
var isWait = false;

var mcClass = null;

var progressWidth = 0;//进度条宽度

$(function() {
	
	token = GetQueryString('token');
	scoreId = GetQueryString("songid");
	courseId = GetQueryString('courseid');
	difficulty = GetQueryString('difficulty');
	
	initKeyboard();
	
	$('#back').bind('touchend', function() {
		stop();
		history.back(-1);
	});
});



function initKeyboard() {
	keyboard = McKeyboard.createNew();
	keyboard.setup($(window).width()*2, viewWhiteKeyNum, leftKey, showMiniature, showControl);	
	keyboard.showKeyName(true);
	keyboard.loadSoundFonts(function(){
		keyboard.bindTouchEvent(keyDown, keyUp);
		noteLength = $('#keyboard').length;
		
	});
}

function keyDown(keys) {

}

function keyUp(keys) {

}


function GetQueryString(name)
{
	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if(r!=null)return  unescape(r[2]); return null;
}
