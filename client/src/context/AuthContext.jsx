import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: returnedToken, user: returnedUser } = response.data;

    localStorage.setItem('token', returnedToken);
    localStorage.setItem('user', JSON.stringify(returnedUser));
    setToken(returnedToken);
    setUser(returnedUser);

    return returnedUser;
  };

  const loginWithGoogle = async (credential) => {
    const response = await api.post('/auth/google', { credential });
    const { token: returnedToken, user: returnedUser } = response.data;

    localStorage.setItem('token', returnedToken);
    localStorage.setItem('user', JSON.stringify(returnedUser));
    setToken(returnedToken);
    setUser(returnedUser);

    return returnedUser;
  };

  const register = async (name, email, password, role) => {
    return api.post('/auth/register', { name, email, password, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, login, loginWithGoogle, register, logout, loading }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
