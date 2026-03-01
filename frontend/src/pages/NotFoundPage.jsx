import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="section flex flex-col items-center justify-center py-32 text-center">
      <p className="text-8xl font-black text-primary-100">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h1>
      <p className="text-gray-400 mt-2 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Button><Link to="/">Back to Shop</Link></Button>
    </div>
  );
}
