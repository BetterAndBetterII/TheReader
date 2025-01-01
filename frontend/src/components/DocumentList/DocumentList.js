import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { 
    Card, 
    CardContent, 
    CardActions, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    CircularProgress,
    IconButton,
    Box,
    LinearProgress,
    CardMedia
} from '@mui/material';
import { Description, Visibility, CheckCircle, Error, HourglassEmpty, Delete } from '@mui/icons-material';
import './DocumentList.css';

const DocumentList = ({updateTime, onViewDocument, collectionId, projectId}) => {
    const [documents, setDocuments] = useState([]);
    const [processingTasks, setProcessingTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // 获取文档列表
    const fetchDocuments = async () => {
        if (!collectionId) return;
        
        try {
            const response = await fetch(`/api/projects/${projectId}/collections/${collectionId}/`);
            const data = await response.json();
            if (response.ok) {
                setDocuments(data.collection.documents || []);
                setProcessingTasks(data.collection.processing_tasks || []);
                // 如果有处理中的文档，启动轮询
                const processingTasks = (data.collection.processing_tasks || []);
                if (processingTasks.length > 0) {
                    startPolling(processingTasks);
                }
            } else {
                console.error('获取文档列表失败:', data.error);
                setDocuments([]);
            }
        } catch (error) {
            console.error('获取文档列表失败:', error);
            setDocuments([]);
        }
    };

    // 轮询处理中的文档状态
    const startPolling = (processingTasks) => {
        processingTasks.forEach(task => {
            const checkStatus = async () => {
                try {
                    const response = await fetch(`/api/documents/status/${task.id}/`);
                    const data = await response.json();
                    
                    if (data.status !== 'PROCESSING') {
                        // 如果任务处理完成或失败，更新任务列表
                        setTimeout(fetchDocuments, 3000);
                    } else {
                        // 继续轮询
                        setTimeout(checkStatus, 3000);
                    }
                } catch (error) {
                    console.error('检查任务状态失败:', error);
                }
            };
            
            checkStatus();
        });
    };

    // 获取文档详情
    const handleViewDocument = (docId) => {
        if (onViewDocument) {
            onViewDocument(docId);
        }
    };

    // 删除文档
    const handleRemoveDocument = (docId, taskId) => {
        setDeleteTarget({ docId, taskId });
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        const { docId, taskId } = deleteTarget;
        try {
            if (docId) {
                await fetch(`/api/documents/remove/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ document_id: docId }),
                });
            }
            if (taskId) {
                await fetch(`/api/documents/remove/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ task_id: taskId }),
                });
            }
            // 刷新文档列表
            fetchDocuments();
        } catch (error) {
            console.error('删除文档失败:', error);
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
    };

    // 获取状态对应的图标和颜色
    const getStatusInfo = (status) => {
        switch (status) {
            case 'COMPLETED':
                return { 
                    icon: <CheckCircle color="success" />, 
                    color: 'success.main',
                    text: '处理完成'
                };
            case 'FAILED':
                return { 
                    icon: <Error color="error" />, 
                    color: 'error.main',
                    text: '处理失败'
                };
            case 'PROCESSING':
                return { 
                    icon: <HourglassEmpty color="info" />, 
                    color: 'info.main',
                    text: '处理中'
                };
            default:
                return { 
                    icon: <CircularProgress size={20} />, 
                    color: 'info.main',
                    text: '未知状态'
                };
        }
    };

    useEffect(() => {
        if (collectionId) {
            setLoading(true);
            fetchDocuments();
            setLoading(false);
        }
        // 组件卸载时清理所有定时器
        return () => {
            const highestId = window.setTimeout(() => {
                for (let i = highestId; i >= 0; i--) {
                    window.clearTimeout(i);
                }
            }, 0);
        };
    }, [updateTime, collectionId]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="document-list-container">
            <Grid 
                container 
                spacing={3}
                justifyContent="flex-start"
                alignItems="stretch"
            >
                {processingTasks.length > 0 && processingTasks.map((task) => (
                    // 处理中的任务
                    <Grid item xs={12}>
                        <Card sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            backgroundColor: '#fff',
                            '&:hover': {
                                boxShadow: 3,
                            }
                        }}>
                            <CardContent sx={{ 
                                minWidth: '200px',
                                flex: 1,
                                p: 2,
                                '&:last-child': { pb: 2 }
                            }}>
                                <Typography variant="h6">{task.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    进度: {task.progress}%
                                </Typography>
                                <Box sx={{ width: '100%', mt: 1 }}>
                                    <LinearProgress variant="determinate" value={task.progress} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>  
                                    状态: {task.status}
                                </Typography>
                                <Box sx={{ position: 'absolute', bottom: 5, right: 5 }}>
                                    <IconButton 
                                        onClick={() => handleRemoveDocument(null, task.id)}
                                        aria-label="删除任务"
                                        size="small"
                                    >
                                    <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {documents.length > 0 ? documents.map((doc) => (
                    <Grid item xs={12} sm={6} md={4} key={doc.id}>
                        <Card sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            backgroundColor: '#fff',
                            '&:hover': {
                                boxShadow: 3,
                            }
                        }}>
                            <CardContent sx={{ 
                                flex: 1,
                                p: 2,
                                '&:last-child': { pb: 2 }
                            }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Description sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                    <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>
                                        {doc.title}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mb={1}>
                                    {getStatusInfo(doc.status).icon}
                                    <Typography 
                                        variant="body2" 
                                        sx={{ ml: 1, color: getStatusInfo(doc.status).color }}
                                    >
                                        {getStatusInfo(doc.status).text}
                                    </Typography>
                                </Box>
                                {doc.status === 'PROCESSING' && (
                                    <Box sx={{ width: '100%', mt: 1 }}>
                                        <LinearProgress />
                                    </Box>
                                )}
                                {/* 缩略图，适应高度 */}
                                <CardMedia
                                    component="img"
                                    image={doc.thumbnail_url}
                                    alt="Document Thumbnail"
                                    sx={{ height: 100, objectFit: 'contain' }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    上传时间: {new Date(doc.created_at).toLocaleString()}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ 
                                justifyContent: 'flex-end',
                                p: 1
                            }}>
                                <IconButton 
                                    onClick={() => handleViewDocument(doc.id)}
                                    aria-label="查看文档"
                                    disabled={doc.status !== 'COMPLETED'}
                                    size="small"
                                >
                                    <Visibility fontSize="small" />
                                </IconButton>
                                <IconButton 
                                    onClick={() => handleRemoveDocument(doc.id, doc.task_id)}
                                    aria-label="删除文档"
                                    size="small"
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                )) : <></>}
                {documents.length === 0 && processingTasks.length === 0 && (
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="center" alignItems="center" height={180}>
                            <Typography variant="h6" color="text.secondary">暂无文档</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <Dialog
                open={deleteConfirmOpen}
                onClose={handleCancelDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    确认删除
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        确定要删除这个文档吗？此操作无法撤销。
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        取消
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        删除
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={modalVisible}
                onClose={() => setModalVisible(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedDoc && (
                    <>
                        <DialogTitle>{selectedDoc.title}</DialogTitle>
                        <DialogContent>
                            <Typography variant="body1" gutterBottom>
                                文件类型: {selectedDoc.file_type}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                页数: {selectedDoc.pages?.length || 0}
                            </Typography>
                            <div className="document-pages">
                                {selectedDoc.pages?.map((page, index) => (
                                    <div key={index} className="page-preview">
                                        <img src={page.file_path} alt={`Page ${index + 1}`} />
                                        <Typography variant="body2">
                                            第 {index + 1} 页
                                        </Typography>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                    </>
                )}
            </Dialog>
            <div>
                <Typography variant="body1" gutterBottom>
                    更新时间: {updateTime}
                </Typography>
            </div>
        </div>
    );
};

export default DocumentList; 