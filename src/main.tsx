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
import { UnvaultedRecordsPage } from './UnvaultedRecordsPage.tsx';
import { YEditsGoldPage } from './YEditsGoldPage.tsx';
import { TermsPage } from './TermsPage.tsx';
import { PrivacyPage } from './PrivacyPage.tsx';

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
        <Route path="/" element={<SettingsProvider><LandingPage /></SettingsProvider>} />
        <Route path="/my-tracker" element={<SettingsProvider><MyTrackerPage /></SettingsProvider>} />
        <Route path="/label" element={<UnvaultedRecordsPage />} />
        <Route path="/yeditsgold" element={<SettingsProvider><YEditsGoldPage /></SettingsProvider>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/:artist/*" element={<ArtistRoute />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
