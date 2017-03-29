FROM ubuntu:latest

MAINTAINER Guillaume TORRESANI <gtorresa@student.42.fr>

RUN apt-get update && \
	apt-get install -y \
	sudo \
	npm \
	nodejs \
	net-tools \
	dnsutils \
	samba-common-bin \
	arp-scan && \
	apt-get clean

ADD ./node /data/remote

RUN mkdir -p /data/remote/options && \
	useradd -u 1000 -s /bin/bash -d /data/remote remote && \
    echo "remote ALL= NOPASSWD: /usr/bin/arp-scan" | cat >> /etc/sudoers && \
    echo "remote ALL= NOPASSWD: /sbin/ip" | cat >> /etc/sudoers && \
    ln -s /usr/bin/nodejs /usr/bin/node && \
    ln -s /data/remote/register /usr/bin/register && \
    chown -R remote:remote /data/remote

USER remote

WORKDIR /data/remote

RUN npm install .

ENTRYPOINT ["node", "app.js"]