import React from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastTimeout: NodeJS.Timeout;

export function toast({ title, description, variant = 'default' }: ToastProps) {
  // Clear any existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Remove existing toast element if any
  const existingToast = document.getElementById('toast-container');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }

  // Create new toast container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'fixed bottom-4 right-4 z-50 animate-slide-up';

  // Create toast element
  const toastElement = document.createElement('div');
  toastElement.className = `
    p-4 rounded-lg shadow-lg
    ${variant === 'default' ? 'bg-gray-800 text-white' : 'bg-red-600 text-white'}
    min-w-[300px] max-w-[500px]
  `;

  // Add title
  const titleElement = document.createElement('div');
  titleElement.className = 'font-medium';
  titleElement.textContent = title;
  toastElement.appendChild(titleElement);

  // Add description if provided
  if (description) {
    const descElement = document.createElement('div');
    descElement.className = 'text-sm mt-1 opacity-90';
    descElement.textContent = description;
    toastElement.appendChild(descElement);
  }

  toastContainer.appendChild(toastElement);
  document.body.appendChild(toastContainer);

  // Auto remove after 3 seconds
  toastTimeout = setTimeout(() => {
    if (document.body.contains(toastContainer)) {
      document.body.removeChild(toastContainer);
    }
  }, 3000);
}

// Add styles to head
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.2s ease-out;
  }
`;
document.head.appendChild(style);
