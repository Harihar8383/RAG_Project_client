import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import ToastProvider from './components/ui/ToastProvider.jsx';
import ConfirmProvider from './components/ui/ConfirmProvider.jsx';
import { savedTheme } from './components/ui/theme.js';

document.documentElement.dataset.theme = savedTheme();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Clerk's live strength meter does not look for leaked passwords; that check runs only after "Continue". These texts
// say so, so a green message followed by a rejection no longer reads as a contradiction.
const CLERK_TEXTS = {
  unstable__errors: {
    zxcvbn: {
      goodPassword: 'Strong enough. We check it against known data leaks when you press Continue.',
    },
    form_password_pwned:
      'This exact password appears in a known data leak from some website, so attackers may try it. It can look strong and still be unsafe. Use a new one that you have not used anywhere, such as one from your password manager.',
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={CLERK_TEXTS} appearance={{ variables: { colorPrimary: '#2b2a27', borderRadius: '0.9rem' } }}>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </ClerkProvider>
  </BrowserRouter>
);
