import React, { useState, useEffect } from 'react';
import './App.css';

const BASE_URL = 'https://tokyo.ororabrowser.com/api';

// Generate or retrieve a unique user ID (this can be stored in local storage or obtained via login)
const USER_ID = localStorage.getItem('user_id') || generateUserId();
localStorage.setItem('user_id', USER_ID);

function generateUserId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function App() {
  const [url, setUrl] = useState('');
  const [downloadStatus, setDownloadStatus] = useState([]);

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

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/events?user_id=${USER_ID}`);

    eventSource.onmessage = function(event) {
      const parsedData = JSON.parse(event.data);
      setDownloadStatus((prevStatus) => {
        if (prevStatus.some(status => status.id === parsedData.id)) {
          return prevStatus.map(status =>
              status.id === parsedData.id ? parsedData : status
          );
        }
        return [...prevStatus, parsedData];
      });
    };

    eventSource.onerror = function(error) {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
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
          <div className="status-container">
            <div className="status-header">Download Status</div>
            <div className="status-content">
              {downloadStatus.map((status, index) => (
                  <div key={index} className="status-item">
                    <pre>{JSON.stringify(status, null, 2)}</pre>
                  </div>
              ))}
            </div>
          </div>
        </header>
      </div>
  );
}

export default App;
