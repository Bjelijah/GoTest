
var McAudioPlayer = {
	type: "McAudioPlayer",
	onInit: null,
	createNew: function(){
		var ins = {};
		
		ins.type = function(){
			return McAudioPlayer.type;	
		};
		
		ins.open = function(scoreId){
			$('#McAudioPlayer').attr("src", "./scores/"+scoreId+"/score.mp3");
		}
				
		ins.start = function(){
			ins.player.play();
			//audio.addEventListener("play", play, false);
			
		};
		
		ins.stop = function(){
			ins.player.pause();
		}
		
		ins.getBPM = function(){/*不支持此方法*/};
		
		ins.setBPM = function(bpm){/*不支持此方法*/};
		
		ins.getCurrentTicks = function(callback){/*不支持此方法*/};

		ins.getCurrentTime = function(callback){
			callback(ins.player.currentTime);
		};
		
		ins.seek = function(t){
			ins.player.fastSeek(t);
		}

		ins.onNoteOn = function(note){/*不支持此方法*/}
		
		$("body").append('<div id="audioctrl">'+
			'<audio id="McAudioPlayer"  preload="auto" type="audio/mpeg">'+
			'	Your browser does not support the audio element.'+
			'</audio>'+
		'</div>');
			
		ins.player = document.getElementById('McAudioPlayer');

		return ins;
	}

};