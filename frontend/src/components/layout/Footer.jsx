import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-lg">ShopSphere</span>
            </div>
            <p className="text-sm leading-relaxed">
              A modern e-commerce platform built for the best shopping experience.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/?category=Electronics" className="hover:text-white transition-colors">Electronics</Link></li>
              <li><Link to="/?category=Clothing" className="hover:text-white transition-colors">Clothing</Link></li>
              <li><Link to="/?isFeatured=true" className="hover:text-white transition-colors">Featured</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login"   className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/orders"   className="hover:text-white transition-colors">Order History</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-default">help@shopsphere.com</span></li>
              <li><span className="cursor-default">Mon–Fri, 9am–5pm EST</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
          <p>Built with React, Redux, Express & MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
