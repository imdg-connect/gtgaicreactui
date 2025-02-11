import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchFiles();
  }, [uploaded]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploaded(false);
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
    });
  };

  const handleDeleteFile = async (filename) => {
    showConfirmDialog(
      'Delete File',
      `Are you sure you want to delete ${filename}?`,
      async () => {
        setDeletingFileName(filename);
        try {
          const response = await fetch(`http://0.0.0.0:8001/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Delete failed');
          }
          
          // Refresh the page after successful deletion
          window.location.reload();
        } catch (error) {
          console.error('Delete error:', error);
          alert(`Failed to delete ${filename}: ${error.message}`);
          setDeletingFileName(null);
          closeConfirmDialog();
        }
      }
    );
  };

  const handleDeleteAll = () => {
    if (!fileList.length) {
      alert('No files to delete');
      return;
    }

    showConfirmDialog(
      'Delete All Files',
      'Are you sure you want to delete ALL files? This action cannot be undone.',
      async () => {
        setIsDeleting(true);
        try {
          const response = await fetch('http://0.0.0.0:8001/delete-all', {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Delete all failed');
          }
          
          // Refresh the page after successful deletion
          window.location.reload();
        } catch (error) {
          console.error('Delete all error:', error);
          alert(`Failed to delete all files: ${error.message}`);
          setIsDeleting(false);
          closeConfirmDialog();
        }
      }
    );
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://0.0.0.0:8001/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.detail || 'Upload failed');
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setUploaded(true);
        fetchFiles();
        setSelectedFile(null);
      })
      .catch((error) => {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}`);
      });
  };

  const fetchFiles = () => {
    fetch('http://0.0.0.0:8001/list-files')
      .then((response) => response.json())
      .then((data) => {
        setFileList(data.files || []);
      })
      .catch((error) => {
        console.error('Error fetching files:', error);
      });
  };

  const handleQueryChange = (event) => {
    setUserQuery(event.target.value);
  };

  const handleSearch = () => {
    if (!userQuery.trim()) {
      setSearchResults([]);
      return;
    }
  
    setIsSearching(true);
  
    fetch('http://0.0.0.0:8001/search', {  // Updated URL to match other endpoints
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: userQuery.trim() 
      })
      // Removed credentials: 'include' as it's not needed
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Search failed');
        }
        return response.json();
      })
      .then((data) => {
        setSearchResults(data.results || []);
      })
      .catch((error) => {
        console.error('Search error:', error);
        alert(`Search failed: ${error.message}`);
        setSearchResults([]);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
        }}
        onCancel={closeConfirmDialog}
      />

      {/* File Upload Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Selected File: {selectedFile.name}</p>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload File
              </button>
            </div>
          )}
          {uploaded && (
            <p className="text-green-600 font-medium">File uploaded successfully!</p>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Search Documents</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={userQuery}
              onChange={handleQueryChange}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4">
                <h3 className="font-medium mb-2">Search Results:</h3>
                <div className="space-y-3">
                {searchResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900">{result.content}</p>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span> File: {result.filename}</span>
                        <span> Page: {result.page_number || 0}</span>
                        <span> Chunk: {result.chunk_index || 0}</span>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>
      </div>

      {/* File List Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Uploaded Files</h2>
          {fileList.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="flex items-center px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              Delete All Files
            </button>
          )}
        </div>
        
        {fileList.length === 0 ? (
          <p className="text-gray-500 text-sm">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {fileList.map((file, index) => (
              <li key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                <span className="text-gray-700 text-sm">{typeof file === 'string' ? file : file.name}</span>
                <button
                  onClick={() => handleDeleteFile(typeof file === 'string' ? file.split(' (')[0] : file.name)}
                  disabled={deletingFileName === file.name}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                >
                  {deletingFileName === file.name ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileUpload;