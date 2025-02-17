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
.PHONY:		all init up down prune tests re cli cli-fclean status rm


all: build up cli

status:
	docker ps
	docker volume ls
	docker image ls
	docker image ls
	docker network ls

#regle re : wipe les volumes et reconstruit tout
re: down all

$(CLI_MODULES):
	make -C cli/ all 

cli: $(CLI_MODULES)

cli-fclean:
	make -C cli/ fclean
 
build:
	@echo "🔧 Building the images..."
	@docker compose  -f docker-compose.yml build

test-front:
	@echo "${Purple}UNIT TESTS : FRONTEND${Off}"
	@cd ./frontend && npm i && npm test
	# @rm -rf frontend/node_modules
	@echo

test-users:
	@echo "${Purple}UNIT TESTS : USERS SERVICE${Off}"
	@docker exec -it user_management python manage.py test
	@echo

test-friends:
	@echo "${Purple}UNIT TESTS : FRIEND LIST SERVICE${Off}"
	@docker exec -it friends_list python manage.py test
	@echo

test-tournament:
	@echo "${Purple}UNIT TESTS : TOURNAMENT SERVICE${Off}"
	@docker exec -it tournament python manage.py test
	@echo

test-avatar:
	@echo "${Purple}UNIT TESTS : AVATAR SERVICE${Off}"
	@docker exec -it avatar python manage.py test
	@echo

test-up:
	@echo "🔧 Building the tests images..."
	@docker compose  -f test.docker-compose.yml build
	@ echo '🚀      starting the Django testing environement...'
	@docker compose -f test.docker-compose.yml up -d
	@ sleep 5

test-chat:
	@echo "${Purple}UNIT TESTS : FRIEND LIST SERVICE${Off}"
	@docker exec -e TESTING=1 -it chat python manage.py test chat --verbosity=1
	@echo

tests: test-front test-up test-users test-friends test-chat test-avatar down
	@./tools/wipe_test_volumes.sh



#cree et demarre les container
up:
	@ echo '🚀      starting the containers...'
	@docker compose  -f docker-compose.yml up -d
	@echo "💻      https://localhost:$(PORT)"
	@echo '🌐      https://'$$(ifconfig | awk '/enp0s/{eth=1} /inet /{if (eth) {print $$2; exit;}}')':$(PORT)'
	

stop:
	@ echo '✋🏻     stopping the containers...'
	@docker compose  -f docker-compose.yml stop

rm: down
	@ echo '🗑️      removing everything but cache...'
	-docker stop $$(docker ps -qa) 2>/dev/null
	-docker rm $$(docker ps -qa) 2>/dev/null
	-docker rmi -f $$(docker images -qa) 2>/dev/null
	-docker volume rm $$(docker volume ls -q) 2>/dev/null
	-docker network rm $$(docker network ls -q) 2>/dev/null

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
