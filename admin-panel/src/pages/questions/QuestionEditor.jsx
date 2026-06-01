import { useState, useEffect } from 'react';
import { getCategories, addQuestion, getQuestions, updateQuestion, deleteQuestion } from '../../services/db';
import { Pencil, Trash2, X, Save, Search, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function QuestionEditor() {
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search, Filter, and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show 10 questions at a time

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [originalData, setOriginalData] = useState(null); 
  const [categoryId, setCategoryId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');

  // Custom Modal States
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', type: 'error' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, message: '', onConfirm: null });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 whenever the user types a search or changes the filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const fetchData = async () => {
    const fetchedCategories = await getCategories();
    setCategories(fetchedCategories);
    if (fetchedCategories.length > 0 && !categoryId) {
      setCategoryId(fetchedCategories[0].id); 
    }
    const fetchedQuestions = await getQuestions();
    setQuestions(fetchedQuestions);
  };

  const showAlert = (message, type = 'error') => setAlertConfig({ isOpen: true, message, type });
  const closeAlert = () => setAlertConfig({ isOpen: false, message: '', type: 'error' });
  
  const showConfirm = (message, onConfirm) => setConfirmConfig({ isOpen: true, message, onConfirm });
  const closeConfirm = () => setConfirmConfig({ isOpen: false, message: '', onConfirm: null });

  const handleChoiceChange = (letter, value) => {
    setChoices(prev => ({ ...prev, [letter]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedQuestion = questionText.trim(); 
    
    if (trimmedQuestion.length < 10) {
      showAlert("Please enter a valid, complete question (at least 10 characters).");
      return;
    }
    if (!trimmedQuestion.includes('?')) {
      showAlert("A valid question must contain a question mark (?).");
      return;
    }
    if (!categoryId || !choices.A.trim() || !choices.B.trim() || !choices.C.trim() || !choices.D.trim()) {
      showAlert("Please ensure the category and all 4 choices are filled out.");
      return;
    }

    // --- THE FIX IS HERE ---
    // We find the exact name of the category the admin selected from the dropdown
    const selectedCategory = categories.find(c => c.id === categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : "Unknown Category";

    // We now save BOTH the ID and the Name to Firestore!
    const currentData = { 
      categoryId, 
      categoryName, // Added this!
      questionText: trimmedQuestion, 
      choices, 
      correctAnswer, 
      explanation 
    };

    if (editingId) {
      if (JSON.stringify(currentData) === JSON.stringify(originalData)) {
        showAlert("No changes were made. Please modify the question or click Cancel Edit.", "warning");
        return;
      }
    }

    setLoading(true);
    
    if (editingId) {
      const result = await updateQuestion(editingId, currentData);
      if (result.success) {
        showAlert("Question updated successfully!", "success");
        resetForm();
      } else showAlert("Failed to update question.");
    } else {
      const result = await addQuestion(currentData);
      if (result.success) {
        showAlert("Question added successfully!", "success");
        resetForm();
      } else showAlert("Failed to add question.");
    }
    setLoading(false);
  };

  const handleEditClick = (q) => {
    setEditingId(q.id);
    setCategoryId(q.categoryId);
    setQuestionText(q.questionText);
    setChoices(q.choices);
    setCorrectAnswer(q.correctAnswer);
    setExplanation(q.explanation || '');
    
    setOriginalData({
      categoryId: q.categoryId,
      questionText: q.questionText,
      choices: q.choices,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    showConfirm("Are you sure you want to delete this question permanently? This cannot be undone.", async () => {
      const result = await deleteQuestion(id);
      if (result.success) {
        fetchData();
        if (editingId === id) resetForm();
        closeConfirm();
      } else {
        showAlert("Failed to delete question.");
        closeConfirm();
      }
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setOriginalData(null);
    setQuestionText('');
    setChoices({ A: '', B: '', C: '', D: '' });
    setCorrectAnswer('A');
    setExplanation('');
    fetchData();
  };

  // --- DATA PROCESSING: Filter -> Search -> Paginate ---
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || q.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);

  // Group Categories for the Dropdown UI
  const groupedCategories = categories.reduce((acc, cat) => {
    const type = cat.type || 'General Education';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cat);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      
      {/* CUSTOM ALERT MODAL */}
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

      {/* CUSTOM CONFIRM MODAL */}
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

      <h2>Question Editor</h2>
      <p style={styles.subtitle}>Create and manage Multiple Choice Questions (MCQs).</p>

      {/* Form Card */}
      <div style={{...styles.formCard, borderTop: editingId ? '4px solid #f39c12' : '4px solid #3498db'}}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50', display: 'flex', justifyContent: 'space-between' }}>
          {editingId ? '✏️ Edit Question' : '✨ New Question'}
          {editingId && (
            <button type="button" onClick={resetForm} style={styles.cancelBtnText}>
              <X size={16} /> Cancel Edit
            </button>
          )}
        </h3>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Category / Subject</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.input}>
              {Object.entries(groupedCategories).map(([type, cats]) => (
                <optgroup key={type} label={type.toUpperCase()}>
                  {cats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Question Text</label>
            <textarea 
              value={questionText} onChange={(e) => setQuestionText(e.target.value)} 
              style={styles.textarea} placeholder="Enter the question (must include a '?')..." required 
            />
          </div>

          <label style={styles.label}>Choices</label>
          <div style={styles.choicesGrid}>
            {['A', 'B', 'C', 'D'].map(letter => (
              <div key={letter} style={styles.choiceRow}>
                <span style={{...styles.choiceBadge, backgroundColor: correctAnswer === letter ? '#dcfce7' : '#e9ecef', borderColor: correctAnswer === letter ? '#22c55e' : '#ccc'}}>
                  {letter}
                </span>
                <input 
                  type="text" value={choices[letter]} onChange={(e) => handleChoiceChange(letter, e.target.value)}
                  style={styles.input} placeholder={`Option ${letter}`} required
                />
              </div>
            ))}
          </div>

          <div className="responsive-form-row" style={{ marginTop: '10px' }}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Correct Answer</label>
              <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} style={styles.input}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div style={{ ...styles.formGroup, flex: 2 }}>
              <label style={styles.label}>Explanation (Optional)</label>
              <input 
                type="text" value={explanation} onChange={(e) => setExplanation(e.target.value)}
                style={styles.input} placeholder="Why is this correct?" 
              />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            <Save size={18} style={{marginRight: '8px'}} />
            {loading ? 'Saving...' : (editingId ? 'Update Question' : 'Save Question')}
          </button>
        </form>
      </div>

      {/* FILTER, SEARCH BAR & TABLE */}
      <div style={styles.tableCard}>
        <div style={styles.searchHeader}>
          
          <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', flex: 1}}>
            {/* Category Filter */}
            <div style={styles.filterBox}>
              <Filter size={18} color="#94a3b8" />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)} 
                style={styles.filterSelect}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            {/* Keyword Search */}
            <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search questions by keyword..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
          
        </div>

        <div className="table-responsive-wrapper" style={{minHeight: '300px'}}>
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Question</th>
                <th style={styles.th}>Ans.</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentQuestions.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>No questions match your search/filter.</td></tr>
              ) : (
                currentQuestions.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{...styles.td, fontSize: '13px', color: '#64748b'}}>{categories.find(c => c.id === q.categoryId)?.name || 'Unknown'}</td>
                    <td style={{...styles.td, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.questionText}>{q.questionText}</td>
                    <td style={styles.td}><strong>{q.correctAnswer}</strong></td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditClick(q)} style={styles.actionBtnEdit} title="Edit"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteClick(q.id)} style={styles.actionBtnDelete} title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div style={styles.paginationFooter}>
            <p style={{fontSize: '13px', color: '#64748b', margin: 0}}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuestions.length)} of {filteredQuestions.length} entries
            </p>
            <div style={{display: 'flex', gap: '5px'}}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1}}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{padding: '5px 15px', fontWeight: 'bold', color: '#334155'}}>{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1}}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', width: '100%', margin: '0 auto' },
  subtitle: { color: '#666', marginBottom: '20px' },
  formCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#334155' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontFamily: 'inherit', width: '100%' },
  textarea: { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontFamily: 'inherit', width: '100%', minHeight: '80px', resize: 'vertical' },
  choicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' },
  choiceRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  choiceBadge: { padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { marginTop: '10px', padding: '14px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' },
  
  tableCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  searchHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: '#fafaf9' },
  
  filterBox: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', minWidth: '180px' },
  filterSelect: { border: 'none', backgroundColor: 'transparent', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '14px', color: '#334155', cursor: 'pointer' },
  
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', flex: 1, minWidth: '200px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '14px' },
  
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569' },
  td: { padding: '15px', color: '#334155' },
  actionBtnEdit: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', cursor: 'pointer', padding: '6px', borderRadius: '6px' },
  actionBtnDelete: { background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' },

  paginationFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fafaf9', flexWrap: 'wrap', gap: '10px' },
  pageBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalBtnNeutral: { padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  modalBtnDanger: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};