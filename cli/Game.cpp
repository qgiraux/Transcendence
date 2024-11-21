/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Game.cpp                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 12:45:15 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 14:13:39 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cli_utils_constants.h"
#include "cli_utils.hpp"
#include "Game.hpp"
#include <iostream>

Game::Game(void) :
	_ball_x(0),
	_ball_y(0),
	_paddle_left_pos(0), //BUG pos
	_paddle_left_len(0),
	_paddle_right_pos(0),
	_paddle_right_len(0),
	_paddle_left_char_len(0),
	_paddle_right_char_len(0),
	_paddle_left_char_posx(0),
	_paddle_right_char_posx(0),
	_paddle_left_char_posy(0),
	_paddle_right_char_posy(0),
	_ball_posx(0),
	_ball_posy(0),
	_score_left(0),
	_score_right(0),
	_max_ball_x(0),
	_max_ball_y(0),
	_game_status(-1),
	_frame(0),
	_screen_xmax(0),
	_screen_ymax(0),
	_score_left_x(0),
	_score_right_x(0),
	_score_y(0),
	_net_x(0)
{}

Game::~Game(void) {};

void	Game::updateGame(void)
{
	this->apiGetUpdate();
	if (this->_frame % 2)
	{
		this->printNet();
		this->clearPaddle();
		this->printPaddle();
		this->printScore();
		this->clearBall();
		this->printBall();
	}
	this->_frame += 1;
}

// int			Game::apiGetIni(void) // TODO: API GET
// {
// 	this->_max_ball_x = 60 << 1;
// 	this->_max_ball_y = 20 << 1;
// 	this->_paddle_left_len = 4 << 1;
// 	this->_paddle_right_len = 4 << 1;
// 	this->_game_status = 0;

// 	return 0;
// }

void		Game::printNet(void)
{
	cli_move_cursor_to(this->_net_x, 1);
	for (t_cpos y = 0; y != this->_screen_ymax; ++y)
		std::cout << CLI_NETCELL << CLI_ANSI_CURSOR_1BACK1DOWN;
}

int		Game::onKeyPress(t_key key) // TODO: Mutltiple players?
{
	if (CLI_PLAYER1UP == key) //Do Stuff
		this->apiPostUp();
	else if (CLI_PLAYER1DOWN == key) //Do Stuff
		this->apiPostDown();
	return 0;
}

void		Game::printScore(void)
{
	cli_move_cursor_to(this->_score_left_x, this->_score_y);
	cli_print_score(this->_score_left);
	cli_move_cursor_to(this->_score_right_x, this->_score_y);
	cli_print_score(this->_score_right);
}

// int			Game::apiGetUpdate(void) // TODO: API GET
// {	
// 	this->_score_left = 5;
// 	this->_score_right = 42;
// 	if (0 == (this->_frame % 0x1000))
// 	{
// 		this->_paddle_right_pos = (this->_paddle_right_pos + 1) % this->_max_ball_y;
// 		this->_ball_x = (this->_ball_x + 1) % this->_max_ball_x;
// 		this->_ball_y = (this->_ball_y + 1) % this->_max_ball_y;
// 	}
// 	return 0;
// }

void		Game::printPaddle(void)
{
	t_pix const posLeftY = this->_paddle_left_pos; // TODO: terminal/service conversion
	t_pix const posLeftX = 0; // TODO: terminal/service conversion

	this->_paddle_left_char_posx = 1 + (posLeftX >> 1); // TODO: terminal/service conversion
	this->_paddle_left_char_posy = (posLeftY >> 1); // TODO: terminal/service conversion
	cli_move_cursor_to( \
		this->_paddle_left_char_posx, this->_paddle_left_char_posy);
	this->_paddle_left_char_len = \
		cli_paddle_print_left(this->_paddle_left_len, posLeftY);

	t_pix const posRightY = this->_paddle_right_pos; // TODO: terminal/service conversion
	t_pix const posRightX = this->_max_ball_x; // TODO: terminal/service conversion

	this->_paddle_right_char_posx = 3 + (posRightX >> 1); // TODO: terminal/service conversion
	this->_paddle_right_char_posy = (posRightY >> 1); // TODO: terminal/service conversion
	cli_move_cursor_to( \
		this->_paddle_right_char_posx, this->_paddle_right_char_posy);
	this->_paddle_right_char_len = \
		cli_paddle_print_right(this->_paddle_right_len, posRightY);
}

