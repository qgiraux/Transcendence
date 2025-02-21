#########################################################
### VARIABLES
#########################################################

Off=\033[0m       # Text Reset
Blue=\033[0;34m         # Blue
Purple=\033[1;95m    # Bold Light Purple
Red=\033[1;31m        # Red
Green=\033[0;32m       # Green

CLI_MODULES=cli/node_modules/
PORT=5000

#########################################################
### REGLES
#########################################################
.PHONY:		all init up down prune re cli cli-fclean status rm


all: build up cli

status:
	docker ps
	docker volume ls
	docker image ls
	docker image ls
	docker network ls

#regle re : wipe les container et reconstruit tout
re: rm all

$(CLI_MODULES):
	make -C cli/ all

cli: $(CLI_MODULES)

cli-fclean:
	make -C cli/ fclean

build:
	@if [ ! -f .env ]; then \
			echo "Error: the .env file is missing -> exiting"; \
			exit 1; \
		fi
	@echo "🔧 Building the images..."
	@docker compose  -f docker-compose.yml build

#cree et demarre les container
up:
	@ echo '🚀      starting the containers...'
	@docker compose  -f docker-compose.yml up -d
	@echo "💻      https://localhost:$(PORT)"
	@echo '🌐      https://'$$(ifconfig | awk '/enp0s/{eth=1} /inet /{if (eth) {print $$2; exit;}}')':$(PORT)'


rm: down
	@ echo '🗑️      removing everything docker but cache...'
	-docker stop $$(docker ps -qa) 2>/dev/null || true
	-docker rm $$(docker ps -qa) 2>/dev/null || true
	-docker rmi -f $$(docker images -qa) 2>/dev/null || true
	-docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	-docker network rm $$(docker network ls -q) 2>/dev/null || true

stop:
	@ echo '✋🏻     stopping the containers...'
	@docker compose  -f docker-compose.yml stop

#stoppe les container et les detruits avec le network
down:
	@ echo '🚫   shutting down containers..'
	@docker compose -f docker-compose.yml  down

#efface les container, les images, et  les caches
prune: down
	@echo "👨‍🌾 Let's prune all this mess"
	@docker container prune -f
	@docker image prune -fa
	@docker system prune -f

wipe-volumes: prune
	@./tools/wipe_volumes.sh


logs:
	@echo "${Blue}=========== LOGS NGINX     ===============${Off}"
	@docker logs nginx
	@echo "${Blue}===========  ############  ===============${Off}"
	@echo "${Blue}=========== LOGS USERS     ===============${Off}"
	@docker logs users
	@echo "${Blue}===========  ############  ===============${Off}"
