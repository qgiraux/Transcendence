from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from concurrent.futures import ThreadPoolExecutor
from channels.layers import get_channel_layer
import redis
import datetime
import json
import logging
import uuid
import asyncio
from .models import Tournament
from asgiref.sync import async_to_sync
import random
import requests
#import subprocess

redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

logger = logging.getLogger(__name__)
game_counter = 0

def Tournament_operation(tournament):
    logger.debug("[Tournament.tournamnent] trying to start tournament...")
    try:
        lineup = tournament.player_list
        for id in lineup :
            if not redis_client.sismember('online_users', id):
                tournament.player_list.remove(id)
                tournament.save()
                logger.error(f"[Tournament.tournamnent] player {id} not online")
                return

        random.shuffle(lineup)
        exp_size = tournament.tournament_size
        size = len(lineup)
        if size not in [2 ** i for i in range(1, 4)] or size != exp_size:
            logger.error(f"[Tournament.tournamnent] Invalid tournament size: {size} or exp_size: {exp_size}")
            return
        logger.debug("[Tournament.tournamnent] starting tournament...")
        tournament.status = 1
        tournament.save()
        winner = organize_tournament(lineup, tournament)
        notification = {
        'type': 'winner_message',
        'group': f'user_{winner}',
        'message': f"'{winner}'",
        'sender': "0",
        }
        try:
            redis_client.publish("global_chat", json.dumps(notification))
        except Exception as e:
            logger.error(f"[Tournament.tournamnent] Error sending winner message: {e}")
        data = f"name={tournament.tournament_name}&result={winner}"
        headers = {'Content-Length': str(len(data)), 'Content-Type': 'application/x-www-form-urlencoded'}
        response = requests.post('http://web3-tournament/score/', data=data, headers=headers)
        if response.status_code != 201:
            logger.error(f"[Tournament.tournamnent] Failed to notify the endpoint. Status code: {response.status_code}, Response: {response.text}")
        else:
            logger.debug(f"[Tournament.tournamnent] Successfully notified the endpoint. Response: {response.text}")
        logger.debug(f"[Tournament.tournamnent]  Winner: {winner}")

        return 
    except Exception as e:
        return e


def organize_tournament(lineup, tournament):

    tournament.rounds[len(lineup)] = lineup
    tournament.save()
    if len(lineup) == 1:
        tournament.status = 2
        tournament.save()
        logger.debug(f"[[Tournament.tournamnent]  Winner: {lineup[0]}")
        return lineup[0]  # Winner
    next_lineup = []
    logger.debug(f"[Tournament.tournamnent] lineup: {lineup}")
    # Parallel execution of matches
    with ThreadPoolExecutor() as executor:
        # gamename = str(uuid.uuid4())
        futures = [
            executor.submit(asyncio.run, match(lineup[i], lineup[i + 1], str(uuid.uuid4())))
            for i in range(0, len(lineup), 2)
        ]
        for future in futures:
            next_lineup.append(future.result())

    return organize_tournament(next_lineup, tournament)


async def match(player1, player2, gamename):
    logger.info(f"[Tournament.tournamnent] Match {gamename} between {player1} and {player2}")
    channel_layer = get_channel_layer()
    if not redis_client.sismember('online_users', player1):
        return player2
    if not redis_client.sismember('online_users', player2):
        return player1
    # Simulate a channel name for this task
    channel_name = f"channel_{gamename}_{player1}_{player2}".replace("-", "_")

    # Add the simulated channel to the group
    await channel_layer.group_add(
        f"game_{gamename}",
        channel_name
    )

     # Send an initial message to the group
    message = {'type': 'create', 'data': {'name': gamename}}
    await channel_layer.group_send(
        f"game_{gamename}",
        message
    )
    # asyncio.sleep(1)

    # Notification logic
    notification = {
        'type': 'game_message',
        'group': f'user_{player1}',
        'message': f"'{gamename}'",
        'sender': "0",
    }
    try:
        redis_client.publish("global_chat", json.dumps(notification))
        notification['group'] = f'user_{player2}'
        redis_client.publish("global_chat", json.dumps(notification))
    except Exception as e:
        logger.error(f"[Tournament.tournamnent] Error sending game-on message: {e}")

   

    # Wait for messages from the group
    while True:
        logger.debug(f"[Tournament.tournamnent] Waiting for message from: game_{gamename}")
        message = await channel_layer.receive(channel_name)  # Use `receive` for the specific channel
        logger.debug(f"[Tournament.tournamnent] Received message: {message}")

        # Check for game over condition
        if message.get("type") == "game_over":
            logger.debug(f"[Tournament.tournamnent] Game over: {message}")
            return message.get("state").get("winner")
