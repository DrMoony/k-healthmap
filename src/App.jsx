import { useState, Component, lazy, Suspense } from 'react';
import { LangProvider } from './i18n';
import NavBar from './components/NavBar';
import './styles/global.css';

const Overview = lazy(() => import('./pages/Overview'));
const ExamDetail = lazy(() => import('./pages/ExamDetail'));
const Lifestyle = lazy(() => import('./pages/Lifestyle'));
const DiabetesDashboard = lazy(() => import('./pages/DiabetesDashboard'));
const LiverDashboard = lazy(() => import('./pages/LiverDashboard'));
const CardiovascularDashboard = lazy(() => import('./pages/CardiovascularDashboard'));
const KidneyDashboard = lazy(() => import('./pages/KidneyDashboard'));
const DiseaseNetwork = lazy(() => import('./pages/DiseaseNetwork'));

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: '#4a4a6a', fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      Loading...
    </div>
  );
}

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
          <div style={{ fontSize: '12px', color: '#bbbbdd', maxWidth: '600px', textAlign: 'center' }}>
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
    <LangProvider>
      <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
        <NavBar active={activeTab} onChange={setActiveTab} />

        <ErrorBoundary key={activeTab}>
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'exam' && <ExamDetail />}
            {activeTab === 'lifestyle' && <Lifestyle />}
            {activeTab === 'diabetes' && <DiabetesDashboard />}
            {activeTab === 'liver' && <LiverDashboard />}
            {activeTab === 'cardiovascular' && <CardiovascularDashboard />}
            {activeTab === 'kidney' && <KidneyDashboard />}
            {activeTab === 'disease' && <DiseaseNetwork />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </LangProvider>
  );
}

export default App;
