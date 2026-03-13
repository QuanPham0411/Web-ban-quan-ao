import { useEffect, useState } from 'react';

const USERS_API_URL = 'http://localhost:3000/api/users';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const fetchUserById = async (userId) => {
    if (!userId) {
      setError('Vui lòng nhập ID user.');
      setSelectedUser(null);
      return;
    }

    setIsLookingUp(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${USERS_API_URL}/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setSelectedUser(data);
      setSuccessMessage(`Đã tải user ID ${data.id}.`);
    } catch (err) {
      setSelectedUser(null);
      setError(`Không thể tải user theo ID (${err.message}).`);
    } finally {
      setIsLookingUp(false);
    }
  };

  const resetForm = () => {
    setNameInput('');
    setEditingUserId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên user.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const url = editingUserId ? `${USERS_API_URL}/${editingUserId}` : USERS_API_URL;
      const method = editingUserId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setSuccessMessage(editingUserId ? 'Cập nhật user thành công.' : 'Thêm user thành công.');
      setSelectedUser(data);
      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(`Không thể lưu user (${err.message}).`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setNameInput(user.name);
    setSelectedUser(user);
    setError('');
    setSuccessMessage(`Đang sửa user ID ${user.id}.`);
  };

  const handleDelete = async (user) => {
    const isConfirmed = window.confirm(`Bạn có chắc muốn xóa user ${user.name} (ID ${user.id}) không?`);
    if (!isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${USERS_API_URL}/${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      if (editingUserId === user.id) {
        resetForm();
      }

      setSuccessMessage(`Đã xóa user ID ${user.id}.`);
      await fetchUsers();
    } catch (err) {
      setError(`Không thể xóa user (${err.message}).`);
    } finally {
      setIsSubmitting(false);
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
            Trang này hiển thị dữ liệu từ backend theo yêu cầu BASE_FE/users. Bạn có thể tạo, xem theo ID,
            cập nhật và xóa user trực tiếp để test CRUD.
          </p>
          <div className="users-actions">
            <button type="button" className="users-reload-btn" onClick={fetchUsers} disabled={isLoading}>
              {isLoading ? 'Đang tải danh sách' : 'Tải lại danh sách'}
            </button>
            <span className="users-api-chip">Nguồn API: {USERS_API_URL}</span>
          </div>
        </section>

        <section className="users-crud-grid">
          <article className="users-card">
            <div className="users-card-header">
              <h2>{editingUserId ? `Sửa user #${editingUserId}` : 'Thêm user mới'}</h2>
              <p>Backend nhận dữ liệu theo format name để phục vụ bài kiểm tra CRUD.</p>
            </div>

            <form className="users-form" onSubmit={handleSubmit}>
              <label htmlFor="user-name-input">Tên user</label>
              <input
                id="user-name-input"
                className="users-input"
                type="text"
                placeholder="Ví dụ: Nguyen Van D"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
              />

              <div className="users-inline-actions">
                <button type="submit" className="users-primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : editingUserId ? 'Cập nhật user' : 'Thêm user'}
                </button>
                {editingUserId ? (
                  <button type="button" className="users-secondary-btn" onClick={resetForm}>
                    Hủy sửa
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="users-card">
            <div className="users-card-header">
              <h2>Tra cứu user theo ID</h2>
              <p>Đúng với yêu cầu test link BASE_API/users/1 trên backend.</p>
            </div>

            <form
              className="users-form"
              onSubmit={(event) => {
                event.preventDefault();
                fetchUserById(lookupId.trim());
              }}
            >
              <label htmlFor="user-id-input">User ID</label>
              <input
                id="user-id-input"
                className="users-input"
                type="number"
                min="1"
                placeholder="Nhập ID, ví dụ 1"
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
              />

              <div className="users-inline-actions">
                <button type="submit" className="users-primary-btn" disabled={isLookingUp}>
                  {isLookingUp ? 'Đang tìm...' : 'Xem user theo ID'}
                </button>
              </div>
            </form>

            <div className="users-detail-card">
              <h3>Kết quả tra cứu</h3>
              {selectedUser ? (
                <div className="users-detail-body">
                  <p>
                    <strong>ID:</strong> {selectedUser.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedUser.name}
                  </p>
                </div>
              ) : (
                <p className="users-empty-detail">Chưa chọn user nào.</p>
              )}
            </div>
          </article>
        </section>

        <section className="users-table-section">
          <h2>Tổng số users: {users.length}</h2>
          {error ? <p className="users-error">{error}</p> : null}
          {successMessage ? <p className="users-success">{successMessage}</p> : null}

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={String(user.id)}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>
                        <div className="users-table-actions">
                          <button type="button" className="users-row-button" onClick={() => fetchUserById(String(user.id))}>
                            Xem
                          </button>
                          <button type="button" className="users-row-button" onClick={() => handleEdit(user)}>
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="users-row-button users-delete-button"
                            onClick={() => handleDelete(user)}
                            disabled={isSubmitting}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="users-empty">
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
