# DocsIngester

import os
import tempfile
from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image
from docx2pdf import convert as docx2pdf
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
import win32com.client
import pythoncom
import uuid
from prepdocs.config import Section, Page, FileType

import logging
logger = logging.getLogger(__name__)

class DocsIngester:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.supported_formats = {'pdf', 'docx', 'pptx'}

    def process_document(self, file_path: str, title: str) -> Section:
        """
        处理文档并返回Section对象
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        if title.split('.')[-1].lower() not in self.supported_formats:
            logger.debug(f"不支持的文件格式: {title.split('.')[-1]}, 尝试转换为 PDF")
            raise ValueError(f"不支持的文件格式: {title.split('.')[-1]}")

        # 根据文件类型处理并获取图片路径列表
        image_paths = []
        if title.split('.')[-1].lower() == 'pdf':
            image_paths = self._process_pdf(file_path)
        elif title.split('.')[-1].lower() == 'docx':
            image_paths = self._process_docx(file_path)
        elif title.split('.')[-1].lower() == 'pptx':
            image_paths = self._process_pptx(file_path)

        # 将图片路径转换为Page对象列表
        pages = [Page(file_path=path) for path in image_paths]
        
        # 创建并返回Section对象
        return Section(
            title=title,  # 使用文件名作为标题
            pages=pages,
            file_type=FileType.IMAGE,  # 目前统一返回图片类型
            filename=title
        )

    def _process_pdf(self, file_path: Path) -> list[str]:
        """处理 PDF 文件"""
        images = convert_from_path(file_path)
        image_paths = []
        
        for i, image in enumerate(images):
            image_path = os.path.join(self.temp_dir, f"page_{i+1}.png")
            image.save(image_path, "PNG")
            image_paths.append(image_path)
        
        return image_paths

    def _process_docx(self, file_path: Path) -> list[str]:
        """处理 DOCX 文件"""
        # 首先转换为 PDF
        temp_pdf = os.path.join(self.temp_dir, f"{uuid.uuid4()}.pdf")
        docx2pdf(file_path, temp_pdf)
        
        # 然后将 PDF 转换为图片
        result = self._process_pdf(Path(temp_pdf))
        
        # 清理临时 PDF
        os.remove(temp_pdf)
        return result

    def _process_pptx(self, file_path: Path) -> list[str]:
        """处理 PPTX 文件"""
        # 使用 COM 接口将 PPT 转换为图片
        pythoncom.CoInitialize()
        powerpoint = win32com.client.Dispatch("Powerpoint.Application")
        powerpoint.Visible = True
        
        presentation = powerpoint.Presentations.Open(str(file_path.absolute()))
        image_paths = []
        
        for i in range(1, presentation.Slides.Count + 1):
            image_path = os.path.join(self.temp_dir, f"slide_{i}.png")
            presentation.Slides(i).Export(image_path, "PNG")
            image_paths.append(image_path)
        
        presentation.Close()
        powerpoint.Quit()
        pythoncom.CoUninitialize()
        
        return image_paths

    def cleanup(self):
        """清理临时文件"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

