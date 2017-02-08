var io = require('socket.io-client');
var exec = require('child_process').exec;
var network = require('network');
var dest_port = 443;

setTimeout(function(){ 
	start_app();
}, 3000);

var socket = io.connect('http://127.0.0.1/', {port: dest_port, secure: true});

socket.on('connect', function (data) {
	console.log(data);
});

function start_app()
{
	network.get_interfaces_list(function(err, obj) {
		if(err)
		{
			console.log("Error: ", err);
			console.log("obj: ", obj);
			process.exit(1);
		}
		else
		{
			console.log(obj);
			make_cmd_arp(obj)
		}
	});
}

function convert_digit(mask)
{
	var res = 0;
	var b2_mask = mask.toString(2);
	for (key in b2_mask)
	{
		if (b2_mask[key] == 1)
			res++;
	}
	console.log(b2_mask);
	return (res);
}

function convert_netmask(full_mask)
{
	var split_mask = full_mask.split('.');
	var digit_mask = 0;
	for (key in split_mask)
	{
		digit_mask += convert_digit(parseInt(split_mask[key]));
	}
	console.log(digit_mask);
}

function make_cmd_arp(net_list)
{
	list_cmd = [];
	for (key in net_list)
	{
		if (net_list[key].ip_address && net_list[key].netmask)
		{
			list_cmd.push({iface: net_list[key].name, net: net_list[key].ip_address, sub: net_list[key].netmask});
		}
	}
	convert_netmask("255.255.254.0");
	for (key in list_cmd)
	{
		var command = "sudo arp-scan -I eth0 172.17.0.0/24";
		arp_network(command, console.log);
	}
}

function arp_network(command, callback)
{
	exec(command, function(error_exec, stdout, stderr) {
		if (error_exec) {
			console.log("Error: ", error_exec);
		}
		else
		{
			callback(stdout);
		}
	});
}