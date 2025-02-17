# syntax=docker/dockerfile:1
FROM	ubuntu:latest AS web3-tournament

#TODO:cleanup apt-get install

RUN		set -eux; \
			apt-get update -y; \
			apt-get install -y \
				jq \
				software-properties-common \
			; \
			add-apt-repository -y ppa:ethereum/ethereum; \
			apt-get update -y; \
			apt-get install -y \
					curl \
					solc \
					python3 \
					python3-pip \
			; \
			apt-get clean all;

#Checking install
RUN jq --version
RUN solc --version
RUN python3 --version
RUN pip --version

COPY requirements.txt ./
# TODO: :( --break-system-packages
RUN pip install --break-system-packages --no-cache-dir -r requirements.txt

#Checking install
RUN django-admin --version


#Compile
COPY ./TournamentScores.sol ./
COPY ./solc_input.json /.
#Web3
COPY ./contract /contract
COPY ./deploytournament.py /deploytournament.py
#django
COPY ./Interface.py /.
COPY ./django /django
#
COPY ./entrypoint.sh /.

ENTRYPOINT		[ "bash", "/entrypoint.sh" ]
CMD				["python3", "/django/manage.py", "runserver", "web3-tournament:80"]
