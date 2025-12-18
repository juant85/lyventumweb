import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Counter to track executions (for debugging multiple initializations)
// @ts-ignore
window.srcIndexExecutionCount = (window.srcIndexExecutionCount || 0) + 1;
// @ts-ignore
console.log(`Main app entry (src/index.tsx) execution count: ${window.srcIndexExecutionCount}`);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal Error: Could not find root element with ID 'root' in HTML to mount React application. (src/index.tsx)");
}

// Check if root has already been initialized (simple check)
// @ts-ignore
if (rootElement._reactRootContainer) {
  console.warn("src/index.tsx: Root element appears to already have a React root. This could indicate multiple initializations or HMR issues. App may not behave as expected.");
} else {
  console.log("src/index.tsx: Creating new React root and rendering App.");
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
}