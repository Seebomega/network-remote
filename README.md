[logo]: http://img15.hostingpics.net/pics/344966example.png "example"

## Synopsis

Network-Remote is a container that you summon with access to the subnet(s) that you want to scan.

The container can only (_AND ONLY_) send an `arp -scan` on his subnet(s) and ask for more informations to isc-dhcp-server or DNS server (With configuration).

The app see if hosts are Connected, IP conflicts, DNS names, HostNames, IP, mac, DockerRunning ... and send them to the Engine (http://link)

![example image][logo]
*This visualization is rendered by the Engine (http://link)*

## How it works

Remote are `docker-compose up` in differents sub-nets or you can mount different interfaces in different sub-nets.

After that, the remote can ask `arp -scan` to see your differents machines connected.

The remote also ask (with configuration) DNS server and/or isc-dhcp-server to get more informations

Send them to Engine

Engine aggregates datas from remote(s) and keep a cache json of all machines found and can say if they are up or down and render Visualization.


## Installation

Pull the project.

Exec: `docker build -t network-remote .`

Edit the `docker-compose.yml` file as you wish and volume the file for configuration:

For example : `node/options.json` *Set hostname, Engine's IP and port*

Exec: `docker-compose up`

Exec: `docker exec -ti network-remote register $MASTERTOKEN` << Get the master Token from Engine's `options.json` see (http://link)

Now you have the nodes who appears in the Engine's web page

## Advanced Installation

- Using DNS Server

By default it's google's DNS, but you can customize your `docker-compose.yml` file to set `dns: x.x.x.x` your own DNS server

- Using isc-dhcp-server

Mount the `dhcpd.conf` file (on server: `/etc/dhcpd/dhcpd.conf`) as volume `/your/path:/remote/data/dhcpd.conf`


## Motivation

As passionated friends of internet, 

We allied our Network-knowledge and Live vizualisations of data to build a simple tool.

We decided to build a tool to help people to see their networks (Companies, associations, geeks ...). 

It's like a monitoring tool for your network but you can easyly see new devices, IP conflicts etc ...

And ... for fun, we have to admit it.



## Contributors

Pitzzae, gtorresa@student.42.fr @pitzzae

SeebOmega, sderoche@maltem.com  @Seebomega


## License

MIT