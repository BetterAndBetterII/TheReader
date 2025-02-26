from django.urls import path
from . import views

urlpatterns = [
    path('gemini_chat', views.gemini_chat, name='gemini_chat'),
    path('gemini_chat_image', views.gemini_chat_image, name='gemini_chat_image'),
    path('add_api_key', views.add_api_key, name='add_api_key'),
    path('upload_api_keys', views.upload_api_keys, name='upload_api_keys'),
    path('list_api_keys', views.list_api_keys, name='list_api_keys'),
    path('delete_api_key', views.delete_api_key, name='delete_api_key'),
    # 项目相关的端点
    path('projects/', views.list_projects, name='list_projects'),
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/delete/', views.delete_project, name='delete_project'),
    path('projects/<int:project_id>/', views.get_project, name='get_project'),
    path('projects/<int:project_id>/collections/', views.list_collections, name='list_collections'),
    path('projects/<int:project_id>/collections/create/', views.create_collection, name='create_collection'),
    path('projects/<int:project_id>/collections/delete/<int:collection_id>/', views.delete_collection, name='delete_collection'),
    path('projects/<int:project_id>/collections/<int:collection_id>/', views.get_collection, name='get_collection'),
    # 文档相关的端点
    path('documents/', views.list_documents, name='list_documents'),
    path('documents/upload/', views.add_document, name='add_document'),
    path('documents/remove/', views.remove_document, name='remove_document'),
    path('documents/<int:document_id>/', views.get_document, name='get_document'),
    path('documents/status/<str:task_id>/', views.get_document_status, name='get_document_status'),
    path('documents/view/<int:document_id>.pdf', views.view_document, name='view_document'),
    path('documents/text_section/<int:document_id>/', views.get_document_text_section, name='get_document_text_section'),
    path('documents/thumbnail/<int:document_id>.png', views.get_document_thumbnail, name='get_document_thumbnail'),
    # 思维导图相关的端点
    path('mindmaps/generate/', views.generate_mindmap, name='generate_mindmap'),
    # 权限相关的端点
    path('permissions/set_permission/', views.set_permission, name='set_permission'),
    path('permissions/get_permission/', views.get_permission, name='get_permission'),
    path('permissions/login/', views.login, name='login'),
    path('permissions/logout/', views.logout, name='logout'),
    path('permissions/change_password/', views.change_password, name='change_password'),
    # 公式解析器相关的端点
    path('parse-latex', views.parse_latex, name='parse_latex'),
]
