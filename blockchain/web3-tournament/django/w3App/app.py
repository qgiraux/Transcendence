# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    app.py                                             :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/16 10:02:43 by jerperez          #+#    #+#              #
#    Updated: 2025/01/16 10:21:18 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import django.apps

class w3AppConfig(AppConfig):
	def ready(self):
		from .models import File
		solcin = Tournament.objects.create(path="lol", content="salut")
		solcin.save()
		#File = self.get_model("File")
