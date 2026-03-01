import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ShoppingCartIcon, HeartIcon, UserIcon,
  Bars3Icon, XMarkIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { logout } from '../../features/auth/authSlice';

export default function Navbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search,   setSearch]   = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ShopSphere</span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-5">
            <NavLink to="/"        className={linkClass} end>Shop</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>Dashboard</NavLink>
            )}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <Link to="/wishlist" className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors">
                <HeartIcon className="w-5 h-5" />
              </Link>
            )}

            <Link to="/cart" className="relative p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors">
              <ShoppingCartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 text-xs font-semibold">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <Link to="/profile"       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                  <Link to="/orders"        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Order History</Link>
                  {isAdmin && (
                    <Link to="/admin"       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Admin Dashboard</Link>
                  )}
                  <div className="divider my-1" />
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <UserIcon className="w-4 h-4" /> Sign in
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-gray-100 animate-slide-down">
            <form onSubmit={handleSearch} className="pb-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </form>
            <Link to="/"       onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Shop</Link>
            {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Dashboard</Link>}
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Profile</Link>
                <Link to="/orders"  onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Orders</Link>
                <button onClick={handleLogout} className="block py-2 text-sm text-red-600">Sign out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-primary-600 font-medium">Sign in</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
