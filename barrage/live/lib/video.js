const logConfig = require('../../config/logConfig.json');
const log4js = require('log4js');
const log = log4js.getLogger('live-barrage');

log.level = logConfig.log;

class Video{ 
    constructor(name, id){ 
        this.name = name;
        this.id = id;
        // 初始化
        this.msgs = [];
        this.peoples = [];
        this.status = 0;
    }
    addMsg (msg) {
        if (this.status === 1) {
            this.msgs.push(msg);
        }
    }
    sendMsg (io) {
        if (this.msgs.length != 0 && this.status === 1) {
            if (this.msgs.length > 0){
                log.debug(this.msgs);
                io.to(this.id).emit('server', JSON.stringify(this.msgs));
            }
            this.msgs = [];
        }
    }
}

module.exports = Video;