from django.urls import path
from .views import gemini_chat, gemini_chat_image

urlpatterns = [
    path('gemini_chat', gemini_chat, name='gemini_chat'),
    path('gemini_chat_image', gemini_chat_image, name='gemini_chat_image'),
]