/**
	钢琴
	@class McKeyboard
*/

var McKeyboard = {

	createNew : function(){
		var ins = {};
		
		ins.viewWhiteKeyNum = 14;	//可见区域内显示多少个白键，如果传0，则显示全部的键
		ins.leftKey = 1;				//可见区域内最左侧键编号
		ins.showMiniature = true;	//是否显示全键盘缩影
		ins.showControl = true;		//是否显示左右滚动控制键
		
		var leftWhiteKey = 1;
		var context;	
		var audioBuffer = [];
		var player = null;
		
		var view = McKeyboardView.createNew();
		
		/**
		 * 初始化
		 * @param viewWhiteKeyNum 	可见区域内显示多少个白键，如果传0，则显示全部的键
		 * @param leftKey			可见区域内最左侧键编号
		 * @param showMiniature		是否显示全键盘缩影
		 * @param showControl		是否显示左右滚动控制键
		 */
		ins.setup = function(viewWhiteKeyNum, leftKey, showMiniature, showControl){
			this.viewWhiteKeyNum = viewWhiteKeyNum;
			this.leftKey = leftKey;
			this.showMiniature = showMiniature;
			this.showControl = showControl;
			
			if(viewWhiteKeyNum == 0) {
				this.viewWhiteKeyNum = 52;
				this.leftKey = 1;
			}
			
			if(pianoKeys[leftKey - 1].type == "black") {
				leftWhiteKey = pianoKeys[leftKey].whiteKeyNo;
			} else {
				leftWhiteKey = pianoKeys[leftKey - 1].whiteKeyNo;
			}
			
			view.setup(this.viewWhiteKeyNum, this.leftKey, this.showMiniature, this.showControl);
		}
		
		/**
		 * 控制是否显示虚拟键盘
		 * @param isShow
		 */
		ins.show = function(isShow) {
			if(isShow) {
				view.showKeyboard();  
			} else {
				view.hideKeyboard();  
			}
		}
		
		/**
		 * 加载音色库
		 * @param onLoaded 加载完成后的回调
		 */
		ins.loadSoundFonts = function(onLoaded) {
			if(!context) {
				window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

				try {
    					context = new window.AudioContext();
				} catch(ReferenceError) {
    					alert("metronome works only on browsers that implement the Web Audio API");
				}
			}
			
			player = new WebAudioFontPlayer();
			player.loader.decodeAfterLoading(context, '_tone_0010_Chaos_sf2_file');
			onLoaded();
//			var bufferLoader = new BufferLoader(context, pianoSourceFile, function(bufferList){
//				audioBuffer = bufferList;
//				onLoaded();
//			});
//			
//			bufferLoader.load();
		}
		

		/**
		 * 为按下钢琴键盘绑定事件
		 * @param touchstartEvent 按下时调用的方法
		 * @param touchendEvent	  松开时调用的方法
		 */
		ins.bindTouchEvent = function(touchstartEvent, touchendEvent) {
			var keyList = [];
			var keys = [];
			$('#keys').bind('touchstart', function(event){
				//context.createGain();
				var touches = event.touches;
				for(var i = 0; i < touches.length; i++) {
					var touch = touches[i];
					var target = $(touch.target);
					if(target.hasClass('light') || target.hasClass('keyname')) {
						target = $(touch.target).parent();
					}
					target.addClass('hover');
					keyList[i] = target;
					
					console.log("key touchstart " + target.attr('id'));

					if(target.attr('id')) {
						var key = parseInt(target.attr('id').split('_')[1]);
						player.queueWaveTable(context, context.destination,
											  _tone_0010_Chaos_sf2_file, 0, key + 20, 1);
						//playAudioFile(audioBuffer[index]);
						keys.push(key);
					}
				}
				touchstartEvent(keys);
								
				event.preventDefault();
			});
			
			$('#keys').bind('touchend', function(event){
				for(var i = 0; i < keyList.length; i++) {
					if($(keyList[i]).attr('id')) {
						ins.lightOff($(keyList[i]).attr('id').split('_')[1]);
						$(keyList[i]).removeClass('hover');
					}
				}
				touchendEvent(keys);
				keys = [];
				keyList = [];
			});
		}
		
		/**
		 * 在某个键上亮灯，不自动熄灭
		 */
		ins.lightUp = function(key, color) {
			view.lightUp(key, color);
		}
		
		/**
		 * 在某个键上亮灯，到达预定时间后自动熄灭
		 */
		ins.lightUpTime = function(key, color, time) {
			view.lightUp(key, color);
			setTimeout(function(){
				view.lightOff(key);
			}, time);
		}
		
		/**
		 * 关闭某个键上的灯
		 */
		ins.lightOff = function(key) {
			view.lightOff(key);
		}
		
		/**
		 * 是否显示琴键对应的音名
		 */
		ins.showKeyName = function(isShow) {
			view.showKeyName(isShow);
		}
		
		/**
		 * 设置可见区域内最左侧键编号
		 */
		ins.setLeftKey = function(key) {
			ins.leftKey = key;
			view.setLeftKey(key);
		}
		
		ins.setLeftWhiteKey = function(whiteKey){
			view.setLeftWhiteKey(whiteKey);
		}
		/**
		 * 根据左侧的键获取最右侧的键编号
		 */
		ins.getRightKey = function() {
			var leftWhiteKeyNo = pianoKeys[ins.leftKey - 1].whiteKeyNo;
			if(!leftWhiteKeyNo) {
				leftWhiteKeyNo = pianoKeys[ins.leftKey].whiteKeyNo;
			}
			var filterarray = $.grep(pianoKeys,function(value){
	            return value.whiteKeyNo == leftWhiteKeyNo + ins.viewWhiteKeyNum - 1;
	        });
			var rightKey = filterarray[0].keyNo;
			if(pianoKeys[rightKey].type == 'black'){
				rightKey++;
			}
			return rightKey;
		}
		
		ins.onMove = function(callback) {
			view.onMove = callback;
		}
		
//		function playAudioFile(toneFile) {
//			var source = context.createBufferSource();
//			source.playbackRate.value = 1.0;
//			source.buffer = toneFile;
//  			source.connect(context.destination);
//  			source.start(0);
//		}
		
		//返回实例
		return ins;
	}	
};