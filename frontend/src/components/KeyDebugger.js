// frontend/src/components/KeyDebugger.js
import React from 'react';
import { debugStoredKeys, clearInvalidKeys } from '../utils/debugKeys';

export default function KeyDebugger() {
  const handleDebug = () => {
    debugStoredKeys();
  };

  const handleClearInvalid = () => {
    clearInvalidKeys();
    alert('Invalid keys cleared. Please logout and login again.');
  };

  const handleClearAll = () => {
    if (window.confirm('This will clear ALL stored keys. Are you sure?')) {
      localStorage.removeItem('userKeys');
      localStorage.removeItem('publicKeysCache');
      sessionStorage.clear();
      alert('All keys cleared. Please logout and login again.');
      window.location.reload();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: '#333',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px'
    }}>
      <button onClick={handleDebug} style={{ margin: '2px' }}>
        🔍 Debug Keys
      </button>
      <button onClick={handleClearInvalid} style={{ margin: '2px' }}>
        🗑️ Clear Invalid
      </button>
      <button onClick={handleClearAll} style={{ margin: '2px' }}>
        💣 Clear All
      </button>
    </div>
  );
}