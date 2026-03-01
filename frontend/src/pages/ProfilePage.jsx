import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { updateProfile } from '../features/auth/authSlice';
import useAuth from '../hooks/useAuth';
import Input  from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, isLoading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const onSubmit = (data) => dispatch(updateProfile(data));

  return (
    <div className="section max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="card p-8">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name" id="name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
          />
          <Input
            label="Email Address" id="email" type="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />
          <Button type="submit" loading={isLoading}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
}
