# VOLUME_DEVICE="$(HOME)/data"
# VOLUME_WP_DEVICE="$(VOLUME_DEVICE)/wordpress"
# VOLUME_MDB_DEVICE="$(VOLUME_DEVICE)/mariadb"
DOCKER_INSTALL=/usr/bin/docker
ENV=./.env

all: $(DOCKER_INSTALL) $(ENV) #$(VOLUME_WP_DEVICE) $(VOLUME_MDB_DEVICE)
	docker compose -f docker-compose.yml up -d --build 

# $(DOCKER_INSTALL):
# 	sudo apt-get update
# 	sudo apt-get install -y ca-certificates curl
# 	sudo install -m 0755 -d /etc/apt/keyrings
# 	sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
# 	sudo chmod a+r /etc/apt/keyrings/docker.asc
# 	echo \
# 		"deb [arch=$$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
# 		$$(. /etc/os-release && echo "$$VERSION_CODENAME") stable" | \
# 		sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# 	sudo apt-get update
# 	sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

fclean: clean
	@echo "Removing volumes"
# sudo rm -rf $(VOLUME_WP_DEVICE)
# sudo rm -rf $(VOLUME_MDB_DEVICE)

clean:
	@echo "Stoping dockers and removing everything"
	-docker stop $$(docker ps -qa) 2>/dev/null
	-docker rm $$(docker ps -qa) 2>/dev/null
	-docker rmi -f $$(docker images -qa) 2>/dev/null
	-docker volume rm $$(docker volume ls -q) 2>/dev/null
	-docker network rm $$(docker network ls -q) 2>/dev/null

re: fclean all

status:
	docker ps
	docker volume ls
	docker image ls
	docker image ls
	docker network ls

exec-web3-tournament:
	docker exec -it web3-tournament bash

exec-eth-client:
	docker exec -t web3-tournament python3 eth_client_script.py

exec-eth-daemon:
	docker exec -t web3-tournament python3 daemon.py

exec-testnet:
	docker exec -it ethereum-testnet /bin/sh

exec-hardhat-network:
	docker exec -it hardhat-network /bin/sh

# ls $(VOLUME_DEVICE)

# $(VOLUME_WP_DEVICE):
# 	mkdir -p $(VOLUME_WP_DEVICE)

# $(VOLUME_MDB_DEVICE):
# 	mkdir -p $(VOLUME_MDB_DEVICE)

# $(VOLUME_AMR_DEVICE):
# 	mkdir -p $(VOLUME_AMR_DEVICE)

.phony: all status clean fclean re exec-tournament exec-testnet exec-eth-daemon


# sudo apt-get update
# sudo apt-get install -y ca-certificates curl
# sudo install -m 0755 -d /etc/apt/keyrings
# sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
# sudo chmod a+r /etc/apt/keyrings/docker.asc
# echo \
# 	"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
# 	$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
# 	sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# sudo apt-get update
# sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# sudo docker stop $(sudo docker ps -qa); sudo docker rm $(sudo docker ps -qa); sudo docker rmi -f $(sudo docker images -qa); sudo docker volume rm $(docker volume ls -q); sudo docker network rm $(sudo docker network ls -q) 2>/dev/null