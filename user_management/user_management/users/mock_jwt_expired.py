def mock_jwt_expired() -> dict:
    """
    Mock the default Django-rest message
    for expired/invalid token to harmonize
    the responses acrosss microservices
    """
    return {
        "detail": "Given token not valid for any token type",
        "code": "token_not_valid",
        "messages": [
            {
            "token_class": "AccessToken",
            "token_type": "access",
            "message": "Token is invalid or expired"
            }
        ]
                }
