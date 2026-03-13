import { useState } from 'react';
import CartIconButton from './components/CartIconButton';

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
      'Áo kiểu cổ vuông': 'https://leika.vn/wp-content/uploads/2024/04/Ao-kieu-CT-croptop-co-vuong-dinh-no-1.jpg',
      'Chân váy xếp ly': 'https://blogcdn.muaban.net/wp-content/uploads/2022/08/09210202/Cach-phoi-do-voi-chan-vay-xep-ly-dai.jpg',
      'Blazer nữ thanh lịch': 'https://lin2hand.com/wp-content/uploads/2022/01/cac-mau-ao-blazer-nu-dep-giup-nang-mac-sang-xin-35.jpeg',
      'Quần culottes nữ': 'https://cf.shopee.vn/file/54f463aebdea96ca81753a2ad8db88c1',
      'Jumpsuit nữ hiện đại': 'https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-ljmuorkhxghg55',
      'Áo cardigan mỏng': 'https://sakurafashion.vn/upload/sanpham/large/82615-ao-khoac-cardigan-mong-co-chu-v-rong-3.jpg',
      'Set bộ công sở nữ': 'https://cf.shopee.vn/file/6da6cf0fb042744ab9910240d92601ea',
      'Áo sơ mi lụa nữ': 'https://down-vn.img.susercontent.com/file/vn-11134207-23010-k88mcla5h6lv13',
      'Váy maxi dự tiệc': 'https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lvg6o0lp876s16',
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
      'Áo thun nam premium': 'https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-lk5dq8susdro6d',
      'Áo polo nam': 'https://anhsang.edu.vn/wp-content/uploads/ao-polo-nam-gia-ra-chinh-hang.jpg',
      'Áo sơ mi oxford': 'https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsfrjykb8zic88',
      'Quần jean nam slim fit': 'https://m.yodycdn.com/fit-in/filters:format(webp)/products/quan-jeans-nu-QJM7061-XDM%20(1).jpg',
      'Quần kaki nam': 'https://bizweb.dktcdn.net/100/438/408/files/quan-kaki-nam-regular-2.jpg?v=1673246517851',
      'Áo khoác bomber nam': 'https://dony.vn/wp-content/uploads/2021/09/ao-khoac-bomber-nam-dep-ban-chay-2.jpg',
      'Set thể thao nam': 'https://cdn.tgdd.vn/Files/2022/11/29/1491553/9-cach-phoi-do-the-thao-nam-tre-trung-nang-dong-cuc-chat-202211290649352405.jpg',
      'Quần short nam': 'https://cdn.santino.com.vn/storage/upload/news/2023/05/quan-short-nam-dep-05.jpg',
      'Áo len nam mỏng': 'https://pos.nvncdn.com/494dd6-88815/art/artCT/20220628_Ob8z6hMrwwvstpf3eeHVmlkP.png',
      'Vest nam trẻ trung': 'https://juanstailor.com.vn/uploaded/Tin-Tuc/vest-nam-tre-trung.png',
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
      'Áo thun bé trai': 'https://down-vn.img.susercontent.com/file/vn-11134201-7ras8-m2xiwu7hmga88f',
      'Đầm bé gái': 'https://down-vn.img.susercontent.com/file/sg-11134201-7rdvq-lzea5y6h4co8b0',
      'Set đồ đi học': 'https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lz0ncmfs7ln181',
      'Quần jogger trẻ em': 'https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m4qyrbh0gfxcd4',
      'Pijama trẻ em': 'https://img.ws.mms.shopee.vn/cn-11134216-7r98o-lry5fc0ah60d0f',
      'Áo khoác kids': 'https://cdn-v2.kidsplaza.vn/media/wysiwyg/product/thoi-trang-2022/thoi-trang-be-trai-1/ao-khoac-bong-vang-kidsplaza-su-tu-m22d-1.jpg',
      'Đầm công chúa bé gái': 'https://cdn.becungshop.vn/images/500x500/dam-cong-chua-phong-cach-co-dien-kem-ao-choang-sang-trong-cho-be-gai-p25009df6c6ca4-500x500.jpg',
      'Quần short trẻ em': 'https://m.yodycdn.com/fit-in/filters:format(webp)/products/quan-short-tre-em-qsk7014-ghi-1.jpg',
      'Áo len trẻ em': 'https://sanglaundry.com/wp-content/uploads/2022/11/23b70221aa5e6d00344f.jpg',
      'Set năng động cuối tuần': 'https://image.voh.com.vn/voh/Image/2023/12/17/tre-em.jpg',
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
      'Áo bra cotton': 'https://matkinhauviet.com/wp-content/uploads/mix-do-voi-ao-bra-day-11.jpg',
      'Quần lót su mềm': 'https://cf.shopee.vn/file/sg-11134201-22100-l1feam5geriv49',
      'Bộ đồ lót ren nhẹ': 'https://cf.shopee.vn/file/sg-11134201-22090-z1ua4evkx2hv51',
      'Áo lót thể thao': 'https://tse2.mm.bing.net/th/id/OIP.QX1PifPeJw5NpVtIcGC7nAHaKs?pid=Api&P=0&h=180',
      'Quần lót nữ seamless': 'https://product.hstatic.net/200000724511/product/upload_369e8e2051e644bfa0a2735a1777df56.jpg',
      'Áo lót không gọng': 'https://cdn.shopify.com/s/files/1/0558/7409/3107/products/T-421-P-White-10001721-00GT-PR-v1.jpg?v=1683889646',
      'Bộ mặc nhà cotton': 'https://mialala.vn/media/product/4660_dmn05083363_doc_4.jpg',
      'Đồ ngủ satin': 'https://static.sonkimfashion.vn/static/file/image/9e0686107a484639afb01ac1387311b3/hop-qua-20-10-do-ngu-tong-hop-vay-ngu-va-kimono-satin-vera-tong-hop-0464-hong-gsvr1dn1km01hq1022-p1s200.jpg',
      'Áo giữ nhiệt mỏng': 'https://pos.nvncdn.com/b97fa9-149448/ps/20241020_jy66NqP2I2.jpeg',
      'Quần gen nhẹ': 'https://dolotthai.com/wp-content/uploads/2022/01/quan-gen-dinh-hinh-0.jpg',
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

