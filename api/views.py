from django.shortcuts import render
from django.http import JsonResponse
import json
from backend.setup_env import global_env
from clients.gemini_client import GeminiClient


# Create your views here.

def gemini_chat(request):
    json_data = json.loads(request.body)
    prompt = json_data.get('prompt')
    gemini_client: GeminiClient = global_env['gemini_client']
    response = gemini_client.chat_with_text(prompt)
    if 'error' in response:
        return JsonResponse({'error': response['error']}, status=500)
    return JsonResponse({'response': response['text']})

def gemini_chat_image(request):
    json_data = json.loads(request.body)
    prompt = json_data.get('prompt')
    image_data = json_data.get('image_data')
    image_type = json_data.get('image_type', 'base64')
    gemini_client: GeminiClient = global_env['gemini_client']
    response = gemini_client.chat_with_image(prompt, image_data, image_type)
    if 'error' in response:
        return JsonResponse({
            'error': response['error']
        }, status=500)
    return JsonResponse({
        'response': response['text']
    })
