FROM ubuntu:latest

MAINTAINER Guillaume TORRESANI <gtorresa@student.42.fr>

RUN apt-get update && \
	apt-get install -y \
	sudo \
	npm \
	nodejs \
	net-tools \
	dnsutils \
	arp-scan && \
	apt-get clean

RUN mkdir -p /data/remote && \
	useradd -u 1000 -s /bin/bash -d /data/remote remote

RUN echo "remote ALL= NOPASSWD: /usr/bin/arp-scan" | cat >> /etc/sudoers

RUN echo "remote ALL= NOPASSWD: /sbin/ip" | cat >> /etc/sudoers

RUN ln -s /usr/bin/nodejs /usr/bin/node && ln -s /data/remote/register /usr/bin/register

ADD ./node /data/remote

RUN chown -R remote:remote /data/remote

USER remote

WORKDIR /data/remote

RUN npm install .

ENTRYPOINT ["node", "app.js"]