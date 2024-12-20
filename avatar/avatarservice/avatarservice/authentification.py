from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from jwt import decode as jwt_decode
from django.conf import settings

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Appelle la méthode parente pour récupérer le token
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        # Valide le token sans associer à un utilisateur Django
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken as e:
            raise InvalidToken(f"Invalid token: {str(e)}")

        # Décodage sans vérification d'utilisateur
        payload = jwt_decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload, validated_token
