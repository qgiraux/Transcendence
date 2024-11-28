# syntax=docker/dockerfile:1
FROM	ubuntu:latest AS ethereum-private

RUN		set -eux; \
			apt-get update -y; \
			apt-get install -y \
				wget \
			; \
			apt-get clean all;
#software-properties-common \

# RUN 	set -eux; \
# 			add-apt-repository -y ppa:ethereum/ethereum; \
# 			apt-get update -y; \
# 			apt-get install -y \
# 				ethereum \
# 			; \
# 			apt-get clean all;

# #Install Go
# #https://go.dev/doc/install
# RUN wget https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz
# RUN tar -C /usr/local -xzf go1.13.5.linux-amd64.tar.gz
# ENV PATH="$PATH:/usr/local/go/bin"
# #
# RUN go version

# Must be < 1.14
RUN wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.15-c5ba367e.tar.gz
RUN tar -C /tmp -xzf geth-linux-amd64-1.13.15-c5ba367e.tar.gz
RUN mv /tmp/geth-linux-amd64-1.13.15-c5ba367e/geth /sbin/geth
#
RUN geth --version

#
COPY ./genesis.json /tmp/genesis.json
RUN geth --nodiscover --datadir /tmp/.data init /tmp/genesis.json

# RUN whereis go

# #RUN ./bin/go/go
# RUN go version

#RUN git clone https://github.com/ethereum/go-ethereum.git

# #Checking install
# RUN geth --version



RUN geth --nodiscover --datadir /.data init /tmp/genesis.json

# RUN bootnode --version
# # RUN bootnode -genkey /.data/geth/nodekey
# # RUN bootnode --genkey=boot.key
# # RUN bootnode --nodekey=boot.key

#RUN geth --datadir=path/to/custom/data/folder --bootnodes=<bootnode-enode-url-from-above>

#RUN geth init path/to/genesis.json
#geth --nodiscover --datadir /tmp/.data init /tmp/genesis.json
#geth --http --http.port 8545 --http.addr 0.0.0.0 --http.corsdomain '*' --http.api 'eth,web3' --nodiscover --http.vhosts '*' --datadir /tmp/.data init /tmp/genesis.json

COPY ./docker-entrypoint.sh /tmp/docker-entrypoint.sh

# ["geth", "--identity", "MyNodeName", "--genesis" "CustomGenesis.json --rpc --rpcport "8000" --rpccorsdomain "*" --datadir "C:\chains\VPSChain" --port "30303" --nodiscover --ipcapi "admin,db,eth,debug,miner,net,shh,txpool,personal,web3" --rpcapi "db,eth,net,web3" --autodag --networkid 1900 --nat "any"

ENTRYPOINT		[ "bash", "/tmp/docker-entrypoint.sh" ]
#CMD				[ "geth", "--datadir", "./data", "console"]
CMD ["sleep", "infinity"]
