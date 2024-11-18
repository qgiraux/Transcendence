/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_demo.cpp                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 13:33:15 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 15:53:14 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "Game.hpp"
#include "cli_utils.hpp"

int	cli_demo(void)
{
	Game game;
	t_controlmap ctrls;

	game.apiGetIni();
	game.iniScreen();
	game.printNet();
	game.apiGetUpdate();
	game.printScore();
	game.iniScreen();
	cli_set_keys(ctrls);
	cli_game_loop(ctrls, game);
	game.destroyScreen();
	return 0;
}

// int	main(void)
// {
// 	cli_demo();
// 	return 0;
// }
