import { useState, useEffect } from 'react';
import { addCategory, getCategories, updateCategory, deleteCategory } from '../../services/db';
import { Pencil, Trash2, X, Search, AlertCircle, CheckCircle2, BookOpen, GraduationCap, Library } from 'lucide-react';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  
  // Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('General Education');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [originalName, setOriginalName] = useState(''); 
  const [originalType, setOriginalType] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Modal States
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', type: 'error' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, message: '', onConfirm: null });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const showAlert = (message, type = 'error') => setAlertConfig({ isOpen: true, message, type });
  const closeAlert = () => setAlertConfig({ isOpen: false, message: '', type: 'error' });
  const showConfirm = (message, onConfirm) => setConfirmConfig({ isOpen: true, message, onConfirm });
  const closeConfirm = () => setConfirmConfig({ isOpen: false, message: '', onConfirm: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = categoryName.trim();
    if (trimmedName.length < 3) {
      showAlert("Category name must be at least 3 characters long.");
      return;
    }

    if (editingId && trimmedName === originalName && categoryType === originalType) {
      showAlert("No changes were made.", "warning");
      return;
    }

    // --- HYPER-STRICT DUPLICATION PREVENTION ---
    // This strips ALL spaces and special characters. " English " and "English" are now caught!
    const normalizeString = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedInput = normalizeString(trimmedName);

    const isDuplicate = categories.some(
      cat => normalizeString(cat.name) === normalizedInput && cat.id !== editingId
    );

    if (isDuplicate) {
      showAlert(`A subject similar to "${trimmedName}" already exists! Duplicates are blocked.`);
      return;
    }
    // -------------------------------------------

    setLoading(true);
    
    if (editingId) {
      const result = await updateCategory(editingId, trimmedName, categoryType);
      if (result.success) {
        showAlert("Category updated successfully!", "success");
        resetForm();
      } else showAlert("Failed to update category.");
    } else {
      const result = await addCategory(trimmedName, "LET Reviewer Subject", categoryType);
      if (result.success) {
        showAlert("Category added successfully!", "success");
        resetForm();
      } else showAlert("Failed to add category.");
    }
    setLoading(false);
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setCategoryType(cat.type || 'General Education');
    setOriginalName(cat.name);
    setOriginalType(cat.type || 'General Education');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    showConfirm("Delete this category? Any assigned questions will lose their group.", async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        fetchCategories();
        if (editingId === id) resetForm();
        closeConfirm();
      } else {
        showAlert("Failed to delete category.");
        closeConfirm();
      }
    });
  };

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('General Education');
    setOriginalName('');
    setOriginalType('');
    setEditingId(null);
    fetchCategories();
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick Stats for the Sidebar
  const genEdCount = categories.filter(c => c.type === 'General Education').length;
  const profEdCount = categories.filter(c => c.type === 'Professional Education').length;
  const majorCount = categories.filter(c => c.type === 'Major Specialization').length;

  return (
    <div style={styles.pageLayout}>
      
      {/* MODALS */}
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
            <h3 style={{marginTop: '10px'}}>Confirm Deletion</h3>
            <p style={{color: '#475569', marginBottom: '20px'}}>{confirmConfig.message}</p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button onClick={closeConfirm} style={styles.modalBtnNeutral}>Cancel</button>
              <button onClick={confirmConfig.onConfirm} style={styles.modalBtnDanger}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: MAIN CONTENT */}
      <div style={styles.mainContent}>
        <h2>CMS & Category Management</h2>
        <p style={styles.subtitle}>Organize subjects into Gen Ed, Prof Ed, and Majors.</p>

        {/* Add / Edit Form */}
        <div style={{...styles.formCard, borderTop: editingId ? '4px solid #f39c12' : '4px solid #3498db'}}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
            {editingId ? '✏️ Edit Category' : '✨ Add New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} className="responsive-form-row">
            <input 
              type="text" 
              placeholder="e.g., Mathematics" 
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            
            <select 
              value={categoryType} 
              onChange={(e) => setCategoryType(e.target.value)} 
              style={{...styles.input, maxWidth: '250px'}}
              disabled={loading}
            >
              <option value="General Education">General Education</option>
              <option value="Professional Education">Professional Education</option>
              <option value="Major Specialization">Major Specialization</option>
            </select>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update' : '+ Add')}
            </button>
            
            {editingId && (
              <button type="button" onClick={resetForm} style={styles.cancelBtn} title="Cancel Edit">
                <X size={20} />
              </button>
            )}
          </form>
        </div>

        {/* SEARCH BAR & TABLE */}
        <div style={styles.tableCard}>
          <div style={styles.searchHeader}>
            <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" placeholder="Search categories..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}
              />
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <th style={styles.th}>Subject Name</th>
                  <th style={styles.th}>Classification</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>No categories found.</td></tr>
                ) : (
                  filteredCategories.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={styles.td}><strong>{cat.name}</strong></td>
                      <td style={styles.td}>
                        <span style={styles.typeTag}>
                          {cat.type || 'General Education'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleEditClick(cat)} style={styles.actionBtnEdit} title="Edit"><Pencil size={18} /></button>
                          <button onClick={() => handleDeleteClick(cat.id)} style={styles.actionBtnDelete} title="Delete"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INSIGHTS SIDEBAR */}
      <div style={styles.sidebarContent}>
        <div style={styles.insightCard}>
          <h3 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#2c3e50'}}>Category Architecture</h3>
          
          <div style={styles.statRow}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <BookOpen size={20} color="#3498db" /> <span style={{fontWeight: 'bold', color: '#334155'}}>Gen Ed</span>
            </div>
            <h2 style={{margin: 0, color: '#3498db'}}>{genEdCount}</h2>
          </div>

          <div style={styles.statRow}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <GraduationCap size={20} color="#2ecc71" /> <span style={{fontWeight: 'bold', color: '#334155'}}>Prof Ed</span>
            </div>
            <h2 style={{margin: 0, color: '#2ecc71'}}>{profEdCount}</h2>
          </div>

          <div style={styles.statRow}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Library size={20} color="#9b59b6" /> <span style={{fontWeight: 'bold', color: '#334155'}}>Majors</span>
            </div>
            <h2 style={{margin: 0, color: '#9b59b6'}}>{majorCount}</h2>
          </div>

          <p style={{fontSize: '12px', color: '#94a3b8', margin: '15px 0 0 0', lineHeight: 1.5}}>
            <strong>Student App Note:</strong> The PWA will use these classifications to properly group the review modules on the home screen.
          </p>
        </div>
      </div>

    </div>
  );
}

const styles = {
  // NEW LAYOUT FIX: Flex container that wraps on mobile, centers on big screens
  pageLayout: { display: 'flex', gap: '30px', maxWidth: '1300px', margin: '0 auto', width: '100%', alignItems: 'flex-start', flexWrap: 'wrap' },
  mainContent: { flex: '1 1 600px', minWidth: '0' },
  sidebarContent: { flex: '0 0 320px', width: '100%' }, // Takes up the empty space!

  subtitle: { color: '#666', marginBottom: '20px' },
  formCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '25px', transition: 'all 0.3s' },
  input: { flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' },
  button: { padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  tableCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  searchHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', backgroundColor: '#fafaf9' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', flex: 1, maxWidth: '300px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '14px' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569', backgroundColor: '#f8fafc' },
  td: { padding: '15px', color: '#334155' },
  
  typeTag: { backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #cbd5e1' },
  
  actionBtnEdit: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', cursor: 'pointer', padding: '6px', borderRadius: '6px' },
  actionBtnDelete: { background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' },

  // Insight Sidebar Styles
  insightCard: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '85px' },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f1f5f9' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalBtnNeutral: { padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  modalBtnDanger: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};