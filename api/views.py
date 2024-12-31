from asgiref.sync import async_to_sync
from django.shortcuts import render
from django.http import JsonResponse
import json
from backend.setup_env import global_env
from clients.gemini_client import GeminiClient
from clients.client_pool import ClientPool
from .models import ApiKey

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
    client_pool: ClientPool = global_env['gemini_client_pool']
    if not image_data:
        response = client_pool.execute_with_retry(GeminiClient.chat_with_text, prompt)
    else:
        response = client_pool.execute_with_retry(GeminiClient.chat_with_image, prompt, image_data, image_type)
    if 'error' in response:
        return JsonResponse({
            'error': response['error']
        }, status=500)
    return JsonResponse({
        'response': response['text']
    })

def add_api_key(request):
    json_data = json.loads(request.body)
    key = json_data.get('key')
    base_url = json_data.get('base_url', 'https://api.betterspace.top')
    # make test
    gemini_client: GeminiClient = global_env['gemini_client']
    response = gemini_client.chat_with_text('Hello, world!')
    if 'error' in response:
        return JsonResponse({'error': response['error']}, status=500)
    
    ApiKey.objects.create(key=key, base_url=base_url)
    return JsonResponse({'message': 'API key added successfully'})
