import React, { useState } from 'react';
import axios from 'axios';

const SpeechToText = () => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSpeak = async () => {
    setIsRecording(true);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaStreamSource(stream);
        const audioChunks = [];

        audioSource.connect(audioContext.destination);

        const handleDataAvailable = event => {
          audioChunks.push(event.data);
        };

        audioSource.ondataavailable = handleDataAvailable;

        const handleStop = () => {
          audioSource.disconnect();
          audioContext.close();

          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio_file', audioBlob);

          axios.post('https://wappgaicbackendnew-hjdyapc3bff5avdg.eastus-01.azurewebsites.net/speech-to-text', formData)
            .then(response => {
              setText(response.data.text);
            })
            .catch(error => {
              console.error(error);
            });
        };

        setTimeout(handleStop, 5000); // Record for 5 seconds
      })
      .catch(error => {
        console.error(error);
      });
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={isRecording}>
        {isRecording ? 'This is Recording........' : 'Speak'}
      </button>
      <p>Text is: {text}</p>
    </div>
  );
};

export default SpeechToText;