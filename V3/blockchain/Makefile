# VOLUME_DEVICE="$(HOME)/data"
# VOLUME_WP_DEVICE="$(VOLUME_DEVICE)/wordpress"
# VOLUME_MDB_DEVICE="$(VOLUME_DEVICE)/mariadb"
DOCKER_INSTALL=/usr/bin/docker
ENV=./.env

all: $(DOCKER_INSTALL) $(ENV)
	docker compose -f docker-compose.yml up -d --build 

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

exec-hardhat-network:
	docker exec -it hardhat-network /bin/sh

test:
	docker exec -it web3-tournament python3 django/manage.py test score

.phony: all status clean fclean re exec-web3-tournament exec-hardhat-network runserver
