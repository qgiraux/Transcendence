# VOLUME_DEVICE="$(HOME)/data"
# VOLUME_WP_DEVICE="$(VOLUME_DEVICE)/wordpress"
# VOLUME_MDB_DEVICE="$(VOLUME_DEVICE)/mariadb"
DOCKER=/usr/bin/docker
NAME=web3-tournament
# ENV=./srcs/.env

# all: $(DOCKER_INSTALL) $(VOLUME_WP_DEVICE) $(VOLUME_MDB_DEVICE)
# 	sudo docker compose -f srcs/docker-compose.yml up -d --build 

all:
	docker build -t ${NAME} .
	docker run --name ${NAME} -d ${NAME}

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
# ls $(VOLUME_DEVICE)

# $(VOLUME_WP_DEVICE):
# 	mkdir -p $(VOLUME_WP_DEVICE)

# $(VOLUME_MDB_DEVICE):
# 	mkdir -p $(VOLUME_MDB_DEVICE)

# $(VOLUME_AMR_DEVICE):
# 	mkdir -p $(VOLUME_AMR_DEVICE)

exec:
	docker exec -it ${NAME} bash

logs:
	docker logs ${NAME}

.phony: all status clean fclean re exec logs
