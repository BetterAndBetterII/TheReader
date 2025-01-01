import threading
import queue
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Optional
from django.utils import timezone
from django.conf import settings
import uuid
import os
import shutil
import logging
from api.models import Task, Document, TextSection, Project, Collection
from prepdocs.config import Section, Page, FileType

logger = logging.getLogger(__name__)

class DocumentPipeline:
    def __init__(self, max_workers=3):
        self.task_queue = queue.Queue()
        self.thread_pool = ThreadPoolExecutor(max_workers=max_workers)
        self.is_running = True
        # 启动守护线程处理任务
        self.daemon_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.daemon_thread.start()

    def add_task(self, title: str, file_path: str, collection_id: int) -> int:
        """添加新任务到流水线，返回任务ID"""
        task = Task.objects.create(
            title=title,
            file_path=file_path,
            status=Task.Status.PENDING,
            collection_id=collection_id
        )
        self.task_queue.put(task.id)
        return task.id

    def _update_task_status(self, task: Task, status: str, progress: int = None, 
                          error_message: Optional[str] = None):
        """更新任务状态"""
        task.status = status
        if progress is not None:
            task.progress = progress
        if error_message:
            task.error_message = error_message
        if status == Task.Status.COMPLETED:
            task.completed_at = timezone.now()
        task.save()

    def _process_document(self, task: Task):
        """处理单个文档的流水线逻辑"""
        try:
            
            # ------------------预处理阶段------------------
            self._update_task_status(task, Task.Status.PREPROCESSING, 25)
            # 实现预处理逻辑
            image_section = self.stage_1(task.file_path, task.title)
            logger.debug(f"预处理阶段完成: {image_section}")

            # ------------------文本提取阶段------------------
            self._update_task_status(task, Task.Status.EXTRACTING, 50)
            # 实现预处理逻辑
            english_section = self.stage_2(image_section)
            logger.debug(f"文本提取阶段完成: {english_section}")

            # ------------------翻译阶段------------------
            self._update_task_status(task, Task.Status.TRANSLATING, 75)
            # 实现翻译逻辑
            chinese_section = self.stage_3(english_section)
            logger.debug(f"翻译阶段完成: {chinese_section}")

            # ------------------保存阶段------------------
            document = self.stage_4(english_section, chinese_section, task.file_path, task, image_section)
            # 完成
            self._update_task_status(task, Task.Status.COMPLETED, 100)
            return document
        except Exception as e:
            logger.error(f"处理文档失败: {str(e)}")
            self._update_task_status(task, Task.Status.FAILED, error_message=str(e))
            raise

    def _process_queue(self):
        """守护线程：持续处理队列中的任务"""
        while self.is_running:
            try:
                task_id = self.task_queue.get(timeout=1)  # 1秒超时
                task = Task.objects.get(id=task_id)
                self.thread_pool.submit(self._process_document, task)
            except queue.Empty:
                continue  # 队列为空，继续等待
            except Exception as e:
                print(f"Error processing task: {str(e)}")
                continue

    def shutdown(self):
        """关闭流水线"""
        self.is_running = False
        self.thread_pool.shutdown(wait=True)
        self.daemon_thread.join(timeout=5) 
        print("Document Pipeline shutdown complete")

    # 具体实现
    def stage_1(self, file_path: str, title: str) -> Section:
        """
        预处理阶段，将文档转换为图片，或文本
        """
        logger.debug(f"Processing {file_path} with title {title}")
        from prepdocs.parse_page import DocsIngester, Section

        ingester = DocsIngester()
        return ingester.process_document(file_path, title)

    def stage_2(self, section: Section):
        """
        文本提取阶段，将图片转换为文本：使用ClientPool来调用GeminiClient的chat_with_image方法
        """
        from prepdocs.parse_images import parse_images
        logger.debug(f"Processing {section} with title {section.title}")

        return parse_images(section)

    def stage_3(self, section: Section):
        """
        翻译阶段，将文本翻译为中文
        """
        from prepdocs.translate import translate_text
        logger.debug(f"Translating {section} with title {section.title}")

        return translate_text(section, 'Simplified Chinese')

    def stage_4(self, english_section: Section, chinese_section: Section, original_file_path: str, task: Task, image_section: Section):
        """
        保存阶段，将文本保存到数据库
        """
        logger.debug(f"Saving {english_section} with title {english_section.title}")
        # 保存文档到persist目录
        persist_dir = settings.PERSIST_DIR
        persist_dir.mkdir(parents=True, exist_ok=True)
        # 生成唯一id
        document_id = str(uuid.uuid4())
        os.makedirs(persist_dir / document_id, exist_ok=True)
        os.makedirs(persist_dir / document_id / "en", exist_ok=True)
        os.makedirs(persist_dir / document_id / "zh", exist_ok=True)
        # 使用 shutil.move 替代 os.rename
        persist_file_path = persist_dir / document_id / task.title
        shutil.move(original_file_path, persist_file_path)
        # 保存缩略图
        shutil.move(image_section.pages[0].file_path, persist_dir / document_id / "thumbnail.png")
        for i, page in enumerate(english_section.pages):
            english_file_path = persist_dir / document_id / "en" / f"{document_id}_index_{i}.md"
            with open(english_file_path, 'w', encoding='utf-8') as f:
                f.write(page.content)
        for i, page in enumerate(chinese_section.pages):
            chinese_file_path = persist_dir / document_id / "zh" / f"{document_id}_index_{i}.md"
            with open(chinese_file_path, 'w', encoding='utf-8') as f:
                f.write(page.content)
        # ------------------保存到数据库------------------
        document = Document.objects.create(
            title=english_section.title,
            linked_file_path=persist_dir / document_id,
            linked_task=task
        )
        logger.debug(f"Creating document {document} with title {document.title}")
        english_text_section = TextSection.objects.create(
            title=english_section.title,
            section=english_section.to_dict(),
            linked_file_path=persist_file_path
        )
        chinese_text_section = TextSection.objects.create(
            title=chinese_section.title,
            section=chinese_section.to_dict(),
            linked_file_path=persist_file_path
        )
        document.english_sections.add(english_text_section)
        document.chinese_sections.add(chinese_text_section)
        document.save()

        # 链接项目和集合
        collection = Collection.objects.get(id=task.collection_id)
        collection.documents.add(document)

        logger.debug(f"Document {document} with title {document.title} created")
        return document
