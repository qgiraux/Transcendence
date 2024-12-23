/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Screen.cpp                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/28 15:08:56 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/29 12:57:51 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "Screen.hpp"
#include "cli_utils_constants.h" //
#include <iostream>
#include <string>

Screen::~Screen(void)
{
	std::cout << CLI_ANSI_SHOW_CURSOR;
}

Screen::Screen(t_cpos x_min, t_cpos x_max, t_cpos y_min, t_cpos y_max) :
	_x_min(x_min),
	_y_min(y_min),
	_x_max(x_max),
	_y_max(y_max),
	_cursor_x(0),
	_cursor_y(0)
{
	std::cout << CLI_ANSI_HIDE_CURSOR;
	this->clearLines();
}

void Screen::clearLines(void)
{
	for (this->_cursor_y = this->_y_min; this->_cursor_y != this->_y_max; ++this->_cursor_y)
	{
		this->_cursor_x = this->_x_min;
		this->moveCursor();
		std::cout << "\e[2K";
	}
}

void Screen::clearArea(void)
{
	for (this->_cursor_y = this->_y_min; this->_cursor_y != this->_y_max; ++this->_cursor_y)
	{
		this->moveCursor();
		for (this->_cursor_x = this->_x_min; this->_cursor_x != this->_x_max; ++this->_cursor_x)
			std::cout << CLI_EMPTY_CHAR;
		//std::cout  << '\n';
	}
}

int Screen::putPrintable(char *str, t_clen lx=0, t_clen ly=0)
{
	if (NULL == str)
		return 1;
	t_cpos const xmin = this->_cursor_x;
	t_cpos const xmax = (0 == lx) ? this->_x_max : xmin + lx;
	t_cpos const ymax = (0 == ly) ? this->_y_max : this->_cursor_y + ly;

	while ('\0' != *str)
	{
		if (this->_cursor_x == xmax)
		{
			if (moveCursorNewline(xmin) || this->_cursor_y == ymax)
				return 1;
		}
		std::cout << *str++;
		this->_cursor_x++;
	}
	return 0;
}

int	Screen::moveCursor(t_cpos x, t_cpos y)
{
	if (x >= this->_x_max || y >= this->_y_max || 1 > x || 1 > y)
		return 1;
	this->_cursor_x = x;
	this->_cursor_y = y;
	std::cout << "\e[" << y << ";" << x << "H";
	return 0;
}

int	Screen::moveCursor(void)
{
	if (this->_cursor_x >= this->_x_max \
		|| this->_cursor_y >= this->_y_max \
		|| 1 > this->_cursor_x \
		|| 1 > this->_cursor_y \
	)
		return 1;
	std::cout << "\e[" << this->_cursor_y << ";" << this->_cursor_x << "H";
	return 0;
}

int	Screen::moveCursorNewline(t_cpos p0=1)
{
	if (this->_cursor_y == this->_y_max - 1)
		return 1;
	this->_cursor_y++;
	this->_cursor_x = p0;
	this->moveCursor();
	return 0;
}

void	Screen::moveAfterScreen(void) const
{
	std::cout \
		<< "\e[" \
		<< this->_y_max - 1 << ";" << this->_x_max - 1 \
		<< "H" \
		<< std::endl \
	;
}

void	Screen::_drawBorderElement(std::size_t const &index) const
{
	const char *elements[9] = {"▗", "▄", "▖", "▐", " ", "▌", "▝", "▀", "▘"};

	std::cout << elements[index];
}

void	Screen::drawBox(t_clen lx=0, t_clen ly=0)
{
	t_cpos const xmin = this->_cursor_x;
	t_cpos const ymin = this->_cursor_y;
	t_cpos const xmax = (0 == lx) ? this->_x_max : xmin + lx;
	t_cpos const ymax = (0 == ly) ? this->_y_max : ymin + ly;
	std::size_t	index_x = 0;
	std::size_t	index_y = 0;

	while (index_x != 2 || index_y != 2)
	{
		if (xmin == this->_cursor_x)
			index_x = 0;
		else if (xmax - 1 == this->_cursor_x)
			index_x = 2;
		else
		{
			index_x = 1;
		}
		if (ymin == this->_cursor_y)
			index_y = 0;
		else if (ymax - 1 == this->_cursor_y)
			index_y = 2;
		else
		{
			if (1 == index_x)
			{
				this->_cursor_x = xmax - 1;
				this->moveCursor();
				index_x = 2;
			}
			index_y = 1;
		}
		this->_drawBorderElement(index_x + 3 * index_y);
		if (2 == index_x)
		{
			if (this->moveCursorNewline(xmin))
				return;
		}
		else
			this->_cursor_x++;
	}
}

int main(void)
{
	Screen s(1, 30, 1, 20);

	s.moveCursor(2, 2);
	s.drawBox(5, 5);
	s.moveCursor(3, 3);
	s.putPrintable((char *)"0123456789012345678901234567890123456789", 3, 3);
	s.moveAfterScreen();
}
