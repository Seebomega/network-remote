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

var path = require('path');
var http = require('http');
var express = require('express');
var bodyParser = require ('body-parser');
var cookieParser = require('cookie-parser');

var config_serv = {
	app: express(),
	ip_serveur: '192.168.80.32',
	debug: true,
	client: [],
	port_http: 80,
	web_domain_site: 'https://network.onlineterroir.com',
};

config_serv.app.use(bodyParser.json());
config_serv.app.use(bodyParser.urlencoded({ extended: false }));
config_serv.app.use(cookieParser());
config_serv.app.use(express.static(path.join(__dirname, 'public')));

var server_http = http.createServer(config_serv.app);

console.log('Start arp-node-engine serveur on url : %s', config_serv.web_domain_site);
server_http.listen(config_serv.port_http, config_serv.ip_serveur, function () {
    console.log('Server_http listening at port %d', config_serv.port_http);
});





var io = require('socket.io').listen(process.env.VIRTUAL_NODE_PORT || server_http);
console.log('socket.io listening at port %d', process.env.VIRTUAL_NODE_PORT || server_http);

io.on('connection', function (socket) {
    socket.on('connect', function () {
        console.log("connect");
    });
    socket.on('scan_arp', function (data) {
        console.log(data);
    });
    socket.on('disconnect', function () {
        console.log("connect");
    });
});