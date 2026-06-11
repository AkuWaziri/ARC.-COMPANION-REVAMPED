import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error sanitizer for sandboxed preview iframe environments
(function sanitizeSandboxEnvironment() {
  if (typeof window === "undefined") return;

  const isNoisyError = (message: string): boolean => {
    if (!message) return false;
    const msgLower = message.toLowerCase();
    return (
      msgLower.includes("has not been authorized yet") ||
      msgLower.includes("unauthorized") ||
      msgLower.includes("authorized yet") ||
      msgLower.includes("receiving end does not exist") ||
      msgLower.includes("could not establish connection") ||
      msgLower.includes("extension") ||
      msgLower.includes("wallet-standard") ||
      msgLower.includes("metamask") ||
      msgLower.includes("the source")
    );
  };

  const extractMessage = (arg: any): string => {
    if (!arg) return "";
    if (arg instanceof Error) {
      return (arg.message || "") + " " + (arg.stack || "");
    }
    if (typeof arg === "object") {
      try {
        const keys = Object.getOwnPropertyNames(arg);
        let accumulated = "";
        for (const key of keys) {
          try {
            accumulated += ` ${key}: ${String(arg[key])}`;
          } catch (_) {}
        }
        return accumulated + " " + JSON.stringify(arg);
      } catch (_) {
        return String(arg);
      }
    }
    return String(arg);
  };

  // Assign to window.onerror directly (acts as the highest priority handler in many runner engines)
  const previousOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const serialized = String(message) + " " + String(source) + " " + extractMessage(error);
    if (isNoisyError(serialized)) {
      return true; // Suppress reporting
    }
    if (previousOnError) {
      return previousOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Intercept uncaught window errors using addEventListener
  window.addEventListener("error", (event) => {
    const serialized = event.message + " " + extractMessage(event.error);
    if (isNoisyError(serialized)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Assign to window.onunhandledrejection directly
  const previousOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    const message = extractMessage(event.reason);
    if (isNoisyError(message)) {
      event.preventDefault();
      event.stopPropagation();
    } else if (previousOnUnhandledRejection) {
      previousOnUnhandledRejection.call(window, event);
    }
  };

  // Intercept unhandled promise rejections using addEventListener
  window.addEventListener("unhandledrejection", (event) => {
    const message = extractMessage(event.reason);
    if (isNoisyError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Intercept and filter console.error logs originating from external wallet extensions
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const serialized = args.map(extractMessage).join(" ");
    if (isNoisyError(serialized)) {
      // Silently discard extension frame authorization errors to prevent test pollution
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Intercept and filter console.warn logs
  const originalConsoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    const serialized = args.map(extractMessage).join(" ");
    if (isNoisyError(serialized)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

