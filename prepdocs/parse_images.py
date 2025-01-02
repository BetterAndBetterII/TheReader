# 解析图片
from api.views import global_env
from clients.client_pool import ClientPool
from prepdocs.config import Section, Page, FileType
from api.views import GeminiClient
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_parse_markdown_system_prompt() -> str:
    return """
You are a markdown parser, convert images to markdown format. Format tables using markdown tables. Replace images with as accurate descriptions as possible, and never output image links.
"""

def process_single_page(client_pool, page):
    response = client_pool.execute_with_retry(
        GeminiClient.chat_with_image, 
        get_parse_markdown_system_prompt(), 
        page.file_path, 
        'path'
    )
    if 'error' in response:
        raise ValueError(f"解析图片失败: {response['error']}")
    return Page(content=response['text'])

def parse_images(section):
    client_pool: ClientPool = global_env['gemini_client_pool']
    if not client_pool._get_clients():
        raise ValueError("No GeminiClient available. Please check your API keys.")
    result_section = Section(
        title=section.title,
        pages=[None] * len(section.pages),  # 预分配空间以保持顺序
        file_type=FileType.TEXT,
        filename=section.filename
    )
    max_workers = min(len(client_pool._get_clients()) * 2, 8)
    # 使用线程池并行处理图片，但保持顺序
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {
            executor.submit(process_single_page, client_pool, page): idx
            for idx, page in enumerate(section.pages)
        }
        
        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            try:
                result_page = future.result()
                result_section.pages[idx] = result_page  # 使用原始索引存储结果
            except Exception as e:
                print(f"处理页面 {idx + 1} 时发生错误: {str(e)}")

    return result_section
