# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    models.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/16 11:19:17 by jerperez          #+#    #+#              #
#    Updated: 2025/01/16 11:19:36 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import django.db.models

class Ipfs(django.db.models.Model):
	cid = django.db.models.CharField(32, primary_key=True)
	content = django.db.models.TextField()
	def __str__(self):
		return self.content 

class Address(django.db.models.Model):
	hex_string = django.db.models.CharField(42, primary_key=True)
	def __str__(self):
		return self.hex_string 

class File(django.db.models.Model):
	path = django.db.models.CharField(32, primary_key=True)
	content = django.db.models.TextField()
	def __str__(self):
		return self.content 
