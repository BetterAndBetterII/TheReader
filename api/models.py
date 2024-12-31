from django.db import models

# Create your models here.

class ApiKey(models.Model):
    key = models.CharField(max_length=255, unique=True)
    base_url = models.CharField(max_length=255, default='https://api.betterspace.top')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key[:10] + '...'

class Task(models.Model):
    # 任务状态选项
    class Status(models.TextChoices):
        PENDING = 'PENDING', '等待处理'
        PREPROCESSING = 'PREPROCESSING', '预处理中'
        EXTRACTING = 'EXTRACTING', '文本提取中'
        TRANSLATING = 'TRANSLATING', '翻译中'
        COMPLETED = 'COMPLETED', '已完成'
        FAILED = 'FAILED', '失败'

    # 基本字段
    title = models.CharField(max_length=255, help_text='任务标题')
    file_path = models.CharField(max_length=1000, help_text='文档文件路径')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text='当前任务状态'
    )
    
    # 进度追踪
    progress = models.IntegerField(default=0, help_text='任务进度(0-100)')
    error_message = models.TextField(null=True, blank=True, help_text='错误信息')
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, help_text='创建时间')
    updated_at = models.DateTimeField(auto_now=True, help_text='最后更新时间')
    completed_at = models.DateTimeField(null=True, blank=True, help_text='完成时间')

    # 元数据
    metadata = models.JSONField(default=dict, blank=True, help_text='额外的任务元数据')

    def __str__(self):
        return f"{self.title} - {self.status}"

    class Meta:
        ordering = ['-created_at']
