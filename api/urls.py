from django.urls import path
from . import views

urlpatterns = [
    path('gemini_chat', views.gemini_chat, name='gemini_chat'),
    path('gemini_chat_image', views.gemini_chat_image, name='gemini_chat_image'),
    path('add_api_key', views.add_api_key, name='add_api_key'),
    # 文档相关的端点
    path('documents/', views.list_documents, name='list_documents'),
    path('documents/upload/', views.add_document, name='add_document'),
    path('documents/<int:document_id>/', views.get_document, name='get_document'),
    path('documents/status/<str:task_id>/', views.get_document_status, name='get_document_status'),
    path('documents/view/<int:document_id>.pdf', views.view_document, name='view_document'),
]
