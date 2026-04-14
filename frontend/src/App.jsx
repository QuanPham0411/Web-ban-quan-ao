import { Suspense, lazy, useEffect, useState } from 'react';
import { catalogProducts } from './catalog';
import './styles/App.css';

const Home = lazy(() => import('./Home'));
const Products = lazy(() => import('./Products'));
const Offers = lazy(() => import('./Offers'));
const Users = lazy(() => import('./Users'));
const Orders = lazy(() => import('./Orders'));
const Checkout = lazy(() => import('./Checkout'));
const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));
const Cart = lazy(() => import('./Cart'));
const ProductDetail = lazy(() => import('./ProductDetail'));
const Admin = lazy(() => import('./Admin'));
const AdminLogin = lazy(() => import('./AdminLogin'));

const PRODUCTION_API_BASE_URL = 'https://api-ban-quan-ao-backend.onrender.com';

const resolveApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  return PRODUCTION_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();
const PRODUCTS_API_URL = `${API_BASE_URL}/api/products`;
const CART_API_URL = `${API_BASE_URL}/api/cart`;
const ORDERS_API_URL = `${API_BASE_URL}/api/orders`;
const OFFERS_API_URL = `${API_BASE_URL}/api/offers`;
const VOUCHERS_API_URL = `${API_BASE_URL}/api/offers/vouchers`;

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

const normalizeSearchValue = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const catalogImageLookup = new Map();
catalogProducts.forEach((product) => {
  const image = String(product?.image || '').trim();
  if (!image) {
    return;
  }

  catalogImageLookup.set(String(product.id || '').trim(), image);
  catalogImageLookup.set(normalizeSearchValue(product.name), image);
});

const parseApiResponse = async (response) => {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

const getCustomerToken = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');
    return parsed?.token ? String(parsed.token) : '';
  } catch {
    return '';
  }
};

const getAdminToken = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) || '{}');
    return parsed?.token ? String(parsed.token) : '';
  } catch {
    return '';
  }
};

const mapAuthErrorMessage = (response, payload, fallback) => {
  const raw = String(payload?.message || '').trim();
  if (raw) {
    if (/not_found|the page could not be found|cannot\s+(post|get)/i.test(raw)) {
      return 'Không tìm thấy API backend. Vui lòng kiểm tra URL backend hoặc biến VITE_API_BASE_URL.';
    }
    return raw;
  }

  if (response.status === 409) {
    return 'Tài khoản này đã được đăng ký rồi.';
  }
  if (response.status === 401) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  if (response.status === 403) {
    return 'Tài khoản của bạn đã bị khóa hoặc không có quyền truy cập.';
  }
  if (response.status >= 500) {
    return 'Máy chủ đang bận. Vui lòng thử lại sau.';
  }

  return fallback;
};

const defaultQuantity = (stock) => {
  if (stock === 'Sắp cháy hàng') return 3;
  if (stock === 'Sắp hết hàng') return 8;
  if (stock === 'Bán chạy') return 120;
  if (stock === 'Mới lên kệ') return 40;
  return 60;
};

const initialProducts = catalogProducts.map((p) => {
  const priceNumber = Number(String(p.price || '0').replace(/\./g, ''));
  return {
    ...p,
    priceNumber,
    priceText: `${p.price}đ`,
    quantity: defaultQuantity(p.stockLabel),
  };
});

const mapProductFromApi = (product) => {
  const priceNumber = Number(product?.price || 0);
  const stockLabel = String(product?.stock_label || 'Còn hàng').trim() || 'Còn hàng';
  const apiImage = String(product?.image_url || product?.image || product?.imageUrl || '').trim();
  const catalogImage = catalogImageLookup.get(String(product?.id || '').trim()) || catalogImageLookup.get(normalizeSearchValue(product?.name));
  const image = apiImage || catalogImage || '';

  return {
    id: String(product?.id || ''),
    categoryKey: String(product?.category_key || 'women'),
    categoryLabel: String(product?.category_label || 'Nữ'),
    name: String(product?.name || ''),
    price: String(product?.price_formatted || `${priceNumber.toLocaleString('vi-VN')}đ`),
    priceNumber,
    priceText: String(product?.price_formatted || `${priceNumber.toLocaleString('vi-VN')}đ`),
    description: String(product?.description || ''),
    image,
    size: String(product?.size_label || ''),
    stockLabel,
    quantity: Number(product?.quantity ?? defaultQuantity(stockLabel)),
  };
};

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

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDate(new Date());
  }
  return formatDate(date);
};

