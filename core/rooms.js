var _ = require('lodash');
var rooms = ['nodejs', 'ruby', 'c++', 'php'];

module.exports = {
	listRooms: function (socket, broadcast, args, callback) {
		var output = ['Active rooms are:'];

		rooms.forEach(function (room) {
			// @TODO:  Performance issue here. Store the number of clients within room object, and avoid filtering on each listRoom call
			var numClients = _.filter(clients, function (client) { return client.room === room; }).length;
			output.push('* ' + room + ' ('+ numClients +')');
		});

		output.push('end of list.');
		callback(output);
	},

	joinRoom: function (socket, broadcast, args, callback) {
		var room = args[0];
		var output = [];

		if (rooms.indexOf(room) === -1) {
			return callback('No such room.');
		}

		output.push('entering room: ' + room);
		broadcast(room, '* new user joined chat: ' + socket.name);

		socket.room = room;
		var roomUsers = _.filter(clients, function (client) { return client.room === room; });

		roomUsers.forEach(function (user) {
			if (user.name === socket.name) {
				output.push('* ' + user.name + ' (** this is you)');
			} else {
				output.push('* ' + user.name);
			}
		});

		callback(output);
	},

	leaveRoom: function (socket, broadcast, args, callback) {
		if (!socket.room) {
			return callback('* You are not in any room');
		}

		broadcast(socket.room, '* user has left chat: ' + socket.name);
		socket.room = null;
	}
};