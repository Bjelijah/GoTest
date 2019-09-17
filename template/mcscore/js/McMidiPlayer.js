/**
	McMidiPlayer midi播放器
	API:
	createNew()
	
*/
var McMidiPlayer = {
	type: "McMidiPlayer",
	onInit: null,
	createNew: function(jsBridge){
		var ins = {};
		var prv = {};
		prv.isReady = false;
		
		prv.playid = 0;  //播放次序号，每stop一次会增加一
		
		ins.jsBridge = null;
		ins.type = function(){
			return McMidiPlayer.type;	
		};
		
		ins.setBridge = function(bridge){
			ins.jsBridge = bridge;	
		};
		
		ins.open = function(scoreId, onLoaded){
			prv.isReady = false;
			ins.jsBridge.callHandler('McMidiPlayer_open', {'sid':''+scoreId}, function (responseData) {
			        console.log("open response:" + responseData);
			        if(onLoaded){
				        prv.isReady = true;
				        ins._getBPM(function(bpm){
					        onLoaded();
				        })
			        }
			       
			});
		};

		ins.isReady = function(){
			return prv.isReady;
		};
		
		ins.start = function(){
			ins.jsBridge.callHandler('McMidiPlayer_start', {'key':'value'}, function (responseData) {
			        console.log("start response:" + responseData);
			        ins.getBPM();
			});
		};

		ins.pause = function(){
			ins.jsBridge.callHandler('McMidiPlayer_pause', {'key':'value'}, function (responseData) {
			        console.log("stop response:" + responseData);
			});
		};

		ins.stop = function(){
			prv.playid++;
			ins.jsBridge.callHandler('McMidiPlayer_stop', {'key':'value'}, function (responseData) {
			        console.log("stop response:" + responseData);
			});
		};

		ins.getBPM = function(){
			ins._getBPM();
			return ins.bpm;
		};

		ins._getBPM = function(cb){
			console.log("call getBPM");
			ins.jsBridge.callHandler('McMidiPlayer_getBPM', {'key':'value'}, function (responseData) {
					//alert(JSON.stringify(responseData));
			        console.log("getBPM response:" + responseData);
			        ins.bpm = parseInt(responseData);
			        if(cb != null){
				        cb(ins.bpm);
			        }
			});
		};

		ins.setBPM = function(bpm){
			console.log("call setBPM");
			ins.bpm = bpm;
			ins.jsBridge.callHandler('McMidiPlayer_setBPM', {'bpm':bpm}, function (responseData) {
			        console.log("setBPM response:" + responseData)
			});
		};

		ins.getCurrentTicks = function(callback){
			//console.log("call getCurrentTicks");
			ins.jsBridge.callHandler('McMidiPlayer_getCurrentTicks', {'playid':prv.playid}, function (responseData) {
			        //console.log("getCurrentTicks response:" + responseData)
			        //var ticks = parseInt(responseData);
			        var res = JSON.parse(responseData);
			        var tick = res.tick;
			        var playid = res.playid;
			        if(playid == prv.playid){
			        	callback(tick);
			        }
			});
		};

		ins.seek = function(ticks){
			ins.jsBridge.callHandler('McMidiPlayer_seek', {'ticks':ticks}, function (responseData) {
			        console.log("seek response:", responseData)
			});
		};

		ins.onNoteOn = function(note){
			var dur = note.offtime - note.ontime;
			ins.jsBridge.callHandler('McMidiPlayer_onNoteOn', {'id':note.id, "pitch":note.pitch, "duration": dur}, function (responseData) {
			        console.log("onNoteOn response:", responseData)
			});
		};

		
		ins.getCurrentTime = function(callback){
			//不支持此方法
		};

		
		return ins;	
	}
	

}


