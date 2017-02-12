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
var crypto = require('crypto');
var exec = require('child_process').exec;
var network = require('network');
var Netmask = require('netmask').Netmask;

var options = JSON.parse(fs.readFileSync('options.json') || '{}');

var arp_table = {};
arp_table.name = options.hostname;
var scan_iface;
var token;
arp_table.children = [];

setTimeout(function(){ 
	start_app();

	setInterval(function(){ 
		make_cmd_arp(scan_iface, send_data_to_engine);
		console.log("scan_iface");
	}, 20000);
}, 3000);

function shutdown(signal, value) {
	console.log('server stopped by ' + signal);
	console.log('clean cookie: ' + token);
	fs.unlinkSync("/data/remote/cookies/" + token);
	process.exit(128 + value);
}

var signals = {
    'SIGINT': 2,
    'SIGTERM': 15
};

Object.keys(signals).forEach(function (signal) {
    process.on(signal, function () {
        shutdown(signal, signals[signal]);
    });
});

var socket;

crypto.randomBytes(48, function(ex, buf) {
    token = buf.toString('hex');
    fs.writeFileSync(
        "/data/remote/cookies/" + token,
        JSON.stringify({
            user: options.hostname,
			type: "network-remote",
            login : new Date()
        })
    );
    init_socket_io(token);
});

function init_socket_io(token) {

    socket = io.connect(options.engine_ip, {
        'port': options.dest_port,
        'secure': true,
        extraHeaders: {
            'Cookie': "AUTH_COOKIE=" + token + ";"
        }
    });

	console.log("io connect " + options.engine_ip + " port " + options.dest_port);

    socket.on('connect', function () {
        var arp_login = {
            hostname: arp_table.name,
            type: "arp_client",
            token: options.token
        };
        socket.emit("login", arp_login);
        console.log("Login: ", arp_login);
    });

    socket.on('return_register', function (token) {
        if (token.valid)
        {
            options.token = token.id;
            fs.writeFileSync('options.json', JSON.stringify(options));
            console.log("Registered on engine");
        }
        else
        {
            console.log("Wrong token");
        }
        process.exit(0);
    });

    if (process.argv.length >= 4 && process.argv[2] == "register")
    {
        socket.emit("register_scan_arp", process.argv[3]);
        console.log("Register on engine");
    }
}

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
				data.children.push({ip: host_inf[0], mac: host_inf[1], vendor: host_inf[2]})
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
		var iface = {};
		iface.name = arp_table.children[key].name;
		iface.children = [];
		for (var key1 in arp_table.children[key].children)
		{
			var mac_find = true;
			for (var key2 in iface.children)
			{
				if (iface.children[key2].mac == arp_table.children[key].children[key1].mac ||
					iface.children[key2].ip == arp_table.children[key].children[key1].ip)
				{
					mac_find = false;
					iface.children[key2].mac.push(arp_table.children[key].children[key1].mac);
				}
			}
			if (mac_find && arp_table.children[key].children[key1].ip != "172.17.0.1")
			{
				var new_host = {};
				new_host.ip = arp_table.children[key].children[key1].ip;
				new_host.name = arp_table.children[key].children[key1].ip
				new_host.mac = [];
				new_host.docker = false;
				new_host.mac.push(arp_table.children[key].children[key1].mac);
				iface.children.push(new_host);
			}
		}
		for (var key1 in iface.children)
		{
			var counts = [];
			var duplicated = false;
			for(var i = 0; i <= iface.children[key1].mac.length; i++) {
				if(counts[iface.children[key1].mac[i]] === undefined) {
					counts[iface.children[key1].mac[i]] = 1;
				} else {
					duplicated = true;
				}
			}
			if (duplicated)
			{
				iface.children[key1].docker = true;
				iface.children[key1].mac = iface.children[key1].mac.filter(function(elem, index, self) {
					return index == self.indexOf(elem);
				});
			}
		}
		arp_table.children[key].children = iface.children;
	}
	
	get_host_name(0, 0, arp_table, callback);
}

function get_host_name(p_iface, p_host, arp_table, callback)
{
	if (arp_table.children[p_iface].children[p_host])
	{
		var command = "host " + arp_table.children[p_iface].children[p_host].ip;
		exec(command, function(error_exec, stdout, stderr) {
			var tab_dns_name = stdout.match(/domain name pointer ([0-z.-])+/g);
			var dns_name;
			if (tab_dns_name && tab_dns_name[0])
			{
				dns_name = tab_dns_name[0].replace("domain name pointer ", "");
				arp_table.children[p_iface].children[p_host].name = dns_name;
			}
			p_host++;
			if (arp_table.children[p_iface].children[p_host])
			{
				get_host_name(p_iface, p_host, arp_table, callback)
			}
			else
			{
				p_host = 0;
				p_iface++;
				if (arp_table.children[p_iface] && arp_table.children[p_iface].children[p_host])
					get_host_name(p_iface, p_host, arp_table, callback)
				else
					callback(arp_table);
			}
		});
	}
}


function send_data_to_engine(data)
{
	socket.emit("scan_arp", data);
	console.log("Send arp_data");
	delete arp_table.children;
	arp_table.children = [];
}