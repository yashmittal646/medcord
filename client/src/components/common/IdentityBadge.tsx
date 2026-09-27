import React, { useState } from 'react';
import { Copy, Check, Shield } from 'lucide-react';

interface IdentityBadgeProps {
  id: string;
  type?: 'PATIENT' | 'DOCTOR';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const IdentityBadge: React.FC<IdentityBadgeProps> = ({
  id,
  type = 'PATIENT',
  size = 'md',
  showLabel = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPatient = type === 'PATIENT' || id.startsWith('PAT-');

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-4 py-2 font-semibold',
  };

  return (
    <div className="inline-flex items-center gap-2">
      {showLabel && (
        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          {isPatient ? 'Patient ID' : 'Doctor ID'}
        </span>
      )}
      <button
        onClick={handleCopy}
        type="button"
        title="Click to copy unique ID"
        className={`inline-flex items-center gap-2 font-mono font-bold rounded-xl transition-all border shadow-sm ${
          isPatient
            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/80 hover:border-blue-300'
            : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100/80 hover:border-indigo-300'
        } ${sizeClasses[size]}`}
      >
        <Shield className="w-3.5 h-3.5 opacity-75" />
        <span>{id}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-blue-600 animate-in fade-in zoom-in" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
        )}
      </button>
      {copied && <span className="text-xs text-blue-600 font-bold">Copied!</span>}
    </div>
  );
};
