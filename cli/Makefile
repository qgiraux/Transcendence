#########################################################
### VARIABLES
#########################################################

MODULES=node_modules/

#########################################################
### REGLES
#########################################################
.PHONY:		all clean fclean re

$(MODULES):
	@npm install

all: $(MODULES)

re: fclean all

fclean: clean
	@rm -rf ./node_modules

clean:
	@rm -f package-lock.json
