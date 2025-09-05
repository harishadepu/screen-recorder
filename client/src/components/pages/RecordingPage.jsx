import React, { useState, useRef } from 'react';

const RecordingPage = () => {
  const [recording, setRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [timer, setTimer] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),
        ...micStream.getAudioTracks()
      ]);

      streamRef.current = combinedStream;

      mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'video/webm' });
        setMediaBlobUrl(URL.createObjectURL(blob));
        setRecordedBlob(blob);
        chunks.current = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      let count = 0;
      intervalRef.current = setInterval(() => {
        count++;
        setTimer(count);
        if (count >= 180) stopRecording();
      }, 1000);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Failed to access screen or microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    clearInterval(intervalRef.current);
    setRecording(false);
  };

  const uploadRecording = async () => {
    if (!recordedBlob) {
      alert('No recording available to upload.');
      return;
    }

    console.log('Uploading blob size:', recordedBlob);

    const formData = new FormData();
    formData.append('recording', recordedBlob, `recording_${Date.now()}.webm`);

    try {
      const res = await fetch('https://screen-recorder-back.onrender.com/api/recordings', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed:', errorText);
        alert('Upload failed: ' + errorText);
      } else {
        alert('Upload successful!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed due to network or server error.');
    }
  };

  return (
    <div className='flex flex-col items-center p-4 mt-10 gap-4'>
      <h2 className='text-2xl font-bold'>Screen Recorder</h2>
      <div className='flex gap-4'>
        <button className='border rounded px-3 py-2' onClick={startRecording} disabled={recording}>Start</button>
        <button className='border rounded px-3 py-2' onClick={stopRecording} disabled={!recording}>Stop</button>
      </div>

      <p>Timer: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</p>

      {mediaBlobUrl && (
        <>
          <video src={mediaBlobUrl} controls width="500" />
          <a href={mediaBlobUrl} download={`recording_${Date.now()}.webm`}>Download</a>
          <button onClick={uploadRecording}>Upload</button>
        </>
      )}
    </div>
  );
};

export default RecordingPage;
