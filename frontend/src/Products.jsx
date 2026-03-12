import { useState } from 'react';

const seasonTags = ['Xuân', 'Hè', 'Thu', 'Đông', 'Premium'];
const sizeTags = ['Size S - XL', 'Size M - 2XL', 'Size Free size', 'Size 90 - 140', 'Size tiêu chuẩn'];
const stockTags = ['Còn hàng', 'Mới lên kệ', 'Bán chạy', 'Sắp cháy hàng'];

const categoryConfigs = [
  {
    key: 'women',
    label: 'Nữ',
    count: 50,
    priceStart: 245000,
    description: 'Đầm, váy, áo kiểu và set đồ nữ đang được mua nhiều.',
    items: [
      'Đầm midi hoa nhí',
      'Áo kiểu cổ vuông',
      'Chân váy xếp ly',
      'Blazer nữ thanh lịch',
      'Quần culottes nữ',
      'Jumpsuit nữ hiện đại',
      'Áo cardigan mỏng',
      'Set bộ công sở nữ',
      'Áo sơ mi lụa nữ',
      'Váy maxi dự tiệc',
    ],
    itemImages: {
      'Đầm midi hoa nhí': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
      'Áo kiểu cổ vuông': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      'Chân váy xếp ly': 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80',
      'Blazer nữ thanh lịch': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
      'Quần culottes nữ': 'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=900&q=80',
      'Jumpsuit nữ hiện đại': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      'Áo cardigan mỏng': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'Set bộ công sở nữ': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'Áo sơ mi lụa nữ': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
      'Váy maxi dự tiệc': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    },
  },
  {
    key: 'men',
    label: 'Nam',
    count: 50,
    priceStart: 219000,
    description: 'Áo sơ mi, polo, jeans, kaki và đồ nam basic dễ mặc.',
    items: [
      'Áo thun nam premium',
      'Áo polo nam',
      'Áo sơ mi oxford',
      'Quần jean nam slim fit',
      'Quần kaki nam',
      'Áo khoác bomber nam',
      'Set thể thao nam',
      'Quần short nam',
      'Áo len nam mỏng',
      'Vest nam trẻ trung',
    ],
    itemImages: {
      'Áo thun nam premium': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
      'Áo polo nam': 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
      'Áo sơ mi oxford': 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80',
      'Quần jean nam slim fit': 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
      'Quần kaki nam': 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      'Áo khoác bomber nam': 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=80',
      'Set thể thao nam': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'Quần short nam': 'https://images.unsplash.com/photo-1506629905607-0e5b1f8b3d4c?auto=format&fit=crop&w=900&q=80',
      'Áo len nam mỏng': 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80',
      'Vest nam trẻ trung': 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=900&q=80',
    },
  },
  {
    key: 'kids',
    label: 'Trẻ em',
    count: 50,
    priceStart: 149000,
    description: 'Trang phục vui tươi cho bé trai, bé gái và đồ mặc nhà.',
    items: [
      'Áo thun bé trai',
      'Đầm bé gái',
      'Set đồ đi học',
      'Quần jogger trẻ em',
      'Pijama trẻ em',
      'Áo khoác kids',
      'Đầm công chúa bé gái',
      'Quần short trẻ em',
      'Áo len trẻ em',
      'Set năng động cuối tuần',
    ],
    itemImages: {
      'Áo thun bé trai': 'https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=900&q=80',
      'Đầm bé gái': 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=900&q=80',
      'Set đồ đi học': 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=80',
      'Quần jogger trẻ em': 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',
      'Pijama trẻ em': 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=900&q=80',
      'Áo khoác kids': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'Đầm công chúa bé gái': 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=900&q=80',
      'Quần short trẻ em': 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',
      'Áo len trẻ em': 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=80',
      'Set năng động cuối tuần': 'https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=900&q=80',
    },
  },
  {
    key: 'intimates',
    label: 'Đồ lót & mặc nhà',
    count: 50,
    priceStart: 119000,
    description: 'Đồ lót, đồ mặc nhà, đồ giữ nhiệt và phụ kiện mềm mại.',
    items: [
      'Áo bra cotton',
      'Quần lót su mềm',
      'Bộ đồ lót ren nhẹ',
      'Áo lót thể thao',
      'Quần lót nữ seamless',
      'Áo lót không gọng',
      'Bộ mặc nhà cotton',
      'Đồ ngủ satin',
      'Áo giữ nhiệt mỏng',
      'Quần gen nhẹ',
    ],
    itemImages: {
      'Áo bra cotton': 'https://images.unsplash.com/photo-1618677603286-0ec56cb6e1b5?auto=format&fit=crop&w=900&q=80',
      'Quần lót su mềm': 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80',
      'Bộ đồ lót ren nhẹ': 'https://images.unsplash.com/photo-1603251579431-8041402bdeda?auto=format&fit=crop&w=900&q=80',
      'Áo lót thể thao': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'Quần lót nữ seamless': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',
      'Áo lót không gọng': 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80',
      'Bộ mặc nhà cotton': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      'Đồ ngủ satin': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'Áo giữ nhiệt mỏng': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
      'Quần gen nhẹ': 'https://images.unsplash.com/photo-1618677603286-0ec56cb6e1b5?auto=format&fit=crop&w=900&q=80',
    },
  },
];

