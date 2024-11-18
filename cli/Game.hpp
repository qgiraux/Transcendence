/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Game.hpp                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 12:45:15 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 14:10:24 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef GAME_HPP
# define GAME_HPP

# include "cli_utils.hpp"
# include <vector>

class Game
{
	public:
		typedef std::vector< std::vector< char > > t_cbuf;
	private:
		t_pix	_ball_x;
		t_pix	_ball_y;
		t_pix	_paddle_left_pos;
		t_pix	_paddle_left_len;
		t_pix	_paddle_right_pos;
		t_pix	_paddle_right_len;
		t_cpos	_paddle_left_char_len;
		t_cpos	_paddle_right_char_len;
		t_cpos	_paddle_left_char_posx;
		t_cpos	_paddle_right_char_posx;
		t_cpos	_paddle_left_char_posy;
		t_cpos	_paddle_right_char_posy;
		t_cpos	_ball_posx;
		t_cpos	_ball_posy;
		int		_score_left;
		int		_score_right;
		t_pix	_max_ball_x;
		t_pix	_max_ball_y;
		int		_game_status;
		t_cbuf	_screen_chars;
		int		_frame;
		t_cpos	_screen_xmax;
		t_cpos	_screen_ymax;
		t_cpos	_score_left_x;
		t_cpos	_score_right_x;
		t_cpos	_score_y;
		t_cpos	_net_x;
		void	_clearSinglePaddle(t_cpos x, t_cpos y, t_cpos len, t_cpos y_max);
	public:
		Game(void);
		~Game(void);
		int			apiGetUpdate(void); //Todo: get game info
		int			apiGetIni(void); //Todo: get game info
		int			apiPost(void); //Todo: post player input
		int			apiPostUp(void); //Todo: post player input
		int			apiPostDown(void); //Todo: post player input
		const int	&getScoreLeft(void) const;
		const int	&getScoreRight(void) const;
		const t_pix	&getPaddleLeftPos(void) const;
		const t_pix	&getPaddleRightPos(void) const;
		const t_pix	&getPaddleLeftLen(void) const;
		const t_pix	&getPaddleRightLen(void) const;
		const t_pix	&getPaddleLeftCharLen(void) const;
		const t_pix	&getPaddleRightCharLen(void) const;
		const t_pix	&getBallX(void) const;
		const t_pix	&getBallY(void) const;
		const t_pix	&getMaxBallX(void) const;
		const t_pix	&getMaxBallY(void) const;
		const int	&getGameStatus(void) const;
		void		updateGame(void);
		void		printNet(void);
		void		printPaddle(void);
		void		clearPaddle(void);
		void		printBall(void);
		void		clearBall(void);
		void		printScore(void);
		void		iniScreen(void);
		void		destroyScreen(void);
		int			onKeyPress(t_key key);
};

#endif
