import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const tokenKey = 'ranquickcalls_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(tokenKey));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile if token exists on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await userService.getProfile();
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          // Token expired or invalid
          handleLogoutCleanup();
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        handleLogoutCleanup();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const handleLogoutCleanup = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        localStorage.setItem(tokenKey, response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success(`Welcome back, ${response.user.username}!`);
        return response.user;
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password, ageRange, languageLevel, interests, country) => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        username,
        email,
        password,
        ageRange,
        languageLevel,
        interests,
        country
      });
      if (response.success) {
        localStorage.setItem(tokenKey, response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Registration successful! Welcome.');
        return response.user;
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const guestLogin = async (ageRange, languageLevel, country) => {
    setIsLoading(true);
    try {
      const response = await authService.guestLogin({ ageRange, languageLevel, country });
      if (response.success) {
        localStorage.setItem(tokenKey, response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success(`Logged in as guest: ${response.user.username}`);
        return response.user;
      }
    } catch (err) {
      toast.error(err.message || 'Guest login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Best effort API logout
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout warning:', err.message);
    } finally {
      handleLogoutCleanup();
      toast.success('Logged out successfully');
    }
  };

  const socialLogin = async (socialData) => {
    setIsLoading(true);
    try {
      const response = await authService.socialLogin(socialData);
      if (response.success) {
        localStorage.setItem(tokenKey, response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success(`Welcome, ${response.user.username}!`);
        return response.user;
      }
    } catch (err) {
      toast.error(err.message || 'Social login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const mobileLogin = async (mobileData) => {
    setIsLoading(true);
    try {
      const response = await authService.mobileLogin(mobileData);
      if (response.success) {
        localStorage.setItem(tokenKey, response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success(`Logged in with phone successfully!`);
        return response.user;
      }
    } catch (err) {
      toast.error(err.message || 'Mobile verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await userService.updateProfile(profileData);
      if (response.success) {
        setUser(response.user);
        toast.success('Profile updated successfully');
        return response.user;
      }
    } catch (err) {
      toast.error(err.message || 'Profile update failed');
      throw err;
    }
  };

  const updateAvatar = async (imageUrl) => {
    try {
      const response = await userService.uploadPicture(imageUrl);
      if (response.success) {
        setUser(prev => ({ ...prev, profilePicture: response.imageUrl }));
        toast.success('Avatar updated successfully');
        return response.imageUrl;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update avatar');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      guestLogin,
      logout,
      socialLogin,
      mobileLogin,
      updateProfile,
      updateAvatar
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
