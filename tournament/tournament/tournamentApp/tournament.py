from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from concurrent.futures import ThreadPoolExecutor
import json

import logging

logger = logging.getLogger(__name__)
game_counter = 0

def Tournament_operation(data):
    try:
        lineup = data.get('player_list')
        if not lineup or len(lineup) < 2 or len(lineup) & (len(lineup) - 1) != 0:
            return JsonResponse({'error': 'Lineup must contain a power of 2 players.'}, status=400)

        winner = organize_tournament(lineup)
        return JsonResponse({'winner': winner})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def organize_tournament(lineup):
    if len(lineup) == 1:
        return lineup[0]  # Winner
    next_lineup = []

    # Parallel execution of matches
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(match, lineup[i], lineup[i + 1])
            for i in range(0, len(lineup), 2)
        ]
        for future in futures:
            next_lineup.append(future.result())

    return organize_tournament(next_lineup)

def match(player1, player2):
    # This is where i connect to game engine
    pass