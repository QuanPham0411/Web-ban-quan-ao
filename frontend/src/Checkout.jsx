import { useMemo, useState } from 'react';
import * as subVn from 'sub-vn';
import CartIconButton from './components/CartIconButton';

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const parseNumberTokens = (text) => {
  const matches = String(text || '').match(/\d[\d.,]*/g) || [];
  return matches
    .map((token) => Number(String(token).replace(/[^\d]/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);
};

const parseAmount = (text) => {
  const normalized = String(text || '').toLowerCase();
  const amountWithUnit = normalized.match(/(\d[\d.,]*)\s*(đ|vnd|k)\b/i);

  if (amountWithUnit) {
    const value = Number(String(amountWithUnit[1]).replace(/[^\d]/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    if (amountWithUnit[2].toLowerCase() === 'k') {
      return value * 1000;
    }

    return value;
  }

  const numberValues = parseNumberTokens(normalized);
  if (numberValues.length === 0) {
    return 0;
  }

  return Math.max(...numberValues);
};

const parseMinOrderFromText = (text) => {
  const normalized = String(text || '').toLowerCase();
  if (!/(đơn|hóa đơn|tối thiểu|từ)/i.test(normalized)) {
    return 0;
  }

  const numberValues = parseNumberTokens(text);
  if (numberValues.length === 0) {
    return 0;
  }

  return Math.max(...numberValues);
};

const parseMinItemsFromText = (text) => {
  const matched = String(text || '').match(/(\d+)\s*(sản phẩm|sp)/i);
  return matched ? Number(matched[1]) : 0;
};

const parseDiscountAmount = (discountText, subtotal) => {
  const normalized = String(discountText || '').toLowerCase();
  const percentMatch = normalized.match(/(\d+)\s*%/);

  if (percentMatch) {
    return Math.floor((subtotal * Number(percentMatch[1])) / 100);
  }

  return parseAmount(discountText);
};

const parseExpiryDate = (value) => {
  const raw = String(value || '').trim();

  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const dmyMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmyMatch) {
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  }

  return null;
};

const isExpiredByDateValue = (value) => {
  const date = parseExpiryDate(value);

  if (!date) {
    return false;
  }

  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return Date.now() > endOfDay.getTime();
};

const getRequiredCategoryKeys = (conditionText) => {
  const text = String(conditionText || '').toLowerCase();
  const keys = [];

  if (text.includes('nữ')) keys.push('nữ');
  if (text.includes('nam')) keys.push('nam');
  if (text.includes('trẻ em')) keys.push('trẻ em');
  if (text.includes('đồ lót') || text.includes('mặc nhà')) keys.push('đồ lót & mặc nhà');

  return keys;
};

const hasRequiredCategory = (cartItems, requiredCategories) => {
  if (requiredCategories.length === 0) {
    return true;
  }

  return cartItems.some((item) => {
    const categoryLabel = String(item.categoryLabel || '').toLowerCase();
    return requiredCategories.includes(categoryLabel);
  });
};

const evaluateCondition = (conditionText, subtotal, totalItems, cartItems) => {
  const minOrder = parseMinOrderFromText(conditionText);
  const minItems = parseMinItemsFromText(conditionText);
  const requiredCategories = getRequiredCategoryKeys(conditionText);

  if (minOrder > 0 && subtotal < minOrder) {
    return { eligible: false, reason: `Cần đơn từ ${formatPrice(minOrder)}.` };
  }

  if (minItems > 0 && totalItems < minItems) {
    return { eligible: false, reason: `Cần mua từ ${minItems} sản phẩm.` };
  }

  if (!hasRequiredCategory(cartItems, requiredCategories)) {
    return { eligible: false, reason: 'Sản phẩm trong giỏ chưa đúng danh mục áp dụng.' };
  }

  return { eligible: true, reason: '' };
};

const evaluateVoucher = (voucher, subtotal, totalItems, cartItems) => {
  const condition = evaluateCondition(voucher.rule, subtotal, totalItems, cartItems);
  const discount = parseDiscountAmount(voucher.discount, subtotal);

  if (!condition.eligible || discount <= 0) {
    return {
      eligible: false,
      discount: 0,
      reason: condition.reason || 'Không đủ điều kiện để sử dụng voucher',
    };
  }

  return { eligible: true, discount, reason: '' };
};

const evaluatePromotion = (promotion, subtotal, totalItems, cartItems) => {
  const conditionText = `${promotion.title || ''} ${promotion.description || ''}`;
  const discountText = `${promotion.badge || ''} ${promotion.title || ''} ${promotion.description || ''}`;
  const condition = evaluateCondition(conditionText, subtotal, totalItems, cartItems);
  const discount = parseDiscountAmount(discountText, subtotal);

  if (!condition.eligible || discount <= 0) {
    return { eligible: false, discount: 0 };
  }

  return { eligible: true, discount };
};

const normalizePhoneInput = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value) => /^\d{10}$/.test(String(value || ''));

function Checkout({
  authState,
  cartItems,
  latestOrderId,
  onPlaceOrder,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoUsers,
  onGoOrders,
  onGoCart,
  onGoLogin,
  onGoRegister,
  cartCount,
  promotions,
  vouchers,
}) {
  const [form, setForm] = useState({
    fullName: authState.accountLabel || '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'cod',
  });
  const [addressSelection, setAddressSelection] = useState({
    provinceCode: '',
    districtCode: '',
    wardCode: '',
  });
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const [voucherMessage, setVoucherMessage] = useState('');
  const provinces = useMemo(() => {
    try {
      return subVn.getProvinces();
    } catch {
      return [];
    }
  }, []);

  const districts = useMemo(() => {
    if (!addressSelection.provinceCode) {
      return [];
    }

    try {
      return subVn.getDistrictsByProvinceCode(addressSelection.provinceCode);
    } catch {
      return [];
    }
  }, [addressSelection.provinceCode]);

  const wards = useMemo(() => {
    if (!addressSelection.districtCode) {
      return [];
    }

    try {
      return subVn.getWardsByDistrictCode(addressSelection.districtCode);
    } catch {
      return [];
    }
  }, [addressSelection.districtCode]);

  const totalPrice = cartItems.reduce((total, item) => total + item.priceNumber * item.quantity, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const activePromotions = useMemo(
    () => promotions.filter((promotion) => !isExpiredByDateValue(promotion.expiresAt || promotion.expire)),
    [promotions],
  );
  const activeVouchers = useMemo(
    () => vouchers.filter((voucher) => !isExpiredByDateValue(voucher.expiresAt || voucher.expire)),
    [vouchers],
  );

  const autoPromotion = useMemo(() => {
    const eligiblePromotions = activePromotions
      .map((promotion) => {
        const result = evaluatePromotion(promotion, totalPrice, totalItems, cartItems);
        return {
          promotion,
          eligible: result.eligible,
          discount: result.discount,
        };
      })
      .filter((item) => item.eligible && item.discount > 0)
      .sort((a, b) => b.discount - a.discount);

    return eligiblePromotions[0] || null;
  }, [activePromotions, totalPrice, totalItems, cartItems]);

  const voucherEvaluations = useMemo(
    () =>
      activeVouchers.map((voucher) => ({
        voucher,
        ...evaluateVoucher(voucher, totalPrice, totalItems, cartItems),
      })),
    [activeVouchers, totalPrice, totalItems, cartItems],
  );

  const selectedVoucher = voucherEvaluations.find(
    (item) => String(item.voucher.code || '').toUpperCase() === String(selectedVoucherCode || '').toUpperCase(),
  );
  const activeVoucher = selectedVoucher?.eligible ? selectedVoucher : null;
  const voucherDiscount = activeVoucher ? activeVoucher.discount : 0;
  const promotionDiscount = autoPromotion?.discount || 0;
  const totalDiscount = promotionDiscount + voucherDiscount;
  const finalTotal = Math.max(0, totalPrice - totalDiscount);
  const voucherStatusMessage =
    selectedVoucherCode && !activeVoucher ? 'Voucher đã chọn không còn đủ điều kiện.' : voucherMessage;
  const isVoucherSuccess = Boolean(activeVoucher && voucherStatusMessage);

  const handleSelectVoucher = (voucherCode) => {
    const normalizedCode = String(voucherCode || '').toUpperCase();
    const targetVoucher = voucherEvaluations.find(
      (item) => String(item.voucher.code || '').toUpperCase() === normalizedCode,
    );

    if (!targetVoucher || !targetVoucher.eligible) {
      return;
    }

    setSelectedVoucherCode(normalizedCode);
    setVoucherMessage(`Đã áp dụng voucher ${normalizedCode}.`);
  };

  const handleClearVoucher = () => {
    setSelectedVoucherCode('');
    setVoucherMessage('Đã bỏ voucher đang áp dụng.');
  };

  const handlePhoneChange = (value) => {
    const normalized = normalizePhoneInput(value);
    setForm((prev) => ({ ...prev, phone: normalized }));
    setPhoneError('');
  };

  const handleProvinceChange = (value) => {
    setAddressSelection({ provinceCode: value, districtCode: '', wardCode: '' });
    setAddressError('');
  };

  const handleDistrictChange = (value) => {
    setAddressSelection((prev) => ({ ...prev, districtCode: value, wardCode: '' }));
    setAddressError('');
  };

  const handleWardChange = (value) => {
    setAddressSelection((prev) => ({ ...prev, wardCode: value }));
    setAddressError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidPhone(form.phone)) {
      setPhoneError('Số điện thoại phải đủ 10 số và không chứa ký tự khác.');
      return;
    }

    if (!addressSelection.provinceCode || !addressSelection.districtCode || !addressSelection.wardCode) {
      setAddressError('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã.');
      return;
    }

    const selectedProvince = provinces.find((item) => String(item.code) === String(addressSelection.provinceCode));
    const selectedDistrict = districts.find((item) => String(item.code) === String(addressSelection.districtCode));
    const selectedWard = wards.find((item) => String(item.code) === String(addressSelection.wardCode));

    const fullAddress = [
      form.address.trim(),
      selectedWard?.name || '',
      selectedDistrict?.name || '',
      selectedProvince?.name || '',
    ]
      .filter(Boolean)
      .join(', ');

    onPlaceOrder({
      ...form,
      address: fullAddress,
      voucherCode: activeVoucher ? activeVoucher.voucher.code : '',
      promotionTitle: autoPromotion?.promotion?.title || '',
      discountAmount: totalDiscount,
      finalTotal,
    });
  };

  return (
    <div className="checkout-page">
      <header className="top-header checkout-header">
        <button type="button" className="brand-button" onClick={onGoHome}>
          <div className="brand">SunnyWear</div>
        </button>

        <nav className="catalog-nav">
          <button type="button" className="catalog-nav-button" onClick={onGoHome}>
            Trang chủ
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoProducts}>
            Sản phẩm
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoOffers}>
            Ưu Đãi
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoUsers}>
            Users
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoOrders}>
            Đơn hàng
          </button>
          <CartIconButton count={cartCount} onClick={onGoCart} isActive />
        </nav>

        <div className="auth-actions">
          {authState.isLoggedIn ? (
            <>
              <span className="auth-status">Xin chào, {authState.accountLabel}</span>
              <button className="btn-outline" onClick={onLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={onGoLogin}>
                Đăng nhập
              </button>
              <button className="btn-register" onClick={onGoRegister}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </header>

      <section className="checkout-hero">
        <span className="hero-badge">Thanh toán</span>
        <h1>Hoàn tất đơn hàng của bạn</h1>
      </section>

      {!authState.isLoggedIn ? (
        <section className="checkout-empty-state">
          <h2>Bạn chưa đăng nhập</h2>
          <p>Vui lòng đăng nhập để tiếp tục thanh toán.</p>
          <button type="button" className="btn-primary" onClick={onGoLogin}>
            Đi tới đăng nhập
          </button>
        </section>
      ) : cartItems.length === 0 ? (
        <section className="checkout-empty-state">
          {latestOrderId ? (
            <>
              <h2>Đặt hàng thành công</h2>
              <p>Mã đơn của bạn: {latestOrderId}. Shop sẽ xác nhận đơn sớm nhất.</p>
              <div className="hero-actions">
                <button type="button" className="btn-primary" onClick={onGoOrders}>
                  Theo dõi đơn hàng
                </button>
                <button type="button" className="btn-outline" onClick={onGoProducts}>
                  Tiếp tục mua sắm
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Giỏ hàng đang trống</h2>
              <p>Hãy thêm sản phẩm trước khi thanh toán.</p>
              <button type="button" className="btn-primary" onClick={onGoProducts}>
                Đi tới trang sản phẩm
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h3>Thông tin nhận hàng</h3>
            <label htmlFor="checkout-name">Họ và tên</label>
            <input
              id="checkout-name"
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />

            <label htmlFor="checkout-phone">Số điện thoại</label>
            <input
              id="checkout-phone"
              type="tel"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={form.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            {phoneError ? <p className="checkout-address-error">{phoneError}</p> : null}

            <label htmlFor="checkout-province">Tỉnh/Thành phố</label>
            <select
              id="checkout-province"
              required
              value={addressSelection.provinceCode}
              onChange={(e) => handleProvinceChange(e.target.value)}
            >
              <option value="">{provinces.length > 0 ? 'Chọn Tỉnh/Thành phố' : 'Không có dữ liệu tỉnh/thành'}</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>

            <label htmlFor="checkout-district">Quận/Huyện</label>
            <select
              id="checkout-district"
              required
              value={addressSelection.districtCode}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!addressSelection.provinceCode}
            >
              <option value="">
                {!addressSelection.provinceCode
                  ? 'Vui lòng chọn Tỉnh/Thành trước'
                  : districts.length === 0
                    ? 'Không có dữ liệu quận/huyện'
                    : 'Chọn Quận/Huyện'}
              </option>
              {districts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>

            <label htmlFor="checkout-ward">Phường/Xã</label>
            <select
              id="checkout-ward"
              required
              value={addressSelection.wardCode}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={!addressSelection.districtCode}
            >
              <option value="">
                {!addressSelection.districtCode
                  ? 'Vui lòng chọn Quận/Huyện trước'
                  : wards.length === 0
                    ? 'Không có dữ liệu phường/xã'
                    : 'Chọn Phường/Xã'}
              </option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>

            <label htmlFor="checkout-address">Địa chỉ cụ thể</label>
            <textarea
              id="checkout-address"
              rows="2"
              required
              placeholder="Số nhà, tên đường..."
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
            {addressError ? <p className="checkout-address-error">{addressError}</p> : null}

            <label htmlFor="checkout-payment">Phương thức thanh toán</label>
            <select
              id="checkout-payment"
              value={form.paymentMethod}
              onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
              <option value="bank">Chuyển khoản ngân hàng</option>
              <option value="vnpay">Thanh toán qua VNPay (QR Code)</option>
            </select>

            {form.paymentMethod === 'vnpay' && (
              <div className="vnpay-qr-container" style={{ marginTop: '20px', padding: '20px', border: '2px dashed #005baa', borderRadius: '12px', textAlign: 'center', background: '#f0f9ff' }}>
                <h4 style={{ color: '#005baa', marginBottom: '10px' }}>Quét mã VNPay để thanh toán</h4>
                <div style={{ background: '#fff', padding: '10px', display: 'inline-block', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VNPAY_PAYMENT_FOR_${totalPrice}_VND`}
                    alt="VNPay QR Code"
                    style={{ width: '200px', height: '200px' }}
                  />
                </div>
                <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#475569' }}>
                  Sử dụng ứng dụng ngân hàng hoặc ví VNPay để quét mã.<br />
                  Số tiền: <strong>{formatPrice(finalTotal)}</strong>
                </p>
                <div style={{ marginTop: '15px', padding: '10px', background: '#e0f2fe', borderRadius: '8px' }}>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#005baa', width: '100%' }}
                    onClick={() => {
                      onPlaceOrder({
                        ...form,
                        paymentMethod: 'vnpay',
                        status: 'Đã thanh toán bằng VNPay thành công',
                        address: [
                          form.address.trim(),
                          wards.find(w => w.code === addressSelection.wardCode)?.name,
                          districts.find(d => d.code === addressSelection.districtCode)?.name,
                          provinces.find(p => p.code === addressSelection.provinceCode)?.name
                        ].filter(Boolean).join(', '),
                        voucherCode: activeVoucher ? activeVoucher.voucher.code : '',
                        promotionTitle: autoPromotion?.promotion?.title || '',
                        discountAmount: totalDiscount,
                        finalTotal,
                      });
                    }}
                  >
                    Xác nhận đã quét & thanh toán thành công
                  </button>
                </div>
              </div>
            )}

            <label htmlFor="checkout-note">Ghi chú</label>
            <textarea
              id="checkout-note"
              rows="2"
              placeholder="Ví dụ: giao giờ hành chính"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            />

            <div className="checkout-promo-info">
              <label>Khuyến mãi tự động</label>
              {autoPromotion ? (
                <p className="checkout-promo-applied">
                  Áp dụng tự động: <strong>{autoPromotion.promotion.title}</strong> (-{formatPrice(autoPromotion.discount)})
                </p>
              ) : (
                <p className="checkout-promo-empty">Chưa có chương trình khuyến mãi nào đủ điều kiện.</p>
              )}
            </div>

            <div className="checkout-voucher-list-wrap">
              <label>Chọn voucher</label>
              {voucherEvaluations.length > 0 ? (
                <div className="checkout-voucher-list">
                  {voucherEvaluations.map((item) => {
                    const code = String(item.voucher.code || '').toUpperCase();
                    const isSelected = Boolean(activeVoucher && selectedVoucherCode === code);

                    return (
                      <article
                        key={item.voucher.id || code}
                        className={`checkout-voucher-card${item.eligible ? '' : ' is-disabled'}${isSelected ? ' is-selected' : ''}`}
                      >
                        <div>
                          <h4>{code}</h4>
                          <p className="checkout-voucher-discount">{item.voucher.discount}</p>
                          <p>{item.voucher.rule}</p>
                          {!item.eligible ? (
                            <p className="checkout-voucher-disabled-text">
                              Không đủ điều kiện để sử dụng voucher
                              {item.reason ? ` (${item.reason})` : ''}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="checkout-voucher-select"
                          onClick={() => handleSelectVoucher(code)}
                          disabled={!item.eligible || isSelected}
                        >
                          {isSelected ? 'Đã chọn' : 'Chọn voucher'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="checkout-promo-empty">Hiện chưa có voucher nào từ admin.</p>
              )}
              {selectedVoucherCode ? (
                <button type="button" className="checkout-voucher-clear" onClick={handleClearVoucher}>
                  Bỏ voucher đã chọn
                </button>
              ) : null}
            </div>

            {voucherStatusMessage ? (
              <p className={`checkout-voucher-message${isVoucherSuccess ? ' is-success' : ' is-error'}`}>
                {voucherStatusMessage}
              </p>
            ) : null}

            <button type="submit" className="btn-register">
              Xác nhận thanh toán
            </button>
          </form>

          <aside className="checkout-summary">
            <h3>Tóm tắt đơn hàng</h3>
            <p>
              <span>Số lượng sản phẩm</span>
              <strong>{totalItems}</strong>
            </p>
            <p>
              <span>Tạm tính</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </p>
            <p>
              <span>Giảm khuyến mãi tự động</span>
              <strong>-{formatPrice(promotionDiscount)}</strong>
            </p>
            <p>
              <span>Giảm voucher</span>
              <strong>-{formatPrice(voucherDiscount)}</strong>
            </p>
            <p className="checkout-total-row">
              <span>Tổng thanh toán</span>
              <strong>{formatPrice(finalTotal)}</strong>
            </p>

            <div className="checkout-items">
              {cartItems.map((item) => (
                <article key={item.id} className="checkout-item-row">
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatPrice(item.priceNumber * item.quantity)}</strong>
                </article>
              ))}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

export default Checkout;
