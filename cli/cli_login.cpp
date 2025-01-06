/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_login.cpp                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/28 11:56:41 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/28 15:00:19 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <string>
#include <iostream>

int	keep_logged_in_api(void); //TODO

void	log_out_api(void) //TODO
{
	return ;
}

int	log_in_api(std::string const &user, std::string const &password) //TODO
{
	(void)user;
	std::cerr << "error: no API: password:`" << password << "`" << std::endl;
	return 0;
}

static int _check_user(std::string const &user)
{
	if ("" == user)
	{
		std::cerr << "error: invalid user: `" << user << "`" << std:: endl;
		return 1;
	}
	return 0;
}

static int _check_pass(std::string const &pass)
{
	if ("" == pass)
	{
		std::cerr << "error: invalid password: `" << pass << "`" << std:: endl;
		return 1;
	}
	return 0;
}

int	login(std::string const &user, int attempts=1)
{
	if (0 > attempts)
		return 1;
	std::string pass;

	std::cin.clear();
	while (0 != attempts && false == std::cin.eof())
	{
		std::cout << "Password for `" << user << "`:";
		std::getline(std::cin, pass);
		if (std::cin.eof())
			return 1;
		else if (_check_pass(pass) || log_in_api(user, pass))
			--attempts;
		else
		{
			std::cout << "Logged in as `" << user << "`" << std:: endl;
			return 0;
		}
	}
	return 1;
}

int	login(void)
{
	std::string user;

	std::cout << "User:";
	std::getline(std::cin, user);
	if (std::cin.eof() || _check_user(user))
		return 1;
	return login(user, 3);
}

int main(void)
{
	if (login())
		return 1;
	log_out_api();
}
