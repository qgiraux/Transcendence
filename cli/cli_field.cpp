/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_field.cpp                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 11:22:48 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 12:12:33 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <iostream>
#include <string>
#include "cli_utils.hpp"
#include "cli_utils_constants.h"
#include "Game.hpp"
#include <stdio.h> //

void cli_ini_stdout(t_cpos width, t_cpos height)
{
	std::string const line = std::string(width, ' ');

	std::cout << "\e[0;0H" << CLI_ANSI_HIDE_CURSOR; 
	for (t_pix i = 0; i != height; ++i)
		std::cout << line << "\n";
}

void cli_move_cursor(t_pix x, t_pix y)
{
	std::cout << "\e[" << 1 + (y >> 1) << ";" << 1 + (x >> 1) << "H";
}

// void ini_stdout(Game *game)
// {
// 	cli_ini_stdout(game->getMaxBallX(), game->getMaxBallY());
// }

// void move_cursor_end(Game *game)
// {
// 	cli_move_cursor(game->getMaxBallX(), game->getMaxBallY());
// 	std::cout << "\e[?25h";
// }

// int main()
// {
// 	ini_stdout(2, 2);
// 	return 0;
// }
