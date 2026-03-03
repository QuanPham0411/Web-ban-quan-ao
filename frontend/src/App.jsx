import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '' });

  // THAY LINK NÀY bằng link Backend (.onrender.com) của bạn
  const API_URL = 'https://api-ban-quan-ao-backend.onrender.com/users';

  // 1. Lấy danh sách người dùng (READ)
  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
        await fetchUsers();
    };
    loadData();
}, []);

  // 2. Thêm người dùng mới (CREATE)
 const handleAddUser = async (e) => {
    e.preventDefault();
    try {
        await axios.post(API_URL, newUser);
        setNewUser({ name: '', email: '', phone: '' });
        fetchUsers();
    } catch (err) {
        console.error(err); // Dùng biến err ở đây để hết lỗi no-unused-vars
        alert("Lỗi khi thêm thành viên!");
    }
};

  // 3. Xóa người dùng (DELETE)
 const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa?")) {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err); // Dùng biến err ở đây để hết lỗi no-unused-vars
            alert("Lỗi khi xóa thành viên!");
        }
    }
};

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", maxWidth: "800px", margin: "auto" }}>
      <h2 style={{ color: "#2c3e50" }}>Quản lý người dùng - Nhóm STU</h2>
      
      {/* Form thêm người dùng */}
      <form onSubmit={handleAddUser} style={{ marginBottom: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px" }}>
        <h4>Thêm thành viên mới</h4>
        <input type="text" placeholder="Tên" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required style={{marginRight: "10px"}} />
        <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required style={{marginRight: "10px"}} />
        <input type="text" placeholder="SĐT" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} style={{marginRight: "10px"}} />
        <button type="submit" style={{ backgroundColor: "#27ae60", color: "white", border: "none", padding: "5px 15px", cursor: "pointer" }}>Thêm</button>
      </form>

      {/* Bảng hiển thị (Mục 2 yêu cầu của thầy) */}
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ backgroundColor: "#34495e", color: "white" }}>
          <tr>
            <th>ID</th><th>Họ Tên</th><th>Email</th><th>SĐT</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>
                <button onClick={() => handleDelete(u.id)} style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;