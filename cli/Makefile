# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/02/06 10:28:10 by jerperez          #+#    #+#              #
#    Updated: 2024/11/16 16:03:04 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME = pong-cli

CXX = c++
CPPFLAGS = -Wall -Wextra -Werror -std=c++98	

SRCS	=	main.cpp \
			cli_field.cpp \
			cli_demo.cpp \
			cli_paddle.cpp \
			cli_print.cpp \
			cli_put09.cpp \
			cli_game_loop.cpp \
			cli_keys.cpp \
			cli_cursor.cpp \
			cli_parse_args.cpp \
			Game.cpp \
			Game_api.cpp

OBJ_DIR	=	obj

OBJ		= 	$(SRCS:.cpp=.o)
OBJS	= 	$(addprefix $(OBJ_DIR)/, $(OBJ))

###############################################

_COLOR_END=\033[0m
_COLOR_BOLD=\033[1m
_COLOR_RED=\033[31m
_COLOR_GREEN=\033[32m
_COLOR_YELLOW=\033[33m

###############################################

all: $(NAME)

$(NAME): $(OBJS)
	@$(CXX) $(CPPFLAGS) -o $@ $^
	@echo "$(_COLOR_GREEN)Ready to use $(_COLOR_BOLD)$(NAME) !$(_COLOR_END)"

-include $(OBJS:.o=.d)

$(OBJ_DIR)/%.o: %.cpp
	@echo Compiling: $<
	@mkdir -p $(@D)
	@$(CXX) $(CPPFLAGS) -MMD -MP -c -o $@ $<

clean:
	@rm -rf $(OBJ_DIR)/
	@echo "$(_COLOR_YELLOW)$(OBJ_DIR) directory removed.$(_COLOR_END)"

fclean: clean
	@rm -f $(NAME) $(NAME_B)
	@echo "$(_COLOR_YELLOW)Program(s) removed.$(_COLOR_END)"

re: fclean all

.PHONY: all re clean fclean
