import React, { useState, useCallback } from 'react';
import { 
    Box, 
    Typography, 
    LinearProgress, 
    Paper, 
    Alert,
    Snackbar
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from '@mui/icons-material';
import './DocumentUploader.css';

const DocumentUploader = ({ onUploadSuccess }) => {
    const [uploadProgress, setUploadProgress] = useState({});
    const [processingFiles, setProcessingFiles] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            try {
                // 开始上传
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: {
                        percent: 0,
                        status: 'uploading'
                    }
                }));

                const response = await fetch('/api/documents/upload/', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(`${file.name} 上传成功`);
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: {
                            percent: 100,
                            status: 'success'
                        }
                    }));

                    if (data?.task_id) {
                        pollProcessingStatus(data.task_id, file.name);
                    }

                    if (onUploadSuccess) {
                        onUploadSuccess(data);
                    }
                } else {
                    throw new Error(data.error || '上传失败');
                }
            } catch (error) {
                showMessage(`${file.name} 上传失败: ${error.message}`, 'error');
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: {
                        percent: 0,
                        status: 'error'
                    }
                }));
            }
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
        }
    });

    // 轮询文档处理进度
    const pollProcessingStatus = async (taskId, fileName) => {
        setProcessingFiles(prev => [...prev, { taskId, fileName }]);
        
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/documents/status/${taskId}/`);
                const data = await response.json();
                
                if (data.status === 'COMPLETED') {
                    showMessage(`${fileName} 处理完成`);
                    setProcessingFiles(prev => prev.filter(f => f.taskId !== taskId));
                } else if (data.status === 'FAILED') {
                    showMessage(`${fileName} 处理失败: ${data.error_message || '未知错误'}`, 'error');
                    setProcessingFiles(prev => prev.filter(f => f.taskId !== taskId));
                } else {
                    // 继续轮询
                    setTimeout(checkStatus, 2000);
                }
            } catch (error) {
                showMessage('检查处理状态失败', 'error');
                setProcessingFiles(prev => prev.filter(f => f.taskId !== taskId));
            }
        };
        
        checkStatus();
    };

    return (
        <div className="document-uploader">
            <Paper
                {...getRootProps()}
                sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    cursor: 'pointer'
                }}
            >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    点击或拖拽文件到此区域上传
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    支持 PDF、Word、PowerPoint 文件
                </Typography>
            </Paper>

            {/* 显示上传进度 */}
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <Box key={fileName} sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" gutterBottom>{fileName}</Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress.percent}
                        color={progress.status === 'error' ? 'error' : 'primary'}
                    />
                </Box>
            ))}

            {/* 显示处理中的文件 */}
            {processingFiles.map(file => (
                <Box key={file.taskId} sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" gutterBottom>{file.fileName}</Typography>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        正在处理中...
                    </Typography>
                </Box>
            ))}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default DocumentUploader; 