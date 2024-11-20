import React, { useRef, useState, forwardRef, useEffect } from 'react';
import { Eye, FileText, Mic, Save, StopCircle } from 'lucide-react';
import { Navbar } from '../Navbar/Navbar';
import { baseUrl } from '../Config';
import { useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.snow.css'; // Default React Quill theme
import './customQuill.css'; // Your custom CSS


const Home = forwardRef(() => {
  const quillRef = useRef(null);
  const location = useLocation();
  const [allContent, setAllContent] = useState('');  
  const [pages, setPages] = useState([]); 
  const [selectedPage, setSelectedPage] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isFileNameModalVisible, setIsFileNameModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Initialize content from location state
  useEffect(() => {
    if (location.state?.documentContent) {
      setAllContent(location.state.documentContent);
      setFileName(location.state.documentName || '');
      setCurrentDocId(location.state.documentId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Function to split content into pages
  const splitContentIntoPages = (htmlContent) => {
    if (!htmlContent) return [];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '600px';  // A4 width
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    const pages = [];
    let currentPageContent = '';
    let currentHeight = 0;
    const MAX_PAGE_HEIGHT = 800;

    Array.from(tempDiv.children).forEach(child => {
      const childHeight = child.scrollHeight;

      if (currentHeight + childHeight > MAX_PAGE_HEIGHT) {
        if (currentPageContent.trim()) {
          pages.push(currentPageContent);
        }
        currentPageContent = child.outerHTML;
        currentHeight = childHeight;
      } else {
        currentPageContent += child.outerHTML;
        currentHeight += childHeight;
      }
    });

    if (currentPageContent.trim()) {
      pages.push(currentPageContent);
    }

    document.body.removeChild(tempDiv);
    return pages.length > 0 ? pages : [''];  // Ensure at least one page exists
  };

  // Update pages when content changes
  useEffect(() => {
    const splitPages = splitContentIntoPages(allContent);
    setPages(splitPages);
  }, [allContent]);

  // Handle editor content change
  const handleEditorChange = (newContent) => {
    // Update the content of the current page
    const updatedPages = [...pages];
    updatedPages[selectedPage] = newContent;

    // Combine all pages into complete document
    const combinedContent = updatedPages.join('');
    setAllContent(combinedContent);

    // Re-split content into pages to maintain proper page breaks
    const newPages = splitContentIntoPages(combinedContent);
    setPages(newPages);
  };

  // Handle text selection
  const handleTextSelection = () => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range) {
        const text = editor.getText(range.index, range.length);
        if (text) {
          console.log('Selected Text:', text);
        }
      }
    }
  };

  // Set up text selection listener
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      editor.on('selection-change', handleTextSelection);
    }
    return () => {
      if (editor) {
        editor.off('selection-change', handleTextSelection);
      }
    };
  }, []);

  // Handle page selection
  const handlePageSelect = (index) => {
    setSelectedPage(index);
  };

  // Export to Word document
  const handleExportToDoc = () => {
    const styleContent = `
      <style>
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em 0; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        p { margin: 1em 0; }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
      </style>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Exported Document</title>
          ${styleContent}
        </head>
        <body>
          ${allContent}
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'document.doc';
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  // Recording functions
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process and update content from AI response
  const processAndUpdateContent = (aiResponse) => {
    try {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection();
      
      if (selection) {
        editor.deleteText(selection.index, selection.length);
        editor.insertText(selection.index, aiResponse);
      } else {
        const length = editor.getLength();
        editor.insertText(length - 1, '\n' + aiResponse);
      }
      
      // Update the content of the current page
      const newContent = editor.root.innerHTML;
      handleEditorChange(newContent);
    } catch (error) {
      console.error('Error processing content update:', error);
    }
  };

  // Audio processing functions
  const convertToWav = async (webmBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000
    });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
    const wavBuffer = audioContext.createBuffer(1, audioBuffer.length, 16000);
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
  
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
  
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

  // Send audio to backend
  const sendAudioToBackend = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));
      
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection();
      if (selection) {
        const selectedText = editor.getText(selection.index, selection.length);
        formData.append('selectedText', selectedText);
      }

      const response = await fetch(`${baseUrl}/api/asr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.chatResponse.mergedText) {
        processAndUpdateContent(data.chatResponse.mergedText);
      }
    } catch (error) {
      console.error('Error sending audio to ASR:', error);
      alert('Error processing audio: ' + error.message);
    }
  };

  // Save document
  const handleSave = async () => {
    if (!fileName) {
      setIsFileNameModalVisible(true);
      return;
    }

    try {
      setIsLoading(true);
      const endpoint = currentDocId
        ? `${baseUrl}/api/documents/${currentDocId}`
        : `${baseUrl}/api/store-document`;

      const method = currentDocId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: allContent,
          fileName,
          documentId: currentDocId
        }),
      });

      if (response.ok) {
        const data = await response.json();
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

  return (
    <div className="form-field">
      <Navbar />
      {isLoading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="popup">
          <div className="thumbnails-sidebar">
            {pages.map((pageContent, index) => (
              <div
                key={index}
                className={`thumbnail-page ${selectedPage === index ? 'selected' : ''}`}
                onClick={() => handlePageSelect(index)}
              >
                <div className="page-number">Page {index + 1}</div>
                <div 
                 className="thumbnail-preview"
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              </div>
            ))}
          </div>

          <div className="editor-container">
            <ReactQuill
              ref={quillRef}
              value={pages[selectedPage] || ''}
              onChange={handleEditorChange}
              className="bg-gray-50 rounded-lg w-[800px] h-[600px] mb-12 "
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  ['clean'],
                  [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
                ]
              }}
            />
          </div>

          <div className="icons_container">
            <div className="icons">
             <div >
             {!isRecording ? (
                <button title="Start Recording" className="mic">
                  <Mic onClick={startRecording} className="mic-btn" />
                </button>
              ) : (
                <button title="Stop Recording" className="mic">
                  <StopCircle onClick={stopRecording} className="mic-btn" />
                </button>
              )}

              {isRecording && (
                <div className="recording-timer">
                  Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
             </div>

              <button
                onClick={handleSave}
                className="mic"
                title={currentDocId ? "Update Document" : "Save Document"}
                disabled={isLoading}
              >
                <Save className="mic-btn" />
              </button>

              <button 
                onClick={() => setIsPreviewVisible(true)} 
                className="mic" 
                title="Preview"
              >
                <Eye className="mic-btn" />
              </button>

              <button 
                onClick={handleExportToDoc} 
                className="mic" 
                title="Export to Word File"
              >
                <FileText className="mic-btn" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Name Modal */}
      {isFileNameModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Enter File Name</h2>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsFileNameModalVisible(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (fileName) {
                    setIsFileNameModalVisible(false);
                    handleSave();
                  } else {
                    alert('Please enter a file name');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsPreviewVisible(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Preview</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: allContent }} />
          </div>
        </div>
      )}

    </div>
  );
});

export default Home;