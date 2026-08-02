import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { registerFeedbackBridge } from '../utils/feedbackBridge';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  text?: string;
}

interface FeedbackContextValue {
  startLoading: (title?: string) => void;
  stopLoading: () => void;
  success: (title: string, text?: string) => void;
  error: (title: string, text?: string) => void;
  info: (title: string, text?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, loadingTitle?: string) => Promise<T>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

let toastSeq = 0;

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, number>>({});

  const pushToast = useCallback((type: ToastType, title: string, text?: string, ttl = 2800) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, text }]);
    if (type !== 'loading' && ttl > 0) {
      timers.current[id] = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, ttl);
    }
    return id;
  }, []);

  const startLoading = useCallback((title = 'Saving…') => {
    setActiveRequests((n) => n + 1);
    setToasts((prev) => {
      const withoutLoading = prev.filter((t) => t.type !== 'loading');
      const id = ++toastSeq;
      return [...withoutLoading, { id, type: 'loading', title }];
    });
  }, []);

  const stopLoading = useCallback(() => {
    setActiveRequests((n) => Math.max(0, n - 1));
    setToasts((prev) => prev.filter((t) => t.type !== 'loading'));
  }, []);

  const success = useCallback((title: string, text?: string) => {
    setToasts((prev) => prev.filter((t) => t.type !== 'loading'));
    pushToast('success', title, text);
  }, [pushToast]);

  const error = useCallback((title: string, text?: string) => {
    setToasts((prev) => prev.filter((t) => t.type !== 'loading'));
    pushToast('error', title, text, 4200);
  }, [pushToast]);

  const info = useCallback((title: string, text?: string) => {
    pushToast('info', title, text);
  }, [pushToast]);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>, loadingTitle = 'Saving…') => {
    startLoading(loadingTitle);
    try {
      const result = await fn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const value = useMemo(
    () => ({ startLoading, stopLoading, success, error, info, withLoading }),
    [startLoading, stopLoading, success, error, info, withLoading],
  );

  useEffect(() => {
    registerFeedbackBridge({ startLoading, stopLoading, success, error });
    return () => registerFeedbackBridge(null);
  }, [startLoading, stopLoading, success, error]);

  const showBar = activeRequests > 0;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className={`btn-top-loader ${showBar ? 'btn-top-loader--on' : ''}`} aria-hidden={!showBar} />
      <div className="btn-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`btn-toast btn-toast--${t.type}`}>
            <span className="btn-toast-icon">
              {t.type === 'success' && <CheckCircleFilled />}
              {t.type === 'error' && <CloseCircleFilled />}
              {t.type === 'info' && <InfoCircleFilled />}
              {t.type === 'loading' && <LoadingOutlined spin />}
            </span>
            <div>
              <div className="btn-toast-title">{t.title}</div>
              {t.text && <div className="btn-toast-text">{t.text}</div>}
            </div>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
};
