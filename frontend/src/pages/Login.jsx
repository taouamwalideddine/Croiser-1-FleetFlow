import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'chauffeur') navigate('/driver');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user.role === 'admin') navigate('/admin');
        else if (result.user.role === 'chauffeur') navigate('/driver');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>FleetFlow</h1>
        <h2 style={styles.subtitle}>Login</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footerText}>
          No account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: '20px',
    fontFamily: '"Roboto", sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '0px',
    padding: '40px',
    border: '2px solid #000000',
    width: '100%',
    maxWidth: '420px',
    boxSizing: 'border-box'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#000000',
    textAlign: 'center',
    marginBottom: '32px',
    fontWeight: '400',
    letterSpacing: '0.5px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '14px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: '"Roboto", sans-serif',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: '#000000',
      boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
    }
  },
  button: {
    padding: '14px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#333333',
      borderColor: '#333333'
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      borderColor: '#999999',
      cursor: 'not-allowed'
    }
  },
  error: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '12px',
    borderRadius: '0px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '2px solid #000000',
    textAlign: 'center',
    fontWeight: '500'
  },
  footerText: {
    marginTop: '24px',
    fontSize: '14px',
    textAlign: 'center',
    color: '#000000',
    '& a': {
      color: '#000000',
      textDecoration: 'underline',
      fontWeight: '500',
      '&:hover': {
        textDecoration: 'none'
      }
    }
  }
};

export default Login;


