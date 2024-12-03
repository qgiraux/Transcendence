#########################################################
### VARIABLES
#########################################################

Off=\033[0m       # Text Reset
Blue=\033[0;34m         # Blue
Purple=\033[1;95m    # Bold Light Purple
Red=\033[1;31m        # Red
Green=\033[0;32m       # Green
#########################################################
### REGLES
#########################################################
.PHONY:		all init up down prune tests re


all: build up

#regle re : wipe les volumes et reconstruit tout
re: prune build up


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

tests: test-front test-users test-friends

#cree et demarre les container
up:
	@ echo '🚀      starting the containers...'
	@docker compose  -f docker-compose.yml up

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

logs:
	@echo "${Blue}=========== LOGS NGINX     ===============${Off}"
	@docker logs nginx
	@echo "${Blue}===========  ############  ===============${Off}"
	@echo "${Blue}=========== LOGS USERS     ===============${Off}"
	@docker logs users
	@echo "${Blue}===========  ############  ===============${Off}"
