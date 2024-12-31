from django.conf import settings
from pipeline.document_pipeline import DocumentPipeline
from clients.gemini_client import GeminiClient
from clients.client_pool import ClientPool

global_env = settings.GLOBAL_ENV

def client_setup():
    print("Setting up Gemini clients...")
    # 初始化客户端池
    global_env['gemini_client_pool'] = ClientPool(
        max_retries=3,
        retry_delay=1.0,
        max_concurrent_requests=50
    )
    
    print("Setting up Document Pipeline...")
    global_env['document_pipeline'] = DocumentPipeline(max_workers=3)
