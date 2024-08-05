import React, { useState, useEffect } from 'react';
import './App.css';

// const BASE_URL = 'https://tokyo.ororabrowser.com/api';
const BASE_URL = 'http://localhost:8081/api';

function generateUserId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

const USER_ID = localStorage.getItem('user_id') || generateUserId();
localStorage.setItem('user_id', USER_ID);

function App() {
  const [url, setUrl] = useState('');
  const [downloadStatus, setDownloadStatus] = useState([]);
  const [deleteId, setDeleteId] = useState(''); // State for delete ID input
  const [deleteUserId, setDeleteUserId] = useState(''); // State for delete user ID input

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (url.trim() === '') {
      alert('Please enter a URL');
      return;
    }

    const format = url.includes('soundcloud') ? 'mp3' : 'mp4';

    try {
      const response = await fetch(`${BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, format, quality: 'best', folder: 'downloads', user_id: USER_ID })
      });

      if (response.ok) {
        console.log('Download initiated');
      } else {
        console.error('Error initiating download');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${BASE_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: deleteId, user_id: deleteUserId })
      });

      if (response.ok) {
        console.log('Download deleted');
        setDownloadStatus(downloadStatus.filter(status => status.id !== deleteId));
        setDeleteId(''); // Clear input field after successful deletion
        setDeleteUserId(''); // Clear input field after successful deletion
      } else {
        console.error('Error deleting download');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8081/api/ws?user_id=${USER_ID}`);

    ws.onmessage = function(event) {
      const parsedData = JSON.parse(event.data);
      setDownloadStatus((prevStatus) => {
        const existingItemIndex = prevStatus.findIndex(status => status.id === parsedData.id);
        let updatedStatus;
        if (existingItemIndex !== -1) {
          updatedStatus = [...prevStatus];
          updatedStatus[existingItemIndex] = parsedData;
        } else {
          // New downloads should be added to the beginning of the array
          updatedStatus = [parsedData, ...prevStatus];
        }
        return updatedStatus;
      });
    };

    ws.onerror = function(error) {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Download Manager</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter video URL"
          />
          <button type="submit">Download</button>
        </form>

        {/* Delete Section */}
        <div>
          <h2>Delete Download</h2>
          <input
            type="text"
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            placeholder="Enter Download ID"
          />
          <input
            type="text"
            value={deleteUserId}
            onChange={(e) => setDeleteUserId(e.target.value)}
            placeholder="Enter User ID"
          />
          <button onClick={handleDelete}>Delete</button>
        </div>

        {/* Download Status Section */}
        <div className="status-container">
          {downloadStatus.length > 0 && <div className="status-header">Download Status</div>}
          <div className="status-content">
            {downloadStatus.map((status, index) => (
              <div key={index} className="status-item">
                <pre>{JSON.stringify(status, null, 2)}</pre>
                <button onClick={() => handleDelete(status.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
