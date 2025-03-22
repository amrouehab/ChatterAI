
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TextBox, Button } from 'devextreme-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Auth = () => {
  const { isAuthenticated, login, signup, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState({ username: '', password: '' });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/chat" />;
  }

  const validateForm = () => {
    let valid = true;
    const newErrors = { username: '', password: '' };

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, password);
      }
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">ChatterAI</h1>
          <p className="text-muted-foreground">Intelligent conversations, simplified.</p>
        </div>

        <Card className="glass-panel overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{isLogin ? 'Welcome back' : 'Create an account'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your credentials to continue' : 'Enter your information to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <TextBox
                  id="username"
                  value={username}
                  onValueChanged={(e) => setUsername(e.value)}
                  placeholder="Enter your username"
                  stylingMode="filled"
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <TextBox
                  id="password"
                  mode="password"
                  value={password}
                  onValueChanged={(e) => setPassword(e.value)}
                  placeholder="Enter your password"
                  stylingMode="filled"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              
              <Button
                useSubmitBehavior={true}
                text={isLogin ? "Sign In" : "Create Account"}
                type="default"
                stylingMode="contained"
                width="100%"
                disabled={isLoading}
                className="mt-4"
              />
            </form>
          </CardContent>
          
          <CardFooter>
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="w-full text-center text-sm text-primary hover:underline mt-2"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
