import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, TrendingUp, Shield, Crown, User, Phone } from 'lucide-react';
import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number is too long')
  .regex(/^[+]?[0-9]+$/, 'Please enter a valid phone number');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type SignupRole = 'admin' | 'member';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<SignupRole>('member');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      phoneSchema.parse(loginPhone);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.loginPhone = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(loginPassword);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.loginPassword = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      nameSchema.parse(signupName);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupName = e.errors[0].message;
      }
    }
    
    try {
      phoneSchema.parse(signupPhone);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupPhone = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(signupPassword);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupPassword = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    
    setIsLoading(true);
    const { error } = await signIn(loginPhone, loginPassword);
    setIsLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid phone number or password. Please try again.'
          : error.message
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.'
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    
    setIsLoading(true);
    const { error } = await signUp(signupPhone, signupPassword, signupName, signupRole);
    setIsLoading(false);
    
    if (error) {
      const message = error.message.includes('already registered')
        ? 'This phone number is already registered. Please login instead.'
        : error.message;
      
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: message
      });
    } else {
      toast({
        title: 'Account created!',
        description: `You are now signed up as ${signupRole === 'admin' ? 'an Admin (Foreman)' : 'a Member'}.`
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="rounded-xl bg-primary p-3">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ChitBuddy
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your chit funds with ease
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 grid w-full max-w-md grid-cols-3 gap-4 px-4">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-card/50 p-3 text-center">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Group Management</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-card/50 p-3 text-center">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Smart Payouts</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-card/50 p-3 text-center">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">Secure Ledger</span>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <CardTitle className="mb-2 text-xl">Welcome back</CardTitle>
                <CardDescription className="mb-6">
                  Enter your phone number and password to login
                </CardDescription>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                    {errors.loginPhone && (
                      <p className="text-sm text-destructive">{errors.loginPhone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.loginPassword && (
                      <p className="text-sm text-destructive">{errors.loginPassword}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <CardTitle className="mb-2 text-xl">Create account</CardTitle>
                <CardDescription className="mb-6">
                  Enter your details to get started
                </CardDescription>
                
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label>I want to sign up as</Label>
                    <RadioGroup
                      value={signupRole}
                      onValueChange={(value) => setSignupRole(value as SignupRole)}
                      className="grid grid-cols-2 gap-3"
                      disabled={isLoading}
                    >
                      <Label
                        htmlFor="role-member"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent ${
                          signupRole === 'member' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value="member" id="role-member" className="sr-only" />
                        <User className={`h-6 w-6 ${signupRole === 'member' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">Member</span>
                        <span className="text-xs text-muted-foreground text-center">Join chit groups</span>
                      </Label>
                      <Label
                        htmlFor="role-admin"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent ${
                          signupRole === 'admin' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value="admin" id="role-admin" className="sr-only" />
                        <Crown className={`h-6 w-6 ${signupRole === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">Admin</span>
                        <span className="text-xs text-muted-foreground text-center">Manage chit groups</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.signupName && (
                      <p className="text-sm text-destructive">{errors.signupName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">India +91 will be added automatically</p>
                    {errors.signupPhone && (
                      <p className="text-sm text-destructive">{errors.signupPhone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.signupPassword && (
                      <p className="text-sm text-destructive">{errors.signupPassword}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
