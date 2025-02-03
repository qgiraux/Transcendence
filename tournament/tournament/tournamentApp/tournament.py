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

redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

logger = logging.getLogger(__name__)
game_counter = 0

def Tournament_operation(tournament):
    logger.error("trying to start tournament...")
    try:
        lineup = tournament.player_list
        random.shuffle(lineup)
        exp_size = tournament.tournament_size
        size = len(lineup)
        if size not in [2 ** i for i in range(1, 3)] or size != exp_size:
            logger.error(f"Invalid tournament size: {size} or exp_size: {exp_size}")
            return
        logger.error("starting tournament...")
        tournament.status = 1
        tournament.save()
        winner = organize_tournament(lineup, tournament)
        response = requests.post('http://web3-tournament/score/', data={'name': winner, "result": "win"})
        if response.status_code != 201:
            logger.error(f"Failed to notify the endpoint. Status code: {response.status_code}, Response: {response.text}")
        else:
            logger.error(f"Successfully notified the endpoint. Response: {response.text}")
        logger.error(f"[Tournament_operation] Winner: {winner}")

        return 
    except Exception as e:
        return e


def organize_tournament(lineup, tournament):

    tournament.rounds[len(lineup)] = lineup
    tournament.save()
    if len(lineup) == 1:
        tournament.status = 2
        tournament.save()
        logger.error(f"[organize_tournament] Winner: {lineup[0]}")
        return lineup[0]  # Winner
    next_lineup = []
    logger.error(f"lineup: {lineup}")
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
    logger.error(f"Match {gamename} between {player1} and {player2}")
    channel_layer = get_channel_layer()

    # Simulate a channel name for this task
    channel_name = f"channel_{gamename}_{player1}_{player2}".replace("-", "_")

    # Add the simulated channel to the group
    await channel_layer.group_add(
        f"game_{gamename}",
        channel_name
    )

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
        logger.error(f"Error sending game-on message: {e}")

    # Send an initial message to the group
    message = {'type': 'create', 'data': {'name': gamename}}
    await channel_layer.group_send(
        f"game_{gamename}",
        message
    )

    # Wait for messages from the group
    while True:
        logger.error(f"Waiting for message from: game_{gamename}")
        message = await channel_layer.receive(channel_name)  # Use `receive` for the specific channel
        logger.error(f"Received message: {message}")

        # Check for game over condition
        if message.get("type") == "game_over":
            logger.error(f"Game over: {message}")
            return message.get("state").get("winner")
