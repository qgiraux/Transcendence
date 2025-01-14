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

redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

logger = logging.getLogger(__name__)
game_counter = 0

def Tournament_operation(tournament):
    logger.error("trying to start tournament...")
    try:
        lineup = tournament.player_list
        exp_size = tournament.tournament_size
        size = len(lineup)
        if size not in [2 ** i for i in range(1, 3)] or size != exp_size:
            logger.error(f"Invalid tournament size: {size} or exp_size: {exp_size}")
            return
        logger.error("starting tournament...")
        winner = organize_tournament(lineup)
        channel_layer = get_channel_layer()
        asyncio.run(channel_layer.group_send(
            "pong_game", json.dumps({ 'type': 'tournament_end', 'data': { 'winner': winner } })
        ))
        return 
    except Exception as e:
        return e


def organize_tournament(lineup):
    if len(lineup) == 1:
        return lineup[0]  # Winner
    next_lineup = []
    logger.error(f"lineup: {lineup}")
    # Parallel execution of matches
    with ThreadPoolExecutor() as executor:
        gamename = str(uuid.uuid4())
        logger.error(f"gamename: {gamename}")
        futures = [
            executor.submit(asyncio.run, match(lineup[i], lineup[i + 1], f"{gamename}{i}"))
            for i in range(0, len(lineup), 2)
        ]
        for future in futures:
            logger.error(f"gamename: {gamename} -- done")
            next_lineup.append(future.result())

    return organize_tournament(next_lineup)

async def match(player1, player2, gamename):
    logger.error(f"Match {gamename} between {player1} and {player2}")
    channel_layer = get_channel_layer()
    message = {
        "type": "gameon",
        "player1": player1,
        "player2": player2,
        "game": gamename,
    }
    ret = redis_client.publish(f"user_{player1}", json.dumps(message))
    logger.error(f"publish {player1}: {ret}")
    redis_client.publish(f"user_{player2}", json.dumps(message))
    
    await channel_layer.group_send(
            "pong_game", json.dumps(message)
		)
    while True:
        message = await channel_layer.receive("pong_game")
        if message.get("type") == "game_over":
            return message.get("winner")