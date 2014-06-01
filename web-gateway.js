var fs = require('fs');
var net = require('net');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var handleError = function (error) {
	console.log('An error occured: ', error);
};

io.on('connection', function (socket) {
	var tcp = net.connect({ port: process.env.TCP_PORT || 1337 });

	tcp.on('data', function (data) {
		socket.emit('data', { data: data.toString() });
	});

	socket.on('data', function (data) {
		tcp.write(data.data + '\n');
	});

	socket.on('disconnect', function () {
		tcp.end();
	});

	tcp.on('end', function () {
		socket.disconnect();
	});

	tcp.on('error', handleError);
	socket.on('error', handleError);
});

server.listen(process.env.WEB_PORT || 3000);
app.get('/', function (req, res) {
	fs.readFile('./index.html', function (err, data) {
		res.send(data.toString())
	});
});