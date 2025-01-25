from django.test import TestCase

# Create your tests here.
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from jwt.exceptions import InvalidTokenError
from .models import Tournament
import jwt
import json

from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from jwt.exceptions import InvalidTokenError

class InviteTests(TestCase):

    def setUp(self):
        self.url = reverse('invite')  # Replace 'invite' with the name of the URL pattern for the Invite endpoint.
        self.valid_token = "valid.token.here"
        self.mock_jwt_payload = {"user_id": 1}
        self.headers = {"HTTP_AUTHORIZATION": f"Bearer {self.valid_token}"}
        self.tournament = Tournament.objects.create(tournament_name="TestTournament")

    @patch('jwt.decode')
    def test_method_not_allowed(self, mock_jwt_decode):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['detail'], "Method not allowed")

    @patch('jwt.decode')
    def test_missing_authorization_header(self, mock_jwt_decode):
        response = self.client.post(self.url, data={}, content_type='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {'detail': 'Authorization header missing'})

    @patch('jwt.decode')
    def test_invalid_token(self, mock_jwt_decode):
        mock_jwt_decode.side_effect = InvalidTokenError("Invalid token")
        response = self.client.post(self.url, data={}, content_type='application/json', **self.headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['detail'], 'Given token not valid for any token type')

    @patch('jwt.decode')
    def test_missing_tournament_name(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        payload = {"friend_id": 2}
        response = self.client.post(self.url, data=payload, content_type='application/json', **self.headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Tournament not found", "code": "not_found"})

    @patch('jwt.decode')
    def test_missing_friend_id(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        payload = {"tournament_name": "TestTournament"}
        response = self.client.post(self.url, data=payload, content_type='application/json', **self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'detail': 'Friend ID is required', 'code': 'invalid_data'})

    @patch('jwt.decode')
    @patch('tournamentApp.views.redis_client.publish')
    def test_successful_notification(self, mock_redis_publish, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        mock_redis_publish.return_value = None  # Simulate successful publish
        payload = {"tournament_name": "TestTournament", "friend_id": 2}
        response = self.client.post(self.url, data=payload, content_type='application/json', **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"detail": "Message sent"})
        mock_redis_publish.assert_called_once_with(
            'global_chat',
            json.dumps({
                'type': 'invite_message',
                'group': 'user_2',
                'message': "TestTournament",
                'sender': 'system'
            })
        )

class JoinTournamentTests(APITestCase):
    def setUp(self):
        """Set up the test environment."""
        self.testurl = reverse('join')
        self.mock_jwt_payload = {'user_id': 1}  # Simulated payload for the JWT
        self.tournament = Tournament.objects.create(tournament_name="TestTournament", tournament_size=2)

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_join_a_tournament(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament"}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        self.assertIn('tournament name', response.json(), "Response does not contain 'tournament name'")
        self.assertEqual(response.json()['tournament name'], 'TestTournament', "Unexpected response message")

    @patch('jwt.decode')
    def test_tournament_already_joined(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament"}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT, f"Expected status 409, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'User already subscribed', "Unexpected response message")

    @patch('jwt.decode')
    def test_invalid_tournament_name(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "te"}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'invalid tournament name', "Unexpected response message")

    @patch('jwt.decode')
    def test_wrong_tournament_name(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "NotTournament"}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, f"Expected status 404, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'Tournament not found', "Unexpected response message")

    @patch('jwt.decode')
    def test_tournament_already_full(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament"}

        self.tournament.player_list = [2, 3]
        self.tournament.save()
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT, f"Expected status 409, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'Tournament full', "Unexpected response message")

    @patch('jwt.decode')
    def test_incomplete_body(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'missing tournament name in body', "Unexpected response message")

    @patch('jwt.decode')
    def test_create_tournament_invalid_method(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament"}
        response = self.client.get(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, f"Expected status 401, got {response.status_code}")

    @patch('jwt.decode')
    def test_tournament_invalid_jwt(self, mock_jwt_decode):
        # Simulate an invalid JWT by raising an exception when jwt.decode is called
        mock_jwt_decode.side_effect = jwt.exceptions.InvalidTokenError("Invalid token")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        payload = {"name": "TestTournament", "size": 2}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'Given token not valid for any token type')
class CreateTournamentTests(APITestCase):
    def setUp(self):
        """Set up the test environment."""
        self.testurl = reverse('create')
        self.mock_jwt_payload = {'user_id': 1}  # Simulated payload for the JWT

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_create_a_tournament(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament", "size": 2}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status 201, got {response.status_code}")

        self.assertIn('tournament name', response.json(), "Response does not contain 'tournament name'")
        self.assertEqual(response.json()['tournament name'], 'TestTournament', "Unexpected response message")


    @patch('jwt.decode')
    def test_tournament_already_created(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament", "size": 2}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Expected status 201, got {response.status_code}")
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT, f"Expected status 409, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'tournament name already in use', "Unexpected response message")

    @patch('jwt.decode')
    def test_invalid_tournament_name(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "te", "size": 2}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'invalid tournament name', "Unexpected response message")

    @patch('jwt.decode')
    def test_invalid_tournament_size(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament", "size": 3}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'invalid tournament size', "Unexpected response message")

    @patch('jwt.decode')
    def test_incomplete_body(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament"}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'incomplete body', "Unexpected response message")

    @patch('jwt.decode')
    def test_create_tournament_invalid_method(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"name": "TestTournament", "size": 2}
        response = self.client.get(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, f"Expected status 401, got {response.status_code}")

    @patch('jwt.decode')
    def test_tournament_invalid_jwt(self, mock_jwt_decode):
        # Simulate an invalid JWT by raising an exception when jwt.decode is called
        mock_jwt_decode.side_effect = jwt.exceptions.InvalidTokenError("Invalid token")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        payload = {"name": "TestTournament", "size": 2}
        response = self.client.post(self.testurl, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")
        self.assertIn('detail', response.json(), "Response does not contain 'detail'")
        self.assertEqual(response.json()['detail'], 'Given token not valid for any token type')
class TournamentListTests(TestCase):

    def setUp(self):
        self.url = reverse('list')  # Replace with the actual URL pattern name
        self.valid_token = "valid.token.here"
        self.mock_jwt_payload = {"user_id": 1}
        self.headers = {"HTTP_AUTHORIZATION": f"Bearer {self.valid_token}"}

    @patch('jwt.decode')
    def test_method_not_allowed(self, mock_jwt_decode):
        response = self.client.post(self.url, data={}, content_type='application/json')
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['detail'], 'Method not allowed')

    @patch('jwt.decode')
    def test_missing_authorization_header(self, mock_jwt_decode):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    @patch('jwt.decode')
    def test_invalid_token(self, mock_jwt_decode):
        mock_jwt_decode.side_effect = InvalidTokenError("Invalid token")
        response = self.client.get(self.url, **self.headers)
        self.assertEqual(response.status_code, 401)

    @patch('jwt.decode')
    def test_missing_user_id_in_token(self, mock_jwt_decode):
        mock_jwt_decode.return_value = {}
        response = self.client.get(self.url, **self.headers)
        self.assertEqual(response.status_code, 401)

    @patch('jwt.decode')
    def test_empty_tournament_list(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        response = self.client.get(self.url, **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'tournaments': []})

    @patch('jwt.decode')
    def test_non_empty_tournament_list(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload

        # Create mock tournaments
        Tournament.objects.create(tournament_name="Tournament1")
        Tournament.objects.create(tournament_name="Tournament2")

        response = self.client.get(self.url, **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {'tournaments': ["Tournament1", "Tournament2"]}
        )

