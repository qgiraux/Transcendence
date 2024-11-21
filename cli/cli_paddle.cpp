/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_paddle.cpp                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/12 14:13:00 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 12:58:27 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <iostream>
#include "cli_utils.hpp"
#include "cli_utils_constants.h"

static t_cpos	_print_paddle_unicode(int index, char const **chars)
{
	std::cout << chars[index] << CLI_ANSI_CURSOR_1BACK1DOWN;
	return 1;
}

static t_cpos _print_paddle(t_pix pix_len, int at_top, char const **chars)
{
	t_cpos	length_char = 0;

	if (!at_top)
	{
		length_char += _print_paddle_unicode(2, chars);
		pix_len -= 1;
	}
	while (CLI_PIXPERCHARSIZE <= pix_len)
	{
		length_char += _print_paddle_unicode(1, chars);
		pix_len -= CLI_PIXPERCHARSIZE;
	}
	if (1 == pix_len)
		length_char += _print_paddle_unicode(0, chars);
	return length_char;
}

t_cpos cli_paddle_print_left(t_pix length, t_pix pos)
{
	const char *paddle[3] = {"▝", "▐", "▗"}; //

	return _print_paddle(length, 0 == pos % 2, paddle);
}

t_cpos cli_paddle_print_right(t_pix length, t_pix pos)
{
	const char *paddle[3] = {"▘", "▌", "▖"}; //

	return _print_paddle(length, 0 == pos % 2, paddle);
}
