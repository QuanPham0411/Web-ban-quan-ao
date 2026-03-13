import { useEffect, useState } from 'react';

const USERS_API_URL = 'http://localhost:3000/users';

function Users({
  authState,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoUsers,
  onGoLogin,
  onGoRegister,
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(USERS_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setError(`Không thể tải dữ liệu users (${err.message}).`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="users-page">
      <div className="users-shell">
        <header className="top-header users-header">
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
            <button type="button" className="catalog-nav-button is-active" onClick={onGoUsers}>
              Users
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

        <section className="users-hero">
          <span className="hero-badge">User list cho bài test CRUD</span>
          <h1>Danh sách Users</h1>
          <p>
            Trang này hiển thị dữ liệu từ backend theo yêu cầu BASE_FE/users. Dữ liệu được lấy trực tiếp từ API users
            và cập nhật theo nút tải lại.
          </p>
          <div className="users-actions">
            <button type="button" className="users-reload-btn" onClick={fetchUsers} disabled={isLoading}>
              {isLoading ? 'Đang tải danh sách' : 'Tải lại danh sách'}
            </button>
            <span className="users-api-chip">Nguồn API: {USERS_API_URL}</span>
          </div>
        </section>

        <section className="users-table-section">
          <h2>Tổng số users: {users.length}</h2>
          {error ? <p className="users-error">{error}</p> : null}

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={String(user.id)}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="users-empty">
                      Chưa có dữ liệu users.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Users;
