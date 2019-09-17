var enableJsBridge = true;

$(function(){
	$('html').css("font-size", $(document).width() / 38.4);
});


//创建cookie
function setCookie(c_name,value){
   sessionStorage.setItem(c_name, value);
}
//获取cookie
function getCookie(c_name){
   return sessionStorage.getItem(c_name);
}

//清空cookie
function clearCookies(){
	sessionStorage.clear();
}


//生成随机字符串
function randomString(len) {
　　len = len || 32;
　　var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
　　var maxPos = $chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
}

function GetQueryString(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if(r != null) return unescape(r[2]);
	return null;
}