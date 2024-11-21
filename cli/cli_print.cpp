/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_print.cpp                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/16 12:03:18 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 13:11:51 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <iostream>
#include "cli_utils.hpp"
#include "cli_utils_constants.h"

void cli_print_ball(t_pix pos_x, t_pix pos_y, const char *ball_lrud[])
{
	int index = (pos_x & 1) + ((pos_y & 1) << 1); //

	if (0 > index || 3 < index) //
		return ;
	std::cout << ball_lrud[index];
}

static void _putnum_rec(int num, int const base)
{
	if (base > num)
		cli_put09(num);
	else
	{
		cli_put09(num % base);
		std::cout << CLI_ANSI_CURSOR_8BACK3UP;
		_putnum_rec(num / base, base);
	}
}

/**Prints score at current cursore position
 * Loops back at CLI_DISPLAY_SCORE_MAX
 */
void cli_print_score(int score)
{
	score = score % CLI_DISPLAY_SCORE_MAX;

	_putnum_rec(score, CLI_DISPLAY_BASE);
}
