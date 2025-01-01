import React from 'react';
import APIKeyForm from '../../components/APIKeyForm/APIKeyForm';
import './SettingsPage.css';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h2>API 密钥设置</h2>
      <APIKeyForm />
    </div>
  );
};

export default SettingsPage; 