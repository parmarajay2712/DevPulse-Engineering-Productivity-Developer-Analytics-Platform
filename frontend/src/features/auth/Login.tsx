import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../../services/api';
import { Box, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response: any = await api('/auth/login', { data });
      setAuthToken(response.token);
      localStorage.setItem('user', JSON.stringify(response));
      // Optionally could store project id from response if we want to default
      navigate('/');
    } catch (error: any) {
      setError('root', { message: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Box className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">Log in to DevPulse</h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Or{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface border border-border py-8 px-4 shadow sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-rose-400/10 border border-rose-400/20 text-rose-400 p-3 rounded-md text-sm text-center">
                {errors.root.message}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email address</label>
              <div className="mt-1">
                <input 
                  {...register('email')}
                  type="email" 
                  autoComplete="email"
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Password</label>
              <div className="mt-1">
                <input 
                  {...register('password')}
                  type="password" 
                  autoComplete="current-password"
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
