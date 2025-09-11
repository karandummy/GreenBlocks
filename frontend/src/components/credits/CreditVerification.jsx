import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar,
  Award,
  User,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { creditService } from '../../services/credit.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';

const CreditVerification = () => {
  const { creditId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    if (user?.role !== 'regulatory_body') {
      toast.error('Access denied. Only regulatory bodies can verify credits.');
      navigate('/dashboard');
      return;
    }
    fetchCreditDetails();
  }, [creditId, user]);

  const fetchCreditDetails = async () => {
    try {
      setLoading(true);
      const response = await creditService.getCreditById(creditId);
      if (response.success) {
        setCredit(response.credit);
      } else {
        toast.error('Credit not found');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to load credit details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredit = async (action) => {
    if (!verificationNotes.trim() && action === 'reject') {
      toast.error('Please provide verification notes for rejection');
      return;
    }

    setVerifying(true);

    try {
      let response;
      if (action === 'approve') {
        response = await creditService.verifyCredits(creditId);
      } else {
        response = await creditService.rejectCredits(creditId, verificationNotes);
      }

      if (response.success) {
        toast.success(`Credit ${action === 'approve' ? 'verified' : 'rejected'} successfully!`);
        fetchCreditDetails(); // Refresh credit details
      } else {
        toast.error(response.message || `Failed to ${action} credit`);
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${action} credit`);
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      issued: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Verified' },
      listed: { color: 'bg-blue-100 text-blue-800', icon: Award, text: 'Listed' },
      sold: { color: 'bg-purple-100 text-purple-800', icon: Award, text: 'Sold' },
      retired: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Retired' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: 'Pending Verification' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!credit) {
    return <div className="text-center py-12">Credit not found</div>;
  }

  const isVerified = credit.verification?.verifiedBy;
  const canVerify = !isVerified && user?.role === 'regulatory_body';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Credit Verification</h1>
            <p className="text-gray-600">ID: {credit.creditId}</p>
          </div>
        </div>

        {/* Credit Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{credit.project?.name}</h2>
              <p className="text-gray-600">{credit.project?.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            {getStatusBadge(credit.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Credit Amount</p>
                <p className="font-semibold">{formatNumber(credit.amount)} tCO₂</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Vintage Year</p>
                <p className="font-semibold">{credit.vintage}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Issuer</p>
                <p className="font-semibold">{credit.issuer?.name}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
            <p className="text-gray-700">{credit.project?.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Location: {credit.project?.location?.state}, {credit.project?.location?.country}</span>
              <span>Developer: {credit.project?.developer?.organization}</span>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          
          {isVerified ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-green-900 font-medium">Credit Verified</h4>
                  <p className="text-green-800 text-sm mt-1">
                    Verified by {credit.verification.verifiedBy?.name} on {formatDate(credit.verification.verificationDate)}
                  </p>
                  {credit.verification.comments && (
                    <div className="mt-3">
                      <p className="text-green-900 font-medium text-sm">Verification Notes:</p>
                      <p className="text-green-800 text-sm">{credit.verification.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : canVerify ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-900 font-medium">Verification Required</h4>
                    <p className="text-yellow-800 text-sm mt-1">
                      This credit is pending verification. Please review the project details and supporting documentation.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes (Optional for approval, required for rejection)
                </label>
                <textarea
                  rows={4}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add your verification notes here..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleVerifyCredit('approve')}
                  disabled={verifying}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {verifying ? 'Verifying...' : 'Verify & Approve'}
                </button>

                <button
                  onClick={() => handleVerifyCredit('reject')}
                  disabled={verifying || !verificationNotes.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {verifying ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="text-gray-900 font-medium">Verification Not Available</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {user?.role !== 'regulatory_body' 
                      ? 'Only regulatory bodies can verify credits.'
                      : 'This credit has already been processed.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Supporting Documentation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documentation</h3>
          
          {credit.project?.documentation && credit.project.documentation.length > 0 ? (
            <div className="space-y-3">
              {credit.project.documentation.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-sm text-gray-600">Uploaded {formatDate(doc.uploadDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No documentation available</p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
              <div>
                <p className="font-medium text-blue-900">Credit Issued</p>
                <p className="text-blue-700 text-sm">Initial issuance of {formatNumber(credit.amount)} credits</p>
              </div>
              <p className="text-blue-600 text-sm">{formatDate(credit.createdAt)}</p>
            </div>

            {credit.transfers && credit.transfers.length > 0 && credit.transfers.map((transfer, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-l-4 border-purple-500 bg-purple-50">
                <div>
                  <p className="font-medium text-purple-900">Credit Transfer</p>
                  <p className="text-purple-700 text-sm">
                    {formatNumber(transfer.amount)} credits transferred
                    {transfer.price && ` for ${formatCurrency(transfer.price * transfer.amount)}`}
                  </p>
                </div>
                <p className="text-purple-600 text-sm">{formatDate(transfer.timestamp)}</p>
              </div>
            ))}

            {credit.status === 'retired' && (
              <div className="flex items-center justify-between p-3 border-l-4 border-gray-500 bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Credit Retired</p>
                  <p className="text-gray-700 text-sm">Credits permanently retired for offsetting</p>
                </div>
                <p className="text-gray-600 text-sm">{formatDate(credit.updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditVerification;