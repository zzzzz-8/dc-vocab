'use client';

import { useToastStore } from '@/lib/store';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineInformationCircle, HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const icons = {
    success: <HiOutlineCheckCircle className="w-5 h-5 text-[#00B894]" />,
    error: <HiOutlineXCircle className="w-5 h-5 text-[#E17055]" />,
    info: <HiOutlineInformationCircle className="w-5 h-5 text-[#74B9FF]" />,
    warning: <HiOutlineExclamationTriangle className="w-5 h-5 text-[#FDCB6E]" />,
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          {icons[toast.type]}
          <span className="flex-1 text-sm">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-gray-100 rounded">
            <HiOutlineXMark className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
