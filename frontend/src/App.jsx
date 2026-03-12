import { useEffect, useState } from 'react';
import Home from './Home';
import Products from './Products';
import Offers from './Offers';
import Login from './Login';
import Register from './Register';
import './styles/App.css';

const AUTH_STORAGE_KEY = 'sunnywear-auth';
const LAST_VISIT_STORAGE_KEY = 'sunnywear-last-visit';
const AUTO_LOGOUT_DAYS = 5;
const AUTO_LOGOUT_MS = AUTO_LOGOUT_DAYS * 24 * 60 * 60 * 1000;

const getCurrentPage = () => {
  if (window.location.hash.startsWith('#products')) {
    return 'products';
  }

  if (window.location.hash.startsWith('#offers')) {
    return 'offers';
  }

  if (window.location.hash.startsWith('#login')) {
    return 'login';
  }

  if (window.location.hash.startsWith('#register')) {
    return 'register';
  }

  return 'home';
};

const getInitialAuthState = () => {
  const now = Date.now();
  const lastVisitValue = localStorage.getItem(LAST_VISIT_STORAGE_KEY);
  const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  const lastVisit = lastVisitValue ? Number(lastVisitValue) : null;

  if (lastVisit && now - lastVisit > AUTO_LOGOUT_MS) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { isLoggedIn: false, accountLabel: 'Khách hàng' };
  }

  if (savedAuth) {
    try {
      const parsedAuth = JSON.parse(savedAuth);
      return {
        isLoggedIn: true,
        accountLabel: parsedAuth.label || 'Khách hàng',
      };
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return { isLoggedIn: false, accountLabel: 'Khách hàng' };
};

function App() {
  const [page, setPage] = useState(getCurrentPage);
  const [authState, setAuthState] = useState(getInitialAuthState);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getCurrentPage());
    };

    localStorage.setItem(LAST_VISIT_STORAGE_KEY, String(Date.now()));
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleAuth = (mode) => {
    const authData = {
      label: mode === 'register' ? 'Thành viên mới' : 'Khách hàng',
      mode,
      updatedAt: Date.now(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem(LAST_VISIT_STORAGE_KEY, String(Date.now()));
    setAuthState({ isLoggedIn: true, accountLabel: authData.label });
  };

  const handleLoginSubmit = ({ fullName }) => {
    handleAuth('login');

    const label = fullName?.trim() || 'Khách hàng';
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsedAuth = savedAuth ? JSON.parse(savedAuth) : {};
    const authData = {
      ...parsedAuth,
      label,
      mode: 'login',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuthState({ isLoggedIn: true, accountLabel: authData.label });
    handleGoHome();
  };

  const handleRegisterSubmit = ({ fullName }) => {
    handleAuth('register');

    const label = fullName?.trim() || 'Thành viên mới';
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsedAuth = savedAuth ? JSON.parse(savedAuth) : {};
    const authData = {
      ...parsedAuth,
      label,
      mode: 'register',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuthState({ isLoggedIn: true, accountLabel: authData.label });
    handleGoHome();
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.setItem(LAST_VISIT_STORAGE_KEY, String(Date.now()));
    setAuthState({ isLoggedIn: false, accountLabel: 'Khách hàng' });
  };

  const handleGoHome = () => {
    window.location.hash = '#home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoProducts = () => {
    window.location.hash = '#products';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoOffers = () => {
    window.location.hash = '#offers';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoLogin = () => {
    window.location.hash = '#login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoRegister = () => {
    window.location.hash = '#register';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (page === 'products') {
    return (
      <Products
        authState={authState}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoOffers={handleGoOffers}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
      />
    );
  }

  if (page === 'offers') {
    return (
      <Offers
        authState={authState}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
      />
    );
  }

  if (page === 'login') {
    return (
      <Login
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoRegister={handleGoRegister}
        onSubmit={handleLoginSubmit}
      />
    );
  }

  if (page === 'register') {
    return (
      <Register
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoLogin={handleGoLogin}
        onSubmit={handleRegisterSubmit}
      />
    );
  }

  return (
    <Home
      authState={authState}
      onLogout={handleLogout}
      onGoHome={handleGoHome}
      onGoProducts={handleGoProducts}
      onGoOffers={handleGoOffers}
      onGoLogin={handleGoLogin}
      onGoRegister={handleGoRegister}
    />
  );
}

export default App;