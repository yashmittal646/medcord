import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { prettify } from '../common/TagPicker.js';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  Building,
  FileText,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestHandled?: () => void;
}

export const DoctorAccessRequestsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRequestHandled,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchGrants = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPatientAccessGrants();
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load access grants:', err);
      showToast(err.message || 'Failed to load access requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGrants();
    }
  }, [isOpen]);

  const handleRespond = async (grantId: string, decision: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    try {
      setProcessingId(grantId);
      await api.respondToAccessGrant(grantId, decision);
      showToast(
        decision === 'APPROVE'
          ? 'Doctor access granted successfully!'
          : decision === 'REJECT'
          ? 'Access request declined.'
          : 'Doctor access revoked.',
        decision === 'APPROVE' ? 'success' : 'info'
      );
      await fetchGrants();
      if (onRequestHandled) onRequestHandled();
    } catch (err: any) {
      showToast(err.message || 'Failed to update access request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const pending = data?.pending || [];
  const approved = data?.approved || [];
  const history = data?.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="glass-card w-full max-w-2xl border-slate-200 bg-white p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Doctor Access & Consent Control</h2>
              <p className="text-xs text-slate-500">
                You have 100% control over who can view your medical records and care timeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Fetching permissions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Pending Requests ({pending.length})
                </h3>
                <button
                  onClick={fetchGrants}
                  className="text-[11px] text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {pending.length === 0 ? (
                <div className="p-5 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No pending access requests from doctors.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((grant: any) => (
                    <div
                      key={grant._id}
                      className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{grant.doctorName}</span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-200">
                              {grant.doctorId}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              {grant.doctorHospital || 'Clinic'} ({prettify(grant.doctorSpecialization || 'Specialist')})
                            </span>
                            <span>•</span>
                            <span>Requested on {new Date(grant.requestedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-amber-200/80">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-teal-600" /> Stated Clinical Reason:
                        </div>
                        <p className="text-xs text-slate-800 font-medium">"{grant.reason}"</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2.5 justify-end pt-1">
                        <button
                          disabled={processingId === grant._id}
                          onClick={() => handleRespond(grant._id, 'REJECT')}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          disabled={processingId === grant._id}
                          onClick={() => handleRespond(grant._id, 'APPROVE')}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Full Access
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved / Active Permissions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-3">
                <UserCheck className="w-4 h-4 text-emerald-600" /> Authorized Doctors ({approved.length})
              </h3>

              {approved.length === 0 ? (
                <div className="p-5 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No doctors currently have approved access.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {approved.map((grant: any) => (
                    <div
                      key={grant._id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{grant.doctorName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                            {grant.doctorId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {grant.doctorHospital} • Approved on {new Date(grant.respondedAt || grant.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        disabled={processingId === grant._id}
                        onClick={() => handleRespond(grant._id, 'REVOKE')}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" /> Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past History */}
            {history.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  Past History ({history.length})
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 3).map((grant: any) => (
                    <div
                      key={grant._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">{grant.doctorName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({grant.doctorId})</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        {grant.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
