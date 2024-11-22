from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt
import datetime
import uuid

class LoginTests(APITestCase):
    def setUp(self):
        # Create a user with known credentials
        self.user = get_user_model().objects.create_user(username='admin', password='admin123')
        self.user = get_user_model().objects.create_user(username='admin2', password='admin1234')
        self.login_url = reverse('login')  # Adjust this to match your URL name for the login endpoint

    def test_login_returns_jwt_tokens(self):
        # Payload for login
        payload = {
            "username": "admin",
            "password": "admin123"
        }
        # Make the POST request to the login endpoint
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Assert the response contains the 'access' and 'refresh' keys
        self.assertIn('access', response.data, "'access' token is missing in the response")
        self.assertIn('refresh', response.data, "'refresh' token is missing in the response")

        # Assert that the tokens are not empty
        self.assertTrue(response.data['access'], "The 'access' token is empty")
        self.assertTrue(response.data['refresh'], "The 'refresh' token is empty")
    def test_wrong_login_does_not_return_jwt_tokens(self):
        # Payload for login
        payload = {
            "username": "adminn",
            "password": "wrong"
        }
        # Make the POST request to the login endpoint
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertNotEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Assert the response contains the 'access' and 'refresh' keys
        self.assertNotIn('access', response.data, "'access' token is missing in the response")
    def test_wrong_password_does_not_return_jwt_tokens(self):
        # Payload for login
        payload = {
            "username": "admin",
            "password": "admin1234"
        }
        # Make the POST request to the login endpoint
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertNotEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Assert the response contains the 'access' and 'refresh' keys
        self.assertNotIn('access', response.data, "'access' token is missing in the response")     
    def test_wrong_login_and_password_does_not_return_jwt_tokens(self):
        # Payload for login
        payload = {
            "username": "wrong",
            "password": "wrong"
        }
        # Make the POST request to the login endpoint
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertNotEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Assert the response contains the 'access' and 'refresh' keys
        self.assertNotIn('access', response.data, "'access' token is missing in the response")
    def test_someone_elses_password_does_not_return_jwt_tokens(self):
        # Payload for login
        payload = {
            "username": "admin2",
            "password": "admin123"
        }
        # Make the POST request to the login endpoint
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertNotEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Assert the response contains the 'access' and 'refresh' keys
        self.assertNotIn('access', response.data, "'access' token is missing in the response")

