import { useState, useEffect } from 'react';
import { getQuestions, getCategories } from '../../services/db';
import { RefreshCw, CheckCircle, Database, Server, Smartphone } from 'lucide-react';

export default function ContentSyncHub() {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [stats, setStats] = useState({ questions: 0, categories: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    setLoading(true);
    try {
      const statsData = await getSystemStats();
      
      setStats({ questions: statsData.questionCount, categories: statsData.categoryCount });

      if (statsData.lastUpdate) {
        const date = statsData.lastUpdate.toDate();
        setLastUpdate(date.toLocaleString());
      } else {
        setLastUpdate("No recent updates found");
      }
    } catch (error) {
      console.error("Error checking sync status:", error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2>Content Sync Hub</h2>
      <p style={styles.subtitle}>Monitor the database pipeline between the Admin Panel and the Student PWA.</p>

      {/* Main Status Card */}
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <div style={styles.statusIconBadge}>
            <CheckCircle size={32} color="#16a085" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '22px' }}>Database is Online & Ready</h3>
            <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Student apps are currently able to pull updates.</p>
          </div>
        </div>

        <div style={styles.dataGrid}>
          <div style={styles.dataBox}>
            <p style={styles.dataLabel}>Latest Database Update</p>
            <h4 style={styles.dataValue}>{lastUpdate || 'Checking...'}</h4>
            <p style={{ fontSize: '12px', color: '#95a5a6', margin: '5px 0 0 0' }}>This is the timestamp the Student PWA looks for.</p>
          </div>

          <div style={styles.dataBox}>
            <p style={styles.dataLabel}>Available Payload</p>
            <h4 style={styles.dataValue}>{stats.questions} Questions</h4>
            <p style={{ fontSize: '12px', color: '#95a5a6', margin: '5px 0 0 0' }}>Across {stats.categories} categories.</p>
          </div>
        </div>

        <button onClick={checkSyncStatus} style={styles.refreshBtn} disabled={loading}>
          <RefreshCw size={18} className={loading ? "spin" : ""} /> 
          {loading ? 'Pinging Database...' : 'Refresh Status'}
        </button>
      </div>

      {/* Architecture Explanation (Great for your final project defense!) */}
      <div style={styles.architectureCard}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={20} /> How Sync Works
        </h3>
        
        <div style={styles.flowDiagram}>
          <div style={styles.flowNode}>
            <Database size={24} color="#3498db" />
            <strong>Admin Panel</strong>
            <span style={styles.flowText}>Updates Firestore with `updatedAt`</span>
          </div>
          
          <div style={styles.flowLine}>➔</div>
          
          <div style={styles.flowNode}>
            <Server size={24} color="#f39c12" />
            <strong>Firebase Cloud</strong>
            <span style={styles.flowText}>Hosts Master Database</span>
          </div>
          
          <div style={styles.flowLine}>➔</div>
          
          <div style={styles.flowNode}>
            <Smartphone size={24} color="#2ecc71" />
            <strong>Student PWA</strong>
            <span style={styles.flowText}>Pulls new data to IndexedDB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', width: '100%', margin: '0 auto' },
  subtitle: { color: '#666', marginBottom: '25px' },
  statusCard: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '5px solid #16a085', marginBottom: '30px' },
  statusHeader: { display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' },
  statusIconBadge: { backgroundColor: '#e8f8f5', padding: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' },
  dataBox: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  dataLabel: { margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  dataValue: { margin: 0, fontSize: '20px', color: '#1e293b' },
  refreshBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  
  architectureCard: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  flowDiagram: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', flexWrap: 'wrap', gap: '15px' },
  flowNode: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, minWidth: '120px' },
  flowText: { fontSize: '12px', color: '#64748b', marginTop: '8px' },
  flowLine: { fontSize: '24px', color: '#cbd5e1', fontWeight: 'bold' }
};

// Add this to your main CSS file (index.css) to make the refresh icon spin!
/*
@keyframes spin { 100% { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
*/