import React, { useState } from 'react';
import { Application } from '../types';
import { Layers, Plus, Copy, Check, ExternalLink, ShieldCheck, Trash2, AlertCircle } from 'lucide-react';

interface ApplicationsViewProps {
  applications: Application[];
  onAddApp: (name: string, version: string, downloadLink: string) => Promise<boolean> | void;
  onDeleteApp?: (appId: string) => Promise<void> | void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({ applications, onAddApp, onDeleteApp }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [downloadLink, setDownloadLink] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || loading) {
      setError('Please provide a valid application name.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const cleanVersion = version.trim() || '1.0.0';
      let cleanLink = downloadLink.trim();
      if (!cleanLink) {
        cleanLink = 'https://redzone.auth/downloads/app.exe';
      } else if (!/^https?:\/\//i.test(cleanLink)) {
        cleanLink = `https://${cleanLink}`;
      }
      await onAddApp(trimmedName, cleanVersion, cleanLink);
      setName('');
      setVersion('1.0.0');
      setDownloadLink('');
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!onDeleteApp) return;
    setDeleteLoading(true);
    try {
      await onDeleteApp(appId);
      setDeleteConfirmAppId(null);
    } catch (err: any) {
      console.error('Delete app error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Applications</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your REDZONE Auth protected software applications and secrets.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(null); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Application</span>
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Applications Created Yet</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">Create your first protected software application to start generating license keys and managing user accounts.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Application Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{app.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">Version {app.version}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium capitalize">
                    {app.status}
                  </span>
                </div>

                <div className="space-y-3 my-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Application Secret</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-red-400 truncate max-w-[180px]">{app.secret}</span>
                      <button onClick={() => copySecret(app.secret, app.id)} className="text-slate-400 hover:text-white">
                        {copiedId === app.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Registered Users</span>
                      <span className="text-white font-bold text-base">{app.totalUsers}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Active Licenses</span>
                      <span className="text-white font-bold text-base">{app.activeLicenses}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Created: {new Date(app.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-3">
                  <a
                    href={app.downloadLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                  >
                    <span>Download Build</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {onDeleteApp && (
                    <button
                      onClick={() => setDeleteConfirmAppId(app.id)}
                      title="Delete application"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Deleting Application */}
      {deleteConfirmAppId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-950/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete Application</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete this application? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAppId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => handleDelete(deleteConfirmAppId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deleteLoading && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                <span>{deleteLoading ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating Application */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-950/80 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Application</h3>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Application Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. RedZone Cheat Suite"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Version</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="1.0.0"
                  value={version}
                  onChange={(e) => {
                    setVersion(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Download Link (Optional)</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="https://redzone.auth/downloads/app.exe"
                  value={downloadLink}
                  onChange={(e) => {
                    setDownloadLink(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-red-950 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  <span>{loading ? 'Creating...' : 'Create Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
