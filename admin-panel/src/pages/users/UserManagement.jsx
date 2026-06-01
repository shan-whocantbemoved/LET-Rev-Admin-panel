import { useState, useEffect } from 'react';
import { getUsers, addUserRecord, updateUserRole, deleteUserRecord } from '../../services/db';
import { UserPlus, Shield, User, Trash2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Teacher');

  // Custom Modal States
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', type: 'error' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, message: '', onConfirm: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const showAlert = (message, type = 'error') => setAlertConfig({ isOpen: true, message, type });
  const closeAlert = () => setAlertConfig({ isOpen: false, message: '', type: 'error' });
  const showConfirm = (message, onConfirm) => setConfirmConfig({ isOpen: true, message, onConfirm });
  const closeConfirm = () => setConfirmConfig({ isOpen: false, message: '', onConfirm: null });

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showAlert("Please provide both a name and an email.");
      return;
    }

    // --- HYPER-STRICT EMAIL DUPLICATION PREVENTION ---
    // Forces lowercase and removes accidental spaces
    const normalizedEmail = email.trim().toLowerCase();
    
    const isDuplicate = users.some(
      u => (u.email || '').trim().toLowerCase() === normalizedEmail
    );

    if (isDuplicate) {
      showAlert(`The email "${normalizedEmail}" is already authorized in the system!`);
      return;
    }
    // -------------------------------------------------

    setLoading(true);
    const result = await addUserRecord({ name: name.trim(), email: normalizedEmail, role });
    
    if (result.success) {
      showAlert("User added to the authorized list!", "success");
      setName('');
      setEmail('');
      setRole('Teacher');
      fetchUsers();
    } else {
      showAlert("Failed to add user.");
    }
    setLoading(false);
  };

  const handleRoleChange = async (id, newRole) => {
    const result = await updateUserRole(id, newRole);
    if (result.success) fetchUsers();
    else showAlert("Failed to update role.");
  };

  const handleDelete = (id) => {
    showConfirm("Remove this user? They will lose access to the Admin Panel.", async () => {
      const result = await deleteUserRecord(id);
      if (result.success) {
        fetchUsers();
        closeConfirm();
      } else {
        showAlert("Failed to remove user.");
        closeConfirm();
      }
    });
  };

  return (
    <div style={styles.container}>
      
      {/* CUSTOM MODALS */}
      {alertConfig.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            {alertConfig.type === 'success' ? <CheckCircle2 size={40} color="#22c55e" /> : <AlertCircle size={40} color={alertConfig.type === 'warning' ? '#f59e0b' : '#ef4444'} />}
            <h3 style={{marginTop: '10px'}}>{alertConfig.type === 'success' ? 'Success' : 'Attention'}</h3>
            <p style={{color: '#475569', marginBottom: '20px'}}>{alertConfig.message}</p>
            <button onClick={closeAlert} style={styles.modalBtnNeutral}>OK</button>
          </div>
        </div>
      )}

      {confirmConfig.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <AlertCircle size={40} color="#ef4444" />
            <h3 style={{marginTop: '10px'}}>Confirm Removal</h3>
            <p style={{color: '#475569', marginBottom: '20px'}}>{confirmConfig.message}</p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button onClick={closeConfirm} style={styles.modalBtnNeutral}>Cancel</button>
              <button onClick={confirmConfig.onConfirm} style={styles.modalBtnDanger}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      <h2>User Management</h2>
      <p style={styles.subtitle}>Control who has access to the LET Reviewer Admin Panel.</p>

      {/* Info Box explaining Auth vs Firestore */}
      <div style={styles.infoBox}>
        <Shield size={24} color="#3498db" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
          <strong>Note:</strong> Adding a user here grants them an official Role in the database. You must still create their actual login password in the Firebase Authentication Console.
        </p>
      </div>

      {/* Add User Form */}
      <div style={styles.formCard}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} /> Authorize New User
        </h3>
        
        <form onSubmit={handleAddUser} className="responsive-form-row">
          <input 
            type="text" placeholder="Full Name (e.g., Jane Doe)" 
            value={name} onChange={(e) => setName(e.target.value)}
            style={styles.input} disabled={loading} required
          />
          <input 
            type="email" placeholder="Email Address" 
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={styles.input} disabled={loading} required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{...styles.input, maxWidth: '200px'}}>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Master Admin</option>
          </select>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Adding...' : 'Authorize User'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div style={styles.tableCard} className="table-responsive-wrapper">
        <table style={styles.table}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
              <th style={styles.th}>Authorized User</th>
              <th style={styles.th}>System Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>No users authorized yet. Add yourself first!</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <strong>{u.name}</strong>
                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{...styles.input, padding: '6px', fontSize: '13px', backgroundColor: u.role === 'Admin' ? '#eff6ff' : '#f8fafc', borderColor: u.role === 'Admin' ? '#bfdbfe' : '#cbd5e1', fontWeight: 'bold', color: u.role === 'Admin' ? '#1d4ed8' : '#475569'}}
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="Admin">Master Admin</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(u.id)} style={styles.actionBtnDelete} title="Revoke Access">
                      <Trash2 size={18} /> Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', width: '100%', margin: '0 auto' },
  subtitle: { color: '#666', marginBottom: '20px' },
  infoBox: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f8fafc', borderLeft: '4px solid #3498db', padding: '15px 20px', borderRadius: '4px', marginBottom: '25px' },
  formCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '25px', borderTop: '4px solid #9b59b6' },
  input: { flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontFamily: 'inherit' },
  submitBtn: { padding: '12px 20px', backgroundColor: '#9b59b6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', minWidth: '150px' },
  
  tableCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569' },
  td: { padding: '15px', color: '#334155' },
  avatar: { width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' },
  actionBtnDelete: { display: 'flex', alignItems: 'center', gap: '5px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalBtnNeutral: { padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  modalBtnDanger: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};