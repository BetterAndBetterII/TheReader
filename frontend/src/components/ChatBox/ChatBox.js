import React, { useState, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ChatBox.css';

const ChatBox = ({ pageContent }) => {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageData, setImageData] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handlePaste = useCallback(async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                const reader = new FileReader();
                
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1];
                    setImageData(base64String);
                };
                
                reader.readAsDataURL(file);
                break;
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() && !imageData) return;

        // 添加用户消息到历史记录
        const userMessage = {
            role: 'user',
            content: [
                {
                    "type": "text",
                    "text": input.trim()
                },
                ...(imageData ? [{
                    "type": "image_url",
                    "image_url": {
                        "url": `data:image/jpeg;base64,${imageData}`
                    }
                }] : []),
                ...(pageContent ? [{
                    "type": "text",
                    "text": pageContent
                }] : [])
            ],
            timestamp: new Date().toISOString(),
        };
        
        setChatHistory(prev => [...prev, userMessage]);
        setIsLoading(true);
        setResponse('');

        try {
            // 构建完整的对话历史
            const messages = [...chatHistory, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const fullContent = `你需要根据历史聊天记录回答我的问题。务必使用与课程教案相同的语言回答我。<|历史记录|>\n${messages.map(msg => `<|${msg.role}|>\n${msg.content.map(item => item.text || "").join('')}`).join('\n')}\n<|课程教案相关内容：|>\n${pageContent}\n<|当前问题|>\n${input}`;

            const result = await axios.post('/api/gemini_chat_image', {
                prompt: fullContent,
                image_data: imageData,
            });

            const assistantMessage = {
                role: 'assistant',
                content: [{
                    "type": "text",
                    "text": result.data.response || '未获取到回答'
                }],
                timestamp: new Date().toISOString(),
            };

            setChatHistory(prev => [...prev, assistantMessage]);
            setResponse(assistantMessage.content);
            setImageData(null);
            setInput('');
        } catch (error) {
            console.error('Error:', error);
            setResponse('抱歉，发生了一些错误，请稍后再试。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        setShowConfirmDialog(true);
    };

    const confirmClear = () => {
        setChatHistory([]);
        setResponse('');
        setShowConfirmDialog(false);
    };

    return (
        <div className="chat-container">
            {showConfirmDialog && (
                <div className="confirm-dialog">
                    <div className="confirm-dialog-content">
                        <p>确定要清空所有聊天记录吗？</p>
                        <div className="confirm-dialog-buttons">
                            <button onClick={confirmClear} className="confirm-yes">确定</button>
                            <button onClick={() => setShowConfirmDialog(false)} className="confirm-no">取消</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="chat-history">
                {chatHistory.map((message, index) => (
                    <div 
                        key={index} 
                        className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                    >
                        {message.content.length > 1 && message.content.map(item => item.image_url ? <div className="message-content-image-container">
                            <img src={item.image_url.url} alt="已粘贴的图片" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                        </div> : null)}
                        {message.content.length > 0 && <div className={`message-content markdown-body ${message.role === 'user' ? 'user-message-content' : 'assistant-message-content'}`}> 
                            {message.role === 'assistant' ? <ReactMarkdown>{message.content[0].text}</ReactMarkdown> : message.content[0].text || ""}
                        </div>}
                    </div>
                ))}
            </div>

            <div className="chat-response">
                {isLoading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="请输入您的问题...（支持Markdown格式）"
                    className="chat-input"
                />
                {imageData && (
                    <div className="image-preview">
                        <img 
                            src={`data:image/jpeg;base64,${imageData}`} 
                            alt="已粘贴的图片" 
                            style={{ maxWidth: '100px', maxHeight: '100px' }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setImageData(null)}
                            className="remove-image"
                        >
                            ×
                        </button>
                    </div>
                )}
                <button 
                    type="submit" 
                    className="send-button"
                    disabled={isLoading}
                >
                    发送
                </button>
                <button 
                    type="button"
                    onClick={handleClearHistory}
                    className="clear-history-button"
                >
                    清空
                </button>
            </form>
        </div>
    );
};

export default ChatBox; 