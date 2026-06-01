import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for our error message
  const [loading, setLoading] = useState(false); // Prevents spam clicking
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true);

    try {
      // Connects to Firebase to verify credentials
      await signInWithEmailAndPassword(auth, email, password);
      
      // The Success Popup
      window.alert("Login Successful! Welcome to the LET Reviewer Admin Panel.");
      
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err);
      // The Error Message
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>
        <p style={styles.subtitle}>LET Reviewer System</p>
        
        {/* If there is an error, display this red box */}
        {error && <div style={styles.errorBox}>{error}</div>}
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required 
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
        <p style={styles.secureText}>[Secure Firebase Auth]</p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9ecef' },
  card: { background: 'white', padding: '40px', borderRadius: '8px', border: '1px solid #ccc', width: '350px', textAlign: 'center' },
  title: { margin: '0 0 5px 0', color: '#000', fontSize: '24px' },
  subtitle: { margin: '0 0 20px 0', color: '#666', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '4px', border: '1px solid #aaa', fontSize: '16px' },
  button: { padding: '12px', borderRadius: '4px', border: 'none', background: '#2c3e50', color: 'white', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  secureText: { marginTop: '15px', fontSize: '12px', color: '#888' },
  errorBox: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', border: '1px solid #f5c6cb' }
};