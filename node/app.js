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
var scan_date = {};

arp_table.children = [];

setTimeout(function(){ 
	start_app();

	setInterval(function(){ 
		make_cmd_arp(scan_iface, send_data_to_engine);
		console.log("scan_iface");
	}, 20000);
}, 3000);

function twoDigits(d) {
	if(0 <= d && d < 10) return "0" + d.toString();
	if(-10 < d && d < 0) return "-0" + (-1*d).toString();
	return d.toString();
}

function toMysqlFormat(date) {
	if(date != null){
		return date.getUTCFullYear() + "-" + twoDigits(1 + date.getUTCMonth()) + "-" + twoDigits(date.getUTCDate()) + " " + twoDigits(date.getHours()) + ":" + twoDigits(date.getUTCMinutes()) + ":" + twoDigits(date.getUTCSeconds());
	}
	else{
		return '';
	}
};

function toHHMMSS(time_stamp) {
    var sec_num = parseInt(time_stamp, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
	if(hours > 24){
		var day = Math.floor(hours/24);
		hours = hours%24;
		 var time = day+' Jour(s) '+hours+':'+minutes+':'+seconds;
	}
	else{
	    var time = hours+':'+minutes+':'+seconds;
	}
    return time;
}

function shutdown(signal, value) {
	console.log('server stopped by ' + signal);
	console.log('clean cookie: ' + token);
	if (fs.existsSync("/data/remote/cookies/" + token))
		fs.unlinkSync("/data/remote/cookies/" + token);
	if (fs.existsSync('options.json'))
		fs.writeFileSync('options.json', JSON.stringify(options));
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
	if (fs.existsSync("/data/remote/cookies/"))
	{
		fs.writeFileSync(
			"/data/remote/cookies/" + token,
			JSON.stringify({
				user: options.hostname,
				type: "network-remote",
				login : new Date()
			})
		);
	}
	else
		console.log("Cookie not create, wrong path");
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
		shutdown('SIGTERM', -128);
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
			scan_iface = get_selected_iface(obj);
			make_cmd_arp(scan_iface, send_data_to_engine)
		}
	});
}

function get_selected_iface(obj)
{
	if (options.iface)
	{
		console.log(options.iface);
		for (var key in obj)
		{
			var scan_iface = false;
			for (var key2 in options.iface)
			{
				if (options.iface[key2] == obj[key].name)
				{
					scan_iface = true;
				}
			}
			if (!scan_iface)
				delete obj[key];
		}
	}
	else
	{
		options.iface = [];
		for (var key in obj)
		{
			if (obj[key].ip_address && obj[key].netmask)
				options.iface.push(obj[key].name);
		}
	}
	return (obj);
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
	scan_date.start = new Date().getTime() / 1000;
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
				if (iface.children[key2].mac == arp_table.children[key].children[key1].mac)
				{
					mac_find = false;
					iface.children[key2].mac.push(arp_table.children[key].children[key1].mac);
				}
			}
			if (mac_find && arp_table.children[key].children[key1].ip != "172.17.0.1")
			{
				var new_host = {};
				new_host.ip = arp_table.children[key].children[key1].ip;
				new_host.vendor = arp_table.children[key].children[key1].vendor;
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
	for (var key in arp_table.children)
	{
		for (var key1 in arp_table.children[key].children)
		{
			var double_pos = [];
			var double_mac = [];
			for (var key2 in arp_table.children)
			{
				for (var key3 in arp_table.children[key2].children)
				{
					if (arp_table.children[key].children[key1].ip == arp_table.children[key2].children[key3].ip)
					{
						double_pos.push(key3);
						double_mac.push(arp_table.children[key].children[key1].mac);
					}
				}
			}
			if (double_pos.length > 1)
			{
				for (var pos in double_pos)
				{
					for (var key2 in double_mac[pos])
					{
						if (arp_table.children[key].children[double_pos[pos]])
							arp_table.children[key].children[double_pos[pos]].mac.push(double_mac[pos][key2]);
					}
					arp_table.children[key].children[double_pos[pos]].mac = arp_table.children[key].children[double_pos[pos]].mac.filter(function(elem, index, self) {
						return index == self.indexOf(elem);
					});
				}
			}
		}
	}
	var dhcp_lease = get_dhcp_lease();
	var now = (new Date()).getTime() + (60*60*1000);
	var scan_date = toMysqlFormat(new Date(now));
	get_host_name(0, 0, arp_table, dhcp_lease, scan_date, callback);
}

