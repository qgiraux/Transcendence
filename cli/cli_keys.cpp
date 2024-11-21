/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_keys.cpp                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 09:14:57 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 12:29:58 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <cstdlib>
#include <string>
#include "cli_utils_constants.h"
#include "cli_utils.hpp"

t_key	cli_get_key_pressed(const std::string &key, t_controlmap const &ctrls)
{
	const t_controlmap::const_iterator	&it = ctrls.find(key);

	if (ctrls.end() == it)
		return 0;
	return it->second;
}

static void	_set_mandatory_keys(t_controlmap &ctrls)
{
	ctrls[CLI_CTRLD] = -1;
	ctrls[""] = 0;
}

void cli_set_keys(t_controlmap &ctrls)
{
	_set_mandatory_keys(ctrls);
	ctrls[CLI_ARRUP] = 1; //
	ctrls[CLI_ARRDN] = 2; //
	ctrls["w"] = CLI_PLAYER1UP; //
	ctrls["s"] = CLI_PLAYER1DOWN; //
}
