import { useMemo, useState } from 'react';

const STOCK_RANK = {
  'Sắp cháy hàng': 0,
  'Sắp hết hàng': 1,
  'Còn hàng': 2,
  'Mới lên kệ': 3,
  'Bán chạy': 4,
};

const STOCK_CHART_COLORS = {
  'Sắp cháy hàng': '#ef4444',
  'Sắp hết hàng': '#f97316',
  'Còn hàng': '#22c55e',
  'Mới lên kệ': '#0ea5e9',
  'Bán chạy': '#6366f1',
};

const getStockClass = (stock) =>
  stock === 'Bán chạy'
    ? 'admin-status-shipping'
    : stock === 'Sắp hết hàng' || stock === 'Sắp cháy hàng'
    ? 'admin-status-pending'
    : 'admin-status-done';

function AdminInventory({ products }) {
  const [viewMode, setViewMode] = useState('list');
  const [statusQuery, setStatusQuery] = useState('');
  const [selectedChartStatus, setSelectedChartStatus] = useState('');

  const summary = useMemo(() => {
    const totalQuantity = products.reduce((total, product) => total + Number(product.quantity || 0), 0);
    const lowStockCount = products.filter((product) => Number(product.quantity || 0) <= 8).length;
    const outOfStockCount = products.filter((product) => Number(product.quantity || 0) <= 0).length;

    return { totalQuantity, lowStockCount, outOfStockCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = String(statusQuery || '').trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      String(product.stockLabel || '').toLowerCase().includes(normalizedQuery),
    );
  }, [products, statusQuery]);

  const sortedProducts = useMemo(
    () =>
      [...filteredProducts].sort((a, b) => {
        const rankA = STOCK_RANK[a.stockLabel] ?? 99;
        const rankB = STOCK_RANK[b.stockLabel] ?? 99;

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        return Number(a.quantity || 0) - Number(b.quantity || 0);
      }),
    [filteredProducts],
  );

  const chartSelectedProducts = useMemo(() => {
    if (!selectedChartStatus) {
      return [];
    }

    return sortedProducts.filter((product) => String(product.stockLabel || '') === selectedChartStatus);
  }, [sortedProducts, selectedChartStatus]);

  const chartSeries = useMemo(() => {
    const quantityByStatus = filteredProducts.reduce((accumulator, product) => {
      const status = String(product.stockLabel || 'Còn hàng');
      const quantity = Math.max(0, Number(product.quantity || 0));
      accumulator[status] = (accumulator[status] || 0) + quantity;
      return accumulator;
    }, {});

    return Object.entries(quantityByStatus)
      .map(([status, quantity]) => ({
        status,
        quantity,
        color: STOCK_CHART_COLORS[status] || '#94a3b8',
      }))
      .sort((a, b) => (STOCK_RANK[a.status] ?? 99) - (STOCK_RANK[b.status] ?? 99));
  }, [filteredProducts]);

  const chartTotal = useMemo(
    () => chartSeries.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [chartSeries],
  );

  const pieBackground = useMemo(() => {
    if (chartTotal <= 0 || chartSeries.length === 0) {
      return 'conic-gradient(#e2e8f0 0deg 360deg)';
    }

    let currentDeg = 0;
    const segments = chartSeries.map((item) => {
      const ratio = Number(item.quantity || 0) / chartTotal;
      const segmentDeg = ratio * 360;
      const startDeg = currentDeg;
      const endDeg = currentDeg + segmentDeg;
      currentDeg = endDeg;
      return `${item.color} ${startDeg}deg ${endDeg}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }, [chartSeries, chartTotal]);

  return (
    <div>
      <div className="admin-tab-topbar">
        <div className="admin-tab-topbar-row admin-inventory-topbar-row">
          <span className="admin-count-badge">{products.length} mã sản phẩm</span>
          <div className="admin-inventory-view-switch" role="tablist" aria-label="Chọn chế độ xem tồn kho">
            <button
              type="button"
              className={`admin-inventory-view-btn${viewMode === 'list' ? ' is-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Xem danh sách
            </button>
            <button
              type="button"
              className={`admin-inventory-view-btn${viewMode === 'chart' ? ' is-active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              Biểu đồ tròn
            </button>
          </div>
          <span className="admin-count-badge">Tổng tồn: {summary.totalQuantity}</span>
        </div>

        <div className="admin-search-wrap">
          <span className="admin-search-icon">&#128269;</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tình trạng (VD: Còn hàng, Sắp hết hàng...)"
            value={statusQuery}
            onChange={(e) => setStatusQuery(e.target.value)}
          />
          {statusQuery ? (
            <button type="button" className="admin-search-clear" onClick={() => setStatusQuery('')}>
              &#10005;
            </button>
          ) : null}
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="admin-table-wrap" style={{ marginTop: '16px' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Tình trạng</th>
                  <th>Số lượng tồn</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="admin-td-id">{product.id}</td>
                    <td>{product.name}</td>
                    <td>
                      <span className="admin-category-badge">{product.categoryLabel}</span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${getStockClass(product.stockLabel)}`}>{product.stockLabel}</span>
                    </td>
                    <td className="admin-td-amount">{Number(product.quantity || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="admin-table-note">
            {statusQuery.trim()
              ? `Tìm thấy ${sortedProducts.length} / ${products.length} sản phẩm theo tình trạng.`
              : 'Danh sách tồn kho được sắp theo mức độ ưu tiên kiểm tra từ thấp lên cao.'}
          </p>
        </>
      ) : (
        <>
          <div className="admin-inventory-chart-wrap">
            <div className="admin-inventory-pie" style={{ backgroundImage: pieBackground }}>
              <div className="admin-inventory-pie-center">
                <strong>{chartTotal}</strong>
                <span>Tổng tồn</span>
              </div>
            </div>

            <div className="admin-inventory-legend">
              {chartSeries.map((item) => {
                const percent = chartTotal > 0 ? Math.round((item.quantity / chartTotal) * 100) : 0;
                const isActive = selectedChartStatus === item.status;

                return (
                  <button
                    key={item.status}
                    type="button"
                    className={`admin-inventory-legend-item${isActive ? ' is-active' : ''}`}
                    onClick={() => setSelectedChartStatus((prev) => (prev === item.status ? '' : item.status))}
                  >
                    <span className="admin-inventory-dot" style={{ backgroundColor: item.color }} />
                    <span className="admin-inventory-status">{item.status}</span>
                    <span className="admin-inventory-qty">{item.quantity}</span>
                    <span className="admin-inventory-percent">{percent}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="admin-table-wrap" style={{ marginTop: '14px' }}>
            {selectedChartStatus ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã SP</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Tình trạng</th>
                    <th>Số lượng tồn</th>
                  </tr>
                </thead>
                <tbody>
                  {chartSelectedProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="admin-td-id">{product.id}</td>
                      <td>{product.name}</td>
                      <td>
                        <span className="admin-category-badge">{product.categoryLabel}</span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${getStockClass(product.stockLabel)}`}>{product.stockLabel}</span>
                      </td>
                      <td className="admin-td-amount">{Number(product.quantity || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-inventory-empty-select">
                Bấm vào màu/trạng thái trong biểu đồ để xem danh sách sản phẩm tương ứng ngay bên dưới.
              </div>
            )}
          </div>

          {selectedChartStatus ? (
            <p className="admin-table-note">
              Đang hiển thị {chartSelectedProducts.length} sản phẩm thuộc tình trạng "{selectedChartStatus}".
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default AdminInventory;
