import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext'; // <-- We added this!
import { LayoutDashboard, FolderTree, FileQuestion, UploadCloud, RefreshCw, Users, LogOut, Menu, UserCircle } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { userRole } = useAuth(); // <-- Get the role from our secure context
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await signOut(auth);
      navigate('/login');
    }
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div style={styles.container}>
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMenu}></div>}

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h2 style={styles.logoText}>LET Reviewer</h2>
          <p style={styles.roleTag}>{userRole === 'Admin' ? 'Master Admin' : 'Teacher'}</p>
        </div>
        
        <nav style={styles.nav}>
          <NavLink to="/dashboard" className="sidebar-link" onClick={closeMenu}>
            <LayoutDashboard size={20} /> Monitoring Dashboard
          </NavLink>
          <NavLink to="/categories" className="sidebar-link" onClick={closeMenu}>
            <FolderTree size={20} /> CMS / Categories
          </NavLink>
          <NavLink to="/questions" className="sidebar-link" onClick={closeMenu}>
            <FileQuestion size={20} /> Question Editor
          </NavLink>
          <NavLink to="/bulk-upload" className="sidebar-link" onClick={closeMenu}>
            <UploadCloud size={20} /> Bulk Upload
          </NavLink>
          <NavLink to="/sync" className="sidebar-link" onClick={closeMenu}>
            <RefreshCw size={20} /> Content Sync Hub
          </NavLink>
          
          {/* THE MAGIC HIDING TRICK! */}
          {userRole === 'Admin' && (
            <NavLink to="/users" className="sidebar-link" onClick={closeMenu}>
              <Users size={20} /> User Management
            </NavLink>
          )}
        </nav>

        <div style={styles.logoutContainer}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={28} />
            </button>
            {/* Greets you dynamically based on role */}
            <h3 style={styles.headerTitle}>Welcome back, {userRole}</h3> 
          </div>
          <UserCircle size={32} color="#7f8c8d" />
        </header>
        
        <div style={styles.content}>
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' },
  sidebar: { width: '260px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column' },
  logoArea: { padding: '25px 20px', borderBottom: '1px solid #34495e', marginBottom: '15px' },
  logoText: { margin: 0, fontSize: '22px', fontWeight: 'bold' },
  roleTag: { margin: '5px 0 0 0', fontSize: '13px', color: '#3498db', fontWeight: 'bold' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 15px', flex: 1 },
  logoutContainer: { padding: '20px' },
  logoutBtn: { width: '100%', backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f6', overflow: 'hidden' },
  header: { height: '70px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', borderBottom: '1px solid #e0e0e0' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerTitle: { margin: 0, fontSize: '18px', color: '#333' },
  content: { padding: '30px', flex: 1, overflowY: 'auto' } 
};