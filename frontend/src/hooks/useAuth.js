import { useSelector } from 'react-redux';

export default function useAuth() {
  const { user, accessToken, status } = useSelector((state) => state.auth);
  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    isAdmin:         user?.role === 'admin',
    isLoading:       status === 'loading',
  };
}
