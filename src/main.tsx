import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import App from './App.tsx';
import { LandingPage } from './LandingPage.tsx';
import './index.css';
import { SettingsProvider } from './SettingsContext.tsx';

import { ErrorBoundary } from './ErrorBoundary.tsx';
import { setActiveConfig } from './artists/activeConfig.ts';
import { getArtistConfig } from './artists/registry.ts';
import { MyTrackerPage } from './MyTrackerPage.tsx';

function CACTIgoldUnavailable() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: 480, padding: '2rem' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
          CACTIgold is not compatible with the merged version of VaultGold at the moment — it will be added at a later date. For now, we've kept the original CACTIgold open{' '}
          <a href="https://cactigold.pages.dev/" style={{ color: '#4ade80', textDecoration: 'underline' }}>here</a>.
        </p>
        <a href="/" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.6rem 1.4rem', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.15)' }}>
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

function ArtistRoute() {
  const { artist } = useParams<{ artist: string }>();

  if (artist === 'cactigold') {
    return <CACTIgoldUnavailable />;
  }

  const config = artist ? getArtistConfig(artist) : undefined;

  if (!config) {
    return <Navigate to="/" replace />;
  }

  // Set the active config before the App mounts — the key forces a full remount
  // on artist change so all components read the freshly set config.
  setActiveConfig(config);

  return (
    <ErrorBoundary key={artist}>
      <SettingsProvider storagePrefix={config.STORAGE_PREFIX}>
        <App key={artist} />
      </SettingsProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SettingsProvider><LandingPage /></SettingsProvider>} />
        <Route path="/my-tracker" element={<SettingsProvider><MyTrackerPage /></SettingsProvider>} />
        <Route path="/:artist/*" element={<ArtistRoute />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
