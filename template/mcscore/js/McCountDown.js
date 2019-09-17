/**
	计时
	@class McCountDown
*/

var McCountDown = {

	createNew : function(){
		var ins = {};
		
		ins.count = 0;		//倒数次数
		ins.desc = true;		//true为倒序数，false为正序数
		ins.dur = 0;			//间隔，单位是毫秒
		
		var ascCount = 1;
		
		/**
		 * 初始化
		 * @param count 倒数次数
		 * @param desc true为倒序数，false为正序数
		 * @param dur 间隔，单位是毫秒
		 */
		ins.setup = function(count, desc, dur) {
			this.count = count;
			this.desc = desc;
			this.dur = dur;
		}
		
		/**
		 * 启动
		 * @param onCount 每次跳动时的回调
		 * @param onFinish 计数完成后的回调
		 */
		ins.start = function(onCount, onFinish){
			var self = this;
			
			if(self.desc) {
				if(self.count >= 1) {
					onCount(self.count);
				}
				
				self.count--;
				
				if(self.count < 0){
					onFinish();
					return;
				}
				
				setTimeout(function(){
					self.start(onCount, onFinish);
				}, self.dur);
			} else {
				if(self.count >= 1) {
					onCount(ascCount);
				}
				
				self.count--;
				ascCount++;
				
				if(self.count < 0){
					onFinish();
					return;
				}
				
				setTimeout(function(){
					self.start(onCount, onFinish);
				}, self.dur);
			}
		}
		
		//返回实例
		return ins;
	}	
};