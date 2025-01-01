import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './APIKeyForm.css';



const APIKeyForm = ({ onAdd }) => {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await axios.post('/api/add_api_key', {
                key: apiKey.trim(),
                ...(baseUrl.trim() && { base_url: baseUrl.trim() })
            });

            if (response.data.error) {
                setStatus({
                    type: 'error',
                    message: 'API密钥验证失败，请重试'
                });
            } else if (response.data.message) {
                setStatus({
                    type: 'success',
                    message: response.data.message
                });
                onAdd();
                // 清空表单
                setApiKey('');
                setBaseUrl('');
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: '提交失败，请稍后重试'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    

    return (
        <div className="api-key-form-container">
            <div className="api-key-form-header">
                <h2>API密钥管理</h2>
            </div>
            <div className="api-key-form-content">
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
            </form>
            </div>
            
        </div>
    );
};

export default APIKeyForm; 