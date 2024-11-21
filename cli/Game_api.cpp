/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Game_api.cpp                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 12:45:15 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 14:13:17 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "Game.hpp"

int			Game::apiGetIni(void) // TODO: API GET
{
	this->_max_ball_x = 60 << 1;
	this->_max_ball_y = 20 << 1;
	this->_paddle_left_len = 4 << 1;
	this->_paddle_right_len = 4 << 1;
	this->_game_status = 0;

	return 0;
}

int			Game::apiGetUpdate(void) // TODO: API GET
{	
	this->_score_left = 5;
	this->_score_right = 42;
	if (0 == (this->_frame % 0x1000))
	{
		this->_paddle_right_pos = (this->_paddle_right_pos + 1) % this->_max_ball_y;
		this->_ball_x = (this->_ball_x + 1) % this->_max_ball_x;
		this->_ball_y = (this->_ball_y + 1) % this->_max_ball_y;
	}
	return 0;
}

int			Game::apiPostUp(void) // TODO: API POST
{
	this->_paddle_left_pos = (this->_paddle_left_pos - 1) % this->_max_ball_y;
	return 0;
}

int			Game::apiPostDown(void) // TODO: API POST
{
	this->_paddle_left_pos = (this->_paddle_left_pos + 1) % this->_max_ball_y;
	return 0;
}
