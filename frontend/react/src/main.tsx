import React from 'react';
import ReactDOM from 'react-dom/client';

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
  React.createElement(
    'main',
    {
      style: {
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif',
        lineHeight: 1.5,
        padding: '2rem',
      },
    },
    React.createElement('h1', null, 'AI Ad Creative Generator – Frontend Initialized')
  )
);
