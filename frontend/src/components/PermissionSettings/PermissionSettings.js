import React, { useState, useEffect } from 'react';
import {
  Paper,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Alert,
  Snackbar,
  TextField,
  Button,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import './PermissionSettings.css';

const PermissionSettings = () => {
  const [permissions, setPermissions] = useState({
    guest_can_view: false,
    guest_can_upload: false,
    guest_can_delete: false
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('/api/permissions/get_permission/');
      setPermissions(response.data);
    } catch (error) {
      console.error('获取权限设置失败:', error);
      setSnackbar({
        open: true,
        message: '获取权限设置失败',
        severity: 'error'
      });
    }
  };

  const handlePermissionChange = async (permission) => {
    try {
      const newPermissions = {
        ...permissions,
        [permission]: !permissions[permission]
      };
      
      await axios.post('/api/permissions/set_permission/', newPermissions);
      setPermissions(newPermissions);
      setSnackbar({
        open: true,
        message: '权限设置更新成功',
        severity: 'success'
      });
    } catch (error) {
      console.error('更新权限设置失败:', error);
      setSnackbar({
        open: true,
        message: '更新权限设置失败',
        severity: 'error'
      });
    } finally {
      fetchPermissions();
    }
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordForm({
      ...passwordForm,
      [field]: event.target.value
    });
  };

  const handleClickShowPassword = (field) => () => {
    setPasswordForm({
      ...passwordForm,
      [field]: !passwordForm[field]
    });
  };

  const handleSubmitPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({
        open: true,
        message: '两次输入的密码不一致',
        severity: 'error'
      });
      return;
    }

    try {
      await axios.post('/api/permissions/change_password/', {
        new_password: passwordForm.newPassword
      });
      
      setSnackbar({
        open: true,
        message: '密码修改成功',
        severity: 'success'
      });
      
      // 清空表单
      setPasswordForm({
        ...passwordForm,
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('修改密码失败:', error);
      setSnackbar({
        open: true,
        message: '修改密码失败',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          在这里配置访客用户的权限。超级管理员默认拥有所有权限。
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={permissions.guest_can_view}
              onChange={() => handlePermissionChange('guest_can_view')}
              color="primary"
            />
          }
          label="允许访客查看文档"
        />

        <FormControlLabel
          control={
            <Switch
              checked={permissions.guest_can_upload}
              onChange={() => handlePermissionChange('guest_can_upload')}
              color="primary"
            />
          }
          label="允许访客上传文档"
        />

        <FormControlLabel
          control={
            <Switch
              checked={permissions.guest_can_delete}
              onChange={() => handlePermissionChange('guest_can_delete')}
              color="primary"
            />
          }
          label="允许访客删除文档"
        />

        <FormControlLabel
          control={
            <Switch
              checked={permissions.guest_can_use_api}
              onChange={() => handlePermissionChange('guest_can_use_api')}
              color="primary"
            />
          }
          label="允许访客使用 API"
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          修改管理员密码
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          请设置一个安全的新密码，建议使用字母、数字和特殊字符的组合。
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
        <TextField
          label="新密码"
          type={passwordForm.showPassword ? 'text' : 'password'}
          value={passwordForm.newPassword}
          onChange={handlePasswordChange('newPassword')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword('showPassword')}
                  edge="end"
                >
                  {passwordForm.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="确认新密码"
          type={passwordForm.showConfirmPassword ? 'text' : 'password'}
          value={passwordForm.confirmPassword}
          onChange={handlePasswordChange('confirmPassword')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword('showConfirmPassword')}
                  edge="end"
                >
                  {passwordForm.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmitPassword}
          disabled={!passwordForm.newPassword || !passwordForm.confirmPassword}
          sx={{ mt: 2 }}
        >
          修改密码
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PermissionSettings;
