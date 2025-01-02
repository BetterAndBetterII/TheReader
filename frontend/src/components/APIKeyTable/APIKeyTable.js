import './APIKeyTable.css';
import axios from 'axios';
import { useState } from 'react';
import { 
  Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    IconButton,
    Typography,
    Container,
    Box,
    Chip,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CountertopsIcon from '@mui/icons-material/Countertops';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

const APIKeyTable = ({ apiKeys, fetchApiKeys }) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedApiKey, setSelectedApiKey] = useState(null);

    const onDelete = async (key) => {
        setSelectedApiKey(key);
        setConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
          await axios.post('/api/delete_api_key', { api_key: selectedApiKey });
          fetchApiKeys();
        } catch (error) {
          console.error('删除 API Key 失败:', error);
        }
        setConfirmDialogOpen(false);
      };
    
      const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
      };

    return (
        <TableContainer component={Paper} sx={{ mt: 4 }} backgroundColor>
          <Table sx={{ minWidth: 650 }} aria-label="API keys table">
            <TableHead>
              <TableRow>
                <TableCell align="center">API 密钥</TableCell>
                <TableCell align="center">Base URL</TableCell>
                <TableCell align="center">创建时间</TableCell>
                <TableCell align="center">
                  <Tooltip title="调用次数">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CountertopsIcon sx={{ mr: 1 }}  />
                      调用次数
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="最后使用时间">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1 }} />
                      最后使用
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="最后错误信息">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ErrorOutlineIcon sx={{ mr: 1 }} />
                      错误信息
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow
                  key={apiKey.key}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell align="center">
                    <Chip 
                      label={apiKey.key}
                      variant="outlined"
                      size="small"
                      sx={{ maxWidth: 200 }}
                    />
                  </TableCell>
                  <TableCell align="center">{apiKey.base_url}</TableCell>
                  <TableCell align="center">
                    {apiKey.created_at ? (
                      <Tooltip title={apiKey.created_at}>
                        <Chip 
                          label={apiKey.created_at.split(' ')[0]}
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : '暂无信息'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={apiKey.counter || 0}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {apiKey.last_used_at ? (
                      <Tooltip title={apiKey.last_used_at}>
                        <Chip 
                          label={apiKey.last_used_at.split(' ')[0]}
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : '暂无信息'}
                  </TableCell>
                  <TableCell align="center">
                    {apiKey.last_error_message ? (
                      <Tooltip title={apiKey.last_error_message}>
                        <Chip 
                          label="查看详情"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : '暂无错误'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="删除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(apiKey.key)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {confirmDialogOpen && (
            <Box sx={{ mt: 4, textAlign: 'center' }}> 
            <Dialog open={confirmDialogOpen} onClose={handleCancelDelete}>  
                <DialogTitle>确认删除 API Key</DialogTitle>
                <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    你即将删除的 API Key 是：{selectedApiKey}。
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    请注意，删除后将无法恢复。
                </Typography>
                </DialogContent>
                <DialogActions>
                <Button variant="contained" color="primary" onClick={handleCancelDelete}>
                    取消
                </Button>
                <Button variant="contained" color="error" onClick={handleConfirmDelete}>
                    确认删除
                </Button>
                </DialogActions>
            </Dialog>
            </Box>
        )}
        </TableContainer>
    )
}

export default APIKeyTable;
