import React from 'react';
import APIKeyForm from '../../components/APIKeyForm/APIKeyForm';
import APIKeyTable from '../../components/APIKeyTable/APIKeyTable';
import PermissionSettings from '../../components/PermissionSettings/PermissionSettings';
import './SettingsPage.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
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
  Tooltip,
  Divider
} from '@mui/material';

const SettingsPage = () => {
  const [apiKeys, setApiKeys] = useState([]);
  
  const fetchApiKeys = async () => {
    const response = await axios.get('/api/list_api_keys');
    setApiKeys(response.data.api_keys);
  };

  useEffect(() => {
      fetchApiKeys();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ backgroundColor: 'white' }}>
      <Container maxWidth="xl" sx={{ backgroundColor: '#f9f9f9', borderRadius: '20px' }}>

        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            API 密钥设置
          </Typography>
          
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
            <APIKeyForm onAdd={fetchApiKeys}/>
          </Paper>
          <APIKeyTable apiKeys={apiKeys} fetchApiKeys={fetchApiKeys} />
        </Box>
        </Container>

      {/* 分割线 */}
      <Divider sx={{ my: 4 }} />
      <Container maxWidth="xl" sx={{ backgroundColor: '#f9f9f9', borderRadius: '20px' }}>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          站点权限设置
        </Typography>
        
        <PermissionSettings />
      </Box>
      </Container>
      
    </Container>
    
  );
};

export default SettingsPage; 