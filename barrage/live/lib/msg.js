
class Msg{ 
	constructor(time, content, color, font, usr_id, usr_type){
		this.time = time;
		this.content = content;
		this.color = color;
		this.font = font;
		this.usr_id = usr_id;
		this.usr_type = usr_type;
	}
}

module.exports = Msg;
