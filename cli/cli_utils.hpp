/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_utils.hpp                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 10:08:32 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 15:57:16 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef CLI_UTILS_HPP
# define CLI_UTILS_HPP

# include <map>
# include <string>
class Game;
/** For pixel position (2 pix per char)*/
typedef std::size_t	t_pix;
/** For terminal character position (2 pix per char)*/
typedef t_pix		t_cpos;
/** For key id*/
typedef int			t_key;
typedef std::map<std::string, t_key> t_controlmap;
void	cli_set_keys(t_controlmap &ctrls);
t_key	cli_get_key_pressed(const std::string &key, t_controlmap const &ctrls);
void	ini_stdout(t_pix width, t_pix height);
void	ini_stdout(Game *game);
void	cli_paddle(Game *game);
void	move_cursor_end(Game *game);
void	cli_print_ball(Game *game);
void	cli_move_cursor(t_pix x, t_pix y);
void	cli_print_net(Game const &game);
int		cli_put09(int num);
void	cli_put_score_left(Game const &game);
void	cli_put_score_right(Game const &game);
int		cli_game_loop(t_controlmap const &ctrls, Game &game);
void	cli_paddle(t_pix length, bool at_top, bool is_left);
void	cli_print_score(int score);
t_cpos	cli_paddle_print_left(t_pix length, t_pix pos);
t_cpos	cli_paddle_print_right(t_pix length, t_pix pos);
void	cli_print_ball(t_pix pos_x, t_pix pos_y, const char *ball_lrud[]);
void	cli_clear_stdout(t_cpos width, t_cpos height);
void	cli_ini_stdout(t_cpos width, t_cpos height);
void	cli_move_cursor(t_pix x, t_pix y);
void	cli_move_cursor_to(t_cpos x, t_cpos y);
void	cli_move_cursor_to_pix(t_pix x, t_pix y);
int		cli_demo(void);
int		cli_parse_args(int ac, char *av[], char *env[]);

#endif
