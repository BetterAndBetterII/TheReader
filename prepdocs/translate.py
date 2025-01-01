# 解析英文文档
from prepdocs.config import Section, Page, FileType

from api.views import global_env
from clients.client_pool import ClientPool
from api.views import GeminiClient

def get_translate_system_prompt(target_language: str) -> str:
    return f"""
You are a professional translator, translate the following text into {target_language}, and cannot output any other extra content: 
"""

def translate_text(section: Section, target_language: str='Simplified Chinese') -> Section:
    """
    解析图片，返回文本
    """
    client_pool: ClientPool = global_env['gemini_client_pool']
    result_section = Section(
        title=section.title,
        pages=[],
        file_type=FileType.TEXT,
        filename=section.filename
    )
    for page in section.pages:
        response = client_pool.execute_with_retry(GeminiClient.chat_with_text, f"{get_translate_system_prompt(target_language)}\n{page.content}")
        if 'error' in response:
            raise ValueError(f"翻译失败: {response['error']}")
        result_section.pages.append(Page(
            content=response['text'],
        ))
    return result_section
