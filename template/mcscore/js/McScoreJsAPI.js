var McScoreJsAPI = {
	type: "McScoreJsAPI",
	onInit: null,
	createNew: function(mcScore){
		var ins = {};
		var prv = {};
		prv.mcScore = mcScore;
		prv.jsBridge = mcScore.getJsBridge();
		
		ins.registerHandler = function(){
			//js响应native端的调用			
			//data为native端传过来的实参，通过responseCallback把返回值传给java端
			prv.jsBridge.registerHandler('McScoreJsAPI_play', function(data, responseCallback ) {
				prv.mcScore.play();
				responseCallback("ok,java");
			});

			prv.jsBridge.registerHandler('McScoreJsAPI_pause', function(data, responseCallback) {
				prv.mcScore.pause();
				responseCallback("ok,java");
			});

			prv.jsBridge.registerHandler('McScoreJsAPI_stop', function(data, responseCallback) {
				prv.mcScore.stop();
				responseCallback("ok,java");
			});

			prv.jsBridge.registerHandler('McScoreJsAPI_setA', function(data, responseCallback) {
				var noteInfo = JSON.parse(data);
				var idx = noteInfo.idx;
				var noteA = prv.mcScore.getNote(idx);
				prv.mcScore.setA(noteA);
				if(responseCallback) responseCallback("ok,java");	
			});

			prv.jsBridge.registerHandler('McScoreJsAPI_setB', function(data, responseCallback) {
				var noteInfo = JSON.parse(data);
				var idx = noteInfo.idx;
				var noteB = prv.mcScore.getNote(idx);
				prv.mcScore.setB(noteB);
			});

			prv.jsBridge.registerHandler('McScoreJsAPI_setB', function(data, responseCallback) {
				var noteInfo = JSON.parse(data);
				var idx = noteInfo.idx;
				var noteB = prv.mcScore.getNote(idx);
				prv.mcScore.setB(noteB);

			});

			prv.jsBridge.registerHandler('McScoreJsAPI_loop', function(data, responseCallback) {
				prv.mcScore.loop();
			});

			prv.jsBridge.registerHandler('McScoreJsAPI_cancelLoop', function(data, responseCallback) {
				prv.mcScore.cancelLoop();
			});
		};
		
		ins.onScoreReady = function(){
			//js调native
			prv.jsBridge.callHandler('McScoreJsAPI_onScoreReady', 'hi java score ready', function (responseData){});
		};

		ins.onNoteOn = function(note){
			//js调native
			prv.jsBridge.callHandler('McScoreJsAPI_onNoteOn', {'id':note.id, 'idx':note.idx}, function (responseData){});
		};

		return ins;
	}
};