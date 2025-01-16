import rest_framework.serializers

class IpfsSerializer(rest_framework.serializers.Serializer):
    cid = rest_framework.serializers.CharField(32)
    content = rest_framework.serializers.TextField()

class AddressSerializer(rest_framework.serializers.Serializer):
    hex_string = rest_framework.serializers.CharField(42)
