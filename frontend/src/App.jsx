import { useEffect, useState } from 'react';
import { catalogProducts } from './catalog';
import Home from './Home';
import Products from './Products';
import Offers from './Offers';
import Users from './Users';
import Orders from './Orders';
import Checkout from './Checkout';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Cart from './Cart';
import ProductDetail from './ProductDetail';
import Admin from './Admin';
import AdminLogin from './AdminLogin';
import './styles/App.css';

const AUTH_STORAGE_KEY = 'sunnywear-auth';
const LAST_VISIT_STORAGE_KEY = 'sunnywear-last-visit';
const CART_STORAGE_KEY = 'sunnywear-cart';
const PRODUCT_DETAIL_STORAGE_KEY = 'sunnywear-product-detail';
const ADMIN_AUTH_STORAGE_KEY = 'sunnywear-admin-auth';
const CUSTOMERS_STORAGE_KEY = 'sunnywear-customers';
const ORDERS_STORAGE_KEY = 'sunnywear-orders';
const PROMOTIONS_STORAGE_KEY = 'sunnywear-promotions';
const VOUCHERS_STORAGE_KEY = 'sunnywear-vouchers';
const AUTO_LOGOUT_DAYS = 5;
const AUTO_LOGOUT_MS = AUTO_LOGOUT_DAYS * 24 * 60 * 60 * 1000;
const ADMIN_EMAIL = 'admin@sunnywear.com';
const ADMIN_PASSWORD = 'Admin@123';
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const defaultQuantity = (stock) => {
  if (stock === 'Sắp cháy hàng') return 3;
  if (stock === 'Sắp hết hàng') return 8;
  if (stock === 'Bán chạy') return 120;
  if (stock === 'Mới lên kệ') return 40;
  return 60;
};

const initialProducts = catalogProducts.map((p) => ({ ...p, quantity: defaultQuantity(p.stockLabel) }));

const seedCustomerEmails = new Set([
  'nguyenvana@email.com',
  'tranthib@email.com',
  'leminhc@email.com',
  'phamthid@email.com',
  'hoangvane@email.com',
  'vuthif@email.com',
  'dangminhg@email.com',
  'buithih@email.com',
]);

const seedOrderIds = new Set(['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005', 'ORD-006', 'ORD-007', 'ORD-008']);

const formatDate = (date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

const getCurrentPage = () => {
  if (window.location.hash.startsWith('#products')) {
    return 'products';
  }

  if (window.location.hash.startsWith('#offers')) {
    return 'offers';
  }

  if (window.location.hash.startsWith('#users')) {
    return 'users';
  }

  if (window.location.hash.startsWith('#orders')) {
    return 'orders';
  }

  if (window.location.hash.startsWith('#login')) {
    return 'login';
  }

  if (window.location.hash.startsWith('#register')) {
    return 'register';
  }

  if (window.location.hash.startsWith('#forgot-password')) {
    return 'forgot-password';
  }

  if (window.location.hash.startsWith('#cart')) {
    return 'cart';
  }

  if (window.location.hash.startsWith('#checkout')) {
    return 'checkout';
  }

  if (window.location.hash.startsWith('#product/')) {
    return 'product-detail';
  }

  if (window.location.hash.startsWith('#admin-login')) {
    return 'admin-login';
  }

  if (window.location.hash.startsWith('#admin')) {
    return 'admin';
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

const getInitialAdminAuth = () => {
  const saved = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

  if (!saved) {
    return { isAdmin: false, email: '' };
  }

  try {
    const parsed = JSON.parse(saved);

    if (parsed && normalizeEmail(parsed.email) === normalizeEmail(ADMIN_EMAIL)) {
      return { isAdmin: true, email: normalizeEmail(parsed.email) };
    }
  } catch {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }

  return { isAdmin: false, email: '' };
};

const getInitialCustomers = () => {
  const savedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);

  if (!savedCustomers) {
    return [];
  }

  try {
    const parsedCustomers = JSON.parse(savedCustomers);

    if (!Array.isArray(parsedCustomers)) {
      return [];
    }

    // Auto-migrate old demo accounts out of storage, keep only real user accounts.
    return parsedCustomers.filter((customer) => !seedCustomerEmails.has(normalizeEmail(customer.email)));
  } catch {
    localStorage.removeItem(CUSTOMERS_STORAGE_KEY);
    return [];
  }
};

const getInitialOrders = () => {
  const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

  if (!savedOrders) {
    return [];
  }

  try {
    const parsedOrders = JSON.parse(savedOrders);

    if (!Array.isArray(parsedOrders)) {
      return [];
    }

    // Auto-migrate old demo orders out of storage, keep only real orders.
    return parsedOrders.filter((order) => !seedOrderIds.has(String(order.id || '')));
  } catch {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    return [];
  }
};

const getInitialPromotions = () => {
  const savedPromotions = localStorage.getItem(PROMOTIONS_STORAGE_KEY);

  if (!savedPromotions) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedPromotions);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(PROMOTIONS_STORAGE_KEY);
    return [];
  }
};

