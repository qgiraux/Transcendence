# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    serializers.py                                     :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/20 11:15:01 by jerperez          #+#    #+#              #
#    Updated: 2025/01/20 12:08:47 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import rest_framework.serializers

# class IpfsSerializer(rest_framework.serializers.Serializer):
# 	cid = rest_framework.serializers.CharField(32)
# 	content = rest_framework.serializers.TextField()

class ContractSerializer(django.db.models.Model):
	key = rest_framework.serializers.CharField(32)
	value = rest_framework.serializer.JSONField()
