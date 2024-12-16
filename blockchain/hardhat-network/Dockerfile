# syntax=docker/dockerfile:1
FROM	node:22-alpine AS hardhat-network

#Check npm
RUN nodejs --version
RUN npm --version

#Hardhat
RUN mkdir hh;
WORKDIR /hh/
RUN npm init -y; \
	npm install --save-dev hardhat;
COPY ./hardhat.config.js .

EXPOSE 8545

COPY ./entrypoint.sh /.
WORKDIR /hh/
ENTRYPOINT		[ "sh", "/entrypoint.sh" ]
CMD				[ "npx", "hardhat", "node"]
