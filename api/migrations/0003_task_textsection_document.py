# Generated by Django 5.1.4 on 2024-12-31 15:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_apikey_base_url'),
    ]

    operations = [
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='任务标题', max_length=255)),
                ('file_path', models.CharField(help_text='文档文件路径', max_length=1000)),
                ('status', models.CharField(choices=[('PENDING', '等待处理'), ('PREPROCESSING', '预处理中'), ('EXTRACTING', '文本提取中'), ('TRANSLATING', '翻译中'), ('COMPLETED', '已完成'), ('FAILED', '失败')], default='PENDING', help_text='当前任务状态', max_length=20)),
                ('progress', models.IntegerField(default=0, help_text='任务进度(0-100)')),
                ('error_message', models.TextField(blank=True, help_text='错误信息', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='最后更新时间')),
                ('completed_at', models.DateTimeField(blank=True, help_text='完成时间', null=True)),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='额外的任务元数据')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TextSection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('linked_file_path', models.CharField(help_text='关联的文件路径', max_length=1000)),
                ('title', models.CharField(help_text='文本标题', max_length=255)),
                ('text', models.TextField(help_text='文本内容')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='最后更新时间')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='文档标题', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='最后更新时间')),
                ('linked_file_path', models.CharField(help_text='关联的文件路径', max_length=1000)),
                ('linked_task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='api.task')),
                ('sections', models.ManyToManyField(related_name='documents', to='api.textsection')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
