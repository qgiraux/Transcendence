/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cli_parse_args.cpp                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/11/16 14:31:51 by jerperez          #+#    #+#             */
/*   Updated: 2024/11/16 16:05:59 by jerperez         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <string>
#include <map>
#include <iostream>
#include "cli_utils.hpp"

typedef std::map< std::string, std::map<std::string, std::string> > _t_args;


static void _print_version()
{
	std::cerr << "pong-cli version 0.0.1" << std::endl;
}

static void _print_help()
{
	std::cerr << "usage: pong-cli [--version] [-h | --help ] [--demo]" << std::endl;
}

static int _parse_option(int &i, char *words[], _t_args &args)
{
	if (NULL == words[i])
		return 1;
	std::string const	s(words[i]);
	std::size_t const	pos = s.find('=', 0);
	int	const			i0 = i;

	if (s.npos != pos)
		return 0;
	++i;
	if ("-h" == s || "--help" == s)
		args[""].insert(std::pair<const std::string, std::string>("--help", s));
	else if ("--version" == s)
		args[""].insert(std::pair<const std::string, std::string>("--version", s));
	else if ("--demo" == s)
		args[""].insert(std::pair<const std::string, std::string>("--demo", s));
	else
		i = i0;
	return 0;
}

static int _parse_option_with_argument(int i, char *words[], _t_args &args)
{
	if (NULL == words[i])
		return -1;
	std::string const	s(words[i]);
	std::size_t const	pos = s.find('=', 0);

	if (s.npos == pos)
		return i;
	std::string const option = s.substr(0,pos);

	if ("--option-with-arg" == option) // TODO: add option list
		args[""].insert(std::pair<const std::string, std::string>(option, s.substr(pos + 1)));
	return ++i;
}

static int	_parse_args(int n, char *words[], _t_args &args)
{
	int	i0;
	int	i;

	args[""].insert(std::pair<const std::string, std::string>("", ""));
	i = 0;
	while (i < n)
	{
		i0 = i;
		if (_parse_option(i, words, args))
			return 1;
		if (i < n && _parse_option_with_argument(i, words, args))
			return 1;
		if (i == i0)
		{
			std::cerr << "pong-cli: error: `" \
				<< words[i] \
				<< "` is not a valid option." \
			<< std::endl;
			return 1;
		}
	}
	return 0;
}

static int _eval_args(_t_args &args)
{
	if ("" != args[""]["--version"])
		_print_version();
	else if ("" != args[""]["--help"])
		_print_help();
	else if ("" != args[""]["--demo"])
		cli_demo();
	else
		cli_demo();
	return 0;
}

int cli_parse_args(int ac, char *av[], char *env[])
{
	_t_args args;

	(void)env;
	if (_parse_args(ac - 1, av + 1, args))
	{
		_print_help();
		return 2;
	}
	_eval_args(args);
	return 0;
}


// int main(int ac, char *av[], char *env[])
// {
// 	_t_args args;

// 	(void)env;
// 	if (_parse_args(ac - 1, av + 1, args))
// 	{
// 		_print_help();
// 		return 2;
// 	}
// 	_eval_args(args);
// 	return 0;
// }
