import React, { useState, useEffect } from 'react';
import Grid2 from '@mui/material/Grid';
import { 
    Card, 
    CardContent, 
    CardActions, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    CircularProgress,
    IconButton,
    Box
} from '@mui/material';
import { Description, Visibility, CheckCircle, Error } from '@mui/icons-material';
import './DocumentList.css';

const DocumentList = ({updateTime, onViewDocument}) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // 获取文档列表
    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/documents/');
            const data = await response.json();
            setDocuments(data.documents);
        } catch (error) {
            console.error('获取文档列表失败');
        } finally {
            setLoading(false);
        }
    };

    // 获取文档详情
    const fetchDocumentDetail = async (docId) => {
        onViewDocument(docId);
    };

    // 获取状态对应的图标和颜色
    const getStatusInfo = (status) => {
        switch (status) {
            case 'COMPLETED':
                return { icon: <CheckCircle color="success" />, color: 'success.main' };
            case 'FAILED':
                return { icon: <Error color="error" />, color: 'error.main' };
            default:
                return { icon: <CircularProgress size={20} />, color: 'info.main' };
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [updateTime]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="document-list-container">
            <Grid2 container spacing={3}>
                {documents.length > 0 ? documents.map((doc) => (
                    <Grid2 xs={12} sm={6} md={4} key={doc.id}>
                        <Card className="document-card">
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Description sx={{ mr: 1 }} />
                                    <Typography variant="h6" component="div">
                                        {doc.title}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mb={1}>
                                    {getStatusInfo(doc.status).icon}
                                    <Typography 
                                        variant="body2" 
                                        sx={{ ml: 1, color: getStatusInfo(doc.status).color }}
                                    >
                                        {doc.status === 'COMPLETED' ? '处理完成' : 
                                         doc.status === 'FAILED' ? '处理失败' : '处理中'}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    上传时间: {new Date(doc.created_at).toLocaleString()}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <IconButton 
                                    onClick={() => fetchDocumentDetail(doc.url)}
                                    aria-label="查看详情"
                                    disabled={doc.status !== 'COMPLETED'}
                                >
                                    <Visibility />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid2>
                )) : (
                    <Grid2 xs={12}>
                        <Typography variant="h6" align="center">暂无文档</Typography>
                    </Grid2>
                )}
            </Grid2>

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