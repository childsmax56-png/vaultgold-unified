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

function ArtistRoute() {
  const { artist } = useParams<{ artist: string }>();
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/:artist/*" element={<ArtistRoute />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