void	Game::_clearSinglePaddle(t_cpos x0, t_cpos y0, t_cpos len, t_cpos y_max)
{
	t_cpos y1 = y0 + len;

	cli_move_cursor_to(x0, 1);
	for (t_cpos y = 1; y < y0; ++y)
		std::cout << " " << CLI_ANSI_CURSOR_1BACK1DOWN;
	cli_move_cursor_to(x0, y1);
	for (t_cpos y = y1; y < y_max; ++y)
		std::cout << " " << CLI_ANSI_CURSOR_1BACK1DOWN;
}

void	Game::printBall(void)
{
	const char *ball_lrud[4] = {"▘", "▝", "▖", "▗"}; //

	this->_ball_posx = 3 + this->_ball_x / 2; // TODO: terminal/service conversion
	this->_ball_posy = 1 + this->_ball_y / 2; // TODO: terminal/service conversion
	cli_move_cursor_to(this->_ball_posx, this->_ball_posy);
	cli_print_ball(this->_ball_x, this->_ball_y, ball_lrud);
}

void	Game::clearBall(void)
{
	cli_move_cursor_to(this->_ball_posx, this->_ball_posy); 
	std::cout << " ";
}

void		Game::clearPaddle(void)
{

	_clearSinglePaddle(this->_paddle_left_char_posx, this->_paddle_left_char_posy, \
		this->_paddle_left_char_len, this->_screen_ymax);
	_clearSinglePaddle(this->_paddle_right_char_posx, this->_paddle_right_char_posy, \
		this->_paddle_right_char_len, this->_screen_ymax);
}

// int			Game::apiPostUp(void) // TODO: API POST
// {
// 	this->_paddle_left_pos = (this->_paddle_left_pos - 1) % this->_max_ball_y;
// 	return 0;
// }

// int			Game::apiPostDown(void) // TODO: API POST
// {
// 	this->_paddle_left_pos = (this->_paddle_left_pos + 1) % this->_max_ball_y;
// 	return 0;
// }



void	Game::iniScreen(void)
{
	this->_screen_xmax = 2 + (this->_max_ball_x >> 1); // TODO: terminal/service conversion
	this->_screen_ymax = (this->_max_ball_y >> 1); // TODO: terminal/service conversion
	this->_net_x = this->_screen_xmax >> 1;
	t_cpos x = this->_net_x >> 1;
	this->_score_left_x = x;
	this->_score_right_x = 3 * x;
	this->_score_y = CLI_DIPLAY_SCORE_ROW;
	std::string const line = std::string(this->_screen_xmax, ' ');

	std::cout << "\e[0;0H" << CLI_ANSI_HIDE_CURSOR; 
	for (t_pix i = 0; i != this->_screen_ymax; ++i)
		std::cout << line << "\n";
}

void	Game::destroyScreen(void)
{
	cli_move_cursor_to(this->_screen_xmax, this->_screen_ymax); 
	std::cout << CLI_ANSI_SHOW_CURSOR << std::endl;
}

// const int	&Game::getScoreLeft(void) const
// {
// 	return this->_score_left;
// }

// const int	&Game::getScoreRight(void) const
// {
// 	return this->_score_right;
// }

// const t_pix	&Game::getPaddleLeftPos(void) const
// {
// 	return this->_paddle_left_pos;
// }

// const t_pix	&Game::getPaddleRightPos(void) const
// {
// 	return this->_paddle_right_pos;
// }

// const t_pix	&Game::getPaddleLeftLen(void) const
// {
// 	return this->_paddle_left_len;
// }

// const t_pix	&Game::getPaddleRightLen(void) const
// {
// 	return this->_paddle_right_len;
// }

// const t_pix	&Game::getBallX(void) const
// {
// 	return this->_ball_x;
// }

// const t_pix	&Game::getBallY(void) const
// {
// 	return this->_ball_y;
// }

const t_pix	&Game::getMaxBallX(void) const
{
	return this->_max_ball_x;
}

const t_pix	&Game::getMaxBallY(void) const
{
	return this->_max_ball_y;
}