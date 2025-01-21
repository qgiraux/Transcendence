# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    models.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/16 11:19:17 by jerperez          #+#    #+#              #
#    Updated: 2025/01/20 12:08:51 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import django.db.models

# class Ipfs(django.db.models.Model):
# 	cid = django.db.models.CharField(32, primary_key=True)
# 	content = django.db.models.TextField()
# 	def __str__(self):
# 		return self.content 

class Contract(django.db.models.Model):
	address = django.db.models.CharField(42, primary_key=True)
	abi = django.db.models.JSONField()
