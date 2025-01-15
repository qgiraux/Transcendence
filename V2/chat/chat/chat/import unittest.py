import unittest
from .tests import ChatConsumerTest

# FILE: chat/chat/chat/test_tests.py


class TestChatConsumerTest(unittest.TestCase):
    
    def setUp(self):
        self.chat_consumer_test = ChatConsumerTest()

    def test_connect_with_valid_token(self):
        result = self.chat_consumer_test.test_connect_with_valid_token()
        self.assertIsNone(result)

    def test_connect_with_invalid_token(self):
        result = self.chat_consumer_test.test_connect_with_invalid_token()
        self.assertIsNone(result)

    def test_connect_without_token(self):
        result = self.chat_consumer_test.test_connect_without_token()
        self.assertIsNone(result)

    def test_receive_chat_message(self):
        result = self.chat_consumer_test.test_receive_chat_message()
        self.assertIsNone(result)

    def test_disconnect(self):
        result = self.chat_consumer_test.test_disconnect()
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()