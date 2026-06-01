import { useState, useEffect } from 'react';
import { getCategories, getQuestions } from '../../services/db';
import { Users, BookOpen, FileQuestion, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: "Total Categories", value: "...", color: "#3498db", icon: BookOpen },
    { label: "Total Questions", value: "...", color: "#2ecc71", icon: FileQuestion },
    { label: "Active Students (Sync)", value: "Pending", color: "#9b59b6", icon: Users },
    { label: "Avg. System Score", value: "Pending", color: "#f1c40f", icon: Activity }
  ]);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {s
    const statsData = await getSystemStats();

    setStats([
      { label: "Total Categories", value: statsData.categoryCount, color: "#3498db", icon: BookOpen },
      { label: "Total Questions", value: statsData.questionCount, color: "#2ecc71", icon: FileQuestion },
      { label: "Active Students (Sync)", value: "0", color: "#9b59b6", icon: Users },
      { label: "Avg. System Score", value: "0%", color: "#f1c40f", icon: Activity }
    ]);
  };

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: '5px', color: '#2c3e50' }}>Monitoring Dashboard</h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Real-time overview of your LET Reviewer system.</p>
      
      <div style={styles.grid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={{ ...styles.card, borderBottom: `4px solid ${stat.color}` }}>
              <div style={styles.cardHeader}>
                <p style={styles.label}>{stat.label}</p>
                <Icon size={20} color={stat.color} />
              </div>
              <h1 style={styles.value}>{stat.value}</h1>
            </div>
          );
        })}
      </div>

      <div style={styles.chartPlaceholder}>
        <h3 style={{marginTop: 0, color: '#334155'}}>Performance Insights</h3>
        <p style={{color: '#64748b', fontSize: '14px'}}>Student telemetry charts will appear here once the Student PWA begins syncing data.</p>
        <div style={{ height: '250px', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginTop: '15px' }}>
          <Activity size={40} color="#cbd5e1" style={{marginRight: '10px'}} />
          <span style={{color: '#94a3b8', fontWeight: 'bold'}}>Waiting for Student Sync...</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', width: '100%', margin: '0 auto' }, // <-- ADD THIS LINE
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 'bold' },
  value: { margin: '15px 0 0 0', color: '#1e293b', fontSize: '32px' },
  chartPlaceholder: { marginTop: '30px', backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }
};