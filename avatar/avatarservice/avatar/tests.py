from django.test import TestCase, Client
from .models import Avatar
import uuid
from PIL import Image, ImageChops
from datetime import timedelta, datetime, timezone
import jwt
import io


def valid_jwt_token(user_id):
    """Generate a valid JWT token for testing."""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(seconds=600)
    }
    secret_key = 'django-insecure-dquen$ta141%61x(1^cf&73(&h+$76*@wbudpia^^ecijswi=q'
    return jwt.encode(payload, secret_key, algorithm='HS256')



# test la securite
# refuse les connexios sans token valide
#envoie bien la bonne uuid
# renvoie une erreur si le format d'image n'est pas bon
# renvoie une erreur si le l'image est trop lourde

class MyTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.token = valid_jwt_token(1)

    def test_NoToken(self):
        c = Client()
        response = c.get(path='/avatar_list/')
        assert(response.status_code == 401)

    def test_Token(self):
        c = Client()
        response = c.get(path='/avatar_list/',
                         HTTP_AUTHORIZATION=f"Bearer {self.token}")
        assert(response.status_code == 200)

    def test_UploadPath(self):
        c = Client()
        with open('avatar/tests-images/test-image.jpg', 'rb') as img:
            response = c.post(
                path='/upload/',
                data={"image": img},
                HTTP_AUTHORIZATION=f"Bearer {self.token}"
            )
        assert response.status_code == 201


    def test_randomUUID(self):
        c = Client()
        response = c.get(path=f"/avatar/{uuid.uuid4()}/")
        assert(response.status_code == 200)
        image_data = response.content
        received_img = Image.open(io.BytesIO(image_data))
        with Image.open('helpers_images/avatar_default.jpg') as default_img:
            diff = ImageChops.difference(received_img, default_img)
        assert diff.getbbox() == None

    def test_UUIDChange(self):
            c = Client()
            with open('avatar/tests-images/test-image.jpg', 'rb') as img:
                upload1_response = c.post(
                    path='/upload/',
                    data={"image": img},
                    HTTP_AUTHORIZATION=f"Bearer {self.token}"
                )
            assert upload1_response.status_code == 201
            first_uuid = upload1_response.json()['uuid']
            #check that the first uuid url works
            get1_response = c.get(f"/avatar/{first_uuid}/")
            assert get1_response.status_code == 200

            with open('avatar/tests-images/test-image.jpg', 'rb') as img:
                upload2_response = c.post(
                    path='/upload/',
                    data={"image": img},
                    HTTP_AUTHORIZATION=f"Bearer {self.token}"
                )
            assert upload2_response.status_code == 200
            second_uuid = upload2_response.json()['uuid']
            assert first_uuid != second_uuid

            #checks that the second uuid url works
            get2_response = c.get(f"/avatar/{second_uuid}/")
            assert get2_response.status_code == 200
            #and that the first response returns the default avatar
            get1_response = c.get(f"/avatar/{first_uuid}/")
            assert get1_response.status_code == 200
            image_data = get1_response.content
            received_img = Image.open(io.BytesIO(image_data))
            with Image.open('helpers_images/avatar_default.jpg') as default_img:
                diff = ImageChops.difference(received_img, default_img)
                assert diff.getbbox() == None

    def test_ImgtooBig(self):
        c = Client()
        with open('avatar/tests-images/toobig.jpg', 'rb') as img:
            response = c.post(
                path='/upload/',
                data={"image": img},
                HTTP_AUTHORIZATION=f"Bearer {self.token}"
            )
        assert response.status_code == 400

    def test_UnsupportedFormat(self):
        c = Client()
        with open('avatar/tests-images/bad_format.psd', 'rb') as img:
            response = c.post(
                path='/upload/',
                data={"image": img},
                HTTP_AUTHORIZATION=f"Bearer {self.token}"
            )
        assert response.status_code == 400

    def test_UnsupportedFormatMalicious(self): # weird binary file pretending to be an image
        c = Client()
        with open('avatar/tests-images/bad_format.jpg', 'rb') as img:
            response = c.post(
                path='/upload/',
                data={"image": img},
                HTTP_AUTHORIZATION=f"Bearer {self.token}"
            )
        assert response.status_code == 400
