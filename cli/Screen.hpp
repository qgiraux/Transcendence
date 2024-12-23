/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Screen.hpp                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/28 15:08:56 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/29 11:54:43 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef SCREEN_HPP
# define SCREEN_HPP

# include <string>

class Screen
{
	public:
		typedef std::size_t	t_cpos;
		typedef t_cpos	t_clen;
	private:
		t_cpos		_x_min;
		t_cpos		_y_min;
		t_cpos		_x_max;
		t_cpos		_y_max;
		t_cpos		_cursor_x;
		t_cpos		_cursor_y;
		Screen(void);
		void _drawBorderElement(std::size_t const &index) const;
	public:
		Screen(t_cpos x_min, t_cpos x_max, t_cpos y_min, t_cpos y_max);
		~Screen(void);
		int		moveCursor(t_clen lx, t_clen ly);
		int		moveCursor(void);
		int		moveCursorNewline(t_cpos p0);
		int		justifyCursor(t_cpos y, t_clen len);
		void	clearArea(void);
		void	clearLines(void);
		int		putPrintable(char *str, t_cpos xmax, t_cpos ymax);
		void	moveAfterScreen(void) const;
		void	drawBox(t_clen lx, t_clen ly);
};

#endif
