import rest_framework.serializers

class Tournament:
	def __init__(self, name: str, result : str):
		self.name = name
		self.result = result
	def __str__(self):
		return f"score[{self.name}]=`{self.result}`"

class TournamentSerializer(rest_framework.serializers.Serializer):
	name = rest_framework.serializers.CharField(max_length=32)
	result = rest_framework.serializers.CharField(max_length=32)