function get_dhcp_lease() {
	var dhcp_lease = {};
	if (fs.existsSync("/data/remote/dhcpd.leases"))
	{
		var dhcp_file = fs.readFileSync('dhcpd.leases', 'utf8');
		var dhcp_lease_list = dhcp_file.match(/lease ([0-9.]+) {([A-z 0-9/:;.\n"\\'(),${?=-]+);\n  client-hostname "([A-z- 0-9]+)";\n}/g);
		for (var key in dhcp_lease_list)
		{
			var result = dhcp_lease_list[key].match(/lease ([0-9.]+) |client-hostname "([A-z- 0-9]+)";/g);
			dhcp_lease[result[0].replace("lease ", "").replace(" ", "")] = result[1].replace("client-hostname \"", "").replace("\";", "");
		}
	}
	if (fs.existsSync("/data/remote/dhcpd.conf"))
	{
		var dhcpfix_file = fs.readFileSync("dhcpd.conf", 'utf8');
		var dhcpfix_lease_list = dhcpfix_file.match(/host ([A-z- 0-9])+{([A-z\n. 0-9:;-])+}/g);
		for (var key in dhcpfix_lease_list)
		{
			var result = dhcpfix_lease_list[key].replace(/host|([{;} ])+|hardware ethernet|fixed-address/g, "").split("\n");
			dhcp_lease[result[2]] = result[0];
		}
	}
	return (dhcp_lease);
}

function get_host_name(p_iface, p_host, arp_table, dhcp_lease, scan_date, callback)
{
	if (arp_table.children[p_iface].children[p_host])
	{
		var command = "host " + arp_table.children[p_iface].children[p_host].ip;
		arp_table.children[p_iface].children[p_host].date = scan_date;
		exec(command, function(error_exec, stdout, stderr) {
			var tab_dns_name = stdout.match(/domain name pointer ([0-z.-])+/g);
			command = "timeout 0.1 nmblookup -A " + arp_table.children[p_iface].children[p_host].ip;
			exec(command, function(error_exec1, stdout1, stderr1) {
				var netbios_name_list = stdout1.split("\n");
				if (netbios_name_list && netbios_name_list[1] && netbios_name_list.length > 4)
				{
					var netbios_name = netbios_name_list[1].split(" ").join("").split("<");
					arp_table.children[p_iface].children[p_host].netbios = netbios_name[0].substr(1, netbios_name[0].length);
					arp_table.children[p_iface].children[p_host].name = arp_table.children[p_iface].children[p_host].netbios + "";
				}
				if (dhcp_lease[arp_table.children[p_iface].children[p_host].ip])
				{
					arp_table.children[p_iface].children[p_host].hostname = dhcp_lease[arp_table.children[p_iface].children[p_host].ip];
					arp_table.children[p_iface].children[p_host].name = arp_table.children[p_iface].children[p_host].hostname + "";
					console.log(arp_table.children[p_iface].children[p_host].hostname, arp_table.children[p_iface].children[p_host].ip);
				}
				if (tab_dns_name && tab_dns_name[0])
				{
					arp_table.children[p_iface].children[p_host].dns_name = tab_dns_name[0].replace("domain name pointer ", "");
					arp_table.children[p_iface].children[p_host].name = arp_table.children[p_iface].children[p_host].dns_name + "";
				}
				p_host++;
				if (arp_table.children[p_iface].children[p_host])
				{
					get_host_name(p_iface, p_host, arp_table, dhcp_lease, scan_date, callback)
				}
				else
				{
					p_host = 0;
					p_iface++;
					if (arp_table.children[p_iface] && arp_table.children[p_iface].children[p_host])
						get_host_name(p_iface, p_host, arp_table, dhcp_lease, scan_date, callback);
					else
						callback(arp_table);
				}
			});
		});
	}
}


function send_data_to_engine(data)
{
	scan_date.end = new Date().getTime() / 1000;
	data.time = toHHMMSS(scan_date.end - scan_date.start);
	for (var key in data.children)
	{
		for (var key1 in scan_iface)
		{
			if (data.children[key].name == scan_iface[key1].name)
			{
				data.children[key].type = scan_iface[key1].type;
				data.children[key].ip_address = scan_iface[key1].ip_address;
				data.children[key].gateway_ip = scan_iface[key1].gateway_ip;
				data.children[key].netmask = scan_iface[key1].netmask;
			}
		}
	}
	socket.emit("scan_arp", data);
	console.log("Send arp_data");
	delete arp_table.children;
	arp_table.children = [];
}