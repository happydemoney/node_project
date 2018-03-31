'use strict'

const mysql  = require('mysql');
const log4js = require('log4js');

const Msg = require('./msg.js');

const dbConfig = require('../../config/dbConfig.json');
const logConfig = require('../../config/logConfig.json');

const pool = mysql.createPool(dbConfig.mysql);
const log = log4js.getLogger('demand-barrage-video');

log.level = logConfig.log;

class Video { 
	constructor(name, id) { 
		this.name = name;
		this.id = id;
		// 初始化
		this.msg_from_live = {};
		this.msg_from_data = {};
    	this.peoples = [];
    	this.status = 0;
	}
	addMsg(msg, socket) {
		if ((!msg.time && msg.time != 0) || msg.time < 0) {
			log.debug('client message time error ' + 'msg.time ' + msg.time);
			return;
		}
		if (this.status === 1) {
			if (!this.msg_from_live[msg.time]) 
				this.msg_from_live[msg.time] = [];
			this.msg_from_live[msg.time].push( new Msg(msg.time || 1, msg.content || '*', 
						msg.color || 1, msg.font || 1, socket.id || 0));
			log.debug('get a new message');
		}
	}
	sendMsg(socket, send_time, data) {
		var flag = false;
		if (typeof this.msg_from_live === "object"  && this.status === 1) {
			for (var p in this.msg_from_live ) {
				flag = true;
				break;
			}
			if (! flag)
				return;
			if (this.msg_from_live[send_time] && this.msg_from_live[send_time].length > 0) {
				log.debug('send msg ' + JSON.stringify(this.msg_from_live[send_time]));
				Array.prototype.push.apply(data, this.msg_from_live[send_time]);
			}
		}
	}
	get_msg(socket, time, table) {
		let video = this;
		pool.getConnection(function (err, conn) {
			if (err) {
				log.error('get a connection from mysql pool: ' + err);
				return;
			}

			let value = '(',
				timeMax = Number(time) + 4;
			
			for (let t = time; t < timeMax; t ++) {
				value += t;
				value += ',';
			}

			value += timeMax;
			value += ')';
			
			function query() {
				
				let sql = 'select * from ' + table + ' where video_id=' + video.id + ' and time in ' + value;

				conn.query(sql, function(err, rows) {
					if (err) {
						log.error('query data error: ' + err + '\nsql: ' + sql);
						return;
					}
					for (let i in rows) {
						let temp;
						try {
							temp = JSON.parse(rows[i].msg);
						}
						catch (e) {
							log.error('data parse error');
							log.error(rows[i].msg);
							log.error(e);
							temp = null;
							continue;
						}
						if (!video.msg_from_data[temp.time])
							video.msg_from_data[temp.time] = [];
						video.msg_from_data[temp.time].push(temp);
					}
					send(video, socket, table);
				});
				conn.release();
			}
			query();
		});
	}
	save(table) {
		for (let i in this.msg_from_live) {
			if (!this.msg_from_live[i])
				continue;
			insert_msg(this.id, table, this.msg_from_live[i]);
			this.msg_from_live[i] = [];
		}
	}
}

/**
 * 往mysql写入数据
 * @param {*} id 
 * @param {String} table 表名 
 * @param {*} msg 
 */
function insert_msg(id, table, msg) {

    pool.getConnection(function (err, conn) {
        if (err) {
			log.error('query data error');
			return;
		}

		function insert() {
			for (var i = 0; i < msg.length; i ++) {
				var str = JSON.stringify(msg[i]);
				if (str.length > 280)
					continue;
				var sql = 'insert into ' + table + ' values ( null, ' +  id + ',' + msg[i].time + ',' + '\'' + str + '\'' + ')';
				conn.query(sql, function(err, result) {
					if (err) { 
						log.error('insert data error: ' + err);
						log.error('result: ' + result);
						log.error('sql: ' + sql);
					}
					log.debug('save data to mysql database');
				});
			}
			conn.release();
		}
		insert();
	});
}
/**
 * 发送数据
 * @param {*} video 
 * @param {*} socket 
 * @param {*} table 
 */
function send(video, socket, table) {
	var data = [];
	for (var i in video.msg_from_data) {
		if (i  && video.msg_from_data[i].length > 0) {
			Array.prototype.push.apply(data, video.msg_from_data[i]);
			video.msg_from_data[i] = [];
		}
	}
	//socket.emit('server', JSON.stringify(data));

	for (var i = socket.send_time; i < socket.send_time + 5; i++) { 
		video.sendMsg(socket, i, data);
	}

	socket.emit('server', JSON.stringify(data));
	data = [];
};

module.exports = Video;