class RegisterTests(APITestCase):
    def test_create_a_user_with_valid_username_and_password(self):
        payload = {
            "username": "admin3",
            "password": "Randmpwd1254."
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status 201, got {response.status_code}")
        self.assertIn('username', response.data, "'username' is missing in the response")
        self.assertTrue(response.data['username'], "The 'username' field is empty")
    def test_create_a_user_with_valid_username_and_no_password(self):
        payload = {
            "username": "admin4",
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status is not {response.status_code}")
        self.assertNotIn('username', response.data, "'username' is in the response") 
    def test_create_a_user_with_too_short_username_and_valid_password(self):
        payload = {
            "username": "sho",
            "password": "Randmpwd1254."
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status is not {response.status_code}")
        self.assertIn('username', response.data, "'username' is not in the response")
        self.assertNotIn('password', response.data, "'password' is in the response")  
    def test_create_a_user_with_valid_username_and_invalid_password(self):
        payload = {
            "username": "admin5",
            "password": "admin5"
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status is not {response.status_code}")
        self.assertNotIn('username', response.data, "'username' is in the response")
        self.assertIn('password', response.data, "'password' is not in the response") 
    def test_create_a_user_with_forbidden_username_and_valid_password(self):
        payload = {
            "username": "sho///test",
            "password": "Randmpwd1254."
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status is not {response.status_code}")
        self.assertIn('username', response.data, "'username' is not in the response")
        self.assertNotIn('password', response.data, "'password' is in the response")
    def test_create_a_user_already_used_login_and_valid_password(self):
        self.user = get_user_model().objects.create_user(username='admin3', password='Randmpwd1254.')
        payload = {
            "username": "admin3",
            "password": "Randmpwd1254."
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status is not {response.status_code}")
        self.assertIn('username', response.data, "'username' is not in the response")
        self.assertNotIn('password', response.data, "'password' is in the response")
    def test_create_a_user_with_valid_username_and_forbidden_password(self):
        payload = {
            "username": "admin5",
            "password": "Randmpwd1254/123"
        }
        login_url = reverse('register')
        response = self.client.post(login_url, payload, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status is not {response.status_code}")
        self.assertNotIn('username', response.data, "'username' is in the response")
        self.assertIn('password', response.data, "'password' is not in the response")

class UserinfosTests(APITestCase):
    def setUp(self):
        # Create a user with known credentials
        self.user = get_user_model().objects.create_user(username='admin', password='admin123')
        self.user2 = get_user_model().objects.create_user(username='admin2', password='admin1234')
        self.userinfo_url = reverse('myuserinfo')
        self.user2info_url = reverse('userinfo', kwargs={'user_id': self.user2.id})
        self.user3info_url = reverse('userinfo', kwargs={'user_id': '54'})
        now = datetime.datetime.now(datetime.timezone.utc)
        self.token = jwt.encode(
            {
                "token_type": "access",
                "exp": now + datetime.timedelta(minutes=5),  # Expiry time
                "iat": now,  # Issued at time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": self.user.id,
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )
        self.inv_token = jwt.encode(
            {
                "token_type": "access",
                "exp": now + datetime.timedelta(minutes=5),  # Expiry time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": "12",
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

    def test_call_my_infos_with_valid_jwt(self):
        # Make the POST request to the login endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(self.userinfo_url, format='json')
        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        self.assertIn('username', response.data, "'username' is missing in the response")
        self.assertTrue(response.data['username'], "The 'username' field is empty")
        self.assertIn('id', response.data, "'id' is missing in the response")
        self.assertTrue(response.data['id'], "The 'id' field is empty")
    def test_call_my_infos_with_invalid_jwt(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.inv_token}")
        response = self.client.get(self.userinfo_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")
        self.assertNotIn('username', response.data, "'username' is missing in the response")
        self.assertNotIn('id', response.data, "'username' is missing in the response")
    def test_call_valid_users_infos_with_valid_jwt(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(self.user2info_url, format='json')
        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        self.assertIn('username', response.json(), "'username' is missing in the response")
        self.assertTrue(response.json()['username'], "The 'username' field is empty")
        self.assertIn('id', response.json(), "'id' is missing in the response")
        self.assertTrue(response.json()['id'], "The 'id' field is empty")
    def test_call_valid_users_infos_with_invalid_jwt(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.inv_token}")
        response = self.client.get(self.user2info_url, format='json')
        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")
        self.assertNotIn('username', response.json(), "'username' is missing in the response")
        self.assertNotIn('id', response.json(), "'id' is missing in the response")
    def test_call_invalid_users_infos_with_valid_jwt(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(self.user3info_url, format='json')
        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, f"Expected status 404, got {response.status_code}")
        self.assertNotIn('username', response.json(), "'username' is missing in the response")
        self.assertNotIn('id', response.json(), "'id' is missing in the response")

class NewLoginTests(APITestCase):
    def setUp(self):
        # Create a user with known credentials
        self.user = get_user_model().objects.create_user(username='admin', password='admin123')
        self.login_url = reverse('change login')  # Adjust this to match your URL name for the login endpoint
        now = datetime.datetime.now(datetime.timezone.utc)
        self.token = jwt.encode(
            {
                "token_type": "access",
                "exp": now + datetime.timedelta(minutes=5),  # Expiry time
                "iat": now,  # Issued at time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": self.user.id,
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )
        self.inv_token = jwt.encode(
            {
                "token_type": "access",
                "exp": now + datetime.timedelta(minutes=5),  # Expiry time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": "-1",
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

    def test_new_valid_login_with_valid_jwt(self):
        # Payload for login
        payload = {
            "username": "newadmin",
        }
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        self.assertIn('username', response.data, "'username' is missing in the response")
        self.assertTrue(response.data['username'], "The 'username' field is empty")
        self.assertIn('id', response.data, "'id' is missing in the response")
        self.assertTrue(response.data['id'], "The 'id' field is empty")
    def test_new_valid_login_with_invalid_jwt(self):
        # Payload for login
        payload = {
            "username": "newadmin",
        }
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.inv_token}")
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")
        self.assertNotIn('username', response.data, "'username' is in the response")
        self.assertNotIn('id', response.data, "'id' is in the response") 
    def test_new_too_short_login_with_valid_jwt(self):
        # Payload for login
        payload = {
            "username": "new",
        }
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('username', response.data, "'username' is missing in the response")
        self.assertNotIn('id', response.data, "'id' is in the response")  
    def test_new_forbidden_login_with_valid_jwt(self):
        # Payload for login
        payload = {
            "username": "new////admin",
        }
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post(self.login_url, payload, format='json')

        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('username', response.data, "'username' is missing in the response")
        self.assertNotIn('id', response.data, "'id' is in the response")
    def test_empty_request_with_valid_jwt(self):
        self.user = get_user_model().objects.create_user(username='admin3', password='Randmpwd1254.')
        payload = {
            "username": "admin3",
            "password": "Randmpwd1254."
        }
        # Payload for login
        payload = {
            "username":"admin3"
        }
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.post(self.login_url, payload, format='json')
        # Assert the response status code is 200 (successful)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 401, got {response.status_code}")
        self.assertIn('username', response.data, "'username' is missing in the response")
        self.assertNotIn('id', response.data, "'id' is in the response")
    
class RefreshTest(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='admin', password='admin123')
        self.refresh_url = reverse('token_refresh')
        now = datetime.datetime.now(datetime.timezone.utc)
        self.token = jwt.encode(
            {
                "token_type": "refresh",
                "exp": now + datetime.timedelta(minutes=5),  # Expiry time
                "iat": now,  # Issued at time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": self.user.id,
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )
        self.inv_token = jwt.encode(
            {
                "token_type": "access",
                "exp": now + datetime.timedelta(minutes=5),  # Expiry time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": "-1",
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )
        self.old_token = jwt.encode(
            {
                "token_type": "refresh",
                "exp": now + datetime.timedelta(minutes=-5),  # Expiry time
                "jti": str(uuid.uuid4()),  # Unique identifier for the token
                "user_id": "-1",
                "username": self.user.username,
                "is_admin": False,  # Adjusted based on your model
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

    def test_refresh_with_valid_refresh_token(self):
        payload = {"refresh":self.token}
        response = self.client.post(self.refresh_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, not {response.status_code}")
        self.assertIn('access', response.data, "'access' is not in the response")
        self.assertTrue(response.json()['access'], "The 'access' field is empty")
    def test_refresh_with_access_token(self):
        payload = {"refresh":self.inv_token}
        response = self.client.post(self.refresh_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, not {response.status_code}")
    def test_refresh_with_too_old_refresh_token(self):
        payload = {"refresh":self.old_token}
        response = self.client.post(self.refresh_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, not {response.status_code}")


    
