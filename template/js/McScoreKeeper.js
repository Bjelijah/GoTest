var McScoreKeeper = {
	createNew : function(){
		var ins = {};
		var prv = {};
		prv.totalNum = 0; //音符总数
		prv.totalDur = 0; //总时长
		
		prv.hitNum = 0; //命中数
		prv.hitDur = 0; //命中时长
		
		prv.playingNotes = {};
		prv.downingKeys = {};
		prv.errorNotes = [];
		prv.onHit = null;
		
		ins.setOnHit = function(onHit){
			prv.onHit = onHit;
		}
		
		ins.noteOn = function(note) {
			var t = new Date().getTime();
			var n = prv.playingNotes[note.pitch];
			if(!n){ //不是延音符
				console.log("noteon " + note.pitch);
				var dk = prv.downingKeys[note.pitch];
				if(!dk){ 
					prv.playingNotes[note.pitch] = {note: note, hit : "no", on_t: t};
				} else {
					if(dk.hit == "no" && t-dk.down_t < 500){
						console.log("McScoreKeeper 超前按键："+note.pitch);
						dk.hit == "hiting";
						prv.playingNotes[note.pitch] = {note: note, hit : "hiting", on_t: t, hit_t : t};
						prv.hitNum++;
						prv.totalNum++;
						if(prv.onHit != null){
							prv.onHit(note);
						}
						return true;
					}else{
						prv.playingNotes[note.pitch] = {note: note, hit : "no", on_t: t};
					}
				}
				prv.totalNum++;
			} else if(n.note.ontick < note.ontick && n.note.offtick >= note.offtick){ //当前note是前一个的延续
				if(!n.continues){
					n.continues = [];
				}
				n.continues.push(note);
				console.log("noteon 延音音符：" + note.pitch);
			} else{
				//console.log("warn: "+n.id + "  #####  " + note.id);

				//alert(JSON.stringify(n) + "  #####  " + JSON.stringify(note));
			}
		};
		
		ins.noteOff = function(note) {
			var t = new Date().getTime();
			var pn = prv.playingNotes[note.pitch];
			if(!pn) return;
			
			var note_dur = t - pn.on_t;
			prv.totalDur += note_dur; 
			
			if(pn.hit == "hiting"){
				pn.hit = "end";
				
				var hit_dur = t - pn.hit_t;
				console.log(hit_dur+", hit_dur / note_dur: "+(hit_dur / note_dur));
				if(hit_dur / note_dur > 0.7){
					hit_dur = note_dur;
				}else{
					hit_dur = (hit_dur / note_dur + 0.2) * note_dur;
				}
				console.log(hit_dur+", hit_dur / note_dur revised: "+(hit_dur / note_dur));

				prv.hitDur = prv.hitDur + hit_dur;
/*
				if(t < pn.hit_t){
				   console.log("McScoreKeeper time error")
				} else {
				   prv.hitDur = prv.hitDur + (t - pn.hit_t);
				}
				*/
			}else if(pn.hit == "no"){
				if(note.element)
					note.element.setAttribute('fill','red');
				prv.errorNotes.push(note);
			}
			delete prv.playingNotes[note.pitch];
		};
		
		ins.keyDown = function(key) {
			var t = new Date().getTime();
			var pitch = key + 20;
			
			//记录
			var dk = {};
			dk.pitch = pitch;
			dk.down_t = t;
			dk.hit = "no";
			
			prv.downingKeys[pitch] = dk;
			
			
			//对比
			var pn = prv.playingNotes[pitch];
			if(!pn || pn.hit != "no") return null; //超前
			
			pn.hit = "hiting";
			pn.hit_t = t;
			
			
			dk.hit = "hiting";
			
			prv.hitNum++;
			//ins.setHitEffect(pn);
			if(prv.onHit != null){
				prv.onHit(pn.note);
			}
			return pn.note;			
		};
		
		ins.keyUp = function(key) {
			var t = new Date().getTime();
			var pitch = key + 20;
			
			//删除
			delete prv.downingKeys[pitch];
			
			//统计
			var pn = prv.playingNotes[pitch];
			if(!pn) return; //空击

			var note_dur = t - pn.on_t;

			if(pn.hit == "hiting"){ //命中
				pn.hit = "end";
				
				var hit_dur = t - pn.hit_t;
				console.log(hit_dur+", hit_dur / note_dur: "+(hit_dur / note_dur));
				if(hit_dur / note_dur > 0.7){
					hit_dur = note_dur;
				}else{
					hit_dur = (hit_dur / note_dur + 0.2) * note_dur;
				}
				console.log(hit_dur+", hit_dur / note_dur revised: "+(hit_dur / note_dur));

				prv.hitDur = prv.hitDur + hit_dur;
			}
		};
		
		ins.setHitEffect = function(note) {
			console.log("hitleft: "+ JSON.stringify( $(note.element).offset()) );
			/*
			var hintHTML;
			
			var hitHTML = "<div class='hit key_" + key +"'></div>";
			$('#waterfall .content').append(hitHTML);
			var hitWidth = $('.item.key_' + key).outerWidth(true) + 10;
			var left = parseInt($('.item.key_' + key).css('left')) - 5;
			$('.hit.key_' + key).css({'width' : hitWidth, 'left' : left});
			*/
		}
		
		ins.removeHitEffect = function(key) {
			$('.hit.key_' + key).remove();
		}

		
		ins.score = function(){
			
			var hit_pct = prv.hitNum / prv.totalNum;
			var dur_pct = prv.hitDur / prv.totalDur;
			var res_score = ((hit_pct+dur_pct)/2.0).toFixed(2);
			console.log("共计:"+prv.totalNum+"个音符，总时长:"+prv.totalDur+"ms，命中"+prv.hitNum+"个, 命中时长"+prv.hitDur+"ms"+", 得分:"+hit_pct+", "+dur_pct+"，综合分数: "+res_score);
			return {score:res_score, hit_num: (hit_pct).toFixed(2), hit_dur: (dur_pct).toFixed(2)};	
		}
		
		ins.getErrorNotes = function(){
			return prv.errorNotes;
		}
		
		ins.isWaitUserKey = function(){
			var keys = Object.keys(prv.playingNotes);
			for(var i=0;i< keys.length;i++){
				if(prv.playingNotes[keys[i]].hit == 'no'){
					console.log("wait " + prv.playingNotes[keys[i]].pitch);
					return true;
				}
			}
			console.log("wait no");
			return false;
		}
		
		ins.getPlayingNoteCount = function(){
			console.log(" playing note " + JSON.stringify(prv.playingNotes));
			return Object.keys(prv.playingNotes).length;
		}
				
		ins.clean = function(){
			prv.totalNum = 0; //音符总数
			prv.totalDur = 0; //总时长			
			prv.hitNum = 0; //命中数
			prv.hitDur = 0; //命中时长
			prv.playingNotes = {};
			
			//清理高亮的音符
		    for(var i=0; i<prv.errorNotes.length;i++){
			    var note = prv.errorNotes[i];
			    //prv.errorNotes.splice(i,1);
			    if(note.element != null) {
			    	note.element.setAttribute('fill','black');
			    }
		    }
		    prv.errorNotes = [];
		}
		
		return ins;
	}
};