/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_game_loop.cpp                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/12 18:13:45 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 12:28:18 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <iostream>
#include <cstring>
#include "cli_utils_constants.h"
#include "cli_utils.hpp"
#include "Game.hpp"

static int _update_keypressed(std::string key, t_controlmap const &ctrls, Game &game)
{
	if (CLI_CTRLD == key)
		return 1;
	t_key const ctrlvalue = cli_get_key_pressed(key, ctrls);

	game.updateGame();
	if (0 == ctrlvalue)
		return 0;
	if (game.onKeyPress(ctrlvalue))
		return 1;
	return -1 == ctrlvalue;
}

static int _tcchangeattr(int fd0, struct termios old_termios, struct termios new_termios)
{
	new_termios = old_termios;
	new_termios.c_lflag &= (~ICANON & ~ECHO);
	return tcsetattr(fd0, TCSANOW, &new_termios ); 
}

static void _ini_read_non_blocking(int fd0, fd_set *rfds_ptr, struct timeval *timeout)
{
    timeout->tv_sec = 0;
    timeout->tv_usec = CLI_TIMUS;
	FD_ZERO(rfds_ptr);
	FD_SET(fd0, rfds_ptr);
}

static ssize_t _read_non_blocking(int fd0, char *buf, size_t nbytes, fd_set rfds, struct timeval *timeout)
{
	int	ret = select(1, &rfds, NULL, NULL, timeout);
	if (-1 == ret)
		return -1;
	else if (0 == ret)
		return 0;
	return read(fd0, buf, nbytes);
}

static int	_loop_control(int const fd0, t_controlmap const &ctrls, Game &game)
{
	char			buf[CLI_BUFSZ];
	ssize_t			bread;
	int				player_exit;
	fd_set			rfds;
	struct timeval	timeout;

	buf[0] = '\0';
	bread = 1;
	player_exit = 0;
	_ini_read_non_blocking(fd0, &rfds, &timeout);
	while (-1 != bread && 0 == player_exit)
	{
		bread = _read_non_blocking(fd0, buf, CLI_BUFSZ, rfds, &timeout);
		if (-1 != bread)
			buf[bread] = '\0';
		else
			buf[0] = '\0';
		player_exit = _update_keypressed(buf, ctrls, game);
	}
	return -1 == bread;
}

int	cli_game_loop(t_controlmap const &ctrls, Game &game)
{
	struct termios	old_termios;
	struct termios	new_termios;
	const int		fd0 = fileno(stdin);

	if (tcgetattr(fd0, &old_termios ))
		return 1;
	if (_tcchangeattr(fd0, old_termios, new_termios))
	{
		tcsetattr(fd0, TCSANOW, &old_termios);
		return 1;
	}
	if (_loop_control(fd0, ctrls, game))
	{
		tcsetattr(fd0, TCSANOW, &old_termios);
		return 1;
	}
	if (tcsetattr(fd0, TCSANOW, &old_termios))
		return 1;
	return 0;
}

// int main()
// {
// 	t_controlmap ctrls;

// 	cli_set_keys(ctrls);
// 	cli_control(ctrls);
// 	return 0;
// }
