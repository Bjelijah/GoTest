var McClass = {
	type: "McClassJsBridge",
	onInit: null,
	createNew: function(onReady){
		var ins = {};
		var prv = {};
		
		prv.cidx = 0;//调用序号
		
		prv.onUserKeyDown = null;
		prv.onUserKeyUp = null;
		
		prv.sid = null;
		prv.progressListener = null;
		prv.leftWhiteKeyChangeListener = null;
		prv.blueConnectedChangeListener = null;
		
		prv.registerHandler = function(){
			if(enableJsBridge){
				var jsbridge = prv.jsBridge;
				if(jsbridge){
					jsbridge.registerHandler('McClass_userKeyDown', function(data, responseCallback) {
						//alert(data);
						console.log("java call McClass_userKeyDown: ", data);
						data = JSON.parse(data);
						for(var i=0;i<data.length;i++){
							data[i] = data[i]-20;
						}
						prv.onUserKeyDown(data);
					});

					jsbridge.registerHandler('McClass_userKeyUp', function(data, responseCallback) {
						console.log("java call McClass_userKeyUp: " + data)
						data = JSON.parse(data);
						for(var i=0;i<data.length;i++) {
							data[i] = data[i]-20;
						}
						prv.onUserKeyUp(data);
					});

					jsbridge.registerHandler('McClass_onDownloadProgress', function(data, responseCallback) {
						console.log("java call McClass_onDownloadProgress: " + data)
						data = JSON.parse(data);
						var sid = data.sid;
						if(sid === prv.sid && prv.progressListener != null){
							prv.progressListener(data.progress);
						}						
					});
					
					jsbridge.registerHandler('McClass_passiveLogout', function(data, responseCallback) {
						console.log("java call McClass_passiveLogout: " + data)
						alert(data);
						location.href = "./login.html";		
					});
					
					jsbridge.registerHandler('McClass_leftWhiteKeyChange', function(data, responseCallback) {
						console.log("java call McClass_leftWhiteKeyChange: " + data)
						//data = JSON.parse(data);
						if(prv.leftWhiteKeyChangeListener != null){
							prv.leftWhiteKeyChangeListener(data);
						}
					});

					jsbridge.registerHandler('McClass_checkBlueConnected',function(data,responseCallback){
					    console.log("java call McClass_checkBlueConnected: " + data)
              if(prv.blueConnectedChangeListener != null) {
								prv.blueConnectedChangeListener(data);
							}
					});

					console.log("jsbridge registerHandler");
				}
			}
		};
		
		ins.setProgressListener = function(callback) {
			prv.progressListener = callback;
		}
		
		ins.setBlueConnectedChangeListener = function(callback) {
			prv.blueConnectedChangeListener = callback;
		}
		
		/**
			绑定当用户按下琴键时产生的事件回调
		*/
		ins.setOnUserKeyDown = function(onUserKeyDown){
			prv.onUserKeyDown = onUserKeyDown;
		}
		
		/**
			绑定当用户松开琴键时产生的事件回调
		*/
		ins.setOnUserKeyUp = function(onUserKeyUp){
			prv.onUserKeyUp = onUserKeyUp;
		}
		
		/**
			用户按下琴键，参数为数组，可以同时多个key
		*/
		ins.userKeyDown = function(keys){
			if(prv.onUserKeyDown && typeof(prv.onUserKeyDown)=="function"){
				prv.onUserKeyDown(keys);
			}
		}

		/**
			用户松开琴键，参数为数组，可以同时多个key
		*/
		ins.userKeyUp = function(keys){
			if(prv.onUserKeyUp && typeof(prv.onUserKeyUp)=="function"){
				prv.onUserKeyUp(keys);
			}
		}
		
		ins.login = function(username, role, handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_login', {"username":username, "role":role}, handler);
			}else{
				handler();
			}
		};

		ins.logout = function(username, handler){
			clearCookies();
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_logout', username, handler);
			}
		};

		ins.loadEtude = function(etude, handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_loadEtude', etude, handler);
			}else{
				handler("{\"code\":200}");
			}
		};
		
		ins.openCourseware = function(isSync, id, url, handler){
			if(enableJsBridge){
				prv.sid = randomString(16);
				prv.jsBridge.callHandler('McClass_openCourseware', {"sid":prv.sid, "id":id,"url":url, "issync": isSync}, handler);
			}
		}
		
		ins.openAnimation = function(id, url, handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_openAnimation', {"id":id,"url":url}, handler);
			}
		}

		ins.getDeviceId = function(handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_getDeviceId', null, handler);
			}else{
				handler("");
			}
		}
		
		ins.isConnected = function(handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_isConnected', null, handler);
			}else{
				handler("false");
			}
		}
		
		ins.connect = function(handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_connect', null, handler);
			}else{
				handler("true");
			}
		}
		
		ins.disconnect = function(handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_disconnect', null, handler);
			}else{
				handler("false");
			}
		}
		
		ins.playAccompany = function(scoreId, handler){
			if(enableJsBridge) {
				var url = "/scores/" + scoreId + "/accompany.mp3";
				prv.jsBridge.callHandler('McClass_playAccompany', {"url": url}, handler);
			} else {
				handler("true");
			}
		}
		
		ins.stopAccompany = function(handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_stopAccompany', null, handler);
			}else{
				handler("true");
			}
		}
		
		ins.playAudio = function(isAccompany, handler){
			if(enableJsBridge) {
				prv.jsBridge.callHandler('McClass_playAudio', {"isAccompany": isAccompany}, handler);
			} else {
				handler("false");
			}
		}
		
		ins.pauseAudio = function(isAccompany, handler){
			if(enableJsBridge) {
				prv.jsBridge.callHandler('McClass_pauseAudio', {"isAccompany": isAccompany}, handler);
			} else {
				handler("false");
			}
		}
		
		ins.stopAudio = function(isAccompany, handler){
			if(enableJsBridge) {
				prv.jsBridge.callHandler('McClass_stopAudio', {"isAccompany": isAccompany}, handler);
			} else {
				handler("false");
			}
		}
		
		ins.finish = function(isAccompany, handler){
			if(enableJsBridge) {
				prv.jsBridge.callHandler('McClass_audioFinish', handler);
			} else {
				handler("true");
			}
		}

		ins.menuOption = function(option, handler){
			if(enableJsBridge){
				console.log("McClass_menuOption: " + option);
				prv.jsBridge.callHandler('McClass_menuOption', option, handler);
			}else{
				//handler("");
			}
		}
		
		ins.waterfallStart = function(option){
			if(enableJsBridge){
				console.log("McClass_waterfallStart: " + option);
				prv.jsBridge.callHandler('McClass_waterfallStart', "", null);
			}else{
				//handler("");
			}
		}

		ins.waterfallPause = function(option){
			if(enableJsBridge){
				console.log("McClass_waterfallPause: " + option);
				prv.jsBridge.callHandler('McClass_waterfallPause', "", null);
			}else{
				//handler("");
			}
		}

		ins.waterfallStop = function(option){
			if(enableJsBridge){
				console.log("McClass_waterfallStop: " + option);
				prv.jsBridge.callHandler('McClass_waterfallStop', "", null);
			}else{
				//handler("");
			}
		}

		ins.waterfallDisableStaff = function(n){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_waterfallDisableStaff', 
											""+n, null); 
											
			}		
		};

		ins.waterfallSetMode = function(mode){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_waterfallSetMode', 
											""+mode, null); 
											
			}		
		};

		ins.waterfallSetBPM = function(bpm){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_waterfallSetBPM', 
											""+bpm, null); 
											
			}		
		};

		
		ins.waterfall = function(token, clsid, cusid, songid, handler){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_waterfall', {"token": token, "clsid":clsid, "cusid":cusid,"songid": songid}, handler);
			}else{
				//handler("");
			}
		}

		ins.waterfallBack = function(){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_waterfallBack', null, null);
			}else{
				//handler("");
			}
		}
		
		ins.showHit = function(note){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_showHit', {"id":note.id, "pitch":note.pitch, "offtick": note.offtick, "cidx": prv.cidx++}, null);
			}else{
				//handler("");
			}
		}

		ins.hideHit = function(pitch){
			if(enableJsBridge){
				prv.jsBridge.callHandler('McClass_hideHit', {"pitch":pitch, "cidx": prv.cidx++}, null);
			}else{
				//handler("");
			}
		}
		
		ins.getTick = function(handler){
			if(enableJsBridge){
				console.log("McClass_getTick");
				prv.jsBridge.callHandler('McClass_getTick', "", handler);
			}else{
				//handler("");
			}
		}
		
		ins.seek2Tick = function(tick){
			if(enableJsBridge){
				console.log("seek2Tick");
				prv.jsBridge.callHandler('McClass_seek2Tick', ""+tick, null);
			}else{
			}
		}
		
		ins.setLeftWhiteKeyChangeListener = function(handler){
			prv.leftWhiteKeyChangeListener = handler;
		}

		//用户选择曲目
    ins.chooseScore = function(handler){
      if(enableJsBridge){
        prv.jsBridge.callHandler('McClass_chooseScore', null, handler);
      }else{
        handler("true");
      }
    }

		
		if(enableJsBridge){
			if("undefined" != typeof mcScore){
				console.log("mcScore exist");
				prv.jsBridge = mcScore.getJsBridge();
				prv.registerHandler();
				onReady(ins);		
			}else{
				console.log("mcScore not exist");
				McJsBridge.createNew(function(bridge){
					prv.jsBridge = bridge;
					prv.registerHandler();
					onReady(ins);
				});
			}
		}else{
			onReady(ins);
		}

	}
	
};