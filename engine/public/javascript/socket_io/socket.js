var url_split = window.document.URL.split('/');
var ip_adresse_name = url_split[0] + '//' + url_split[2];
var last_int = parseInt(ip_adresse_name[ip_adresse_name.length - 1]) + 1;
var io_adresse_name = ip_adresse_name.substr(0, ip_adresse_name.length - 1) + last_int;
var url = url_split[2];
//var socket = io.connect("http://trans.lan:9092", {secure: true});
var socket = io.connect(url, {secure: true});

function changeFavicon(src) {
	var link = document.createElement('link'),
		oldLink = document.getElementById('dynamic-favicon');
	link.id = 'dynamic-favicon';
	link.rel = 'shortcut icon';
	link.href = src;
	if (oldLink) {
		document.head.removeChild(oldLink);
	}
	document.head.appendChild(link);
}

function getXMLHttpRequest() {
	var xhr = null;

	if (window.XMLHttpRequest || window.ActiveXObject) {
		if (window.ActiveXObject) {
			try {
				xhr = new ActiveXObject("Msxml2.XMLHTTP");
			} catch(e) {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
		} else {
			xhr = new XMLHttpRequest();
		}
	} else {
		alert("Votre navigateur ne supporte pas l'objet XMLHTTPRequest...");
		return null;
	}

	return xhr;
}

function FileConvertSize(aSize) {
	if (aSize == 0)
		aSize = 1;
	aSize = Math.abs(parseInt(aSize, 10));
	var def = [
		[1, 'octets'],
		[1024, 'ko'],
		[1024 * 1024, 'Mo'],
		[1024 * 1024 * 1024, 'Go'],
		[1024 * 1024 * 1024 * 1024, 'To']
	];
	for (var i = 0; i < def.length; i++) {
		if (aSize < def[i][0]) return (aSize / def[i - 1][0]).toFixed(2) + ' ' + def[i - 1][1];
	}
}

socket.on('connect', function () {
	socket.emit('add_user', 'client');
	changeFavicon("https://"+url+"/trans.png");
	console.log("connect");
});

var id_get_files = 0;
var source_tree = null;
var new_torrent = null;
var list_search;
var g_nb_match = {
	len:0,
	match:0,
	nb:0,
	full:0
};

socket.on('id_get_files', function (data, tree, list) {
	id_get_files = data;
	source_tree = tree;
	list_search = list;
});

socket.on('t411_result_btoa', function(data) {
	new_torrent = data;
	if (typeof new_torrent != 'undefined' && new_torrent != null)
	{
		$('#classique_download').css('display', 'none');
		$('#up_t411_download').css('display', 'block');
		$('#up_t411_download').html(data.name+'<br>'+FileConvertSize(data.size));
	}
	else
	{
		$('#classique_download').css('display', 'block');
		$('#up_t411_download').css('display', 'none');
	}
	$('#upload_container').css('display', 'block');
});

function update_vpn_selector(node)
{
	if (confirm('Changemen de serveur\n '+node.options[node.selectedIndex].value+'.freedom-ip.com\n\n'))
	{
		select_new_server(node.options[node.selectedIndex].value,'vpn_out_1');
	}
	else
	{
		document.getElementById('selectvpn1').selectedIndex=client_conf1;
	}
}

function make_html_vpn_selector() {
	var html_return = 'VPN<select class="bouton_option_md" id="selectvpn1" onchange="update_vpn_selector(this)">'+
		'<option value="nl1">NL1</option>'+
		'<option value="nl2">NL2</option>'+
		'<option value="nl3">NL3</option>'+
		'<option value="nl4">NL4</option>'+
		'<option value="de1">DE1</option>'+
		'<option value="de2">DE2</option>'+
		'<option value="es1">ES1</option>'+
		'<option value="uk1">UK1</option>'+
		'<option value="ie1">IE1</option>'+
		'<option value="cz1">CZ1</option>'+
		'<option value="lt1">LT1</option>'+
		'<option value="pl1">PL1</option>'+
		'<option value="ch1">CH1</option>'+
		'<option value="it1">IT1</option>'+
		'<option value="lu1">LU1</option>'+
		'<option value="fi1">FI1</option>'+
		'<option value="pt1">PT1</option>'+
		'<option value="gr1">GR1</option>'+
		'<option value="mt1">MT1</option>'+
		'<option value="dk1">DK1</option>'+
		'<option value="se1">SE1</option>'+
		'<option value="us1">US1</option>'+
		'<option value="us2">US2</option>'+
		'<option value="us3">US3</option>'+
		'<option value="ca1">CA1</option>'+
		'<option value="ca2">CA2</option>'+
		'<option value="ca3">CA3</option>'+
	'</select>';
	return (html_return);
}

function make_html_iface(name, data) {
	var d_tr = document.createElement('div');
	var d_td_name = document.createElement('div');
	var d_td_tx = document.createElement('div');

	d_tr.setAttribute('class', 'row-data');

	d_td_name.innerHTML = name;
	d_td_name.setAttribute('class', 'columns large-2 cell-data');

	d_td_tx.setAttribute('class', 'columns large-10');
	d_td_tx.innerHTML = '<span class="success label span-data">' + data.speed_in + '</span>';

	d_td_tx.innerHTML += '<span class="secondary label span-data">' + data.data_in + '</span>';

	d_td_tx.innerHTML += '<span class="alert label span-data">' + data.speed_out + '</span>';

	d_td_tx.innerHTML += '<span class="secondary label span-data">' + data.data_out + '</span>';

	d_tr.appendChild(d_td_name);
	d_tr.appendChild(d_td_tx);
	return (d_tr);
}


function make_html_table_iface(data)
{
	var d_div = document.createElement('div');
	d_div.setAttribute("class", "columns large-4 table-data");

	d_div.appendChild(make_html_iface("WAN", data.eth0));
	d_div.appendChild(make_html_iface("LAN", data.ens3));
	d_div.appendChild(make_html_iface("VPN-WAN", data.tun0));
	d_div.appendChild(make_html_iface("VPN-LAN", data.tap0));

	return (d_div);
}

function make_htlm_time_up_load(server)
{
	
	var div = document.createElement('div');

	div.setAttribute('class', 'div_up_load_server');

	div.innerHTML = "Load average: "+server.cpu[0]+" "+server.cpu[1]+" "+server.cpu[2] + "<br>Mem: ";
	return (div);
}

function make_htlm_server_mem(server)
{
	var div_mem = document.createElement('div');
	var span_mem_u = document.createElement('span');
	var span_mem_f = document.createElement('span');
	var span_mem_c = document.createElement('span');

	div_mem.setAttribute('class', 'div_mem_barre progress success round');

	var used_mem = parseInt(((server.mem.used - server.mem.caches) / server.mem.total) * 100),
	used_free = parseInt((server.mem.free / server.mem.total) * 100),
	used_caches = parseInt((server.mem.caches / server.mem.total) * 100);

	span_mem_u.setAttribute('class', 'left_meter_mem');
	span_mem_c.setAttribute('class', 'center_meter_mem');
	span_mem_f.setAttribute('class', 'right_meter_mem');
	span_mem_u.setAttribute('style', 'width: ' + used_mem + '%');
	span_mem_c.setAttribute('style', 'width: ' + used_caches + '%');
	span_mem_f.setAttribute('style', 'width: ' + (100 - used_mem - used_caches) + '%');
	span_mem_u.setAttribute('title', "Used: " + FileConvertSize((server.mem.used - server.mem.caches) * 1000));
	span_mem_c.setAttribute('title', "Caches: " + FileConvertSize(server.mem.caches * 1000));
	span_mem_f.setAttribute('title', "Free: " + FileConvertSize(server.mem.free * 1000));
	span_mem_u.innerHTML = used_mem + '%';
	span_mem_c.innerHTML = used_caches + '%';
	span_mem_f.innerHTML = used_free + '%';
	if ((100 - used_mem - used_caches) < 10)
	{
		span_mem_f.setAttribute('style', 'width: ' + 10 + '%');
		span_mem_u.setAttribute('style', 'width: ' + (used_mem - ((10 - (100 - used_mem - used_caches)) / 2)) + '%');
		span_mem_c.setAttribute('style', 'width: ' + (used_caches - ((10 - (100 - used_mem - used_caches)) / 2)) + '%');
	}
	div_mem.appendChild(span_mem_u);
	div_mem.appendChild(span_mem_c);
	div_mem.appendChild(span_mem_f);
	return (div_mem);
}

function make_htlm_server_info_swap(server)
{
	var div_swap = document.createElement('div');
	var span_swap_l = document.createElement('span');
	var span_swap_r = document.createElement('span');
	div_swap.setAttribute('class', 'div_mem_barre progress success round');

	var free_swap = parseInt((server.swap[0] / server.swap[1]) * 100),
	used_swap = 100 - free_swap;

	span_swap_l.setAttribute('class', 'left_meter_swap');
	span_swap_r.setAttribute('class', 'right_meter_swap');
	if (used_swap < 10)
	{
		span_swap_l.setAttribute('style', 'width: ' + 10 + '%');
		span_swap_r.setAttribute('style', 'width: ' + 90 + '%');
	}
	else
	{
		span_swap_l.setAttribute('style', 'width: ' + used_swap + '%');
		span_swap_r.setAttribute('style', 'width: ' + free_swap + '%');
	}
	span_swap_l.setAttribute('title', "Used: " + FileConvertSize((server.swap[1] - server.swap[0] + 1) * 1000000));
	span_swap_r.setAttribute('title', "Free: " + FileConvertSize(server.swap[0] * 1000000));
	span_swap_l.innerHTML = used_swap + '%';
	span_swap_r.innerHTML = free_swap + '%';

	div_swap.appendChild(span_swap_l);
	div_swap.appendChild(span_swap_r);
	return (div_swap);
}

function make_htlm_server_info(server)
{
	var div = document.createElement('div');

	div.setAttribute('class', 'div_time_up_load columns large-2');
	var swap_txt = document.createElement('div');
	swap_txt.innerHTML = "Swap: ";

	div.appendChild(make_htlm_time_up_load(server));
	div.appendChild(make_htlm_server_mem(server));
	div.appendChild(swap_txt);
	div.appendChild(make_htlm_server_info_swap(server));
	return (div);
}

function make_htlm_ratio(up, down, ratio)
{
	var div = document.createElement('div');
	var div_ratio = document.createElement('div');
	var div_up = document.createElement('div');
	var div_down = document.createElement('div');
	var span_ratio = document.createElement('span');
	var span_up = document.createElement('span');
	var span_down = document.createElement('span');

	div.setAttribute('class', 'div_ratio_monitor columns large-2');

	div_ratio.setAttribute('class', 'label inlineall');
	div_ratio.setAttribute('style', 'margin: 10px 0px;');
	div_ratio.innerHTML = 'Ratio :'+ratio;

	div_up.setAttribute('class', 'progress success div_ratio_barre');
	span_up.setAttribute('class', 'meter');
	span_up.setAttribute('style', 'width: ' + up + '%; padding: 2px;');
	span_up.innerHTML = up + '%';
	div_up.appendChild(span_up);

	div_down.setAttribute('class', 'progress alert div_ratio_barre');
	span_down.setAttribute('class', 'meter');
	span_down.setAttribute('style', 'width: ' + down + '%; padding: 2px;');
	span_down.innerHTML = down + '%';
	div_down.appendChild(span_down);

	div.appendChild(div_ratio);
	div.appendChild(div_up);
	div.appendChild(div_down);
	return (div);
}


function make_html_unite_disk(name)
{
	var td_disk = document.createElement('td');
	td_disk.setAttribute('class', 'td_disk_server');
	td_disk.innerHTML = name;
	return (td_disk);
}

function make_html_value_disk(size, used)
{
	var td_disk = document.createElement('td'),
	// svg_disk = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
	// circle_disk = document.createElementNS("http://www.w3.org/2000/svg", "circle"),
	value = ((used * 100) / size);
	degree = ((value/100) * 360) * (Math.PI/180);

	td_disk.setAttribute('class', 'td_disk_server');
	//
	// circle_disk.setAttribute('r', 25);
	// circle_disk.setAttribute('cx', 25);
	// circle_disk.setAttribute('cy', 25);
	// circle_disk.setAttribute('style', 'stroke-dasharray: '+ value +';');
	// circle_disk.setAttribute('d', '50');
	// svg_disk.setAttribute('width', 50);
	// svg_disk.setAttribute('height', 50);
	// svg_disk.appendChild(circle_disk);

	var canvas= document.createElement("canvas");
	canvas.width = 70;
	canvas.height = 70;
	var ctx = canvas.getContext("2d");

	ctx.beginPath();
	ctx.arc(canvas.width/2,canvas.height/2,25,0,2*Math.PI);
	ctx.fillStyle="yellowgreen";
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.strokeStyle="#333";
	ctx.lineWidth=10;
	ctx.arc(canvas.width/2,canvas.height/2,25,-0.5*Math.PI,-0.5*Math.PI+degree);
	ctx.stroke();
	ctx.font = "14px arial";
	ctx.fillStyle = "#333";
	ctx.textAlign = "center";
	ctx.fillText(value.toFixed(0) +'%', canvas.width/2, (canvas.height/2)+4);

	td_disk.appendChild(canvas);

	return (td_disk);
}

function make_html_server_disk(server)
{
	var div_disk = document.createElement('div'),
	table_disk = document.createElement('table'),
	tr1_disk = document.createElement('tr'),
	tr2_disk = document.createElement('tr');

	div_disk.setAttribute('class', 'div_disk_server columns large-2');
	table_disk.setAttribute('class', 'table_disk_server');

	table_disk.appendChild(tr1_disk);
	table_disk.appendChild(tr2_disk);
	div_disk.appendChild(table_disk);

	var disk = server.disk;
	for(key in disk)
	{
		tr1_disk.appendChild(make_html_unite_disk(key));
		tr2_disk.appendChild(make_html_value_disk(disk[key].size, disk[key].used));
	}
	
	return (div_disk);
}

function make_html_file_read_user(user)
{
	var div_user = document.createElement('div');
	div_user.setAttribute('class', 'div_file_read_user');
	div_user.innerHTML = user;
	return (div_user);
}

function make_html_file_read_data(user)
{
	var div_user = document.createElement('div');
	div_user.setAttribute('class', 'div_file_read_data');
	div_user.innerHTML = user;
	return (div_user);
}

function make_html_file_read(server)
{
	var div_file = document.createElement('div'),
	div_scroll = document.createElement('div');
	div_file.setAttribute('class', 'div_file_read columns large-2');
	div_scroll.setAttribute('class', 'div_file_read_scroll');
	div_file.appendChild(div_scroll);
	//div_file.innerHTML = "";
	for(key in server.file)
	{
		div_scroll.appendChild(make_html_file_read_user(key));
		for(key2 in server.file[key])
		{
			//div_file.innerHTML += server.file[key][key2]+'<br>';
			div_scroll.appendChild(make_html_file_read_data(server.file[key][key2]));
		}
	}
	div_file.appendChild(div_scroll);
	return (div_file);
}

var test = true;

socket.on('server_iface', function (data, server) {
	if (test == true)
	{
		//console.log(server.file);
		var $html = $("#info_pzone_iface");
		var ratio = (server.ratio.up / server.ratio.down).toFixed(2);
		var ratio_inv = (server.ratio.down / server.ratio.up).toFixed(2);
		var ratio_up = (((server.ratio.up + server.ratio.down) / server.ratio.up) / ratio).toString();
		var ratio_down = (((server.ratio.up + server.ratio.down) / server.ratio.down) * ratio_inv).toString();
		ratio_up = ratio_up.substr(0,2) + '.' + ratio_up.substr(2,2);
		ratio_down = ratio_down.substr(0,2) + '.' + ratio_down.substr(2,2);
		
		ratio_up = ((server.ratio.up / (server.ratio.up + server.ratio.down)) * 1000000000000000).toFixed(2);
		ratio_down = ((server.ratio.down / (server.ratio.up + server.ratio.down)) * 1000000000000000).toFixed(2);

		$("#info_pzone_iface").empty();
		$html.append(make_html_table_iface(data));
		$html.append(make_htlm_server_info(server));
		$html.append(make_htlm_ratio(ratio_down, ratio_up, ratio));
		$html.append(make_html_server_disk(server));
		$html.append(make_html_file_read(server));
		//test = false;
	}
});

function order_table_result(type, order)
{
	var passage = 0;
	var permutation = true;
	var pos = 0;

	while (permutation == true) {
		permutation = false;
		passage++;
		if (order == 'desc')
		{
			for (pos=0; pos < list_search.torrents.length - 1; pos++) {
				if (list_search.torrents[pos][type] < list_search.torrents[pos + 1][type]){
					permutation = true;
					var temp = list_search.torrents[pos];
					list_search.torrents[pos] = list_search.torrents[pos + 1];
					list_search.torrents[pos + 1] = temp;
				}
			}
		}
		else if (order == 'asc')
		{
			for (pos=0; pos < list_search.torrents.length - 1; pos++) {
				if (list_search.torrents[pos][type] > list_search.torrents[pos + 1][type]){
					permutation = true;
					var temp = list_search.torrents[pos];
					list_search.torrents[pos] = list_search.torrents[pos + 1];
					list_search.torrents[pos + 1] = temp;
				}
			}
		}
	}
	make_t411_result_search(list_search, type, order);
}

function table_oder_listener(node)
{
	node.addEventListener("click", function () {
		var vald = this.getAttribute('name');
		if (vald == 'true')
		{
			$('.menu_barre_t411').attr('class', 'menu_barre_t411 header');
			this.setAttribute('class', 'menu_barre_t411 headerSortUp');
			this.setAttribute('name', 'false');
			order_table_result(this.id, 'asc');
		}
		else if (vald == 'false')
		{
			$('.menu_barre_t411').attr('class', 'menu_barre_t411 header');
			this.setAttribute('class', 'menu_barre_t411 headerSortDown');
			this.setAttribute('name', 'true');
			order_table_result(this.id, 'desc');
		}
	});
}

function make_line_t411_table_order(type, order)
{
	var d_tr = document.createElement('tr');
	var d_td_info = document.createElement('th');
	var d_td_dl = document.createElement('th');
	var d_td_name = document.createElement('th');
	var d_td_times_categoryname = document.createElement('th');
	var d_td_size = document.createElement('th');
	var d_td_leechers = document.createElement('th');
	var d_td_seeders = document.createElement('th');
	var d_td_times_completed = document.createElement('th');

	d_td_name.innerHTML = 'Nom';
	d_td_name.setAttribute('class', 'menu_barre_t411 header');
	d_td_name.setAttribute('name', 'false');
	d_td_name.setAttribute('id', 'name');
	table_oder_listener(d_td_name);

	d_td_times_categoryname.innerHTML = 'Type';
	d_td_times_categoryname.setAttribute('class', 'menu_barre_t411 header');
	d_td_times_categoryname.setAttribute('name', 'false');
	d_td_times_categoryname.setAttribute('id', 'categoryimage');
	table_oder_listener(d_td_times_categoryname);

	d_td_size.innerHTML = 'Taille';
	d_td_size.setAttribute('class', 'menu_barre_t411 header');
	d_td_size.setAttribute('name', 'false');
	d_td_size.setAttribute('id', 'size');
	table_oder_listener(d_td_size);

	d_td_leechers.innerHTML = 'Leechers';
	d_td_leechers.setAttribute('class', 'menu_barre_t411 header');
	d_td_leechers.setAttribute('name', 'false');
	d_td_leechers.setAttribute('id', 'leechers');
	table_oder_listener(d_td_leechers);

	d_td_seeders.innerHTML = 'Seeders';
	d_td_seeders.setAttribute('class', 'menu_barre_t411 header');
	d_td_seeders.setAttribute('name', 'false');
	d_td_seeders.setAttribute('id', 'seeders');
	table_oder_listener(d_td_seeders);

	d_td_times_completed.innerHTML = 'Complété';
	d_td_times_completed.setAttribute('class', 'menu_barre_t411 header');
	d_td_times_completed.setAttribute('name', 'false');
	d_td_times_completed.setAttribute('id', 'times_completed');
	table_oder_listener(d_td_times_completed);

	d_td_info.setAttribute('class', 'menu_barre_t411_empty');
	d_td_info.innerHTML = '';

	d_td_dl.setAttribute('class', 'menu_barre_t411_empty');
	d_td_dl.innerHTML = '';

	if (typeof type != 'undefined' && typeof order != 'undefined')
	{
		if (type == 'name')
			var select_type = d_td_name;
		else if (type == 'categoryimage')
			var select_type = d_td_times_categoryname;
		else if (type == 'size')
			var select_type = d_td_size;
		else if (type == 'leechers')
			var select_type = d_td_leechers;
		else if (type == 'seeders')
			var select_type = d_td_seeders;
		else if (type == 'times_completed')
			var select_type = d_td_times_completed;
		if (typeof select_type != 'undefined' && order == 'desc')
		{
			select_type.setAttribute('name', 'true');
			select_type.setAttribute('class', 'menu_barre_t411 headerSortUp');
		}
		else if (typeof select_type != 'undefined' && order == 'asc')
		{
			select_type.setAttribute('name', 'false');
			select_type.setAttribute('class', 'menu_barre_t411 headerSortDown');
		}
	}

	d_tr.appendChild(d_td_name);
	d_tr.appendChild(d_td_times_categoryname);
	d_tr.appendChild(d_td_size);
	d_tr.appendChild(d_td_seeders);
	d_tr.appendChild(d_td_leechers);
	d_tr.appendChild(d_td_times_completed);
	d_tr.appendChild(d_td_info);
	d_tr.appendChild(d_td_dl);
	return (d_tr);
}

function make_line_t411_table(data)
{
	var d_tr = document.createElement('tr');
	var d_td_info = document.createElement('td');
	var d_td_dl = document.createElement('td');
	var d_td_name = document.createElement('td');
	var d_td_times_categoryname = document.createElement('td');
	var d_td_size = document.createElement('td');
	var d_td_leechers = document.createElement('td');
	var d_td_seeders = document.createElement('td');
	var d_td_times_completed = document.createElement('td');
	var div_name = document.createElement('div');

	d_tr.setAttribute('class', 'hover-line');

	d_td_info.setAttribute('class', 'd_td_info');
	d_td_info.innerHTML = '<i class="fa fa-question-circle fa-1-4x" aria-hidden="true"></i>';
	d_td_info.id = data.id;
	d_td_info.setAttribute('name', 'true');
	d_td_info.addEventListener("click", function () {
		var vald = this.getAttribute('name');
		if (vald == 'true')
			vald = true;
		else if (vald == 'false')
			vald = false;
		socket.emit('get_t411_details', parseInt(this.id));
		$('#torrent_inspector').toggle(vald);
		$('#toolbar-inspector').toggleClass('selected', vald);
		var w = vald ? $('#torrent_inspector').outerWidth() + 1 + 'px' : '0px';
		if (vald == true)
		{
			$('.d_td_info').attr('style', '');
			$('.d_td_info').attr('name', 'true');
			this.setAttribute('name', 'false');
			this.setAttribute('style', 'color:#0081ff');
		}
		else
		{
			$('.d_td_info').attr('style', '');
			$('.d_td_info').attr('name', 'true');
		}
		$('#torrent_container')[0].style.right = w;
	});

	d_td_dl.setAttribute('class', 'd_td_info');
	d_td_dl.innerHTML = '<i class="fa fa-cloud-download fa-1-4x" aria-hidden="true"></i>';
	d_td_dl.id = data.id;
	d_td_dl.name = data.name;
	d_td_dl.addEventListener("click", function () {
		if (confirm("Ajouter Téléchargement\n\n" + this.name) == true) {
			socket.emit('get_t411_download', parseInt(this.id));
		}
	});

	d_td_name.id = data.id;
	d_td_name.setAttribute('class', 'd_td_name');

	var str = data.name.replace(/\./gi, " ");
	var nb_match_line = 0;
	div_name.innerHTML = str.replace(reg_ex, function(x){				
		nb_match_line++;
		return "<b class='match_word'>" + x + "</b>";
	});
	if (nb_match_line > g_nb_match.match)
	{
		if (nb_match_line > g_nb_match.len)
			g_nb_match.match = g_nb_match.len;
		else
			g_nb_match.match = nb_match_line;
	}
	if (nb_match_line >= g_nb_match.len)
	{
		g_nb_match.full = 1;
		g_nb_match.nb++;
	}
	div_name.setAttribute('class', 'd_td_div_name');
	d_td_name.appendChild(div_name);

	d_td_times_categoryname.innerHTML = data.categoryname;
	d_td_times_categoryname.setAttribute('class', 'd_td_times_categoryname');

	d_td_size.innerHTML = FileConvertSize(data.size);
	d_td_size.setAttribute('class', 'd_td_size');

	d_td_leechers.innerHTML = data.leechers;
	d_td_leechers.setAttribute('class', 'd_td_leechers');

	d_td_seeders.innerHTML = data.seeders;
	d_td_seeders.setAttribute('class', 'd_td_seeders');

	d_td_times_completed.innerHTML = data.times_completed;
	d_td_times_completed.setAttribute('class', 'd_td_times_completed');

	d_tr.appendChild(d_td_name);
	d_tr.appendChild(d_td_times_categoryname);
	d_tr.appendChild(d_td_size);
	d_tr.appendChild(d_td_seeders);
	d_tr.appendChild(d_td_leechers);
	d_tr.appendChild(d_td_times_completed);
	d_tr.appendChild(d_td_info);
	d_tr.appendChild(d_td_dl);
	return (d_tr);
}

function make_separator_t411_list()
{
	var d_tr = document.createElement('tr');
	var d_td_separator = document.createElement('td');
	d_td_separator.setAttribute('colspan', '8');
	d_td_separator.setAttribute('class', 'd_td_separator');
	d_tr.appendChild(d_td_separator);
	return (d_tr);
}

function make_t411_result_search(data, type, order)
{
	list_search = data;
	document.getElementById('t411_result_search').innerHTML = '';
	var d_table = document.createElement('table');
	var regex_str = "";
	g_nb_match.len = 0;
	g_nb_match.match = 0;
	g_nb_match.nb = 0;
	g_nb_match.full = 0;
	if (typeof document.getElementById("t411_search") != null)
	{
		var str_get = document.getElementById("t411_search").value.replace(/[ ]{2,}/, " ").trim();
		var regex_split = str_get.split(' ');
		if (regex_split.length > 0)
		{
			var regex_str = "";
			for(key in regex_split)
			{
				if (key == 0 && regex_split[key] != "")
					regex_str += regex_split[key];
				else if (regex_split[key] != "")
					regex_str += "|"+regex_split[key];
			}
			g_nb_match.len = regex_split.length;
		}
	}
	reg_ex = new RegExp(regex_str, "gi");
	d_table.setAttribute('style', 'width:100%;margin-bottom: 0px;border:none;border-collapse: collapse;');
	d_table.appendChild(make_line_t411_table_order(type, order));
	if (data.torrents.length > 0)
	{
		$("#t411_result_search").append(d_table);
		var no_full_match = [];
		for (var key in data.torrents)
		{
			g_nb_match.full = 0;
			var new_line = make_line_t411_table(data.torrents[key]);
			if (g_nb_match.full == 1)
				d_table.appendChild(new_line);
			else
				no_full_match.push(new_line);
		}
		if (data.torrents.length != no_full_match.length)
			d_table.appendChild(make_separator_t411_list());
		for(key in no_full_match)
		{
			d_table.appendChild(no_full_match[key]);
		}
		if (document.getElementById('total_result_t411') != null)
		{
			document.getElementById('total_result_t411').innerHTML = g_nb_match.nb+"/"+data.total + " Résultat";
			if (typeof g_nb_match == 'object' &&
				g_nb_match.len != 0 &&
				g_nb_match.match != 0)
			{
				document.getElementById('total_result_t411').innerHTML += ", "+g_nb_match.match+"/"+g_nb_match.len+" Match";
			}
		}
	}
	else
	{
		var error_html = "<div style='height:100%;width:100%;text-align: center;vertical-align: middle;'>"+
			"<div style='position: relative;top: 45%;'>Aucun résultat</div>"+
		"</div>"
		$("#t411_result_search").html(error_html);
	}
}

socket.on('t411_result', function (data) {
	make_t411_result_search(data);
});

socket.on('t411_details', function (data) {
	console.log('test');
	document.getElementById("info_pzone_details").innerHTML = data.description+"<br><br><br><br><br>";
	document.getElementById("info_pzone_details").setAttribute('style', 'display: block;');
});

function make_t411_search_tool(node)
{
	if (node.value.length > 0) {
		var filtre_1 = null;
		var filtre_2 = null;
		if (typeof node.parentNode.children[2] != 'undefined' &&
			typeof node.parentNode.children[2].children != 'undefined')
		{
			var child_1 = node.parentNode.children[2].children;
			filtre_1 = child_1[node.parentNode.children[2].selectedIndex].value;
		}
		if (typeof node.parentNode.children[3] != 'undefined' &&
			typeof node.parentNode.children[3].children != 'undefined')
		{
			var child_2 = node.parentNode.children[3].children;
			filtre_2 = child_2[node.parentNode.children[3].selectedIndex].value;
		}
		socket.emit('get_t411_info', node.value, filtre_1, filtre_2);
	}
}

window.onload = function () {
	$("#t411_search").keyup(function () {
		make_t411_search_tool(this);
	});
	$("#t411_search").click(function () {
		make_t411_search_tool(this);
	});
	$("#t411_search").focusout(function () {
		setTimeout(function () {
			//document.getElementById('t411_result_search').innerHTML = '';
			document.getElementById("info_pzone_details").innerHTML = '';
			document.getElementById("info_pzone_details").setAttribute('style', '');
		}, 200);
	});
	$("#t411_search").autocomplete({
		source: function(request, response) {
			$.getJSON("https://suggestqueries.google.com/complete/search?callback=?",
				{
				  "hl":"en", // Language
				  "jsonp":"suggestCallBack", // jsonp callback function name
				  "q":request.term, // query term
				  "client":"firefox" // force youtube style response, i.e. jsonp
				}
			);
			suggestCallBack = function (data) {
				var suggestions = [];
				$.each(data[1], function(key, val) {
					suggestions.push({"value":val});
				});
				suggestions.length = 10; // prune suggestions list to only 10 items
				response(suggestions);
			};
		},
		select: function (e, ui) {
	        make_t411_search_tool(this);
	    },
	}).click(function(){
        $(this).data("autocomplete").search($(this).val());
    });
	/*$("html").click(function () {
		document.getElementById("info_pzone_details").innerHTML = '';
		document.getElementById("info_pzone_details").setAttribute('style', '');
	});*/
}

