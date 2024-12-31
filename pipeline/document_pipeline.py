import threading
import queue
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Optional
from django.utils import timezone

from api.models import Task

class DocumentPipeline:
    def __init__(self, max_workers=3):
        self.task_queue = queue.Queue()
        self.thread_pool = ThreadPoolExecutor(max_workers=max_workers)
        self.is_running = True
        # 启动守护线程处理任务
        self.daemon_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.daemon_thread.start()

    def add_task(self, title: str, file_path: str) -> int:
        """添加新任务到流水线，返回任务ID"""
        task = Task.objects.create(
            title=title,
            file_path=file_path,
            status=Task.Status.PENDING
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
            # 预处理阶段
            self._update_task_status(task, Task.Status.PREPROCESSING, 25)
            # TODO: 实现预处理逻辑
            
            # 文本提取阶段
            self._update_task_status(task, Task.Status.EXTRACTING, 50)
            # TODO: 实现文本提取逻辑
            
            # 翻译阶段
            self._update_task_status(task, Task.Status.TRANSLATING, 75)
            # TODO: 实现翻译逻辑
            
            # 完成
            self._update_task_status(task, Task.Status.COMPLETED, 100)
            
        except Exception as e:
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