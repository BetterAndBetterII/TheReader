from django.conf import settings

from clients.gemini_client import GeminiClient

global_env = settings.GLOBAL_ENV

def client_setup():
    print("Setting up Gemini client...")
    global_env['gemini_client'] = GeminiClient()
