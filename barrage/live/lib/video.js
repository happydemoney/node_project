var config = require('../../config/config.json');
var log4js = require('log4js');
var log    = log4js.getLogger('live-barrage');
log.level = config.log;

function Video(name, id) {
    this.name = name;
    this.id = id;
    this.msgs = [];
    this.peoples = [];
    this.status = 0;
};

Video.prototype.addMsg = function(msg) {
    if (this.status === 1) {
        this.msgs.push(msg);
    }
};

Video.prototype.sendMsg = function(io) {
    if (this.msgs.length != 0 && this.status === 1) {
		if (this.msgs.length > 0){
			log.debug(this.msgs);
			io.to(this.id).emit('server', JSON.stringify(this.msgs));
		}
        this.msgs = [];
    }
};

module.exports = Video;