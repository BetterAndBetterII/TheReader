import './APIKeyForm.css';
import axios from 'axios';

const APIKeyItem = ({ apiKey, baseUrl, onDelete }) => {
    const handleDelete = async (apiKey) => {
        await axios.post('/api/delete_api_key', { api_key: apiKey });
        onDelete();
    };
    return (
        <div className="api-key-item">
            <span>{apiKey}</span>
            <span>{baseUrl}</span>
            <button onClick={() => handleDelete(apiKey)}>删除</button>
        </div>
    );
};

export default APIKeyItem;