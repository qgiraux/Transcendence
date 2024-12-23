#VOLUME_DEVICE="$(HOME)/data"
DOCKER=/usr/bin/docker
NAME=nodejs
# ENV=./srcs/.env

all:
	docker build -t ${NAME} .
	docker run --name ${NAME} -d ${NAME}

fclean: clean
	@echo "Removing volumes"

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

logs:
	docker logs ${NAME}

.phony: all status clean fclean re exec logs