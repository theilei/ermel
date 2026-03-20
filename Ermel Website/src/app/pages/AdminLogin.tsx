import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Eye, EyeOff, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import logoImg from '../../assets/e11197c9a69ce4af64c22995e5b9ed17b033f7df.png';

const GLASS_INSTALLATION_IMG = 'https://images.unsplash.com/photo-1761227390482-bccb032eeea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMHdpbmRvdyUyMGluc3RhbGxhdGlvbiUyMGNvbnN0cnVjdGlvbnxlbnwxfHx8fDE3NzE5OTMyOTF8MA&ixlib=rb-4.1.0&q=80&w=1080';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(adminId, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please check your email and password.');
      return;
    }

    const meRes = await fetch(`${(import.meta as any).env?.VITE_API_URL || '/api'}/auth/me`, { credentials: 'include' });
    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok || meData?.user?.role !== 'admin') {
      setError('This account does not have admin access.');
      return;
    }

    if (rememberMe) {
      // Keep this preference only for UX and not authentication.
      localStorage.setItem('ermel_remember_me', 'true');
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <ImageWithFallback
        src={GLASS_INSTALLATION_IMG}
        alt="Glass installation background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(135deg, rgba(21,38,60,0.92) 0%, rgba(21,38,60,0.88) 50%, rgba(122,0,0,0.35) 100%)' 
        }}
      />

      {/* Back to Home Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-6 left-6 z-20 text-white/90 hover:text-white hover:bg-white/10"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                <img 
                  src={logoImg} 
                  alt="ERMEL Logo" 
                  className="h-12 object-contain"
                />
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
              </div>
              <CardDescription className="text-base">
                Enter your credentials to access the admin dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin ID Field */}
              <div className="space-y-2">
                <Label htmlFor="adminId">Admin Email</Label>
                <Input
                  id="adminId"
                  type="email"
                  placeholder="Enter your admin email"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <div className="w-full border-t pt-4 text-center text-xs text-muted-foreground">
              Use your verified admin account credentials.
            </div>
          </CardFooter>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-xs text-white/70 mt-6">
          © {new Date().getFullYear()} ERMEL. All rights reserved. Protected by secure authentication.
        </p>
      </div>
    </div>
  );
}
