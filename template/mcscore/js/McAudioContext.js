
var McAudioContext = {
	type: "McAudioPlayer",
	onInit: null,
	createNew: function(){
		var ins = {};
		ins.context = null;
		ins.audioBuffer = null;
		ins.source = null;
		ins.onLoaded = null;
		ins.bufferPlayer = null;
		ins.type = function(){
			return McAudioPlayer.type;	
		};
		
		var prv = {};
		prv.isReady = false;
		prv.isPlaying = false;
		prv.preSeekOffset = 0;
		prv.pauseOffset = 0;
		
		ins.init = function(){
	        try {
	            window.AudioContext = window.AudioContext || window.webkitAudioContext;
	            ins.context = new AudioContext();
	            console.log("AudioContext created!");
	        } catch(e) {
	            //alert("Web Audio not supported in your browser, please try a newer release of Safari, Chrome, or Firefox");
	            console.log("Web Audio not supported in your browser, please try a newer release of Safari, Chrome, or Firefox");
	        }
        };
        
        ins.isReady = function(){
			return prv.isReady;
		};

		function initSound(arrayBuffer) {  
		    ins.context.decodeAudioData(arrayBuffer, function(buffer) { //解码成功时的回调函数  
		        ins.audioBuffer = buffer;  
		        ins.bufferPlayer = new BuffAudio(ins.context, ins.audioBuffer);
		        if(ins.onLoaded && typeof(ins.onLoaded)=="function"){
			        prv.isReady = true;
			        ins.onLoaded();
		        }
		    }, function(e) { //解码出错时的回调函数  
		        console.log('Error decoding file', e);  
		    });  
		};
		 
		ins.open = function(scoreId, onLoaded, isAccompany, onError){
			prv.isReady = false;
			ins.onLoaded = onLoaded;
			var url = "./scores/"+scoreId+"/score.mp3";
			if(isAccompany) {
				url = "./scores/"+scoreId+"/accompany.mp3";
			}
			var xhr = new XMLHttpRequest(); //通过XHR下载音频文件  
		    xhr.open('GET', url, true);  
		    xhr.responseType = 'arraybuffer';
		    xhr.onload = function(e) { //下载完成
					if(xhr.status == 200) {
						initSound(this.response);  
					} else {
						if(onError) {
							onError();
						}
					}
		    };
				
		    xhr.send(); 
		};
		
		ins.restart = function(){
			
		}
		
		ins.start = function(){
			ins.bufferPlayer.play();
		};
		
		ins.stop = function(){
			ins.bufferPlayer.stop(false);
		};

		ins.pause = function(){
			ins.bufferPlayer.pause();
		};
		
		
		ins.getBPM = function(){/*不支持此方法*/};
		
		ins.setBPM = function(bpm){/*不支持此方法*/};
		
		ins.getCurrentTicks = function(callback){/*不支持此方法*/};

		prv._getCurrentTime = function(){
			if(prv.isPlaying){
				return ins.context.currentTime-prv.startTime+prv.seekOffset;
			}else{
				if(prv.preSeekOffset > 0){
					return prv.preSeekOffset;
				}
				return prv.pauseOffset;
			}
		}
		ins.getCurrentTime = function(callback){
			callback(ins.bufferPlayer.playbackTime());
		};
		
		ins.seek = function(t){
			ins.bufferPlayer.seek(t);
		}

		ins.onNoteOn = function(note){/*不支持此方法*/}
		
		ins.init();

		return ins;
	}

};