# VOLUME_DEVICE="$(HOME)/data"
# VOLUME_WP_DEVICE="$(VOLUME_DEVICE)/wordpress"
# VOLUME_MDB_DEVICE="$(VOLUME_DEVICE)/mariadb"
DOCKER=/usr/bin/docker
NAME=ethereum-testnet
# ENV=./srcs/.env

# all: $(DOCKER_INSTALL) $(VOLUME_WP_DEVICE) $(VOLUME_MDB_DEVICE)
# 	sudo docker compose -f srcs/docker-compose.yml up -d --build 

all:
	docker build -t ${NAME} .
	docker run --name ${NAME} -d ${NAME}

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

exec:
	docker exec -it ${NAME} bash
# ls $(VOLUME_DEVICE)

# $(VOLUME_WP_DEVICE):
# 	mkdir -p $(VOLUME_WP_DEVICE)

# $(VOLUME_MDB_DEVICE):
# 	mkdir -p $(VOLUME_MDB_DEVICE)

# $(VOLUME_AMR_DEVICE):
# 	mkdir -p $(VOLUME_AMR_DEVICE)

.phony: all status clean fclean re exec
