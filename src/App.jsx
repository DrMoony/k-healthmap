import { useState, Component } from 'react';
import NavBar from './components/NavBar';
import Overview from './pages/Overview';
import Metabolic from './pages/Metabolic';
import ExamDetail from './pages/ExamDetail';
import Lifestyle from './pages/Lifestyle';
import DiseaseNetwork from './pages/DiseaseNetwork';
import './styles/global.css';

// Error boundary to prevent white screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px', color: '#ff4444', background: '#0a0a0f',
          fontFamily: "'JetBrains Mono', monospace", minHeight: '50vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '12px' }}>렌더링 오류 발생</div>
          <div style={{ fontSize: '12px', color: '#888', maxWidth: '600px', textAlign: 'center' }}>
            {this.state.error?.message}
          </div>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '20px', padding: '10px 24px', background: '#1a1a2e',
              border: '1px solid #00d4ff44', borderRadius: '8px', color: '#00d4ff',
              cursor: 'pointer', fontSize: '13px',
            }}>
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <NavBar active={activeTab} onChange={setActiveTab} />

      <ErrorBoundary key={activeTab}>
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'metabolic' && <Metabolic />}
        {activeTab === 'exam' && <ExamDetail />}
        {activeTab === 'lifestyle' && <Lifestyle />}
        {activeTab === 'disease' && <DiseaseNetwork />}
      </ErrorBoundary>
    </div>
  );
}

export default App;
