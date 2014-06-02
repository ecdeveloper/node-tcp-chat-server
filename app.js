var _ = require('lodash');
var net = require('net');
var shortId = require('shortid');

require('./web-gateway');

global.rooms = require('./rooms');
var helper = require('./helpers');

global.cmds = {
	'/help': {handler: helper.printHelp, description: 'Prints help'},
	'/rooms': {handler: rooms.listRooms, description: 'Lists the rooms'},
	'/join': {handler: rooms.joinRoom, description: 'Join a specific room (/join %room%)'},
	'/leave': {handler: rooms.leaveRoom, description: 'Leave the room you are in'},
	'/pm': {handler: helper.sendPM, description: 'Send a PM to smdb (/pm %user% %msg%)'},
	'/quit': {handler: helper.dropClient, description: 'Quit'},
};
global.clients = [];

net.createServer(function (socket) {
	console.log(new Date(), '> Incoming connection (', socket.address() ,'). Total clients: ', clients.length + 1);

	var self = this;
	socket.id = shortId.generate();
	clients.push(socket);

	var broadcast = function (room, message) {
		var sockets = _.filter(clients, function (client) { return client.room === room; });
		sockets.forEach(function (sock) {
			helper.socketWrite(sock, message);
		});
	};

	var socketWrite = function (message, type) {
		helper.socketWrite(socket, message, type);
	};

	var processMessage = function (data) {
		if (data && data[0] === '/') {
			var args = data.split(' ');
			var cmd = args[0];
			args = args.splice(1, args.length);

			if (typeof socket.name === 'undefined') {
				return socketWrite('Bad login name');
				return socketWrite('Login name?');
			}

			if (typeof cmds[cmd] === 'undefined') {
				return socketWrite('Bad command');
			}

			cmds[cmd].handler(socket, broadcast, args, function (output) {
				socketWrite(output);
			});
		} else if (typeof socket.name === 'undefined') {
			return setUsername(data);
		} else {
			// Regular message
			broadcast(socket.room, socket.name + ': ' + data);
		}
	};

	var setUsername = function (name) {
		if (_.find(clients, function (client) { return client.name === name; })) {
			socketWrite(['Sorry, name taken', 'Login name?']);
			return;
		}

		socket.name = name;
		socketWrite(['Welcome ' + name + '!', 'To see available commands type /help']);
	};

	socketWrite(['Welcome to the XYZ chat server', 'Login name?']);

	socket.on('data', function (data) {
		processMessage(data.toString().replace(/(\r\n|\n|\r)/gm, ''));
	});

	socket.on('error', function (error) {
		console.log('An error occured:', error);
	});

	socket.on('end', function () {
		helper.dropClient(socket, broadcast);
	});

}).listen(process.env.TCP_PORT || 1337);

console.log('Listening on port '+ (process.env.TCP_PORT || 1337) +'...');