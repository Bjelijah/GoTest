/**
	计时器
	@class McTimer
*/

var McTimer = {
createNew : function(){
		var ins = {};
		ins.startTimestamp = 0;
		ins.currentTime = 0;
		ins.status = null;
		
		ins.start = function(){
			ins.startTimestamp = Date.now();
			ins.status = "RUNNING";
		}
		
		ins.pause = function(){
			ins.currentTime = ins.getTime();
			ins.startTimestamp = 0;
			ins.status = "PAUSE";
		}
		
		ins.stop = function(){
			ins.currentTime = 0;
			ins.startTimestamp = 0;
			ins.status = "STOP";
		}
		
		ins.restart = function(){
			ins.stop();
			ins.start();
		}
		
		ins.getTime = function(){
			if(ins.status == "RUNNING"){
				return ins.currentTime + (Date.now() - ins.startTimestamp);
			}else{
				return ins.currentTime;
			}
		}
		
		return ins;
	}

};