/**
	js bridge
	API:
	createNew()
	@class McJsBridge
	
*/
var McJsBridge = {
	type: "McJsBridge",
	onInit: null,
	createNew: function(onReady){
		
		McJsBridge.setupWebViewJavascriptBridge(function(bridge) {			
			//
			try{ //此处try catch注意  android 有init初始化方法，必须调用 不调用后续注册的事件将无效 而IOS却没有init方法 调用会报错 所以得捕获异常
                bridge.init(function(message, responseCallback) {
                    console.log('JS got a message', message);
                    var data = {
                        'Javascript Responds': '测试中文!'
                    };
                    console.log('JS responding with', data);
                    responseCallback(data);
                });
            }catch(e){

            }
			onReady(bridge);
    	});
	},
	
	setupWebViewJavascriptBridge:function(callback){
	    var u = navigator.userAgent;
        var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
        //var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
        if(isAndroid){
            McJsBridge.setupWebViewJavascriptBridge4Android(callback);
        }else{
            McJsBridge.setupWebViewJavascriptBridge4IOS(callback);
        }

	},

	setupWebViewJavascriptBridge4Android: function(callback) {

	    if (window.WebViewJavascriptBridge) {
            return callback(window.WebViewJavascriptBridge);
        } else {
            document.addEventListener(
                'WebViewJavascriptBridgeReady', 
                function() {
                    return callback(window.WebViewJavascriptBridge);
                },
                false
            );
        }
    },

	setupWebViewJavascriptBridge4IOS: function(callback) {
	    if (window.WebViewJavascriptBridge) { 
		    return callback(WebViewJavascriptBridge); 
		}
	    if (window.WVJBCallbacks) 
	    { 
		    return window.WVJBCallbacks.push(callback); 
		}
	    window.WVJBCallbacks = [callback];
	    var WVJBIframe = document.createElement('iframe');
	    WVJBIframe.style.display = 'none';
	    WVJBIframe.src = 'https://__bridge_loaded__';
	    document.documentElement.appendChild(WVJBIframe);
	    setTimeout(function() { 
		    document.documentElement.removeChild(WVJBIframe) 
		    }, 
		0);
	}
}