function Products({
  authState,
  onLogout,
  onGoHome,
  onGoOffers,
  onGoCart,
  onGoLogin,
  onGoRegister,
  onAddToCart,
  onGoProductDetail,
  cartCount,
}) {
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
          <CartIconButton count={cartCount} onClick={onGoCart} />
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
              <h3 className="catalog-name">
                <button
                  type="button"
                  className="catalog-name-button"
                  onClick={() =>
                    onGoProductDetail({
                      id: product.id,
                      name: product.name,
                      priceNumber: Number(product.price.replace(/\./g, '')),
                      priceText: `${product.price}đ`,
                      image: product.image,
                      size: product.size,
                      stockLabel: product.stockLabel,
                      categoryLabel: product.categoryLabel,
                      description: product.description,
                    })
                  }
                >
                  {product.name}
                </button>
              </h3>
              <p className="catalog-desc">{product.description}</p>
              <div className="catalog-price-row">
                <span className="catalog-price">{product.price}đ</span>
                <span className="catalog-size">{product.size}</span>
              </div>
              <button
                className="catalog-button"
                disabled={!authState.isLoggedIn}
                onClick={() =>
                  onAddToCart({
                    id: product.id,
                    name: product.name,
                    priceNumber: Number(product.price.replace(/\./g, '')),
                    priceText: `${product.price}đ`,
                    image: product.image,
                    size: product.size,
                    stockLabel: product.stockLabel,
                    categoryLabel: product.categoryLabel,
                    description: product.description,
                  })
                }
              >
                {authState.isLoggedIn ? 'Thêm vào giỏ' : 'Chỉ xem - cần đăng nhập'}
              </button>
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