const mapOrderFromApi = (order, fallbackCustomerEmail = '') => {
  const items = Array.isArray(order?.items)
    ? order.items.map((item) => ({
        id: String(item?.productId || item?.product_id || ''),
        name: String(item?.productName || item?.product_name || ''),
        quantity: Number(item?.quantity || 0),
        priceNumber: Number(item?.unitPrice || item?.unit_price || 0),
        priceText: `${Number(item?.unitPrice || item?.unit_price || 0).toLocaleString('vi-VN')}đ`,
      }))
    : [];

  const displayId = String(order?.orderCode || order?.order_code || `ORD-${order?.id || ''}`);
  const createdAtSource = order?.placedAt || order?.placed_at || order?.updatedAt || order?.updated_at || Date.now();
  const totalAmount = Number(order?.totalAmount || order?.total_amount || 0);

  return {
    id: displayId,
    backendId: Number(order?.id || 0),
    customer: String(order?.customerName || order?.customer_name || ''),
    customerEmail: String(fallbackCustomerEmail || ''),
    fullName: String(order?.customerName || order?.customer_name || ''),
    phone: String(order?.customerPhone || order?.customer_phone || ''),
    address: String(order?.customerAddress || order?.customer_address || ''),
    paymentMethod: String(order?.paymentMethod || order?.payment_method || 'cod'),
    note: String(order?.note || ''),
    items,
    product:
      items.length === 0
        ? 'Không có sản phẩm'
        : items.length === 1
        ? items[0].name
        : `${items[0].name} (+${items.length - 1} sản phẩm)`,
    amount: `${totalAmount.toLocaleString('vi-VN')}đ`,
    status: String(order?.status || 'Chờ xác nhận'),
    date: formatDateTime(createdAtSource),
    voucherCode: String(order?.voucherCode || order?.voucher_code || ''),
    promotionTitle: String(order?.promotionTitle || order?.promotion_title || ''),
    createdAt: new Date(createdAtSource).getTime() || Date.now(),
  };
};

const mapPromotionFromApi = (offer) => ({
  id: offer.id,
  badge: offer.badge || '',
  title: offer.title || '',
  expiresAt: offer.expiryDate || '',
  expire: offer.expiryDate || '',
  description: offer.description || '',
  discountType: offer.discountType || 'percent',
  discountValue: Number(offer.discountValue || 0),
  minOrder: Number(offer.minOrder || 0),
});

const mapVoucherFromApi = (voucher) => {
  const discountType = String(voucher.discountType || 'percent');
  const discountValue = Number(voucher.discountValue || 0);
  const minOrder = Number(voucher.minOrder || 0);

  return {
    id: voucher.id,
    code: voucher.code || '',
    discount: discountType === 'percent' ? `Giảm ${discountValue}%` : `Giảm ${discountValue.toLocaleString('vi-VN')}đ`,
    rule: minOrder > 0 ? `Đơn từ ${minOrder.toLocaleString('vi-VN')}đ` : 'Không yêu cầu giá trị đơn tối thiểu',
    expiresAt: voucher.expiryDate || '',
    expire: voucher.expiryDate || '',
  };
};

const getCurrentPage = () => {
  if (window.location.hash.startsWith('#products/')) {
    return 'product-detail';
  }

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

  if (!hashValue.startsWith('#products/')) {
    return null;
  }

  return hashValue.slice('#products/'.length) || null;
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
      const savedFullName = String(parsedAuth.fullName || '').trim();
      const savedLabel = String(parsedAuth.label || '').trim();
      return {
        isLoggedIn: true,
        accountLabel: savedFullName || savedLabel || 'Khách hàng',
        email: parsedAuth.email || '',
      };
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return { isLoggedIn: false, accountLabel: 'Khách hàng', email: '' };
};

