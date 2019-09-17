$(function(){
	
	var bpm = $('#bpmChoose').val();
	var rhythm = $('#rhythmSelect').val();
	var pause = true;
	
	var metronome = McMetronome.createNew();
	var fonts = metronome.getSoundFonts();
	initPage(bpm, rhythm, fonts);
	
	$('#playButton').bind("click", function () {
		metronome.setup(bpm, rhythm);
		pause = !pause;
		if (!pause) {
			metronome.setSoundFont($('#fontSelect').val(), function(){
				metronome.startMetronome();
				startIndicator();
			});
		} else {
			metronome.stopMetronome();
		}
		$(this).text(pause ? "Play" : "Pause");
	});
	
	$('#bpmChoose').bind("change", function() {
		metronome.state.bpm = $('#bpmChoose').val();
		$('#speed').text($('#bpmChoose').val());
	});
	
	$('#rhythmSelect').bind("change", function() {
		metronome.state.rhythm = $('#rhythmSelect').val();
	});
	
	$('#fontSelect').bind("change", function() {
		metronome.stopMetronome();
		metronome.setSoundFont($('#fontSelect').val(), function(){
			metronome.startMetronome();
			startIndicator();
		});
	});
	
	function startIndicator() {
		$('.indicator').addClass("on");
		setTimeout(function(){
			$('.indicator').removeClass("on");
		}, 100);
		
		setTimeout(function(){
			if(metronome.state.pause) {
				return;
			}
		
			startIndicator();
		}, 60000/metronome.state.bpm);
	}
});

function initPage(bpm, rhythm, fonts) {
	$('#speed').text(bpm);
	showFonts(fonts);
}

function showFonts(fonts) {
	var html = "";
	for(var index in fonts) {
		html += "<option value=" + fonts[index] + ">" + fonts[index] + "</option>";
	}
	$('#fontSelect').append(html);
}

function createAudioContext(callback){
	window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
	try {
    		var context = new window.AudioContext();
	} catch(ReferenceError) {
    		alert("metronome works only on browsers that implement the Web Audio API");
	}
	context.createGain();
	
	var count = 0;
	function wait() {
		if(context.currentTime === 0) {
			count++;
			if(count > 60) {
				alert('timeout');
			} else {
				setTimeout(wait, 100);
			}
		} else {
			callback(context);
		}
	}
	wait();
}
