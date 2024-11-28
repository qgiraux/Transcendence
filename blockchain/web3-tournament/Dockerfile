# syntax=docker/dockerfile:1
FROM	ubuntu:latest AS web3-tournament

#TODO:cleanup apt-get install

RUN		set -eux; \
			apt-get update -y; \
			apt-get install -y \
				software-properties-common \
			; \
			add-apt-repository -y ppa:ethereum/ethereum; \
			apt-get update -y; \
			apt-get install -y \
					solc \
					python3 \
					python3-pip \
			; \
			apt-get clean all;

#Checking install
RUN solc --version
RUN python3 --version
RUN pip --version

COPY requirements.txt ./
# TODO: :( --break-system-packages
RUN pip install --break-system-packages --no-cache-dir -r requirements.txt

COPY ./docker-entrypoint.sh /tmp/docker-entrypoint.sh

COPY ./eth_client_script.py ./
COPY ./daemon.py ./
COPY ./Tournament.sol ./

ENTRYPOINT		[ "bash", "/tmp/docker-entrypoint.sh" ]
# TODO: django daemon
#CMD				[ "python3", "./daemon.py"]
CMD				[ "sleep", "infinity"]