const withSuspense = (content) => (
  <Suspense fallback={<div className="auth-page"><div className="auth-card-wrap"><div className="auth-card"><p>Dang tai du lieu...</p></div></div></div>}>
    {content}
  </Suspense>
);

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
    let cancelled = false;

    const loadProductsFromApi = async () => {
      try {
        const response = await fetch(`${PRODUCTS_API_URL}?page=1&limit=100`);
        if (!response.ok) {
          return;
        }

        const data = await parseApiResponse(response);
        const total = Number(data.total || 0);
        const firstPage = Array.isArray(data.products) ? data.products.map(mapProductFromApi) : [];
        const totalPages = Math.max(1, Math.ceil(total / 100));
        const productPages = [...firstPage];

        for (let page = 2; page <= totalPages; page += 1) {
          const pageResponse = await fetch(`${PRODUCTS_API_URL}?page=${page}&limit=100`);
          if (!pageResponse.ok) {
            break;
          }

          const pageData = await parseApiResponse(pageResponse);
          const pageProducts = Array.isArray(pageData.products) ? pageData.products.map(mapProductFromApi) : [];
          productPages.push(...pageProducts);
        }

        if (!cancelled && productPages.length > 0) {
          setSharedProducts(productPages);
        }
      } catch {
        // Keep catalog fallback when API is unavailable.
      }
    };

    loadProductsFromApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOffersAndVouchers = async () => {
      try {
        const [offersResponse, vouchersResponse] = await Promise.all([
          fetch(`${OFFERS_API_URL}?page=1&limit=200`),
          fetch(`${VOUCHERS_API_URL}?page=1&limit=200`),
        ]);

        const offersData = await parseApiResponse(offersResponse);
        const vouchersData = await parseApiResponse(vouchersResponse);

        if (!cancelled && offersResponse.ok) {
          const rows = Array.isArray(offersData?.offers) ? offersData.offers : [];
          setSharedPromotions(rows.map(mapPromotionFromApi));
        }

        if (!cancelled && vouchersResponse.ok) {
          const rows = Array.isArray(vouchersData?.vouchers) ? vouchersData.vouchers : [];
          setSharedVouchers(rows.map(mapVoucherFromApi));
        }
      } catch {
        // Keep local fallback when API is unavailable.
      }
    };

    loadOffersAndVouchers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCustomerOrders = async () => {
      if (!authState.isLoggedIn) {
        return;
      }

      const token = getCustomerToken();
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${ORDERS_API_URL}/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await parseApiResponse(response);
        if (!response.ok) {
          return;
        }

        const mappedOrders = Array.isArray(data.orders)
          ? data.orders.map((order) => mapOrderFromApi(order, authState.email))
          : [];

        if (!cancelled) {
          setSharedOrders(mappedOrders);
        }
      } catch {
        // Keep existing local data if backend temporarily unavailable.
      }
    };

    loadCustomerOrders();

    return () => {
      cancelled = true;
    };
  }, [authState.isLoggedIn, authState.email]);

  useEffect(() => {
    let cancelled = false;

    const loadAdminOrders = async () => {
      if (!adminAuth.isAdmin) {
        return;
      }

      const token = getAdminToken();
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${ORDERS_API_URL}?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await parseApiResponse(response);
        if (!response.ok) {
          return;
        }

        const mappedOrders = Array.isArray(data.orders)
          ? data.orders.map((order) => mapOrderFromApi(order))
          : [];

        if (!cancelled) {
          setSharedOrders(mappedOrders);
        }
      } catch {
        // Keep existing local data if backend temporarily unavailable.
      }
    };

    loadAdminOrders();

    return () => {
      cancelled = true;
    };
  }, [adminAuth.isAdmin]);

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

  const handleLoginSubmit = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
      setLoginError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    try {
      setLoginError('');
      // Gọi API backend để verify email/password từ database
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        setLoginError(mapAuthErrorMessage(response, data, 'Đăng nhập thất bại'));
        return;
      }

      const userRole = data.user?.role || 'customer';

      // Nếu user có role admin hoặc staff, redirect tới admin page
      if (userRole === 'admin' || userRole === 'staff') {
        const adminData = {
          email: normalizedEmail,
          token: data.token,
          role: userRole,
          fullName: data.user?.fullName || '',
          loggedInAt: Date.now(),
        };
        localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(adminData));
        setAdminAuth({ isAdmin: true, email: normalizedEmail });
        window.location.hash = '#admin';
        return;
      }

      // Nếu customer, login như bình thường
      const fullName = String(data.user?.fullName || '').trim();
      const authData = {
        label: fullName || normalizedEmail.split('@')[0] || 'Khách hàng',
        fullName,
        mode: 'login',
        email: normalizedEmail,
        token: data.token,
        role: userRole,
        loggedInAt: Date.now(),
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setAuthState({ isLoggedIn: true, accountLabel: authData.label, email: normalizedEmail });
      setLoginError('');
      handleGoHome();
    } catch (err) {
      setLoginError(`Lỗi kết nối: ${err.message}`);
    }
  };

  const handleRegisterSubmit = async ({ fullName, email, phone, password }) => {
    if (!fullName || !email || !password) {
      setLoginError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    try {
      setLoginError('');
      // Gọi API backend để register user
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: phone || null,
          password,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        setLoginError(mapAuthErrorMessage(response, data, 'Đăng ký thất bại'));
        return;
      }

      // Đăng ký thành công nhưng yêu cầu người dùng đăng nhập lại
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthState({ isLoggedIn: false, accountLabel: 'Khách hàng', email: '' });
      window.alert('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
      window.location.hash = '#login';
    } catch (err) {
      setLoginError(`Lỗi kết nối: ${err.message}`);
    }
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

  const syncCartToBackend = async (token) => {
    await fetch(CART_API_URL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    for (const item of cartItems) {
      const response = await fetch(CART_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.id,
          productName: item.name,
          priceFormatted: item.priceText || `${Number(item.priceNumber || 0).toLocaleString('vi-VN')}đ`,
          imageUrl: item.image || '',
          quantity: Number(item.quantity || 1),
        }),
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || `Không thể đồng bộ giỏ hàng (HTTP ${response.status}).`);
      }
    }
  };

  const handlePlaceOrder = async (checkoutData) => {
    if (!authState.isLoggedIn || cartItems.length === 0) {
      return;
    }

    const token = getCustomerToken();
    if (!token) {
      window.alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      await syncCartToBackend(token);

      const response = await fetch(ORDERS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: checkoutData?.fullName || authState.accountLabel,
          phone: checkoutData?.phone || '',
          address: checkoutData?.address || '',
          paymentMethod: checkoutData?.paymentMethod || 'cod',
          note: checkoutData?.note || '',
          voucherCode: checkoutData?.voucherCode || '',
          promotionTitle: checkoutData?.promotionTitle || '',
          discountAmount: Number(checkoutData?.discountAmount || 0),
        }),
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      const createdOrder = mapOrderFromApi(data.order, authState.email);
      setSharedOrders((prev) => [createdOrder, ...prev]);
      setLatestOrderId(createdOrder.id);
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
    } catch (err) {
      window.alert(`Không thể đặt hàng: ${err.message}`);
    }
  };

  const handleCustomerCancelOrder = async (orderId) => {
    const token = getCustomerToken();
    if (!token) {
      window.alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const targetOrder = sharedOrders.find((order) => order.id === orderId);
    const backendOrderId = Number(targetOrder?.backendId || 0);
    if (!backendOrderId) {
      return;
    }

    try {
      const response = await fetch(`${ORDERS_API_URL}/${backendOrderId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

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
    } catch (err) {
      window.alert(`Không thể hủy đơn: ${err.message}`);
    }
  };

  const handleAdminDeleteOrder = async (orderId) => {
    const token = getAdminToken();
    const backendOrderId = Number(orderId || 0);

    if (!token || !backendOrderId) {
      return;
    }

    try {
      const response = await fetch(`${ORDERS_API_URL}/${backendOrderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setSharedOrders((previous) => previous.filter((order) => Number(order.backendId || 0) !== backendOrderId));
    } catch (err) {
      window.alert(`Không thể xóa đơn hàng: ${err.message}`);
    }
  };

  const handleAdminUpdateOrderStatus = async (orderId, nextStatus) => {
    const token = getAdminToken();
    const backendOrderId = Number(orderId || 0);
    if (!token || !backendOrderId) {
      return;
    }

    try {
      const response = await fetch(`${ORDERS_API_URL}/${backendOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setSharedOrders((previous) =>
        previous.map((order) =>
          Number(order.backendId || 0) === backendOrderId
            ? {
                ...order,
                status: nextStatus,
              }
            : order,
        ),
      );
    } catch (err) {
      window.alert(`Không thể cập nhật trạng thái đơn: ${err.message}`);
    }
  };

  const handleAdminLoginSubmit = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
      console.error('Email và mật khẩu không được để trống');
      return false;
    }

    try {
      // Gọi API backend để verify email/password từ database
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        console.error('Đăng nhập thất bại:', mapAuthErrorMessage(response, data, 'Đăng nhập thất bại'));
        return false;
      }

      // Kiểm tra xem user có phải admin không
      const userRole = data.user?.role || 'customer';
      if (userRole !== 'admin' && userRole !== 'staff') {
        console.error('Chỉ admin hoặc staff mới được truy cập.');
        return false;
      }

      // Lưu JWT token và admin info
      const adminData = {
        email: normalizedEmail,
        token: data.token,
        role: userRole,
        fullName: data.user?.fullName || '',
        loggedInAt: Date.now(),
      };
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(adminData));
      setAdminAuth({ isAdmin: true, email: normalizedEmail });
      window.location.hash = '#admin';
      return true;
    } catch (err) {
      console.error('Lỗi đăng nhập admin:', err.message);
      return false;
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setAdminAuth({ isAdmin: false, email: '' });
    window.location.hash = '#admin-login';
  };

  const handleGoProductDetail = (product) => {
    setSelectedProduct(product);
    localStorage.setItem(PRODUCT_DETAIL_STORAGE_KEY, JSON.stringify(product));
    window.location.hash = `#products/${product.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product) => {
    if (!authState.isLoggedIn) {
      return;
    }

    const addAmount = Number(product.customQuantity || 1);

    setCartItems((previous) => {
      const existingItem = previous.find((item) => item.id === product.id);

      if (existingItem) {
        return previous.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + addAmount,
              }
            : item,
        );
      }

      return [
        ...previous,
        {
          ...product,
          quantity: addAmount,
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
    return withSuspense(
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
    return withSuspense(
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
    return withSuspense(
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
    return withSuspense(
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
        errorMessage={loginError}
      />
    );
  }

  if (page === 'forgot-password') {
    return withSuspense(
      <ForgotPassword
        onGoHome={handleGoHome}
        onGoProducts={handleGoProducts}
        onGoOffers={handleGoOffers}
        onGoUsers={handleGoUsers}
        onGoCart={handleGoCart}
        onGoLogin={handleGoLogin}
        cartCount={visibleCartCount}
      />
    );
  }

  if (page === 'users') {
    return withSuspense(
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
    return withSuspense(
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
    return withSuspense(
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
    return withSuspense(
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
    return withSuspense(
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
        onGoCheckout={handleGoCheckout}
        onGoProductDetail={handleGoProductDetail}
        onGoLogin={handleGoLogin}
        onGoRegister={handleGoRegister}
        products={sharedProducts}
      />
    );
  }

  if (page === 'admin-login') {
    if (adminAuth.isAdmin) {
      return withSuspense(<Admin adminAuth={adminAuth} onAdminLogout={handleAdminLogout} products={sharedProducts} onSetProducts={setSharedProducts} customers={sharedCustomers} onSetCustomers={setSharedCustomers} orders={sharedOrders} onSetOrders={setSharedOrders} onDeleteOrder={handleAdminDeleteOrder} onUpdateOrderStatus={handleAdminUpdateOrderStatus} promotions={sharedPromotions} onSetPromotions={setSharedPromotions} vouchers={sharedVouchers} onSetVouchers={setSharedVouchers} />);
    }

    return withSuspense(<AdminLogin onAdminLoginSubmit={handleAdminLoginSubmit} onGoHome={handleGoHome} />);
  }

  if (page === 'admin') {
    if (!adminAuth.isAdmin) {
      return withSuspense(<AdminLogin onAdminLoginSubmit={handleAdminLoginSubmit} onGoHome={handleGoHome} />);
    }

    return withSuspense(<Admin adminAuth={adminAuth} onAdminLogout={handleAdminLogout} products={sharedProducts} onSetProducts={setSharedProducts} customers={sharedCustomers} onSetCustomers={setSharedCustomers} orders={sharedOrders} onSetOrders={setSharedOrders} onDeleteOrder={handleAdminDeleteOrder} onUpdateOrderStatus={handleAdminUpdateOrderStatus} promotions={sharedPromotions} onSetPromotions={setSharedPromotions} vouchers={sharedVouchers} onSetVouchers={setSharedVouchers} />);
  }

  return withSuspense(
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
      products={sharedProducts}
      onGoProductDetail={handleGoProductDetail}
    />
  );
}

export default App;
