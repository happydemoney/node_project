'use strict'

// node_modules依赖部分
// server
const http = require('http');
const server = http.createServer();

//webSocket
const io = require('socket.io')(server);
// 打印日志信息包
const log4js = require('log4js');
// js原生扩展函数
const array = require('lodash/array');

// custom部分
// 配置信息 - mysql 以及 redis服务地址配置
const logConfig = require('../config/logConfig.json');

const log = log4js.getLogger('demand-barrage');

// 消息处理类
const Video = require('./lib/video.js');

var videos = {};

// 表名称
const table = 'barrage';

log.level = logConfig.log;

server.listen(process.argv[2] || 30000, process.argv[3] || '127.0.0.1');

function save_data() {
	for (var i in videos) {
		if (videos[i]) { 
			videos[i].save(table);
		}
	}
	setTimeout(save_data, 30000);
}

save_data();

io.on('connection', function (socket) {

	socket.on('open_barrage', function (video_name, video_id) {
		if (video_name && video_id) {
			if (!videos[video_id]) {
				var video = new Video(video_name, video_id);
				video.status = 1;

				videos[video_id] = video;
			}
			if (!socket.video_id) {
				socket.video_id = video_id;
				socket.send_time = 0;
				socket.video_name = video_name;
				videos[video_id].peoples.push(socket.id);
			}
			log.debug(socket.handshake.address + ':open video barrage ' + video_name + ' ' + video_id);
		}
		else {
			log.error('video name and id error');
		}
	});

	socket.on('get_id', function () {
		socket.emit('id', socket.id);
	});

	socket.on('get_msg', function (time) {
		socket.send_time = time;
		if (videos[socket.video_id])
			videos[socket.video_id].get_msg(socket, time, table);
		else {
			if (!videos[socket.video_id])
				log.error('this ' + socket.handshake.address + ' do not open barrage');
			log.error('get_msg error');
			log.error(socket.video_id);
		}
	});

	socket.on('close_barrage', function (name, id) {
		if (name && id) {
			if (videos[id] && socket.video_id) {
				videos[id].peoples = array.without(videos[id].peoples, socket.id);
				socket.video_id = null;
				socket.video_name = null;
				if (videos[id].peoples.length == 0) {
					videos[id].save(table);
					log.debug('this video  ' + name + ' noboby online');
					videos[id] = null;
				}
				log.debug('this video ' + name);
			}
			else {
				if (!videos[id])
					log.error('this ' + socket.handshake.address + ' do not open barrage');
				log.error('close barrage error');
			}
		}
	});

	socket.on('message', function (data) {
		if (!data)
			return;
		try {
			var msg = JSON.parse(data);
		}
		catch (e) {
			log.error('parse JSON error');
			log.error(e);
			msg = null;
		}
		if (videos[socket.video_id] && msg) {
			log.debug(socket.handshake.address + ' : ' + data);
			videos[socket.video_id].addMsg(msg, socket);
		}
		else {
			if (!videos[socket.video_id])
				log.error('this ' + socket.handshake.address + ' do not open barrage');

			log.error('receive error');
		}
	});

	socket.on('disconnect', function () {
		if (videos[socket.video_id]) {
			log.debug(socket.handshake.address + ': client disconnect');
			videos[socket.video_id].peoples = array.without(videos[socket.video_id].peoples, socket.id);
			if (videos[socket.video_id].peoples.length == 0) {
				log.debug('this video noboby online');
				videos[socket.video_id].save(table);
				videos[socket.video_id] = null;
			}
			socket.video_id = null;
			socket.video_name = null;
		}
	});

	socket.on('error', function (err) {
		log.error(err);
	});
});

// 每30s执行一次垃圾回收
setInterval(function () {
	global.gc();
	log.debug('garbage collector');
}, 30000);