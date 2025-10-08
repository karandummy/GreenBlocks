import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Upload, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectService } from '../../services/project.service';

const MRVDataSubmission = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await projectService.getProjectById(projectId);
      if (res.success) setProject(res.project);
      else toast.error('Project not found');
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error('Select at least one file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('description', description);
    files.forEach((file) => formData.append('files', file));

    try {
      const res = await fetch('http://localhost:5000/api/mrv/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Wallet-Address': localStorage.getItem('walletAddress')
        }
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Uploaded successfully! IPFS CID: ${data.metadataCid}`);
        setFiles([]);
        setDescription('');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!project) return <div className="text-center py-12">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Project
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Upload MRV Documents</h1>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">Project Details</h3>
          <p><strong>Name:</strong> {project.name}</p>
          <p><strong>ID:</strong> {project._id}</p>
          <p><strong>Owner:</strong> {project.owner}</p>
          <p><strong>Status:</strong> {project.status}</p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
          </div>

          <p className="text-gray-600 mb-4 text-sm">Files will be uploaded to IPFS via your backend.</p>

          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 mb-4 border border-green-600 text-green-600 rounded-lg cursor-pointer hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-2" /> Select Files
          </label>

          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            rows={3}
            placeholder="Short description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MRVDataSubmission;
