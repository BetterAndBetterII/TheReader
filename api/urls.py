from django.urls import path
from . import views

urlpatterns = [
    path('gemini_chat', views.gemini_chat, name='gemini_chat'),
    path('gemini_chat_image', views.gemini_chat_image, name='gemini_chat_image'),
    path('add_api_key', views.add_api_key, name='add_api_key'),
]