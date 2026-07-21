import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import App from './App.tsx';
import { LandingPage } from './LandingPage.tsx';
import './index.css';
import { SettingsProvider } from './SettingsContext.tsx';
import { DownloadManagerProvider } from './DownloadManagerContext.tsx';
import { DownloadProgressWidget } from './components/DownloadProgressWidget.tsx';

import { ErrorBoundary } from './ErrorBoundary.tsx';
import { setActiveConfig } from './artists/activeConfig.ts';
import { getArtistConfig } from './artists/registry.ts';
import { MyTrackerPage } from './MyTrackerPage.tsx';
import { GamePage } from './GamePage.tsx';
import { YEditsGoldPage } from './YEditsGoldPage.tsx';
import { ListeningStatsPage } from './ListeningStatsPage.tsx';
import { TermsPage } from './TermsPage.tsx';
import { PrivacyPage } from './PrivacyPage.tsx';
import { DownloadPage } from './DownloadPage.tsx';
import { GlobalMiniPlayer } from './player/GlobalMiniPlayer.tsx';

// Renders the persistent mini player on any route where the per-artist <App>
// is NOT mounted (landing page, /my-tracker, etc.). On artist routes App shows
// its own full PlayerBar, so this hides itself to avoid a duplicate bar.
function GlobalPlayerMount() {
  const location = useLocation();
  const firstSegment = location.pathname.split('/').filter(Boolean)[0];
  const onArtistRoute = !!(firstSegment && getArtistConfig(firstSegment));
  if (onArtistRoute) return null;
  return <GlobalMiniPlayer />;
}

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
    <DownloadManagerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SettingsProvider><LandingPage /></SettingsProvider>} />
          <Route path="/my-tracker" element={<SettingsProvider><MyTrackerPage /></SettingsProvider>} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/yeditsgold" element={<SettingsProvider><YEditsGoldPage /></SettingsProvider>} />
          <Route path="/listening" element={<SettingsProvider><ListeningStatsPage /></SettingsProvider>} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/:artist/*" element={<ArtistRoute />} />
        </Routes>
        <GlobalPlayerMount />
      </BrowserRouter>
      <DownloadProgressWidget />
    </DownloadManagerProvider>
  </StrictMode>,
);
