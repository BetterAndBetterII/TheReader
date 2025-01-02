import React, { useState, useEffect } from 'react';
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, Button, Typography, Dialog, DialogTitle, DialogContent, IconButton, Tooltip, Snackbar } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import DocumentUploader from '../../components/DocumentUploader/DocumentUploader';
import DocumentList from '../../components/DocumentList/DocumentList';
import './DocumentPage.css';

const DocumentPage = ({ onViewDocument, permissionChallenge }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [updateTime, setUpdateTime] = useState(new Date().toLocaleString());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 更新 URL 参数
  const updateUrlParams = (params) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url.toString());
  };

  // 从 URL 和 localStorage 恢复状态
  useEffect(() => {
    const url = new URL(window.location.href);
    const projectId = url.searchParams.get('project');
    const collectionId = url.searchParams.get('collection');
    
    // 如果 URL 中有 project，优先使用 URL 中的
    if (projectId) {
      setSelectedProject(projectId);
    } else {
      // 否则尝试从 localStorage 获取上次选择的 project
      const lastProject = localStorage.getItem('lastSelectedProject');
      if (lastProject) {
        setSelectedProject(lastProject);
        // 更新 URL
        updateUrlParams({ project: lastProject, collection: collectionId });
      }
    }

    // 如果 URL 中有 collection，设置选中的 collection
    if (collectionId) {
      setSelectedCollection(collections.find(collection => collection.id === collectionId));
    } else {
      // 否则尝试从 localStorage 获取上次选择的 collection
      const lastCollection = localStorage.getItem('lastSelectedCollection');
      if (lastCollection) {
        setSelectedCollection(collections.find(collection => collection.id === lastCollection));
      }
    }
  }, []);

  // 监听浏览器的前进后退
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const projectId = url.searchParams.get('project');
      const collectionId = url.searchParams.get('collection');
      
      if (projectId) {
        setSelectedProject(projectId);
      }
      if (collectionId) {
        setSelectedCollection(collections.find(collection => collection.id === collectionId));
      } else {
        setSelectedCollection(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 获取项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  // 当选择项目时获取集合列表
  useEffect(() => {
    if (selectedProject) {
      fetchCollections(selectedProject);
      // setSelectedCollection(null);
      // 保存到 localStorage
      localStorage.setItem('lastSelectedProject', selectedProject);
      // 更新 URL
      updateUrlParams({ project: selectedProject });
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      fetch('/api/projects/').then(response => {
        if (response.status === 403) {
          permissionChallenge();
        } else {
          return response.json();
        }
      }).then(data => {
        setProjects(data.projects || []);
      }).catch(error => {
        console.error('获取项目列表失败:', error);
      });
    } catch (error) {
      console.error('获取项目列表失败:', error);
      if (error.message === '权限不足') {
        permissionChallenge();
      } else {
        console.error('获取项目列表失败:', error);
      }
    }
  };

  const handleDeleteProject = async () => {
    // 二次确认
    if (window.confirm('确定要删除该项目吗？项目下所有集合和文档都将被删除！且无法恢复！')) {
      if (window.confirm('再次确认要删除该项目吗？')) {
        fetch(`/api/projects/delete/`, {
          method: 'POST',
          body: JSON.stringify({ project_id: selectedProject }),
        }).then(response => {
          if (response.status === 403) {
            permissionChallenge();
          } else {
            setSnackbar({
              open: true,
              message: '项目删除成功',
              severity: 'success'
            });
            fetchProjects();
          }
        });
      }
    }
  };

  const fetchCollections = async (projectId) => {
    try {
      fetch(`/api/projects/${projectId}/collections/`).then(response => {
        if (response.status === 403) {
          permissionChallenge();
        } else {
          return response.json();
        }
      }).then(data => {
        setCollections(data.collections || []);
      }).catch(error => {
        console.error('获取集合列表失败:', error);
      });
    } catch (error) {
      if (error.message === '权限不足') {
        permissionChallenge();
      } else {
        console.error('获取集合列表失败:', error);
      }
    }
  };

  const handleCreateProject = async () => {
    const projectName = prompt('请输入项目名称：');
    if (projectName) {
      try {
        fetch('/api/projects/create/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: projectName }),
        }).then(response => {
          if (response.status === 403) {
            permissionChallenge();
          } else {
            return response.json();
          }
        }).then(data => {
          setSnackbar({
            open: true,
            message: '创建项目成功',
            severity: 'success'
          });
          fetchProjects();
        }).catch(error => {
          console.error('创建项目失败:', error);
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: '创建项目失败',
          severity: 'error'
        });
        if (error.message === '权限不足') {
          permissionChallenge();
        } else {
          console.error('创建项目失败:', error);
        }
      }
    }
  };

  const handleCreateCollection = async () => {
    const collectionName = prompt('请输入集合名称：');
    if (collectionName && selectedProject) {
      try {
        fetch(`/api/projects/${selectedProject}/collections/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: collectionName }),
        }).then(response => {
          if (response.status === 403) {
            permissionChallenge();
          } else {
            setSnackbar({
              open: true,
              message: '创建集合成功',
              severity: 'success'
            });
            return response.json();
          }
        }).then(data => {
          fetchCollections(selectedProject);
        }).catch(error => {
          console.error('创建集合失败:', error);
        });
      } catch (error) {
        if (error.message === '权限不足') {
          permissionChallenge();
        } else {
          console.error('创建集合失败:', error);
        }
      }
    }
  };

  const handleDeleteCollection = async () => {
    if (window.confirm('确定要删除该集合吗？集合下所有文档都将被删除！且无法恢复！')) {
      fetch(`/api/projects/${selectedProject}/collections/delete/`, {
        method: 'POST',
        body: JSON.stringify({ collection_id: selectedCollection.id }),
      }).then(response => {
        if (response.status === 403) {
          permissionChallenge();
        } else {
          setSnackbar({
            open: true,
            message: '集合删除成功',
            severity: 'success'
          });
          fetchCollections(selectedProject);
        }
      });
    }
  };

  const handleCollectionClick = (collection) => {
    setSelectedCollection(collection);
    // 更新 URL 中的 collection 参数
    updateUrlParams({ project: selectedProject, collection: collection.id });
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  const handleUploadSuccess = () => {
    setUpdateTime(new Date().toLocaleString());
    // 上传成功后关闭对话框
    setUploadDialogOpen(false);
  };

  const handleRefreshDocuments = () => {
    setIsRefreshing(true);
    setUpdateTime(new Date().toLocaleString());
    // 添加动画效果
    setTimeout(() => {
      setIsRefreshing(false);
    }, 120);
  };

  return (
    <Box className="document-page" sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>选择项目</InputLabel>
              <Select
                value={selectedProject}
                label="选择项目"
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
            >
              创建项目
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteProject}
              disabled={!selectedProject}
              color="error"
            >
              删除项目
            </Button>
          </Box>
        </Grid>

        {selectedProject && (
          <>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">集合列表</Typography>
                <Box display="flex" gap={2}>
                  {selectedCollection && (
                    <Button
                      variant="contained"
                      startIcon={<UploadFileIcon />}
                      onClick={handleOpenUploadDialog}
                      color="primary"
                    >
                      上传文档
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateCollection}
                  >
                    创建集合
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteCollection}
                    disabled={!selectedCollection}
                    color="error"
                  >
                    删除集合
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {collections.map((collection) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={collection.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: selectedCollection?.id === collection.id ? '#e3f2fd' : 'background.paper',
                      }}
                      onClick={() => handleCollectionClick(collection)}
                    >
                      <FolderIcon sx={{ fontSize: 40, color: '#FFA000' }} />
                      <Typography>{collection.name}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </>
        )}

        {selectedCollection && (
          <Grid item xs={12}>
            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {selectedCollection.name} 中的文档
                </Typography>
                <Tooltip title="刷新文档列表">
                  <IconButton 
                    onClick={handleRefreshDocuments}
                    sx={{
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': {
                          transform: 'rotate(0deg)',
                        },
                        '100%': {
                          transform: 'rotate(360deg)',
                        },
                      },
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <DocumentList
                updateTime={updateTime}
                onViewDocument={onViewDocument}
                collectionId={selectedCollection.id}
                projectId={selectedProject}
              />
            </Box>
          </Grid>
        )}
      </Grid>

      {/* 上传文档对话框 */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              上传文档到 {selectedCollection?.name}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseUploadDialog}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DocumentUploader 
            onUploadSuccess={handleUploadSuccess}
            collectionId={selectedCollection?.id}
          />
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
        message={snackbar.message}
        severity={snackbar.severity}
        autoHideDuration={2000}
      />
    </Box>
  );
};

export default DocumentPage; 