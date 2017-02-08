var io = require('socket.io-client');
var exec = require('child_process').exec;
var dest_port = 443;

var socket = io.connect('http://127.0.0.1/', {port: dest_port, secure: true});

socket.on('connect', function (data) {
	console.log(data);
});

var command = "sudo arp-scan -I eth0 172.17.0.0/24";
exec(command, function(error_exec, stdout, stderr) {
	if (error_exec) {
		console.log("Error: ", error_exec);
	}
	else
	{
		console.log(stdout);
	}
});