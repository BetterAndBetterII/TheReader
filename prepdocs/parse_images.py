# 解析图片
from api.views import global_env
from clients.client_pool import ClientPool
from prepdocs.config import Section, Page, FileType
from api.views import GeminiClient

def get_parse_markdown_system_prompt() -> str:
    return """
You are a markdown parser, convert images to markdown format. Format tables using markdown tables. Replace images with as accurate descriptions as possible, and never output image links.
"""

def parse_images(section: Section) -> Section:
    """
    解析图片，返回文本
    """
    if section.file_type == FileType.TEXT:
        return section
    client_pool: ClientPool = global_env['gemini_client_pool']
    result_section = Section(
        title=section.title,
        pages=[],
        file_type=FileType.TEXT,
        filename=section.filename
    )
    for page in section.pages:
        response = client_pool.execute_with_retry(GeminiClient.chat_with_image, get_parse_markdown_system_prompt(), page.file_path, 'path')
        if 'error' in response:
            raise ValueError(f"解析图片失败: {response['error']}")
        result_section.pages.append(Page(
            content=response['text']
        ))
    return result_section



