from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

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
        print("Response Status:", response.status_code)
        print("Response Data:", response.data)
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

