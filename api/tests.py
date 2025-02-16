# from django.test import TestCase
# from clients.openai_client import OpenAIClient

# class TestOpenAIClient(TestCase):
#     def test_chat_with_text(self):
#         api_key = "NOT_NEEDED"
#         base_url = "http://night.betterspace.top:8100/v1"
#         client = OpenAIClient(api_key=api_key, base_url=base_url)
        
#         message = "Hello, test!"
#         response = client.chat_with_text(message)
#         print("Test Response:", response)
        
#         # 检查返回结果中是否包含文本回复
#         self.assertTrue(isinstance(response, str), "Response should be a string")

from openai import OpenAI

# for backward compatibility, you can still use `https://api.deepseek.com/v1` as `base_url`.
client = OpenAI(api_key="NOT_NEED", base_url="http://night.betterspace.top:8100/v1")
print(client.models.list())