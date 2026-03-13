import { useEffect, useState } from 'react';
import Home from './Home';
import Products from './Products';
import Offers from './Offers';
import Login from './Login';
import Register from './Register';
import Cart from './Cart';
import ProductDetail from './ProductDetail';
import './styles/App.css';

const AUTH_STORAGE_KEY = 'sunnywear-auth';
const LAST_VISIT_STORAGE_KEY = 'sunnywear-last-visit';
const CART_STORAGE_KEY = 'sunnywear-cart';
const PRODUCT_DETAIL_STORAGE_KEY = 'sunnywear-product-detail';
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

  if (window.location.hash.startsWith('#cart')) {
    return 'cart';
  }

  if (window.location.hash.startsWith('#product/')) {
    return 'product-detail';
  }

  return 'home';
};

const getCurrentProductId = () => {
  const hashValue = window.location.hash || '';

  if (!hashValue.startsWith('#product/')) {
    return null;
  }

  return hashValue.slice('#product/'.length) || null;
};

const getInitialCartItems = () => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);

  if (!savedCart) {
    return [];
  }

  try {
    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter((item) => item && item.id && Number(item.quantity) > 0);
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
};

const getInitialSelectedProduct = () => {
  const savedProduct = localStorage.getItem(PRODUCT_DETAIL_STORAGE_KEY);

  if (!savedProduct) {
    return null;
  }

  try {
    return JSON.parse(savedProduct);
  } catch {
    localStorage.removeItem(PRODUCT_DETAIL_STORAGE_KEY);
    return null;
  }
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
  const [cartItems, setCartItems] = useState(getInitialCartItems);
  const [selectedProduct, setSelectedProduct] = useState(getInitialSelectedProduct);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

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

  const handleGoCart = () => {
    window.location.hash = '#cart';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoProductDetail = (product) => {
    setSelectedProduct(product);
    localStorage.setItem(PRODUCT_DETAIL_STORAGE_KEY, JSON.stringify(product));
    window.location.hash = `#product/${product.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product) => {
    if (!authState.isLoggedIn) {
      return;
    }

    setCartItems((previous) => {
      const existingItem = previous.find((item) => item.id === product.id);

      if (existingItem) {
        return previous.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...previous,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCartItems((previous) => previous.filter((item) => item.id !== productId));
      return;
    }

    setCartItems((previous) =>
      previous.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: nextQuantity,
            }
          : item,
      ),
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((previous) => previous.filter((item) => item.id !== productId));
  };

  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  if (page === 'products') {
    return (
      <Products
        authState={authState}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoOffers={handleGoOffers}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        onAddToCart={handleAddToCart}
        onGoProductDetail={handleGoProductDetail}
        cartCount={totalCartItems}
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
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        cartCount={totalCartItems}
      />
    );
  }

  if (page === 'login') {
    return (
      <Login
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoCart={handleGoCart}
        onGoRegister={handleGoRegister}
        cartCount={totalCartItems}
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
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        cartCount={totalCartItems}
        onSubmit={handleRegisterSubmit}
      />
    );
  }

  if (page === 'cart') {
    return (
      <Cart
        authState={authState}
        cartItems={cartItems}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
      />
    );
  }

  if (page === 'product-detail') {
    return (
      <ProductDetail
        authState={authState}
        product={selectedProduct}
        currentProductId={getCurrentProductId()}
        cartCount={totalCartItems}
        onAddToCart={handleAddToCart}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
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
      onGoCart={handleGoCart}
      onGoLogin={handleGoLogin}
      onGoRegister={handleGoRegister}
      onAddToCart={handleAddToCart}
      cartCount={totalCartItems}
    />
  );
}

export default App;
