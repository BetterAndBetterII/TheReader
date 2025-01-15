import logging
from threading import local

logger = logging.getLogger(__name__)
_thread_locals = local()

def get_current_request():
    return getattr(_thread_locals, 'request', None)

class RequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        response = self.get_response(request)
        del _thread_locals.request
        return response

class IPAddressMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 获取真实IP地址
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        request.client_ip = ip
        return self.get_response(request)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):        
        response = self.get_response(request)
        
        logger.info(
            f"{request.method} {request.path} {response.status_code}",
            extra={
                'status_code': response.status_code
            }
        )
        
        return response 
    