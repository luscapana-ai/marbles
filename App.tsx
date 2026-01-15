import React, { useState } from 'react';
import Layout from './components/Layout';
import MarbleGame from './components/MarbleGame';
import Encyclopedia from './components/Encyclopedia';
import Marketplace from './components/Marketplace';
import Analyzer from './components/Analyzer';
import { GameMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.PLAY);

  const renderContent = () => {
    switch (mode) {
      case GameMode.PLAY:
        return <MarbleGame />;
      case GameMode.ENCYCLOPEDIA:
        return <Encyclopedia />;
      case GameMode.MARKETPLACE:
        return <Marketplace />;
      case GameMode.ANALYZER:
        return <Analyzer />;
      default:
        return <MarbleGame />;
    }
  };

  return (
    <Layout currentMode={mode} setMode={setMode}>
      {renderContent()}
    </Layout>
  );
};

export default App;