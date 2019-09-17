/**
	瀑布流视图
	@class McWaterfallView
*/

var McWaterfallView = {

	createNew : function(){
		var ins = {};

		ins.viewWhiteKeyNum = 14;
		ins.leftKey = 1;
		ins.noteStyle = 'block';
		
		var semibreveHeight = 80;
		
		ins.setup = function(viewWhiteKeyNum, leftKey, noteStyle){
			ins.viewWhiteKeyNum = viewWhiteKeyNum;
			ins.leftKey = leftKey;
			ins.noteStyle = noteStyle;
			createWaterfall();
			ins.moveWaterfall(leftKey);
		}
		
		ins.drawNote = function(note) {
			if(note.style == 'block') {
				var noteWidth;
				var noteHeight = note.height;
				
				var noteHTML;
				if($('#key_' + note.key).attr('class').indexOf('white') > 0) {
					noteWidth = $('.item.key_' + note.key).width() * 0.8;
					noteHTML = '<span class="note block key_white key_' + note.key + '" id="note_' + note.id + '">' + '</span>';
				} else {
					noteWidth = $('.item.key_' + note.key).width();
					noteHTML = '<span class="note block key_black key_' + note.key + '" id="note_' + note.id + '">' + '</span>';
				}
				$('.item.key_' + note.key).append(noteHTML);
				
				var noteLeft = ($('.item.key_' + note.key).width() - noteWidth) / 2;
				$('#note_' + note.id).css({'width' : noteWidth, 'height' : noteHeight, 
										   'left' : noteLeft, 'bottom' : note.bottom});
			}
			
			if(note.style == 'ball') {
				var noteWidth;
				
				var noteHTML;
				if($('#key_' + note.key).attr('class').indexOf('white') > 0) {
					noteWidth = $('.item.key_' + note.key).width() * 0.6;
					noteHTML = '<span class="note ball key_white key_' + note.key + '" id="note_' + note.id + '"></span>';
				} else {
					noteWidth = $('.item.key_' + note.key).width() * 0.8;
					noteHTML = '<span class="note ball key_black key_' + note.key + '" id="note_' + note.id + '"></span>';
				}
				$('.item.key_' + note.key).append(noteHTML);
				
				var noteLeft = ($('.item.key_' + note.key).width() - noteWidth) / 2;
				$('#note_' + note.id).css({'width' : noteWidth, 'height' : noteWidth, 
										   'left' : noteLeft, 'bottom' : note.bottom});
			}
		}
		
		ins.setHint = function(key) {
			return;
			var hintWidth = $('.note.key_' + key).width();
			var hintHeight = $('#waterfall').outerHeight(true);
			var hintLeft = $('.note.key_' + key).offset().left + parseInt($('#waterfall .content').css('right'));
			console.log(hintLeft);
			
			if($('.hint.key_' + key).length == 0) {
				var hintHTML = '<span class="hint key_' + key + '"></span>';
				$('.waterfall .content').prepend(hintHTML);
				$('.hint.key_' + key).css({'width' : hintWidth, 'height' : hintHeight, 'left' : hintLeft});
			}
		}
		
		ins.removeHint = function(key) {
			return;
			var removeFlag = true;
			
			var keysEl = $('.note.key_' + key);
			for(var i = 0; i < keysEl.length; i++) {
				var keyEl = keysEl[i];
				
				var top = parseInt($(keyEl).offset().top);
				var keyElHeight = parseInt($(keyEl).height());
				var waterfallHeight = parseInt($('#waterfall').height()) - 2;
				console.log("key " + key + ": " + top + " " + keyElHeight + " " + waterfallHeight);
				if(top > -keyElHeight && top < waterfallHeight) {
					removeFlag = false;
				}
			}
			if(removeFlag) {
				$('.hint.key_' + key).remove();
			}
		}
		
		ins.removeAllHints = function() {
			var hintEls = $('.hint');
			for(var i = 0; i < hintEls.length; i++) {
				var el = hintEls[i];
				$(el).remove();
			}
		}
		
		ins.setWaterfallBottom = function(note) {
			var noteElBottom = parseInt($('#note_' + note.id ).css('bottom'));
			console.log(noteElBottom);
			$('.waterfall_view').css('bottom', -(noteElBottom - $('#waterfall').height()));
		}
		
		ins.setHitEffect = function(key) {
			var hintHTML;
			
			var hitHTML = "<div class='hit key_" + key +"'></div>";
			$('#waterfall .content').append(hitHTML);
			var hitWidth = $('.item.key_' + key).outerWidth(true) + 10;
			var left = parseInt($('.item.key_' + key).css('left')) - 5;
			$('.hit.key_' + key).css({'width' : hitWidth, 'left' : left});
		}
		
		ins.removeHitEffect = function(key) {
			$('.hit.key_' + key).remove();
		}
		
		ins.moveWaterfall = function(key) {
			var left = parseInt($('.item.key_' + key).css('left'));
			if(pianoKeys[key - 1].type == "black") {
				left = parseInt($('.item.key_' + (key + 1)).css('left'));
			}
			$('#waterfall .content').animate({right: left});
		}
		
		function createWaterfall() {
			var itemWidth = $(window).width() / ins.viewWhiteKeyNum;
			console.log("viewWhiteKeyNum "+ins.viewWhiteKeyNum+ " NumitemWidth: "+itemWidth);
			var viewAreaHTML = "<div class='waterfall_view'></div>";
			$('.waterfall .content').append(viewAreaHTML);
			
			var html = "";
			var whiteKeyNum = 0;
			for(var i = 0; i < pianoKeys.length; i++) {
				if(pianoKeys[i].type == "white") {
					html = "<span class='item key_" + (i+1) + "'></span>";
					$('.waterfall_view').append(html);
					var left = (pianoKeys[i].whiteKeyNo - 1) * itemWidth;
					
					$('.item.key_' + (i+1)).css({'width' : itemWidth, 'left': left});
					whiteKeyNum++;
				} else {
					html = "<span class='item key_" + (i+1) + "'></span>";
					$('.waterfall_view').append(html);
					var left = whiteKeyNum * itemWidth - itemWidth / 4;
					$('.item.key_' + (i+1)).css({'width' : itemWidth / 2, 'left': left});
				}
			}
		}
		
		//返回实例
		return ins;
	}	
};