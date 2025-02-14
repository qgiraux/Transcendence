import redis
import logging
import qrcode
from django.http import HttpResponse
from io import BytesIO
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp import devices_for_user
import base64
import hmac
import time
import hashlib

logger = logging.getLogger(__name__)

def is_user_online(user_id):
    redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
    # print_redis_content()
    return redis_client.sismember('online_users', user_id)


def get_user_totp_device(user, confirmed=None):
    devices = devices_for_user(user, confirmed=confirmed)
    for device in devices:
        if isinstance(device, TOTPDevice):
            return device

def is_user_using_totp(user):
    device = get_user_totp_device(user)
    return device is not None

def generate_qr_code(request):
    # Data for the QR code (it could be a URL, string, or anything you want to encode)
    data = request

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create an image from the QR code instance
    img = qr.make_image(fill='black', back_color='white')

    # Save the image to a BytesIO object so we can send it as an HTTP response
    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response


class Token2FAAccessSignatureError(Exception):
    pass

class Token2FAExpiredError(Exception):
    pass



def generate_2FA_accesstoken(user_id: int,  secret_key:str, validity:int=60):
    """_summary_
    Generate a token embedding user_id, expiration_date and HMAC
       hash

    Args:
        user_id (int): user id
        validity (int, optional): token validity in seconds. Defaults to 60 seconds
        secret_key (str): UTF-8 str of the secret key used by hmac
    """
    validity_timestamp = int(time.time()) + validity
    data = f"{user_id}:{validity_timestamp}".encode("utf-8")
    signature = hmac.new(secret_key.encode("utf-8"), data, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode()

    return f"{user_id}:{validity_timestamp}:{signature_b64}"

def validate_2FA_accesstoken(token:str, secret_key:str):
    """_summary_
        Validate the token by checking the hmac signature
    Args:
        token (str): _description_ the user_id:expire_time:signature token
        secret_key (str): _description_ secret key to validate the token
    Raises:
        InvalidTokenError: _description_ The token is either
    """

    user_id, expire_time, signature = token.split(':')
    user_id = int(user_id)
    expire_time = int(expire_time)
    # verify the signature
    payload = f"{user_id}:{expire_time}".encode("utf-8")
    expected_signature = hmac.new(secret_key.encode("utf-8"), payload, hashlib.sha256).digest()
    expected_signature_b64 = base64.urlsafe_b64encode(expected_signature).decode()
    if not hmac.compare_digest(expected_signature_b64, signature):
        raise TokenSignatureError()
    # verify the validity
    now = int(time.time())
    if expire_time < now:
        raise Tokenexpire_timeError()



if __name__ == "__main__":
    SECRET_KEY = "this is my secret key to encode the signature"
    INVALID_KEY = "invalid"
    t = generate_token(25, INVALID_KEY, 5)
    print(t)
    # time.sleep(6)
    try:
        validate_token(t, SECRET_KEY)
        print("the token is valid !")
    except TokenSignatureError:
        print("The signature is not valid")
    except Tokenexpire_timeError:
        print("The token has expired")
