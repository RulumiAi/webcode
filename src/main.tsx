import {RuntimeBoundary} from './components/RuntimeBoundary';
import './mioCopy';
import { installDesignPreview } from './previewApi';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './mio.css';
import './reference.css';
import './discovery-details.css';
import './worldbook.css';
import './media-motion.css';
import './business.css';
import './delight.css';
import './editorial.css';
import './h5-refinement.css';
import './rulumi.css';
import './rulumi-v011.css';
import { LocaleProvider, useLocale } from './i18n';

function clearLegacyServiceWorkerState() {
  void Promise.all([
    'serviceWorker' in navigator
      ? navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(
        registrations
          .filter((registration) => {
            const worker = registration.active || registration.waiting || registration.installing;
            const scriptPath = worker ? new URL(worker.scriptURL).pathname : '';
            return new URL(registration.scope).origin === window.location.origin
              && ['/sw.js', '/registerSW.js'].includes(scriptPath);
          })
          .map((registration) => registration.unregister()),
      ))
      : Promise.resolve([]),
    'caches' in window
      ? caches.keys().then((names) => Promise.all(
        names.filter((name) => name.startsWith('soulmingle-env1-')).map((name) => caches.delete(name)),
      ))
      : Promise.resolve([]),
  ]).catch(() => undefined);
}

installDesignPreview();
clearLegacyServiceWorkerState();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <RuntimeBoundary><App /></RuntimeBoundary>
      
    </LocaleProvider>
  </StrictMode>,
);

function PreviewNotice(){const {t}=useLocale(); return <div className='mio-preview-notice'><strong>v0.21.0</strong> · {t('mio.preview')}</div>}

import './rulumi-v012.css';

import './rulumi-v013.css';

import './rulumi-v014.css';

import './rulumi-v015.css';

import './rulumi-v016.css';

import './rulumi-v017.css';

import './rulumi-v018.css';

import './rulumi-v019.css';

import './rulumi-v020.css';

import './rulumi-v021.css';

import "./rulumi-v022.css";
import "./demo-ui.css";
