import openai
import os
import base64
import io
from typing import Literal
from PIL import Image
from api.models import ApiKey
from django.utils import timezone
from clients.gemini_client import GeminiClient

class OpenAIClient(GeminiClient):
    def __init__(self, api_key=None, base_url=None, model="gpt-4o"):
        self.api_key = api_key if api_key else os.getenv('OPENAI_API_KEY')
        self.base_url = base_url if base_url else os.getenv('OPENAI_API_BASE', "https://api.openai.com/v1")
        
        try:
            self.api_key_model = ApiKey.objects.get(key=self.api_key)
        except ApiKey.DoesNotExist:
            self.api_key_model = None
        
        # 创建 OpenAI 模型客户端
        self.client = openai.Client(api_key=self.api_key, base_url=self.base_url)
        
        self.text_model = model
        self.vision_model = model
        

    def chat_with_text(self, message) -> dict:
        """
        纯文本对话功能
        :param message: 用户输入的文本消息
        :return: 模型的回复
        """
        try:
            messages = [
                {"role": "system", "content": "You are a helpful assistant"},
                {"role": "user", "content": message},
            ]
            request_params = {
                "model": self.text_model,
                "messages": messages,
            }
            response = self.client.chat.completions.create(**request_params)
            self.update_api_key_usage()
            return response.choices[0].message.content
        
        except Exception as e:
            self.update_api_key_error(str(e))
            return {"error": str(e)}

    def chat_with_image(self, message, image_data, image_type: Literal["base64", "path"] = "base64"):
        """
        图片+文本对话功能，使用 messages 模式  
        注：处理完图片后，将其作为文本传递
        """
        try:
            # ...图片处理代码保持不变...
            if image_type == "base64":
                if ',' in image_data:
                    prefix, image_data = image_data.split(',', 1)
                    if not any(valid_prefix in prefix.lower() for valid_prefix in ['image/jpeg', 'image/png', 'image/gif']):
                        return {"error": "不支持的图片格式，请使用 JPEG、PNG 或 GIF 格式"}
                padding = 4 - (len(image_data) % 4) if len(image_data) % 4 != 0 else 0
                image_data += '=' * padding
                try:
                    image_bytes = base64.b64decode(image_data)
                    if len(image_bytes) == 0:
                        return {"error": "Base64解码后的数据为空"}
                except Exception as e:
                    return {"error": f"Base64解码错误: {str(e)}"}
                try:
                    image = Image.open(io.BytesIO(image_bytes))
                    if image.format not in ['JPEG', 'PNG', 'GIF']:
                        return {"error": f"不支持的图片格式: {image.format}，请使用 JPEG、PNG 或 GIF 格式"}
                    image.load()
                except Exception as e:
                    return {"error": f"图片解析错误: {str(e)}，请确保提供了有效的图片数据"}
            elif image_type == "path":
                try:
                    image = Image.open(image_data)
                    if image.format not in ['JPEG', 'PNG', 'GIF']:
                        return {"error": f"不支持的图片格式: {image.format}，请使用 JPEG、PNG 或 GIF 格式"}
                    image.load()
                except Exception as e:
                    return {"error": f"图片文件打开错误: {str(e)}"}
            else:
                return {"error": f"不支持的图片类型: {image_type}，请使用 base64 或 path 类型"}

            messages = [
                {"role": "system", "content": "You are a helpful assistant"},
                {"role": "user", "content": message},
                {"role": "user", "content": image_data},
            ]
            request_params = {
                "model": self.vision_model,
                "messages": messages,
            }
            response = self.client.chat.completions.create(**request_params)
            self.update_api_key_usage()
            return response.choices[0].message.content
        except Exception as e:
            self.update_api_key_error(str(e))
            return {"error": str(e)}

    def update_api_key_usage(self):
        if not self.api_key_model:
            return
        self.api_key_model.counter += 1
        self.api_key_model.last_used_at = timezone.now()
        self.api_key_model.save()

    def update_api_key_error(self, error_message):
        if not self.api_key_model:
            return
        self.api_key_model.last_error_message = error_message
        self.api_key_model.save()
