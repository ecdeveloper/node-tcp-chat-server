var _ = require('lodash');

var _formatSysMessage = function (msg, username) {
	msg = '* ' + msg;
	if ( msg.indexOf(' ' + username + ' ') > -1 ) {
		msg = msg + ' (** this is you)';
	}

	return msg;
};

var socketWrite = function (socket, message, type) {
	if (typeof message === 'object' && message.length) {
		message.forEach(function (msg) {
			if (type === 'system') {
				message = _formatSysMessage(message, socket.name);
			}

			socket.write('\r<= ' + msg + '\n');
		});
	} else {
		if (type === 'system') {
			message = _formatSysMessage(message, socket.name);
		}

		socket.write('\r<= ' + message + '\n');
	}

	socket.write('=> ');
};

var dropClient = function (socket, broadcast, args, callback) {
	var inx = _.findIndex(clients, function (client) { return client.id === socket.id; });
	if (inx > -1) {
		if (socket && socket.room) {
			rooms.leaveRoom(socket, broadcast, args, callback);
		}

		clients.splice(inx, 1);
		socketWrite(socket, 'BYE');
		socket.end();
	}
};

var sendPM = function (socket, broadcast, args, callback) {
	var user = args[0];
	var msg = args.splice(1, args.length).join(' ');

	var client = _.find(clients, function (client) { return client.name === user; });
	if (!client) {
		return socketWrite(socket, 'No such user', 'system');
	}

	if (client.name === socket.name) {
		return socketWrite(socket, 'Sending PM to yourself? Really? :D', 'system');
	}

	socketWrite(client, '[PM] ' + socket.name + ': ' + msg);
	socketWrite(socket, '[PM] ' + socket.name + ' to '+ user +': ' + msg);
};

var printHelp = function (socket, broadcast, args, callback) {
	Object.keys(cmds).forEach(function (key) {
		socketWrite(socket, key + ' - ' + cmds[key].description, 'system');
	});
}

module.exports = {
	dropClient: dropClient,
	sendPM: sendPM,
	printHelp: printHelp,
	socketWrite: socketWrite
}