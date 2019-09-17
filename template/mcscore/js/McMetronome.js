/**
	节拍器
	@class McMetronome
*/

var McMetronome = {

	createNew : function(){
		var ins = {};
		
		ins.state = {
			bpm : 120,
			rhythm : 4,
			pause : true,
			position : 0
		};
		ins.context = null;
		
		var source;
		var fonts = [{"name": "音色1", "strongFont" : "./sounds/hit1.wav", "weakFont" : "./sounds/weak1.wav"},
					 {"name": "音色2", "strongFont" : "./sounds/hit2.wav", "weakFont" : "./sounds/weak2.wav"},
				 	 {"name": "音色3", "strongFont" : "./sounds/hit3.wav", "weakFont" : "./sounds/weak3.wav"}];
		var currentFont = [];
		var audioBuffer;
		var last_current_time = 0,
			scheduler_tick_offset_in_msecs = 30,
			next_scheduled_note_at = 0;
		var gainNode;
		
		/**
			设置节拍器
		 */
		ins.setup = function(bpm, rhythm) {
			window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
			if(!this.context) {
				try {
    					this.context = new window.AudioContext();
				} catch(ReferenceError) {
    					alert("metronome works only on browsers that implement the Web Audio API");
				}
				gainNode = this.context.createGain();
			}
			if(bpm != undefined) {
				this.bpm = bpm;
			}
			if(rhythm !== undefined) {
				this.rhythm = rhythm;
			}
		}
		
		/**
			获取音色列表
			@return 音色名数组
		*/
		ins.getSoundFonts = function() {
			var fontNames = [];
			for(var i = 0; i < fonts.length; i++) {
				fontNames.push(fonts[i].name);
			}
			
			return fontNames;
		};
		
		/**
			设置音色
			@return 是否设置成功
		*/
		ins.setSoundFont = function(fontName, onLoaded){
			var match = false;
			if(this.context){
				for(var i = 0; i < fonts.length; i++){
					if (fontName == fonts[i].name) {
						match = true;
						currentFont[0] = fonts[i].strongFont;
						currentFont[1] = fonts[i].weakFont;
					}
				}
				
				var bufferLoader = new BufferLoader(this.context, currentFont, function(bufferList){
					audioBuffer = bufferList;
					onLoaded();
				});
				
				bufferLoader.load();
			}
			
			return match;
		};
		
		/**
		 	播放强音
		 */
		ins.playStress = function(){
			//playAudioFile(audioBuffer[0], 0, 1.0, 1.0);
		};
		
		/**
		 	播放弱音
		 */
		ins.playWeakness = function(){
			//playAudioFile(audioBuffer[1], 0, 1.0, 0.2);
		};
		
		/**
			启动节拍器
		 */
		ins.startMetronome = function(){
			var self = this;
			self.state.pause = false;
			playMetronome();
		};
		
		/**
			停止节拍器 
		 */
		ins.stopMetronome = function(){
			this.state.pause = true;
		}
		
		//加载音色
		function loadFontFile(file, callback) {
			var request = new XMLHttpRequest();
			request.open('get', 'sounds/' + file, true);
			request.responseType = 'arraybuffer';

			request.onload = function () {
				ins.context.decodeAudioData(request.response, function(incomingBuffer) {
                     audioBuffer = incomingBuffer;
                     callback();
                });
    			};
    			request.send();
		}
		
		function playMetronome() {
			window.setTimeout(function(){
				var currentTime = ins.context.currentTime;
				if (currentTime - (last_current_time || 0) >
                    10 * (scheduler_tick_offset_in_msecs / 1000)) {
					next_scheduled_note_at = ins.context.currentTime;
					ins.state.position = 0;
				}
				last_current_time = currentTime;
				
				if (ins.state.pause) {
        				return;
       			}
				
				if (currentTime > next_scheduled_note_at) {
					playBeat(next_scheduled_note_at);
					next_scheduled_note_at = (next_scheduled_note_at + (60 / ins.state.bpm));
					ins.state.position = (ins.state.position + 1) % ins.state.rhythm;
				}
				
				playMetronome();
			}, scheduler_tick_offset_in_msecs);
		}
		
		//播放音色
		function playBeat(time) {
			if(ins.state.position == 0) {
				//播放强音
				playAudioFile(audioBuffer[0], time, 1.0, 1.0);
			} else {
				//播放弱音
				playAudioFile(audioBuffer[1], time, 1.0, 0.2);
			}
		}
		
		function playAudioFile(toneFile, time, rate, volume) {
			source = ins.context.createBufferSource();
			source.playbackRate.value = rate;
			source.buffer = toneFile;
    			source.connect(gainNode);
    			gainNode.connect(ins.context.destination);
    			gainNode.gain.value = volume;
    			source.start(time);
		}
		
		//返回实例
		return ins;
	}	
};