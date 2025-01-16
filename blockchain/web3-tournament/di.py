# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Interface.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/12/11 12:27:58 by jerperez          #+#    #+#              #
#    Updated: 2024/12/15 14:41:16 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# #
# import sys
# #sys.path.insert(0, "/django/ipfsApp") #ugly
# sys.path.append("/django/ipfsApp")
# import models

# class DjangoInterface:
# 	""" Interfaces with django 
# 	"""
# 	class Ipfs:
# 		def save(cid, content):
# 			ipfs = models.Ipfs.objects.create(cid=cid, content=content)
# 			ipfs.save()

# async def main():
# 	""" Sets score['Cup']='Patate' then gets score['Cup'] """
# 	import logging
# 	logger = logging.getLogger(__name__)
# 	logging.basicConfig(level=logging.INFO)

# 	DjangoInterface.Ipfs.save("coucou", "salut")

# if __name__ == '__main__':
# 	import asyncio
# 	asyncio.run(main())
