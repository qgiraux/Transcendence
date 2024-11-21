/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_put09.cpp                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/12 14:13:00 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/14 11:37:02 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <iostream>
#include "cli_utils_constants.h"

typedef void (*_t_print_num)(void);
typedef const char *_t_num_row;

static void _print_num(\
	_t_num_row top, \
	_t_num_row tmd, \
	_t_num_row bmd, \
	_t_num_row bot)
{
	std::cout	<< top << CLI_ANSI_CURSOR_NUMROWNEXT \
				<< tmd << CLI_ANSI_CURSOR_NUMROWNEXT \
				<< bmd << CLI_ANSI_CURSOR_NUMROWNEXT \
				<< bot;
}

static void _print_clear(void)
{
	_print_num( \
				"   ", \
				"   ", \
				"   ", \
				"   "  \
				);
}

static void _print_0(void)
{
	_print_num( \
				"▛▀▜", \
				"▌ ▐", \
				"▌ ▐", \
				"▙▄▟"  \
				);
}

static void _print_1(void)
{
	_print_num( \
				"  ▐", \
				"  ▐", \
				"  ▐", \
				"  ▐"  \
				);
}

static void _print_2(void)
{
	_print_num( \
				"▀▀▜", \
				"▄▄▟", \
				"▌  ",  \
				"▙▄▄"  \
				);
}

static void _print_3(void)
{
	_print_num( \
				"▀▀▜", \
				"▄▄▟", \
				"  ▐",  \
				"▄▄▟"  \
				);
}

static void _print_4(void)
{
	_print_num( \
				"▌ ▐", \
				"▙▄▟", \
				"  ▐",  \
				"  ▐"  \
				);
}

static void _print_5(void)
{
	_print_num( \
				"▛▀▀", \
				"▙▄▄", \
				"  ▐",  \
				"▄▄▟"  \
				);
}

static void _print_6(void)
{
	_print_num( \
				"▛▀▀", \
				"▙▄▄", \
				"▌ ▐",  \
				"▙▄▟"  \
				);
}

static void _print_7(void)
{
	_print_num( \
				"▀▀▜", \
				"  ▐", \
				"  ▐",  \
				"  ▐"  \
				);
}

static void _print_8(void)
{
	_print_num( \
				"▛▀▜", \
				"▙▄▟", \
				"▌ ▐",  \
				"▙▄▟"  \
				);
}

static void _print_9(void)
{
	_print_num( \
				"▛▀▜", \
				"▙▄▟", \
				"  ▐",  \
				"▄▄▟"  \
				);
}

/**Prints num in terminal as 3x4 ASCII art at current cursor position
 * if 0 <= num <= 9 prints num
 * else prints spaces
 */
int cli_put09(int num)
{
	if (0 > num || CLI_DISPLAY_BASE <= num)
	{
		_print_clear();
		return 1;
	}
	const _t_print_num fun[CLI_DISPLAY_BASE] = \
	{ \
			&_print_0, &_print_1, &_print_2, \
			&_print_3, &_print_4, &_print_5, \
			&_print_6, &_print_7, &_print_8, \
			&_print_9 \
	};
	(fun[num])();
	return 0;
}

// int main (int ac, char *av[])
// {
// 	if (2 != ac || '\0' == av[1][0])
// 		return 2;
// 	int const ret = cli_put09(av[1][0] - '0');

// 	std::cout << std::endl;
// 	return ret;
// }