const getInitialVouchers = () => {
  const savedVouchers = localStorage.getItem(VOUCHERS_STORAGE_KEY);

  if (!savedVouchers) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedVouchers);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(VOUCHERS_STORAGE_KEY);
    return [];
  }
};

const getInitialAuthState = () => {
  const now = Date.now();
  const lastVisitValue = localStorage.getItem(LAST_VISIT_STORAGE_KEY);
  const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  const lastVisit = lastVisitValue ? Number(lastVisitValue) : null;

  if (lastVisit && now - lastVisit > AUTO_LOGOUT_MS) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { isLoggedIn: false, accountLabel: 'Khách hàng', email: '' };
  }

  if (savedAuth) {
    try {
      const parsedAuth = JSON.parse(savedAuth);
      return {
        isLoggedIn: true,
        accountLabel: parsedAuth.label || 'Khách hàng',
        email: parsedAuth.email || '',
      };
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return { isLoggedIn: false, accountLabel: 'Khách hàng', email: '' };
};

function App() {
  const [page, setPage] = useState(getCurrentPage);
  const [authState, setAuthState] = useState(getInitialAuthState);
  const [adminAuth, setAdminAuth] = useState(getInitialAdminAuth);
  const [cartItems, setCartItems] = useState(getInitialCartItems);
  const [selectedProduct, setSelectedProduct] = useState(getInitialSelectedProduct);
  const [sharedProducts, setSharedProducts] = useState(initialProducts);
  const [sharedCustomers, setSharedCustomers] = useState(getInitialCustomers);
  const [sharedOrders, setSharedOrders] = useState(getInitialOrders);
  const [sharedPromotions, setSharedPromotions] = useState(getInitialPromotions);
  const [sharedVouchers, setSharedVouchers] = useState(getInitialVouchers);
  const [latestOrderId, setLatestOrderId] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(sharedCustomers));
  }, [sharedCustomers]);

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sharedOrders));
  }, [sharedOrders]);

  useEffect(() => {
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(sharedPromotions));
  }, [sharedPromotions]);

  useEffect(() => {
    localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(sharedVouchers));
  }, [sharedVouchers]);

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
    setAuthState({ isLoggedIn: true, accountLabel: authData.label, email: '' });
  };

  const upsertCustomer = ({ email, name, phone, password }) => {
    const normalizedCustomerEmail = normalizeEmail(email);

    if (!normalizedCustomerEmail || normalizedCustomerEmail === normalizeEmail(ADMIN_EMAIL)) {
      return;
    }

    setSharedCustomers((previous) => {
      const existingCustomer = previous.find((customer) => normalizeEmail(customer.email) === normalizedCustomerEmail);

      if (existingCustomer) {
        return previous.map((customer) =>
          normalizeEmail(customer.email) === normalizedCustomerEmail
            ? {
                ...customer,
                name: name?.trim() || customer.name,
                phone: phone?.trim() || customer.phone,
                password: password || customer.password,
              }
            : customer,
        );
      }

      return [
        {
          id: `USR-${String(previous.length + 1).padStart(3, '0')}`,
          name: name?.trim() || normalizedCustomerEmail.split('@')[0] || 'Khách hàng mới',
          email: normalizedCustomerEmail,
          phone: phone?.trim() || '',
          password: password || '',
          orders: 0,
          joined: formatDate(new Date()),
        },
        ...previous,
      ];
    });
  };

  const handleUpdateCustomer = (updatedCustomer) => {
    setSharedCustomers((previous) =>
      previous.map((customer) =>
        normalizeEmail(customer.email) === normalizeEmail(updatedCustomer.email)
          ? { ...customer, ...updatedCustomer }
          : customer
      )
    );
  };

  const handleLoginSubmit = ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const rawPassword = String(password || '');

    if (normalizedEmail === normalizeEmail(ADMIN_EMAIL) && password === ADMIN_PASSWORD) {
      setLoginError('');
      const adminData = { email: normalizedEmail, loggedInAt: Date.now() };
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(adminData));
      setAdminAuth({ isAdmin: true, email: normalizedEmail });
      window.location.hash = '#admin';
      return;
    }

    const existingCustomer = sharedCustomers.find(
      (customer) => normalizeEmail(customer.email) === normalizedEmail,
    );

    if (!existingCustomer) {
      setLoginError('Email này chưa đăng ký tài khoản.');
      return;
    }

    if (!existingCustomer.password) {
      setLoginError('Tài khoản này chưa có mật khẩu. Vui lòng dùng Quên mật khẩu để thiết lập mật khẩu.');
      return;
    }

    if (existingCustomer.password !== rawPassword) {
      setLoginError('Mật khẩu không chính xác.');
      return;
    }

    setLoginError('');
    handleAuth('login');

    const emailPrefix = normalizedEmail.split('@')[0];
    const label = existingCustomer.name?.trim() || emailPrefix || 'Khách hàng';
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsedAuth = savedAuth ? JSON.parse(savedAuth) : {};
    const authData = {
      ...parsedAuth,
      label,
      mode: 'login',
      email: normalizedEmail,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuthState({ isLoggedIn: true, accountLabel: authData.label, email: normalizedEmail });
    handleGoHome();
  };

  const handleRegisterSubmit = ({ fullName, email, phone, password }) => {
    setLoginError('');
    handleAuth('register');
    upsertCustomer({ email, name: fullName, phone, password });

    const label = fullName?.trim() || 'Thành viên mới';
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsedAuth = savedAuth ? JSON.parse(savedAuth) : {};
    const authData = {
      ...parsedAuth,
      label,
      mode: 'register',
      email: normalizeEmail(email),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuthState({ isLoggedIn: true, accountLabel: authData.label, email: normalizeEmail(email) });
    handleGoHome();
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.setItem(LAST_VISIT_STORAGE_KEY, String(Date.now()));
    setAuthState({ isLoggedIn: false, accountLabel: 'Khách hàng', email: '' });
    setCartItems([]);
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

  const handleGoUsers = () => {
    window.location.hash = '#users';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoOrders = () => {
    window.location.hash = '#orders';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoLogin = () => {
    setLoginError('');
    window.location.hash = '#login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoRegister = () => {
    window.location.hash = '#register';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoForgotPassword = () => {
    window.location.hash = '#forgot-password';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoCart = () => {
    window.location.hash = '#cart';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoCheckout = () => {
    window.location.hash = '#checkout';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = (checkoutData) => {
    if (!authState.isLoggedIn || cartItems.length === 0) {
      return;
    }

    const totalPrice = cartItems.reduce((total, item) => total + item.priceNumber * item.quantity, 0);
    const discountAmount = Math.min(Number(checkoutData?.discountAmount || 0), totalPrice);
    const finalTotal = Math.max(0, Number(checkoutData?.finalTotal || totalPrice - discountAmount));
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const orderItems = cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity || 0),
      priceNumber: Number(item.priceNumber || 0),
      priceText: item.priceText || `${Number(item.priceNumber || 0).toLocaleString('vi-VN')}đ`,
    }));
    const productLabel =
      cartItems.length === 1
        ? cartItems[0].name
        : `${cartItems[0].name} (+${cartItems.length - 1} sản phẩm)`;

    const order = {
      id: orderId,
      customer: authState.accountLabel,
      customerEmail: normalizeEmail(authState.email),
      fullName: checkoutData?.fullName || authState.accountLabel,
      phone: checkoutData?.phone || '',
      address: checkoutData?.address || '',
      paymentMethod: checkoutData?.paymentMethod || 'cod',
      note: checkoutData?.note || '',
      items: orderItems,
      product: productLabel,
      amount: `${finalTotal.toLocaleString('vi-VN')}đ`,
      status: 'Chờ xác nhận',
      date: formatDate(new Date()),
      voucherCode: checkoutData?.voucherCode || '',
      promotionTitle: checkoutData?.promotionTitle || '',
      createdAt: Date.now(),
    };

    setSharedOrders((prev) => [order, ...prev]);
    setLatestOrderId(orderId);
    setCartItems([]);

    if (authState.email) {
      const normalized = normalizeEmail(authState.email);
      setSharedCustomers((prev) =>
        prev.map((customer) =>
          normalizeEmail(customer.email) === normalized
            ? { ...customer, orders: Number(customer.orders || 0) + 1 }
            : customer,
        ),
      );
    }
  };

  const handleCustomerCancelOrder = (orderId) => {
    setSharedOrders((previous) =>
      previous.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'Đã huỷ',
              cancelledBy: 'customer',
            }
          : order,
      ),
    );
  };

  const handleAdminDeleteOrder = (orderId) => {
    setSharedOrders((previous) => previous.filter((order) => order.id !== orderId));
  };

  const handleAdminLoginSubmit = ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    if (normalizedEmail === normalizeEmail(ADMIN_EMAIL) && password === ADMIN_PASSWORD) {
      const adminData = { email: normalizedEmail, loggedInAt: Date.now() };
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(adminData));
      setAdminAuth({ isAdmin: true, email: normalizedEmail });
      window.location.hash = '#admin';
      return true;
    }

    return false;
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setAdminAuth({ isAdmin: false, email: '' });
    window.location.hash = '#admin-login';
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
  const visibleCartCount = authState.isLoggedIn ? totalCartItems : 0;

  if (page === 'products') {
    return (
      <Products
        authState={authState}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoOffers={handleGoOffers}
        onGoCart={handleGoCart}
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        onAddToCart={handleAddToCart}
        onGoProductDetail={handleGoProductDetail}
        cartCount={visibleCartCount}
        products={sharedProducts}
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
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        cartCount={visibleCartCount}
        promotions={sharedPromotions}
        vouchers={sharedVouchers}
      />
    );
  }

  if (page === 'login') {
    return (
      <Login
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoRegister={handleGoRegister}
        onGoForgotPassword={handleGoForgotPassword}
        cartCount={visibleCartCount}
        errorMessage={loginError}
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
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        cartCount={visibleCartCount}
        onSubmit={handleRegisterSubmit}
      />
    );
  }

  if (page === 'forgot-password') {
    return (
      <ForgotPassword
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoUsers={handleGoUsers}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        cartCount={visibleCartCount}
        customers={sharedCustomers}
        onUpdateCustomer={handleUpdateCustomer}
      />
    );
  }

  if (page === 'users') {
    return (
      <Users
        authState={authState}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        cartCount={visibleCartCount}
      />
    );
  }

  if (page === 'orders') {
    return (
      <Orders
        authState={authState}
        orders={sharedOrders}
        onCancelOrder={handleCustomerCancelOrder}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        cartCount={visibleCartCount}
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
        onGoCheckout={handleGoCheckout}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
      />
    );
  }

  if (page === 'checkout') {
    return (
      <Checkout
        authState={authState}
        cartItems={cartItems}
        latestOrderId={latestOrderId}
        onPlaceOrder={handlePlaceOrder}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoUsers={handleGoUsers}
        onGoOrders={handleGoOrders}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        cartCount={visibleCartCount}
        promotions={sharedPromotions}
        vouchers={sharedVouchers}
      />
    );
  }

  if (page === 'product-detail') {
    return (
      <ProductDetail
        authState={authState}
        product={selectedProduct}
        currentProductId={getCurrentProductId()}
        cartCount={visibleCartCount}
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

  if (page === 'admin-login') {
    if (adminAuth.isAdmin) {
      return <Admin adminAuth={adminAuth} onAdminLogout={handleAdminLogout} products={sharedProducts} onSetProducts={setSharedProducts} customers={sharedCustomers} onSetCustomers={setSharedCustomers} orders={sharedOrders} onSetOrders={setSharedOrders} onDeleteOrder={handleAdminDeleteOrder} promotions={sharedPromotions} onSetPromotions={setSharedPromotions} vouchers={sharedVouchers} onSetVouchers={setSharedVouchers} />;
    }

    return <AdminLogin onAdminLoginSubmit={handleAdminLoginSubmit} onGoHome={handleGoHome} />;
  }

  if (page === 'admin') {
    if (!adminAuth.isAdmin) {
      return <AdminLogin onAdminLoginSubmit={handleAdminLoginSubmit} onGoHome={handleGoHome} />;
    }

    return <Admin adminAuth={adminAuth} onAdminLogout={handleAdminLogout} products={sharedProducts} onSetProducts={setSharedProducts} customers={sharedCustomers} onSetCustomers={setSharedCustomers} orders={sharedOrders} onSetOrders={setSharedOrders} onDeleteOrder={handleAdminDeleteOrder} promotions={sharedPromotions} onSetPromotions={setSharedPromotions} vouchers={sharedVouchers} onSetVouchers={setSharedVouchers} />;
  }

  return (
    <Home
      authState={authState}
      onLogout={handleLogout}
      onGoHome={handleGoHome}
      onGoProducts={handleGoProducts}
      onGoOffers={handleGoOffers}
      onGoUsers={handleGoUsers}
      onGoOrders={handleGoOrders}
      onGoCart={handleGoCart}
      onGoLogin={handleGoLogin}
      onGoRegister={handleGoRegister}
      onAddToCart={handleAddToCart}
      cartCount={visibleCartCount}
    />
  );
}

export default App;
