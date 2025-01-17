import redis
import logging
import qrcode
from django.http import HttpResponse
from io import BytesIO
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp import devices_for_user

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