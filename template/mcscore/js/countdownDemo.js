$(function(){
	var countdown = McCountDown.createNew();
	
	var c = 3;
	var desc = true;
	var dur = 1000;
	
	countdown.setup(c, desc, dur);
	countdown.start(onCount, onFinish);
	
	function onCount(count) {
		var bgPath = 'url(icons/num_' + count + '.png)';
		$('.count').css('background-image', bgPath);
		var animationCSS = 'scaleout ' + (dur/1000) + 's ' + c + ' ease-in-out forwards';
		
		$('.count').css({'animation' : animationCSS, '-webkit-animation' : animationCSS});
	}
	
	function onFinish() {
		$('#count').remove();
	}
})
