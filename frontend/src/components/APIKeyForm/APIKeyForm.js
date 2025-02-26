import React, { useState } from 'react';
import axios from 'axios';
import './APIKeyForm.css';
import { Select, MenuItem } from '@mui/material';

const APIKeyForm = ({ onAdd }) => {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiType, setApiType] = useState('gemini');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await axios.post('/api/add_api_key', {
                key: apiKey.trim(),
                ...(baseUrl.trim() && { base_url: baseUrl.trim() }),
                apiType
            });

            if (response.data.error) {
                setStatus({ type: 'error', message: 'API密钥验证失败，请重试' });
            } else if (response.data.message) {
                setStatus({ type: 'success', message: response.data.message });
                onAdd();
                setApiKey('');
                setBaseUrl('');
                setApiType('gemini');
            }
        } catch (error) {
            setStatus({ type: 'error', message: '提交失败，请稍后重试' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatus({ type: 'error', message: '请选择文件' });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('apiType', apiType);
        if (baseUrl.trim()) {
            formData.append('base_url', baseUrl.trim());
        }

        try {
            const response = await axios.post('/api/upload_api_keys', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.error) {
                setStatus({ type: 'error', message: response.data.error });
            } else {
                setStatus({ type: 'success', message: '批量导入成功！' });
                onAdd();
                setFile(null);
                // 重置文件输入
                const fileInput = document.getElementById('file-upload');
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            setStatus({ type: 'error', message: '文件上传失败，请稍后重试' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="api-key-form-container">
            <div className="api-key-form-header">
                <h2>API密钥管理</h2>
            </div>
            <form onSubmit={handleSubmit} className="api-key-form">
                <div className="form-group">
                    <label htmlFor="apiKey">API密钥 *</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="请输入您的API密钥"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="baseUrl">Base URL（选填）</label>
                    <input
                        id="baseUrl"
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="请输入Base URL（可选）"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="api-type">API 类型</label>
                    <Select
                        id="api-type"
                        value={apiType}
                        onChange={(e) => setApiType(e.target.value)}
                        className="form-input"
                    >
                        <MenuItem value="gemini">Gemini</MenuItem>
                        <MenuItem value="openai">OpenAI</MenuItem>
                    </Select>
                </div>

                {status.message && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting || !apiKey.trim()}
                >
                    {isSubmitting ? '提交中...' : '提交'}
                </button>

                <div className="form-divider">或</div>

                <div className="form-group">
                    <label htmlFor="file-upload">批量导入API密钥（.txt文件）</label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".txt"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="file-input"
                    />
                    <small className="file-hint">每行一个API密钥</small>
                    <button 
                        type="button"
                        onClick={handleFileUpload}
                        className="upload-button"
                        disabled={isSubmitting || !file}
                    >
                        {isSubmitting ? '上传中...' : '上传文件'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default APIKeyForm;