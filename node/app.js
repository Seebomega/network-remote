//******************************************************************************//
//                                                                              //
//                                                         :::      ::::::::    //
//    app.js                                             :+:      :+:    :+:    //
//                                                     +:+ +:+         +:+      //
//    By: gtorresa <gtorresa@student.42.fr>          +#+  +:+       +#+         //
//                                                 +#+#+#+#+#+   +#+            //
//    Created: 2017/02/08 10:29:23 by gtorresa          #+#    #+#              //
//    Updated: 2017/02/08 15:29:23 by gtorresa         ###   ########.fr        //
//                                                                              //
//******************************************************************************//

var fs = require('fs');
var io = require('socket.io-client');
var exec = require('child_process').exec;
var network = require('network');
var Netmask = require('netmask').Netmask;

var options = JSON.parse(fs.readFileSync('options.json') || '{}');

var arp_table = {};
arp_table.name = options.hostname;
var scan_iface;
arp_table.children = [];

setTimeout(function(){ 
	start_app();
	setInterval(function(){ 
		make_cmd_arp(scan_iface, send_data_to_engine);
	}, 20000);
}, 3000);
console.log(options);
var socket = io.connect(options.engine_ip, {port: options.dest_port, secure: false});

socket.on('connect', function () {
	var arp_login = {
		hostname: arp_table.name,
		type: "arp_client"
	};
    socket.emit("login", arp_login);
    console.log(arp_login);
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
			scan_iface = obj;
			make_cmd_arp(obj, send_data_to_engine)
		}
	});
}

function convert_digit(mask)
{
	var res = 0;
	var b2_mask = mask.toString(2);
	for (var key in b2_mask)
	{
		if (b2_mask[key] == 1)
			res++;
	}
	return (res);
}

function convert_netmask(full_mask)
{
	var split_mask = full_mask.split('.');
	var digit_mask = 0;
	for (var key in split_mask)
	{
		digit_mask += convert_digit(parseInt(split_mask[key]));
	}
	return (digit_mask);
}

function make_cmd_arp(net_list, callback)
{
	list_cmd = [];
	for (var key in net_list)
	{
		if (net_list[key].ip_address && net_list[key].netmask)
		{
			var di_sub = convert_netmask(net_list[key].netmask);
			if (di_sub  < 24)
				di_sub = 24;
			var block = new Netmask(net_list[key].ip_address + '/' + di_sub);
			list_cmd.push({
				iface: net_list[key].name,
				net: net_list[key].ip_address,
				sub: net_list[key].netmask,
				di_sub: di_sub,
				base: block.base
			});

		}
	}
	scan_arp_network(0, list_cmd, list_cmd.length - 1, callback);
}

function scan_arp_network(pos, list_cmd, length, callback)
{
	var command = "sudo arp-scan -I " + list_cmd[pos].iface + " " + list_cmd[pos].base + "/" + list_cmd[pos].di_sub + " 172.17.0.1/32";
	console.log(command);
	exec(command, function(error_exec, stdout, stderr) {
		if (error_exec) {
			console.log("Error: ", error_exec);
		}
		else
		{
			var lines = stdout.split('\n');
			var iface = lines[0].match(/Interface: [0-z.,]+/g);
			var len_line = 0;
			var data = {};
			data.children = [];
			data.name = iface[0].replace('Interface: ', '').replace(',', '');
			lines.splice(0,2);
			for (var key in lines)
			{
				if (lines[key] == "" && len_line == 0)
					len_line = key;
			}
			lines.splice(len_line, lines.length);
			for (var key in lines)
			{
				var host_inf = lines[key].split('\t');
				data.children.push({ip: host_inf[0], mac: host_inf[1], vendor: host_inf[2], name: host_inf[0] + " " + host_inf[1] + " " + host_inf[2]})
			}
			arp_table.children.push(data);
			if (pos >= length)
			{
				if (callback)
                    groupe_mac_on_ip(arp_table, callback);
			}
			else
				scan_arp_network(pos + 1, list_cmd, length, callback)
		}
	});
}

function groupe_mac_on_ip(arp_table, callback)
{
	for(var key in arp_table.children)
	{
        for (var key1 in arp_table.children[key].children)
		{
            console.log(arp_table.children[key].children[key1]);
		}
	}
    callback(arp_table);
}

function send_data_to_engine(data)
{
	socket.emit("scan_arp", data);
	delete arp_table.children;
	arp_table.children = [];
}