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

const DocumentUploader = ({ onUploadSuccess, collectionId }) => {
    const [uploadProgress, setUploadProgress] = useState({});
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
            formData.append('collection_id', collectionId);

            try {
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
    }, [onUploadSuccess, collectionId]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
        }
    });

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