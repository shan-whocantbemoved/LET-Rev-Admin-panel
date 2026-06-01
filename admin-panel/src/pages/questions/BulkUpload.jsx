import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { getCategories, bulkAddQuestions } from '../../services/db';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BulkUpload() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); 

  // SCALABILITY: Limit how many rows React tries to render so the browser doesn't freeze!
  const PREVIEW_LIMIT = 15; 

  useEffect(() => {
    const fetchCats = async () => {
      const fetched = await getCategories();
      setCategories(fetched);
      if (fetched.length > 0) setCategoryId(fetched[0].id);
    };
    fetchCats();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // PapaParse handles huge files incredibly fast in the background
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const formattedData = results.data.map(row => ({
          questionText: row['Question'] || '',
          choices: {
            A: row['Option A'] || '',
            B: row['Option B'] || '',
            C: row['Option C'] || '',
            D: row['Option D'] || ''
          },
          correctAnswer: row['Correct Answer']?.toUpperCase().trim() || 'A',
          explanation: row['Explanation'] || ''
        }));
        setParsedData(formattedData);
        setUploadStatus(null);
      }
    });
  };

  const handleBulkSubmit = async () => {
    if (parsedData.length === 0) return;
    if (!categoryId) {
      alert("Please select a category first!");
      return;
    }

    const selectedCategory = categories.find(c => c.id === categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : "Unknown Category";
    const categoryType = selectedCategory ? (selectedCategory.type || 'General Education') : 'General Education';

    // Data Denormalization: Attach everything the Student App needs to filter instantly!
    const finalData = parsedData.map(q => ({ 
      ...q, 
      categoryId, 
      categoryName, 
      categoryType 
    }));

    setLoading(true);
    const result = await bulkAddQuestions(finalData);
    
    if (result.success) {
      setUploadStatus('success');
      setParsedData([]); 
      document.getElementById('csv-upload').value = ''; 
    } else {
      setUploadStatus('error');
    }
    setLoading(false);
  };

  // Group Categories for the Dropdown UI
  const groupedCategories = categories.reduce((acc, cat) => {
    const type = cat.type || 'General Education';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cat);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h2>Bulk Upload Hub</h2>
      <p style={styles.subtitle}>Upload CSV files to instantly generate hundreds of questions.</p>

      <div style={styles.infoBox}>
        <FileSpreadsheet size={32} color="#3498db" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>CSV Format Required</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
            Headers required: <strong>Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation</strong>
          </p>
        </div>
      </div>

      <div style={styles.uploadCard}>
        <div style={styles.formGroup}>
          <label style={styles.label}>1. Select Target Category & Classification</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.input}>
            {/* The Grouped Dropdown! */}
            {Object.entries(groupedCategories).map(([type, cats]) => (
              <optgroup key={type} label={type.toUpperCase()}>
                {cats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={{...styles.formGroup, marginTop: '15px'}}>
          <label style={styles.label}>2. Upload CSV File</label>
          <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} style={styles.fileInput} />
        </div>
      </div>

      {uploadStatus === 'success' && <div style={styles.successAlert}><CheckCircle2 size={18} /> Batch uploaded successfully!</div>}
      {uploadStatus === 'error' && <div style={styles.errorAlert}><AlertCircle size={18} /> Upload failed. Check file format.</div>}

      {parsedData.length > 0 && (
        <div style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <h3 style={{ margin: 0, color: '#334155' }}>Data Preview ({parsedData.length} items parsed)</h3>
            <button onClick={handleBulkSubmit} style={styles.submitBtn} disabled={loading}>
              <UploadCloud size={18} style={{marginRight: '8px'}} />
              {loading ? 'Uploading...' : `Upload ${parsedData.length} Questions`}
            </button>
          </div>

          <div className="table-responsive-wrapper">
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <th style={styles.th}>Question Preview</th>
                  <th style={styles.th}>Ans.</th>
                  <th style={styles.th}>A / B / C / D</th>
                </tr>
              </thead>
              <tbody>
                {/* SCALABILITY: Only render the first X rows */}
                {parsedData.slice(0, PREVIEW_LIMIT).map((q, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{...styles.td, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.questionText}</td>
                    <td style={{...styles.td, fontWeight: 'bold', color: '#22c55e'}}>{q.correctAnswer}</td>
                    <td style={{...styles.td, fontSize: '12px', color: '#64748b'}}>A: {q.choices.A} <br/> B: {q.choices.B}</td>
                  </tr>
                ))}
                {/* Indicate there is more data hiding! */}
                {parsedData.length > PREVIEW_LIMIT && (
                  <tr>
                    <td colSpan="3" style={{ padding: '15px', textAlign: 'center', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold', fontSize: '13px' }}>
                      ...and {parsedData.length - PREVIEW_LIMIT} more questions ready for upload.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // THE LAYOUT FIX: margin: '0 auto' centers the page instead of leaving weird space on the right
  container: { maxWidth: '1100px', width: '100%', margin: '0 auto' },
  subtitle: { color: '#666', marginBottom: '20px' },
  infoBox: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px' },
  uploadCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '25px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#334155' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontFamily: 'inherit', width: '100%', maxWidth: '400px' },
  fileInput: { padding: '10px', borderRadius: '6px', border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', maxWidth: '400px' },
  
  successAlert: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' },
  errorAlert: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' },

  previewCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #cbd5e1' },
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '15px' },
  submitBtn: { padding: '12px 20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center' },
  
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { padding: '12px 15px', borderBottom: '2px solid #e2e8f0', color: '#475569' },
  td: { padding: '12px 15px', color: '#334155' }
};