const catalogProducts = categoryConfigs.flatMap((category, categoryIndex) =>
  Array.from({ length: category.count }, (_, index) => {
    const itemName = category.items[index % category.items.length];
    const seasonTag = seasonTags[Math.floor(index / category.items.length)];
    const price = category.priceStart + index * 12000 + categoryIndex * 9000;

    return {
      id: `${category.key}-${index + 1}`,
      categoryKey: category.key,
      categoryLabel: category.label,
      name: `${itemName} ${seasonTag}`,
      price: price.toLocaleString('vi-VN'),
      description: `${category.description} Form dễ mặc, chất liệu êm và phù hợp dùng hằng ngày.`,
      image: category.itemImages[itemName],
      size: sizeTags[index % sizeTags.length],
      stockLabel: stockTags[(index + categoryIndex) % stockTags.length],
    };
  }),
);

function Products({ authState, onLogout, onGoHome, onGoOffers, onGoLogin, onGoRegister }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categoryFilterMap = {
    all: ['women', 'men', 'kids', 'intimates'],
    women: ['women', 'intimates'],
    men: ['men'],
    kids: ['kids'],
    intimates: ['intimates'],
  };

  const handleScrollProducts = () => {
    document.getElementById('catalog-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredProducts = catalogProducts.filter((product) =>
    categoryFilterMap[activeCategory]?.includes(product.categoryKey),
  );

  return (
    <div className="catalog-page">
      <header className="top-header catalog-header">
        <button type="button" className="brand-button" onClick={onGoHome}>
          <div className="brand">SunnyWear</div>
        </button>
        <nav className="catalog-nav">
          <button type="button" className="catalog-nav-button" onClick={onGoHome}>
            Trang chủ
          </button>
          <button
            type="button"
            className="catalog-nav-button is-active"
            onClick={handleScrollProducts}
          >
            Sản phẩm
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoOffers}>
            Ưu Đãi
          </button>
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

      <section className="catalog-hero">
        <div>
          <span className="hero-badge">Danh mục đầy đủ của shop</span>
          <h1>Trang Sản Phẩm SunnyWear</h1>
          <p>
            Tổng hợp khoảng 200 mặt hàng cho phụ nữ, đàn ông, trẻ em và đồ lót/mặc nhà.
            Bạn có thể lọc nhanh theo từng nhóm để xem đầy đủ món shop đang bán.
          </p>
        </div>
        <div className="catalog-hero-stats">
          <div className="catalog-stat-card">
            <strong>200+</strong>
            <span>Sản phẩm</span>
          </div>
          <div className="catalog-stat-card">
            <strong>4</strong>
            <span>Nhóm hàng chính</span>
          </div>
          <div className="catalog-stat-card">
            <strong>New</strong>
            <span>Cập nhật theo mùa</span>
          </div>
        </div>
      </section>

      <section className="catalog-summary">
        {categoryConfigs.map((category) => (
          <article key={category.key} className="catalog-summary-card">
            <h3>{category.label}</h3>
            <p>{category.description}</p>
            <span>{category.count} sản phẩm</span>
          </article>
        ))}
      </section>

      <section className="catalog-toolbar">
        <div className="catalog-filter-group">
          <button
            type="button"
            className={`catalog-filter ${activeCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Tất cả
          </button>
          {categoryConfigs.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`catalog-filter ${activeCategory === category.key ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <p className="catalog-result">Hiển thị {filteredProducts.length} / {catalogProducts.length} sản phẩm</p>
      </section>

      <section id="catalog-products" className="catalog-grid">
        {filteredProducts.map((product) => (
          <article key={product.id} className="catalog-card">
            <div className="catalog-image-wrap">
              <img className="catalog-image" src={product.image} alt={product.name} loading="lazy" />
            </div>
            <div className="catalog-card-content">
              <div className="catalog-card-top">
                <span className="catalog-category">{product.categoryLabel}</span>
                <span className="catalog-stock">{product.stockLabel}</span>
              </div>
              <h3 className="catalog-name">{product.name}</h3>
              <p className="catalog-desc">{product.description}</p>
              <div className="catalog-price-row">
                <span className="catalog-price">{product.price}đ</span>
                <span className="catalog-size">{product.size}</span>
              </div>
              <button className="catalog-button">Thêm vào giỏ</button>
            </div>
          </article>
        ))}
      </section>

      <footer className="site-footer">
        <div className="footer-branding">
          <h3>SunnyWear Shop</h3>
          <p>Thời trang trẻ trung, hiện đại và nhiều ưu đãi cho mọi khách hàng.</p>
        </div>
        <div className="footer-contact">
          <p>
            <strong>Địa chỉ:</strong> 123 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh
          </p>
          <p>
            <strong>Số điện thoại:</strong> 0909 123 456
          </p>
          <p>
            <strong>Email:</strong> support@sunnywear.vn
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Products;
