/**
	瀑布流
	@class McWaterfall
*/

var McWaterfall = {

	createNew : function(){
		var ins = {};
		
		ins.viewWhiteKeyNum = 0;	//可见区域内显示多少个白键，如果传0，则显示全部的键
		ins.leftKey = 1;				//可见区域内最左侧键编号
		ins.dropSpeed = 0;			//音符下落的速度
		ins.initSpeed = 0;
		ins.noteStyle = "block";		//下落音符的样式：矩形(block)、球形(ball)
		ins.distance = 0;			//瀑布流音符下落的距离
		ins.status = "INIT";
		
		var waterfallView = McWaterfallView.createNew();
		var animatedNotes = [];
		
		var hitNotes = 0;
		var startHitTime = 0;
		var endHitTime = 0;
		var hitTime = 0;
		var hitNoteEl = null;
		
		var isFirstHit = true;
		
		var allNotes = [];
		var allNotesEl = [];
		
		/**
		 * 初始化
		 */
		ins.setup = function(viewWhiteKeyNum, leftKey, dropSpeed, distance, noteStyle){
			this.viewWhiteKeyNum = viewWhiteKeyNum;
			this.leftKey = leftKey;
			this.dropSpeed = dropSpeed;
			this.initSpeed = dropSpeed;
			this.distance = distance;
			this.noteStyle = noteStyle;
			
			if(viewWhiteKeyNum == 0) {
				this.viewWhiteKeyNum = 52;
				this.leftKey = 1;
			}
			
			waterfallView.setup(ins.viewWhiteKeyNum, this.leftKey, noteStyle);
		}
		
		/**
		 * 绘制音符
		 * @param notes
		 */
		ins.drawNotes = function(notes) {
			allNotes = [];
			for(var staff = 0; staff < notes.length; staff++) {
				for(var i = 0; i < notes[staff].length; i++) {
					var note = notes[staff][i];
					
					var height = (note.offtime - note.ontime) * 1000 * this.initSpeed;
					var bottom = $('#waterfall').height() + note.ontime * 1000 * this.initSpeed;
					
					var dropNote = setNote(note, height, bottom);
					allNotes.push(dropNote);
				}
			}
			allNotes.sort(compareIncrease("ontime"));
			
			for(var i = 1; i < allNotes.length; i++) {
				if(allNotes[i].ontime > allNotes[i-1].ontime) {
					if(allNotes[i].key == allNotes[i-1].key) {
						allNotes[i-1].height -= 10;
					}
				}
			}
			
			for(var i = 0; i < allNotes.length; i++) {
				waterfallView.drawNote(allNotes[i]);
			}
			
			return allNotes.length;
		}
		
		/**
		 * 移除瀑布流上的所有音符
		 */
		ins.removeAllNotes = function() {
			$('.note').remove();
		}
		
		/**
		 * 设置整体高度
		 * @param distance
		 */
		ins.setDistance = function(distance) {
			this.distance = distance;
		}
		
		/**
		 * 设置下落速度
		 * @param speed
		 */
		ins.setDropSpeed = function(speed) {
			this.dropSpeed = speed;
		}
		
		/**
		 * 瀑布流下落
		 */
		ins.drop = function() {
			console.log('drop');
			console.trace();
			if(this.status == 'INIT' || this.status == 'STOP') {
				console.log("animate: bottom "+ (-this.distance) + ", speed "+(this.distance / this.dropSpeed));
				/*
				$('.waterfall_view').animate(
				{ bottom: -this.distance }, 
				this.distance / this.dropSpeed, 
				'linear', 
				function(){
					console.log('animate finish');
					ins.stop();
				});
				*/
				
				$('.waterfall_view').animate(
					{ bottom: -this.distance }, 
					10*1000,
					'linear'
					);
			} else if(this.status == 'PAUSE') {
				
				var rest = this.distance + parseInt($('.waterfall_view').css('bottom'));
				console.log(rest);
				$('.waterfall_view').animate({bottom: -this.distance}, rest / this.dropSpeed, 'linear', function(){
					console.log('animate finish');
					ins.stop();
				});
				
			}
			
			this.status = "PLAY";
		}
		
		/**
		 * 瀑布流暂停
		 */
		ins.pause = function() {
			$('.waterfall_view').stop();
			$('.waterfall_view').clearQueue();
			this.status = "PAUSE";
		}
		
		/**
		 * 瀑布流停止
		 */
		ins.stop = function() {
			$('.waterfall_view').stop();
			$('.waterfall_view').clearQueue();
			$('.waterfall_view').css('bottom', 0);
			this.removeAllHints();
			this.status = "STOP";
		}
		
		/**
		 * 是否正在动画
		 */
		ins.isAnimated = function() {
			return $('.waterfall_view').is(":animated");
		}
		
		/**
		 * 在指定的键值上显示提示条
		 * @param key
		 */
		ins.showHint = function(key) {
			waterfallView.setHint(key);
		}
		
		/**
		 * 移除指定键值上的提示条
		 * @param key
		 */
		ins.removeHint = function(key) {
			waterfallView.removeHint(key);
		}
		
		/**
		 * 移除所有提示条
		 */
		ins.removeAllHints = function() {
			waterfallView.removeAllHints();
		}
		
		/**
		 * 判断是否击中
		 * @param key
		 */
		ins.isHit = function(key) {
			var noteEls = $('.note.key_' + key);
			for(var i = 0; i < noteEls.length; i++) {
				var noteEl = $(noteEls[i]);
				var noteTop = noteEl.offset().top;
				var rangeTop = $('#waterfall').height() - noteEl.height() - 10;
				var rangeBottom = $('#waterfall').height();
				
				console.log('noteTop: ' + noteTop + ' rangeTop: ' + rangeTop + ' rangeBottom: ' + rangeBottom);
				if( noteTop > rangeTop && noteTop < rangeBottom) {
					return noteEl;
				}
			}
			return null;
		}
		
		/**
		 * 在指定键值上设置击中时的效果
		 * @param key
		 */
		ins.setHitEffect = function(key) {
			waterfallView.setHitEffect(key);
		}
		
		/**
		 * 移除指定键值上的击中效果
		 * @param key
		 */
		ins.removeHitEffect = function(key) {
			waterfallView.removeHitEffect(key);
		}
		
		/**
		 * 设置瀑布流的底部位置
		 * @param note
		 */
		ins.setWaterfallBottom = function(note) {
			waterfallView.setWaterfallBottom(note);
		}
		
		/**
		 * 设置可见区域内最左侧键编号
		 */
		ins.setLeftKey = function(key) {
			this.leftKey = key;
			waterfallView.moveWaterfall(key);
		}
		
		/**
		 * 获取可视区域内距离瀑布流底部最近的音符的键值
		 */
		ins.getClosedKeys = function() {
			var notesInView = [];
			for(var i = 0; i < allNotesEl.length; i++) {
				var noteEl = $(allNotesEl[i]);
				var elTop = noteEl.offset().top;
				var maxTop = $('#waterfall').height() - noteEl.height() + 10;
				
				if(elTop > 0 && elTop < maxTop) {
					var note = new Object();
					var noteId = noteEl.attr('id');
					note.id = parseInt($(hitNoteEl).attr('id').split('_')[1]);
					note.bottom = elTop + noteEl.height();
					notesInView.push(note);
				}
			}
			
			notesInView.sort(compareDecrease("bottom"));
			console.log(notesInView);
			var closedNotes = [];
			var first = notesInView[0];
			for(var i = 0; i < notesInView.length; i++) {
				if(first.bottom == notesInView[i].bottom) {
					var noteId = notesInView[i].id;
					for(var j = 0; j < allNotes.length; j++) {
						var note = allNotes[j];
						if(noteId == note.id) {
							closedNotes.push(note);
							break;
						}
					}
				} else {
					break;
				}
			}
			console.log(closedNotes);
			return closedNotes;
		}
		
		/**
		 * 获取命中的音符数
		 */
		ins.getHitNotes = function() {
			return hitNotes;
		}
		
		/**
		 * 获取命中的时长
		 */
		ins.getHitTime = function() {
			return hitTime / 1000;
		}
		
		function setNote(note, height, bottom) {
			var dropNote = new Object();
			dropNote.id = note.id;
			dropNote.key = note.pitch - 20;
			dropNote.pitch = note.pitch;
			dropNote.staff = note.staff;
			dropNote.ontime = note.ontime;
			dropNote.dropSpeed = ins.dropSpeed;
			dropNote.height = height;
			dropNote.bottom = bottom;
			//dropNote.style = ins.noteStyle;
			dropNote.style = "block";
			dropNote.status = "INIT";
			
			return dropNote;
		}
		
		function compareIncrease(propertyName) { 
		    return function (object1, object2) { 
		        var value1 = object1[propertyName]; 
		        var value2 = object2[propertyName]; 
		        if (value1 < value2) { 
		            return -1; 
		        }else if (value1 > value2) { 
		            return 1; 
		        }else { 
		            return 0; 
		        } 
		    };  
		}
		
		function compareDecrease(propertyName) { 
		    return function (object1, object2) { 
		        var value1 = object1[propertyName]; 
		        var value2 = object2[propertyName]; 
		        if (value1 < value2) { 
		            return 1; 
		        }else if (value1 > value2) { 
		            return -1; 
		        }else { 
		            return 0; 
		        } 
		    };  
		} 
		
//		function setHitEffect(key) {
//			if($('.note.key_' + key).length > 0) {
//				var bottom = parseInt($('.note.key_' + key).css('bottom').replace('px', ''));
//				if(bottom <= 10) {
//					hitNoteEl = $('.note.key_' + key);
//					waterfallView.setHitEffect(ins.noteStyle, key);
//					
//					var keyId = $('.note.key_' + key).attr('id');
//					if(!$('#' + keyId).attr('isHit')) {
//						hitNotes++;
//						$('#' + keyId).attr('isHit', 'hit');
//					}
//					
//					startHitTime = new Date().getTime();
//				}
//			}
//		}
		
//		function removeHitEffect(key) {
//			if(hitNoteEl) {
//				waterfallView.removeHitEffect(key);
//				endHitTime = new Date().getTime();
//				
//				var bottom = parseInt($(hitNoteEl).css('bottom').replace('px', ''));
//				if(bottom <= 0 && bottom >= -$(hitNoteEl).height()) {
//					hitTime += endHitTime - startHitTime;
//				} else {
//					hitTime += $(hitNoteEl).height() / ins.dropSpeed;
//				}
//				hitNoteEl = null;
//			}
//		}
		
		//返回实例
		return ins;
	}	
};