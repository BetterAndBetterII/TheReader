from django.db import models

# Create your models here.

"""
多个文档组成一个集合，多个集合组成一个项目
每个文档有多个文本段落，每个文本段落有多个页面
Task任务是针对文档的，每个文档对应有一个Task

项目
 |
 |--- 集合
 |    |--- 文档
 |    |--- 文档
 |    |--- 文档
 |--- 集合
 |    |--- 文档
 |    |--- 文档
 |    |--- 文档
"""

from django.db import models

class ApiKey(models.Model):
    key = models.CharField(max_length=255, unique=True)
    base_url = models.CharField(max_length=255, default='https://api.betterspace.top')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    counter = models.IntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_error_message = models.TextField(null=True, blank=True)

    # 直接使用 CharField，而不限制 choices
    api_type = models.CharField(max_length=10, default='gemini', help_text='API 类型 (gemini 或 openai)')

    def __str__(self):
        return f"{self.api_type.upper()} - {self.key[:10]}..."

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

    # 关联字段
    collection_id = models.IntegerField(default=0, help_text='集合ID')

    # 元数据
    metadata = models.JSONField(default=dict, blank=True, help_text='额外的任务元数据')

    def __str__(self):
        return f"{self.title} - {self.status}"

    class Meta:
        ordering = ['-created_at']

class TextSection(models.Model):
    linked_file_path = models.CharField(max_length=1000, help_text='关联的文件路径')
    title = models.CharField(max_length=255, help_text='文本标题')
    # Section_obj_json
    section = models.JSONField(default=dict, help_text='Section对象')
    created_at = models.DateTimeField(auto_now_add=True, help_text='创建时间')
    updated_at = models.DateTimeField(auto_now=True, help_text='最后更新时间')

    def __str__(self):
        return f"{self.title} - {self.task.title} - {self.linked_file_path}"

    class Meta:
        ordering = ['-created_at']

class Document(models.Model):
    title = models.CharField(max_length=255, help_text='文档标题')
    english_sections = models.ManyToManyField(TextSection, related_name='english_documents', blank=True)
    chinese_sections = models.ManyToManyField(TextSection, related_name='chinese_documents', blank=True)
    created_at = models.DateTimeField(auto_now_add=True, help_text='创建时间')
    updated_at = models.DateTimeField(auto_now=True, help_text='最后更新时间')

    linked_file_path = models.CharField(max_length=1000, help_text='关联的文件路径')
    linked_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='documents')

    def __str__(self):
        return f"{self.title} - {self.linked_task.title} - {self.linked_file_path}"

    class Meta:
        ordering = ['-created_at']

class Collection(models.Model):
    name = models.CharField(max_length=255, help_text='集合名称')
    documents = models.ManyToManyField(Document, related_name='collections')
    created_at = models.DateTimeField(auto_now_add=True, help_text='创建时间')
    updated_at = models.DateTimeField(auto_now=True, help_text='最后更新时间')

    def __str__(self):
        return f"{self.name} - {self.created_at}"

    class Meta:
        ordering = ['-created_at']

class Project(models.Model):
    name = models.CharField(max_length=255, help_text='项目名称')
    collections = models.ManyToManyField(Collection, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True, help_text='创建时间')
    updated_at = models.DateTimeField(auto_now=True, help_text='最后更新时间')

    def __str__(self):
        return f"{self.name} - {self.created_at}"

    class Meta:
        ordering = ['-created_at']

class MindMap(models.Model):
    title = models.CharField(max_length=255, help_text='思维导图标题')
    created_at = models.DateTimeField(auto_now_add=True, help_text='创建时间')
    document_id = models.IntegerField(default=0, help_text='关联的文档ID')
    mind_map_json = models.JSONField(default=dict, help_text='思维导图JSON')

    def __str__(self):
        return f"{self.title} - {self.document_id}"

    class Meta:
        ordering = ['-created_at']
