import { useState } from 'react';
import NavBar from './components/NavBar';
import Overview from './pages/Overview';
import Metabolic from './pages/Metabolic';
import ExamDetail from './pages/ExamDetail';
import Lifestyle from './pages/Lifestyle';
import DiseaseNetwork from './pages/DiseaseNetwork';
import './styles/global.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <NavBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && <Overview />}
      {activeTab === 'metabolic' && <Metabolic />}
      {activeTab === 'exam' && <ExamDetail />}
      {activeTab === 'lifestyle' && <Lifestyle />}
      {activeTab === 'disease' && <DiseaseNetwork />}
    </div>
  );
}

export default App;
