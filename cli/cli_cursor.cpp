/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_cursor.cpp                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/16 13:23:46 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 13:38:27 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <iostream>
#include "cli_utils.hpp"

void	cli_move_cursor_to(t_cpos x, t_cpos y)
{
	std::cout << "\e[" << y << ";" << x << "H";
}

void	cli_move_cursor_to_pix(t_pix x, t_pix y)
{
	std::cout << "\e[" << 1 + (y >> 1) << ";" << 1 + (x >> 1) << "H";
}
