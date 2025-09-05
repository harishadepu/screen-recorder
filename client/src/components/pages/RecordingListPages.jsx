import React, { useEffect, useState } from 'react';

const RecordingListPages = () => {
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await fetch('https://screen-recorder-back.onrender.com/api/recordings');
        const data = await res.json();
        setRecordings(data);
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
      }
    };
    fetchRecordings();
  }, []);

  return (
    <div className='flex flex-col items-center p-4 mt-10 gap-4'>
      <h2 className='text-2xl font-bold'>Uploaded Recordings</h2>
      {recordings.length === 0 ? (
        <p>No recordings found.</p>
      ) : (
        <ul>
          {recordings.map(rec => (
            <li key={rec.id} className='m-4 p-4 border rounded'>
              <p><strong>Filename:</strong> {rec.filename}</p>
              <p><strong>Size:</strong> {(rec.size / 1024).toFixed(2)} KB</p>
              <p><strong>Created:</strong> {new Date(rec.createdAt).toLocaleString()}</p>
              <video src={`http://localhost:5000${rec.url}`} controls width="400" />
              <a href={`http://localhost:5000${rec.url}`} download={rec.filename}>Download</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecordingListPages;
