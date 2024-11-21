/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_utils_constants.h                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/14 09:41:47 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 13:50:33 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef CLI_UTILS_CONSTANTS_H
# define CLI_UTILS_CONSTANTS_H

# define CLI_ANSI_HIDE_CURSOR		"\e[?25l"
# define CLI_ANSI_SHOW_CURSOR		"\e[?25h"
# define CLI_ANSI_CURSOR_1BACK1DOWN	"\e[1B\e[1D"
# define CLI_ANSI_CURSOR_NUMROWNEXT	"\e[1B\e[3D"
# define CLI_ANSI_CURSOR_8BACK3UP	"\e[3A\e[8D"
# define CLI_CTRLD	"\4"
# define CLI_ARRUP	"\x1b\x5b\x41"
# define CLI_ARRDN	"\x1b\x5b\x42"
# define CLI_BUFSZ	10
# define CLI_TIMUS	1000
# define CLI_DISPLAY_SCORE_MAX	100
# define CLI_DISPLAY_BASE		10
# define CLI_NETCELL	"।" //NOT A CHAR
# define CLI_PLAYER1UP		3
# define CLI_PLAYER1DOWN	4
# define CLI_PIXPERCHARSIZE		2
# define CLI_DIPLAY_SCORE_ROW		2

#endif
