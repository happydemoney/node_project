'use strict'

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
var _ = require('underscore')._;
var config = require('./config.json');

var Video = require('./lib/video.js');
var Msg = require('./lib/msg.js');

var mysql = require('mysql');
var pool = mysql.createPool(config.mysql);
var get_region = require('./lib/ip.js');

var log4js = require('log4js');
var log = log4js.getLogger('live-barrage');
log.level = config.log;

io.adapter(redis(config.redis));
server.listen(process.argv[2] || 30000, process.argv[3] || '127.0.0.1');

var videos = {};
//1.一个video代表一个room video_id代表的是roomID
//2.socket.video_id 对应的是roomID
//3.socket.id 对应的是某个客户端的唯一标识

function get_length(obj) {
	var k = 0;
	for (var i in obj)
		k++;
	return k;
}

io.on('connection', function (socket) {
	socket.on('open_barrage', function (video_name, video_id) {
		if (video_name && video_id) {
			if (!videos[video_id]) {
				var video = new Video(video_name, video_id);
				video.status = 1;
				videos[video_id] = video;
			}
			if (!socket.video_id) {
				socket.join(video_id);
				socket.video_id = video_id;
				videos[video_id].peoples.push(socket.id);
			}
			log.debug(socket.handshake.address + ': open a video ' + video_name + ' ' + video_id);
			io.to(video_id).emit('online', get_length(io.sockets.sockets));
		}
		else {
			log.error('video name and id is error');
		}
	});
	socket.on('get_id', function () {
		log.debug("get_id:" + socket.id);
		socket.emit('id', socket.id);
	});

	socket.on('close_barrage', function (name, id) {
		if (name && id) {
			if (videos[id] && socket.video_id) {
				socket.leave(id);
				videos[id].peoples = _.without(videos[id].peoples, socket.id);
				socket.video_id = null;
				log.debug(socket.handshake.address + ': close video ' + name + ' ' + id);
			}
			else {
				log.error('this video can not close');
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
			log.error('parse json error');
			log.error(socket.handshake.address + ': data ' + data);
			log.error(e);
			msg = null;
		}
		if (videos[socket.video_id] && msg) {
			log.debug(data);
			videos[socket.video_id].addMsg(msg);
			//		    videos[socket.video_id].msgs.push( new Msg(msg.time || 1, msg.content || '', 
			//						msg.color || 1, msg.font || 1, socket.id || 0, msg.usr_type || 0));
		}
		else {
			log.error('this video can not recv msg');
		}
	});

	socket.on('disconnect', function () {
		if (videos[socket.video_id]) {
			log.debug(socket.handshake.address + '(' + socket.id + '): client disconnect');
			log.debug('socket.video_id = null:' + socket.video_id);
			videos[socket.video_id].peoples = _.without(videos[socket.video_id].peoples, socket.id);
			socket.leave(socket.video_id);
			socket.video_id = null;
		}
		else {
			log.error('disconnect error: this videos(' + socket.video_id + ') cannot exist');
		}
	});
	socket.on('error', function (err) {
		log.error(err);
	});

	socket.on('get_region', function () {
		var ip = socket.handshake.address;
		get_region(pool, socket, ip);
	});

});

function send() {
	for (var id in videos) {
		if (!videos[id])
			continue;

		if (videos[id].peoples.length == 0) {
			log.debug('the room(' + id + ') is no peoples then delete this room');
			videos[id] = null;
			continue;
		}
		videos[id].sendMsg(io);
	}
};

setInterval(send, 500);
setInterval(function () {
	log.debug('garbage collector');
	global.gc();
}, 30000);
