import React, { useRef, useState, forwardRef, useEffect } from 'react';
import JoditEditor from 'jodit-react';
import { Eye, FileText, Mic, Save, StopCircle } from 'lucide-react';
import {Navbar} from '../Navbar/Navbar';
import { baseUrl } from '../Config';
import { useLocation } from 'react-router-dom';


const Home = forwardRef(() => {
  const location = useLocation();
  const [transcripts, setTranscripts] = useState('');
  const editor = useRef(null);
  const [content, setContent] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false); 
  const [isEditorVisible, setEditorVisible] = useState(false);
  const [output, setOutput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fileName, setFileName] = useState('');
const [isFileNameModalVisible, setIsFileNameModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const pageRefs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null); // Store current document ID

  // Update content whenever output changes
  useEffect(() => {
    if (output) {
      setContent(output);
    }
  }, [output]);

  useEffect(() => {
    if (location.state?.documentContent) {
      setContent(location.state.documentContent);
      setFileName(location.state.documentName || '');
      setCurrentDocId(location.state.documentId); // Store the document ID
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

    // Toggle preview visibility
    const handlePreviewClick = () => {
      setIsPreviewVisible(!isPreviewVisible);
    };

    const handleExportToDoc = () => {
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Exported Document</title>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
  
      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
  
      // Create a temporary link to trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'document.doc';
      downloadLink.click();
  
      // Clean up the URL object after download
      URL.revokeObjectURL(url);
    };

    const splitContentIntoPages = (content) => {
      const pageHeight = 1123; // Approx height for A4 in pixels at 96 DPI
      let pages = [];
      let currentPageContent = '';
    
      // Simulate adding lines until the height is close to the page height
      content.split('\n').forEach(line => {
        currentPageContent += line + '\n';
        if (currentPageContent.length >= pageHeight) {
          pages.push(currentPageContent);
          currentPageContent = ''; // Reset for the next page
        }
      });
    
      if (currentPageContent) pages.push(currentPageContent); // Add remaining content
      return pages;
    };
    
    // On change, split the content into pages
    const pages = splitContentIntoPages(content);

  // Recording functionality
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
  
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
  
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
  
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const wavBlob = await convertToWav(audioBlob);
        await sendAudioToBackend(wavBlob);
        stream.getTracks().forEach(track => track.stop());
        stopTimer();
      };
  
      mediaRecorder.start(1000);
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };
  
  const convertToWav = async (webmBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000
    });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
    const wavBuffer = audioContext.createBuffer(
      1,
      audioBuffer.length,
      16000
    );
  
    wavBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);
  
    const wavBlob = await new Promise(resolve => {
      const offlineContext = new OfflineAudioContext(1, wavBuffer.length, 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = wavBuffer;
      source.connect(offlineContext.destination);
      source.start();
  
      offlineContext.startRendering().then(renderedBuffer => {
        const wav = new Blob([createWaveFileData(renderedBuffer)], { type: 'audio/wav' });
        resolve(wav);
      });
    });
  
    return wavBlob;
  };
  
  const createWaveFileData = (audioBuffer) => {
    const frameLength = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
    const blockAlign = numberOfChannels * bitsPerSample / 8;
    const wavDataByteLength = frameLength * numberOfChannels * 2;
    const headerByteLength = 44;
    const totalLength = headerByteLength + wavDataByteLength;
    const waveFileData = new Uint8Array(totalLength);
    const view = new DataView(waveFileData.buffer);
  
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + wavDataByteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, wavDataByteLength, true);
  
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < frameLength; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  
    return waveFileData;
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const sendAudioToBackend = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));

      const response = await fetch(`${baseUrl}/api/asr`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.transcript) {
        setTranscripts((prevTranscripts) => `${prevTranscripts ? prevTranscripts + '\n' : ''}${data.transcript}`);
        setContent((prevContent) => `${prevContent ? prevContent + '\n' : ''}${data.transcript}`);
        setEditorVisible(true);
      } else {
        throw new Error('No transcript received');
      }
    } catch (error) {
      console.error('Error sending audio to ASR:', error);
      setError('Error processing audio: ' + error.message);
    }
  };


  const handleSave = async () => {
    if (!fileName) {
      setIsFileNameModalVisible(true);
      return;
    }

    try {
      setIsLoading(true);
      const endpoint = currentDocId 
        ? `${baseUrl}/api/documents/${currentDocId}` // Update existing document
        : `${baseUrl}/api/store-document`;           // Create new document
      
      const method = currentDocId ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          fileName,
          documentId: currentDocId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update currentDocId if this was a new document
        if (!currentDocId) {
          setCurrentDocId(data.documentId);
        }
        alert('Document saved successfully');
      } else {
        throw new Error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileNameSubmit = () => {
    if (fileName) {
      setIsFileNameModalVisible(false); // Close the modal
      handleSave(); // Trigger the save function with the file name
    } else {
      alert('Please enter a file name');
    }
  };
  

  const config = {
    readonly: false,
    height: 800,
    width: 800,
    uploader: {
      insertImageAsBase64URI: true,
    },
    html: true,
    toolbarButtons: [
      'undo', 'redo', '|',
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'paragraph', '|',
      'align', '|',
      'source'
    ],
    removeButtons: ['about'],
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
  };

  return (
    <div className="form-field">
  <Navbar />
  {isLoading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="popup">
          <div className="editor-container">
            <JoditEditor
              ref={editor}
              value={content}
              config={config}
              tabIndex={1}
              onBlur={(newContent) => setContent(newContent)}
              onChange={(newContent) => {}}
            />
          </div>
          <div className='icons_container'>
          <div className='icons'>
            {!isRecording ? (
              <div>
                <button title='Start Recording'><Mic onClick={startRecording} className='mic-btn' /></button>
              </div>
            ) : (
              <>
                <div>
                  <button title='Stop recording'><StopCircle onClick={stopRecording} className='mic-btn' /></button>
                </div>
              </>
            )}
          </div>

          {isRecording && (
            <div className="recording-timer">
              Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          )}
          <div>
            <button 
              onClick={handleSave} 
              className="mic" 
              title={currentDocId ? "Update Document" : "Save Document"}
              disabled={isLoading}
            >
              <Save className="mic-btn" />
            </button>
          </div>
          <div>
            <button onClick={handlePreviewClick} className="mic" title="Preview"><Eye className="mic-btn" /></button>
          </div>
         <button onClick={handleExportToDoc} className="mic" title="Export to word File"><FileText className="mic-btn" /></button>
        </div>
        </div>
      )}

  {/* File name modal */}
  {isFileNameModalVisible && (
    <div className="file-name-modal">
      <div className="modal-content">
        <h2>Enter File Name</h2>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
        />
        <button onClick={handleFileNameSubmit}>Save</button>
        <button onClick={() => setIsFileNameModalVisible(false)}>Cancel</button>
      </div>
    </div>
  )}

  {/* Preview Modal */}
  {isPreviewVisible && (
    <div className="preview-modal">
      <div className="preview-content">
        <button onClick={handlePreviewClick} className="close-preview">
          Close
        </button>
        <h2>Preview</h2>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  )}
</div>
  );
});

export default Home;