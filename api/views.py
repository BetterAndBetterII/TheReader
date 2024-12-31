from asgiref.sync import async_to_sync
from django.shortcuts import render
from django.http import JsonResponse, FileResponse
import json
from backend.setup_env import global_env
from clients.gemini_client import GeminiClient
from clients.client_pool import ClientPool
from .models import ApiKey, Document, Task
from pipeline.document_pipeline import DocumentPipeline
import tempfile
import logging
import io
from pathlib import Path

logger = logging.getLogger(__name__)

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

def add_document(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    title = request.POST.get('title')
    file = request.FILES.get('file')
    
    if not title or not file:
        return JsonResponse({'error': 'Missing title or file'}, status=400)
    
    # 保存到临时文件，不要删除！
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        for chunk in file.chunks():
            temp_file.write(chunk)
        temp_file_path = temp_file.name
    
    document_pipeline: DocumentPipeline = global_env['document_pipeline']
    logger.debug(f"Adding document with title: {title} with file path: {temp_file_path}")
    task_id = document_pipeline.add_task(title, temp_file_path)
    
    return JsonResponse({
        'message': '文档上传成功',
        'task_id': task_id
    })

def list_documents(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    documents = Document.objects.all().order_by('-created_at')
    logger.debug(f"Listing documents: {documents}")
    type_map = {
        'image': '图片',
        'text': '文本',
        'pdf': 'PDF',
        'docx': 'DOCX',
        'pptx': 'PPTX'
    }
    documents_data = [{
        'id': doc.id,
        'title': doc.title,
        'created_at': doc.created_at.isoformat(),
        'file_type': type_map.get(doc.title.split('.')[-1], '未知'),
        'status': doc.linked_task.status,
        'url': f'/api/documents/view/{doc.id}.pdf'
    } for doc in documents]
    
    return JsonResponse({
        'documents': documents_data
    })

def get_document(request, document_id):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        document = Document.objects.get(id=document_id)
        sections = document.sections.all()
        
        document_data = {
            'id': document.id,
            'title': document.title,
            'created_at': document.created_at.isoformat(),
            'file_type': document.linked_task.metadata.get('file_type', '未知'),
            'status': document.linked_task.status,
            'pages': [{
                'id': section.id,
                'title': section.title,
                'text': section.text,
                'file_path': section.linked_file_path
            } for section in sections]
        }
        
        return JsonResponse({
            'document': document_data
        })
    except Document.DoesNotExist:
        return JsonResponse({'error': '文档不存在'}, status=404)

def get_document_status(request, task_id):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        task = Task.objects.get(id=task_id)
        return JsonResponse({
            'status': task.status,
            'progress': task.progress,
            'error_message': task.error_message,
            'metadata': task.metadata
        })
    except Task.DoesNotExist:
        return JsonResponse({'error': '任务不存在'}, status=404)

def view_document(request, document_id):
    try:
        document = Document.objects.get(id=document_id)
        # 获取文档目录下的原始文件
        file_path = Path(document.linked_file_path) / document.title
        
        if not file_path.exists():
            return JsonResponse({'error': '文件不存在'}, status=404)
        
        # pdf object stream
        with open(file_path, 'rb') as file:
            pdf_stream = io.BytesIO(file.read())
        
        # 使用文档的实际标题作为下载文件名
        return FileResponse(
            pdf_stream, 
            filename=document.title,
            content_type='application/pdf',
            headers={'Content-Disposition': f'inline; filename="{document.title}"'}
        )
    except Document.DoesNotExist:
        return JsonResponse({'error': '文档不存在'}, status=404)
    except PermissionError:
        return JsonResponse({'error': '无法访问文件'}, status=403)
    except Exception as e:
        logger.error(f"查看文档失败: {str(e)}")
        return JsonResponse({'error': '查看文档失败'}, status=500)
