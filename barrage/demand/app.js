'use strict'

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var _ = require('underscore')._;
var config = require('./config.json');

var Video = require('./lib/video.js');
var Msg = require('./lib/msg.js');

var log4js = require('log4js');
var log = log4js.getLogger('demand-barrage');
log.level = config.log;

server.listen(process.argv[2] || 30000, process.argv[3] || '127.0.0.1');

var videos = {};

var table = 'barrage';

function save_data() {
	for (var i in videos) {
		if (videos[i])
			videos[i].save(table);
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
				videos[id].peoples = _.without(videos[id].peoples, socket.id);
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
	var flag = true;
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
			videos[socket.video_id].peoples = _.without(videos[socket.video_id].peoples, socket.id);
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


setInterval(function () {
	global.gc();
	log.debug('garbage collector');
}, 30000);