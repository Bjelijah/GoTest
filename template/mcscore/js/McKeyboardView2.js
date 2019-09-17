/**
	钢琴视图
	@class McKeyboardView
*/

var McKeyboardView = {

	createNew : function(){
		var ins = {};
		
		ins.onMove = function() {return false;}
		
		var lKeyWidth;
		var lKeyHeight;
		var whiteKeyNum;
		var leftWhiteKey;
		
		/**
		 * 创建钢琴键盘
		 */
		ins.setup = function(viewWhiteKeyNum, leftKey, showMiniature, showControl){
			lKeyWidth = $(window).width() / viewWhiteKeyNum;
			whiteKeyNum = viewWhiteKeyNum;
			leftWhiteKey = getLeftWhiteKey(leftKey);
			
			createController(showMiniature, showControl);
			createKeyboard(leftWhiteKey);
			
			addMask(leftWhiteKey);
			//showKeys(leftWhiteKey, false);
			this.moveNote(0, false);
		}
		
		/**
		 * 移动琴键
		 * @param step 移动的步数
		 */
		ins.moveNote = function(step, animate){
			leftWhiteKey += step;
			if(leftWhiteKey < 1 ) {
				leftWhiteKey = 1;
			}
			if(leftWhiteKey > 53 - whiteKeyNum) {
				leftWhiteKey = 53 - whiteKeyNum;
			}
			console.log("moveNote to " + leftWhiteKey);
			addMask(leftWhiteKey);
			showKeys(leftWhiteKey, animate);
			ins.onMove(getLeftKey(leftWhiteKey));
		}
		
		ins.setLeftKey = function(key) {
			/*
			var newLeftWhiteKey;
			if(pianoKeys[key - 1].type == "black") {
				newLeftWhiteKey = pianoKeys[key].whiteKeyNo;
			} else {
				newLeftWhiteKey = pianoKeys[key - 1].whiteKeyNo;
			}
			var step = newLeftWhiteKey - leftWhiteKey;
			console.log(newLeftWhiteKey + ' ' + leftWhiteKey + ' ' + step);
			this.moveNote(step, true);
			leftWhiteKey = newLeftWhiteKey;
			*/
		}
		
		ins.setLeftWhiteKey = function(whiteKey) {
			var newLeftWhiteKey = whiteKey;
			var step = newLeftWhiteKey - leftWhiteKey;
			console.log("setLeftWhiteKey: "+newLeftWhiteKey + ' ' + leftWhiteKey + ' ' + step);
			this.moveNote(step, false);
		}

		/**
		 * 显示钢琴键盘
		 */
		ins.showKeyboard = function(){
			$('#keyboard').show();
		}
		
		/**
		 * 隐藏钢琴键盘
		 */
		ins.hideKeyboard = function(){
			$('#keyboard').hide();
		}
		
		/**
		 * 在某个键上亮灯
		 */
		ins.lightUp = function(key, color) {
			var keyId = "key_" + key;
			var lightHTML = '<span class="light"></span>';
			var width = $('#' + keyId).width() * 0.7;
			var left = ($('#' + keyId).width() - width) / 2;
			$('#' + keyId).append(lightHTML);
			$('#'+keyId + ' .light').css({'width':width, 'height': width, 'left': left ,'background':color});
		}
		
		/**
		 * 关闭某个键上的灯
		 */
		ins.lightOff = function(key) {
			var keyId = "key_" + key;
			var children = $('#' + keyId).children();
			for(var i = 0; i < children.length; i++) {
				if(children[i].className == 'light') {
					children[i].remove();
				}
			}
		}
		
		/**
		 * 是否显示琴键对应的音名
		 */
		ins.showKeyName = function(isShow) {
			if(isShow) {
				$('.keyname').show();
			} else {
				$('.keyname').hide();
			}
		}
		
		ins.scrollLeft = function(left){
			$('.keys_area').css({'left': left*-1});
			$('.key_hits').css({'left': left*-1});
		}
 		
		function createController(showMiniature, showControl) {
			drawHits();
			
			if(showMiniature || showControl) {
				var headerHTML = '<div class="header" id="keyboard_header"></div>';
				$('#keyboard').append(headerHTML);
				$('#keyboard_header').width($(window).width());
			}
			
			if(showMiniature && (!showControl)) {
				createMiniature();
			} else if(showMiniature && showControl) {
				createControl();
				createMiniature();
				var width = $('#miniature').width() + 4 * $('.icon').outerWidth(true);
				var left = ($('#keyboard_header').width() - width)/2;
				$('.control').css({'width': width, 'left': left});
			}
		}
		
		function createMiniature() {
			var miniatureHTML = '<div class="miniature" id="miniature">' + 
								'<span class="mask left"></span>' +
								'<span class="mask right"></span></span>' + 
								'</div>';
			$('#keyboard_header').append(miniatureHTML);
			var height = $('#keyboard_header').height();
			$('.miniature').css({'height':height});
			$('.mask').css({'height':height});
			
			$('#miniature').bind('touchend', function(event){ 
				var sKeyWidth = $('#miniature').width() / 52;
				var x = event.changedTouches[0].clientX - $(this).offset().left;
				var currentKey = Math.floor(x / sKeyWidth) + 1;
				var step = currentKey - (leftWhiteKey + Math.floor(whiteKeyNum / 2));
				ins.moveNote(step, true);
			});
		}
		
		function createControl() {
			var controlHTML = '<div class="control" id="control">' + 
							  '<span class="icon last_octave" id="last_octave"></span>' +
				   		  	  '<span class="icon last_note" id="last_note"></span>' + 
				   		  	  '<span class="icon next_octave" id="next_octave"></span>' + 
				   		  	  '<span class="icon next_note" id="next_note"></span></div>';
			$('#keyboard_header').append(controlHTML);
			var height = $('#keyboard_header').height();
			$('.icon').css({'width':height, 'height':height});
			
			$('#last_note').bind('touchend', function(){ins.moveNote(-1, true);});
			$('#next_note').bind('touchend', function(){ins.moveNote(1, true);});
			$('#last_octave').bind('touchend', function(){ ins.moveNote(-whiteKeyNum, true)});
			$('#next_octave').bind('touchend', function(){ ins.moveNote(whiteKeyNum, true)});
		}
		
		function createKeyboard() {
			var keysAreaHTML = "<div class='keys_area' id='keys'></div>";
			$('#keyboard').append(keysAreaHTML);
			
			var margin = parseInt($('.keys_area').css('marginTop').replace('px', '')) + 
						 parseInt($('.keys_area').css('marginBottom').replace('px',''));
			var keysAreaHeight;
			if($('#keyboard_header').length > 0) {
				keysAreaHeight = Math.floor($('#keyboard').outerHeight(true) - $('.header').outerHeight(true)) - margin;
			} else {
				keysAreaHeight = Math.floor($('#keyboard').outerHeight(true)) - margin;
			}
			
			lKeyHeight = keysAreaHeight;
			$('.keys_area').height(keysAreaHeight);
			drawKeys(lKeyWidth, lKeyHeight);
			$('.keys_area').width(lKeyWidth * 52);
		}
		
		function drawHits(){
			/*
			var hitWidth = lKeyWidth*1.5;
			var off = (lKeyWidth - hitWidth)/2.0;
			var html = '<div id="key_hits" class="key_hits"></div>';
			$('#keyboard').append(html);
			html = '';
			var whiteKeyNum = 0;
			for(var i = 0; i < pianoKeys.length; i++) {
				if(pianoKeys[i].type == "white") {
					html = '<div id="hit_'+(i+1)+'" class="hit3"> </div>';
					$('#key_hits').append(html);
					var left = (pianoKeys[i].whiteKeyNo - 1) * lKeyWidth + off;
					$('#hit_'+(i+1)).css('left', left);
					whiteKeyNum++;
				} else {
					html = '<div id="hit_'+(i+1)+'" class="hit3"> </div>';
					$('#key_hits').append(html);
					var left = whiteKeyNum * lKeyWidth - lKeyWidth / 4 + off;
					$('#hit_' + (i+1)).css('left', left);
				}
			}
			//$('.hit3').width(hitWidth);
			$('.hit3').height(30);
			$('.key_hits').width(lKeyWidth * 52);
			*/
		}
		
		function drawKeys(keyWidth, keyHeight) {
			$('.keys_area').empty();
			
			var html = '';
			var whiteKeyNum = 0;
			for(var i = 0; i < pianoKeys.length; i++) {
				
				if(pianoKeys[i].type == "white") {
					html = "<span class='keyBox'><span class='key_white' id='key_" + (i+1) + "'></span></span>";
					$('.keys_area').append(html);
					var left = (pianoKeys[i].whiteKeyNo - 1) * keyWidth;
					$('#key_' + (i+1)).parent().css('left', left);
					whiteKeyNum++;
				} else {
					html = "<span class='key_black' id='key_" + (i+1) + "'></span>";
					$('.keys_area').append(html);
					var left = whiteKeyNum * keyWidth - keyWidth / 4;
					$('#key_' + ((i+1))).css('left', left);
				}
				if(pianoKeys[i].name.substr(0,1) == 'C') {
					createKeyName(i, keyHeight);
				}
			}
			$('.keyBox').outerWidth(Math.round(keyWidth));
			$('.keyBox').outerHeight(keyHeight);
			$('.key_black').css({'width': keyWidth * 0.6, 'height': keyHeight * 0.6});
		}
		
		function createKeyName(index, height) {
			var keyname = pianoKeys[index].name;
			if(pianoKeys[index].type == "white") {
				var colorClass;
				var group = parseInt(keyname.substr(1,1));
				switch (group) {
					case 0:
						colorClass = "group_0";
						break;
					case 1:
						colorClass = "group_1";
						break;
					case 2:
						colorClass = "group_2";
						break;
					case 3:
						colorClass = "group_3";
						break;
					case 4:
						colorClass = "group_4";
						break;
					case 5:
						colorClass = "group_5";
						break;
					case 6:
						colorClass = "group_6";
						break;
					case 7:
						colorClass = "group_7";
						break;
					case 8:
						colorClass = "group_0";
						break;
				}
				
				var keyNameHTML = "<span class='keyname " + colorClass +  "'>" + keyname + "</span>";
				$('#key_' + ((index+1))).append(keyNameHTML);
			}
		}
		
		function addMask(leftWhiteKey) {
			var whiteKeys = leftWhiteKey - 1;
			var keyWidth = $('#miniature').width() / 52;
			var maskLeftWidth = whiteKeys * keyWidth;
			var maskRightWidth = (52 - whiteKeys - whiteKeyNum) * keyWidth;
	
			$('.mask.left').width(maskLeftWidth);
			$('.mask.right').width(maskRightWidth);
		}
		
		function showKeys(leftWhiteKey, animate){
			var whiteKeys = leftWhiteKey - 1;
			var r = parseInt($('.keys_area').css('right'));
			if( r == whiteKeys * lKeyWidth){
				console.log("showKeys 不用移动");
				return;
			}
			console.log("showKeys 从 "+r+" 移动到:"+ whiteKeys * lKeyWidth);
			//$('.keys_area').css({'right': whiteKeys * lKeyWidth});
			
			if(animate) {
				setTimeout(function(){
					$('.keys_area').animate({right: whiteKeys * lKeyWidth});
					$('.key_hits').animate({left: whiteKeys * lKeyWidth*-1});

				});
			} else {
				$('.keys_area').css({'right': whiteKeys * lKeyWidth});
				$('.key_hits').css({'right': whiteKeys * lKeyWidth*-1});
			}
		}
		
		function getLeftWhiteKey(key) {
			var whiteKeyNo = pianoKeys[key - 1].whiteKeyNo;
			if(!whiteKeyNo) {
				whiteKeyNo = pianoKeys[key].whiteKeyNo;
			}
			return whiteKeyNo;
		}
		
		function getLeftKey(leftWhiteKey) {
			for(var i = 0; i < pianoKeys.length; i++) {
				var item = pianoKeys[i];
				if(item.whiteKeyNo == leftWhiteKey) {
					return item.keyNo;
				}
			}
		}
		
		//返回实例
		return ins;
	}	
};