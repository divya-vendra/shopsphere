import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Badge   from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users,    setUsers]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading,  setLoading]  = useState(true);

  const loadUsers = (page = 1) => {
    setLoading(true);
    adminApi.getAllUsers({ page, limit: 20 })
      .then(({ data }) => {
        setUsers(data.users);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    try {
      await adminApi.updateUser(user._id, { role: newRole });
      setUsers((u) => u.map((x) => x._id === user._id ? { ...x, role: newRole } : x));
      toast.success('Role updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name}?`)) return;
    try {
      await adminApi.deleteUser(user._id);
      setUsers((u) => u.filter((x) => x._id !== user._id));
      toast.success('User deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="section">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Users <span className="text-base font-normal text-gray-400">({pagination.total})</span>
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRole(user)}
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          {user.role === 'admin' ? 'Make Customer' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-6">
            <Pagination
              page={pagination.page} pages={pagination.pages}
              onPageChange={loadUsers}
            />
          </div>
        </>
      )}
    </div>
  );
}
