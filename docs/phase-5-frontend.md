# Phase 5: Next.js Frontend

> **Goal**: Build a modern, responsive frontend using Next.js 14 with App Router that allows users to submit articles, view predictions, and browse their history.

---

## Overview

This phase creates the user-facing application:
- Article submission form with image upload
- Real-time prediction results with confidence visualization
- User authentication (login/register)
- Prediction history dashboard
- Admin statistics panel

**Estimated Effort**: 4-5 days  
**Prerequisites**: Phase 4 completed (backend API running)  
**Port**: 3000

---

## 5.1 Project Setup

### 5.1.1 Create Next.js Project

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"
cd frontend
```

### 5.1.2 Install Dependencies

```bash
# UI and components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-toast \
  class-variance-authority clsx tailwind-merge lucide-react

# Forms and validation
npm install react-hook-form @hookform/resolvers zod

# HTTP client
npm install axios

# File upload
npm install react-dropzone

# Charts
npm install recharts

# Utilities
npm install date-fns
```

### 5.1.3 Install shadcn/ui Components

```bash
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card input label textarea toast \
  dialog dropdown-menu avatar badge progress skeleton alert
```

---

## 5.2 Environment Configuration

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 5.3 API Client Setup

```typescript
// frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('token') 
    : null;
    
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
    
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
    
  getProfile: () => api.get('/auth/profile'),
};

// Predict API
export const predictApi = {
  submit: (formData: FormData) =>
    api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    
  get: (id: string) => api.get(`/predict/${id}`),
  
  submitFeedback: (id: string, feedback: 'correct' | 'incorrect') =>
    api.post(`/predict/${id}/feedback`, { feedback }),
};

// History API
export const historyApi = {
  list: (params?: { page?: number; limit?: number; label?: string }) =>
    api.get('/history', { params }),
    
  getStats: () => api.get('/history/stats'),
};
```

---

## 5.4 Authentication Context

```typescript
// frontend/src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getProfile();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 5.5 Shared Components

### 5.5.1 Navigation Header

```typescript
// frontend/src/components/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, History, LogOut, Shield } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          🔍 FakeNewsDetector
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </Link>
              
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user.name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

### 5.5.2 Image Upload Component

```typescript
// frontend/src/components/ImageUpload.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  className?: string;
}

export function ImageUpload({ onFileSelect, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
        setPreview(URL.createObjectURL(file));
      }
    },
    [onFileSelect]
  );

  const removeImage = () => {
    setPreview(null);
    onFileSelect(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  if (preview) {
    return (
      <div className={cn('relative', className)}>
        <img
          src={preview}
          alt="Preview"
          className="w-full h-48 object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={removeImage}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400',
        className
      )}
    >
      <input {...getInputProps()} />
      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-600">
        {isDragActive
          ? 'Drop the image here'
          : 'Drag & drop an image, or click to select'}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        JPG, PNG, or WebP (max 10MB)
      </p>
    </div>
  );
}
```

### 5.5.3 Confidence Bar Component

```typescript
// frontend/src/components/ConfidenceBar.tsx
interface ConfidenceBarProps {
  confidence: number;
  label: 'REAL' | 'FAKE';
}

export function ConfidenceBar({ confidence, label }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  const isReal = label === 'REAL';
  
  const getColor = () => {
    if (isReal) {
      return confidence > 0.8 ? 'bg-green-500' : 'bg-green-400';
    }
    return confidence > 0.8 ? 'bg-red-500' : 'bg-red-400';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          Confidence
        </span>
        <span className="text-sm font-bold">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### 5.5.4 Result Card Component

```typescript
// frontend/src/components/ResultCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBar } from './ConfidenceBar';
import { CheckCircle, XCircle, Image, FileText } from 'lucide-react';

interface ResultCardProps {
  label: 'REAL' | 'FAKE';
  confidence: number;
  explanation: string;
  modality: 'text_only' | 'multimodal';
  imageUrl?: string;
}

export function ResultCard({
  label,
  confidence,
  explanation,
  modality,
  imageUrl,
}: ResultCardProps) {
  const isReal = label === 'REAL';

  return (
    <Card className={`border-2 ${isReal ? 'border-green-500' : 'border-red-500'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isReal ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <span className={isReal ? 'text-green-700' : 'text-red-700'}>
              {label}
            </span>
          </CardTitle>
          
          <Badge variant="outline" className="flex items-center gap-1">
            {modality === 'multimodal' ? (
              <>
                <Image className="w-3 h-3" />
                Multimodal
              </>
            ) : (
              <>
                <FileText className="w-3 h-3" />
                Text Only
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ConfidenceBar confidence={confidence} label={label} />
        
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Analyzed image"
            className="w-full h-48 object-cover rounded-lg"
          />
        )}
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Analysis</h4>
          <p className="text-gray-600">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5.6 Page Components

### 5.6.1 Root Layout

```typescript
// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fake News Detector',
  description: 'AI-powered multimodal fake news detection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 5.6.2 Home Page (Article Submission)

```typescript
// frontend/src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { predictApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(1000),
  body: z.string().max(10000).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.body) formData.append('body', data.body);
      if (image) formData.append('image', image);

      const response = await predictApi.submit(formData);
      
      // Redirect to result page
      router.push(`/result/${response.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Prediction failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6" />
            Check Article
          </CardTitle>
          <CardDescription>
            Submit an article to analyze whether it's real or fake news.
            You can include an image for more accurate analysis.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title / Headline *</Label>
              <Input
                id="title"
                placeholder="Enter the article headline..."
                {...register('title')}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Article Body (Optional)</Label>
              <Textarea
                id="body"
                placeholder="Paste the article content here..."
                rows={6}
                {...register('body')}
                disabled={isSubmitting}
              />
              {errors.body && (
                <p className="text-sm text-red-500">{errors.body.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <ImageUpload
                onFileSelect={setImage}
                className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Article'
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-gray-500">
                Please{' '}
                <a href="/login" className="text-blue-600 hover:underline">
                  log in
                </a>{' '}
                to analyze articles.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.6.3 Result Page

```typescript
// frontend/src/app/result/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultCard } from '@/components/ResultCard';
import { predictApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';

interface Prediction {
  id: string;
  title: string;
  body?: string;
  imageUrl?: string;
  label: 'REAL' | 'FAKE';
  confidence: number;
  explanation: string;
  modality: 'text_only' | 'multimodal';
  feedback?: 'correct' | 'incorrect';
  createdAt: string;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await predictApi.get(params.id as string);
        setPrediction(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load prediction',
          variant: 'destructive',
        });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [params.id, router, toast]);

  const handleFeedback = async (feedback: 'correct' | 'incorrect') => {
    if (!prediction) return;
    
    setFeedbackSubmitting(true);
    try {
      await predictApi.submitFeedback(prediction.id, feedback);
      setPrediction({ ...prediction, feedback });
      toast({
        title: 'Thank you!',
        description: 'Your feedback helps improve our model.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <ResultCard
        label={prediction.label}
        confidence={prediction.confidence}
        explanation={prediction.explanation}
        modality={prediction.modality}
        imageUrl={prediction.imageUrl}
      />

      {/* Article preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Analyzed Article</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-gray-800">{prediction.title}</h3>
          {prediction.body && (
            <p className="text-gray-600 mt-2 whitespace-pre-wrap">
              {prediction.body}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Feedback section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Was this prediction helpful?</CardTitle>
        </CardHeader>
        <CardContent>
          {prediction.feedback ? (
            <p className="text-green-600">
              Thanks for your feedback: {prediction.feedback}
            </p>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => handleFeedback('correct')}
                disabled={feedbackSubmitting}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Correct
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFeedback('incorrect')}
                disabled={feedbackSubmitting}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Incorrect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.6.4 History Page

```typescript
// frontend/src/app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { historyApi } from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Prediction {
  id: string;
  title: string;
  label: 'REAL' | 'FAKE';
  confidence: number;
  modality: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await historyApi.list({ page: currentPage, limit: 10 });
        setPredictions(response.data.predictions);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Prediction History</h1>

      {predictions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No predictions yet. Start by analyzing an article!
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <Link key={prediction.id} href={`/result/${prediction.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 line-clamp-1">
                          {prediction.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(prediction.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={prediction.label === 'REAL' ? 'default' : 'destructive'}
                        >
                          {prediction.label}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {Math.round(prediction.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 5.6.5 Login Page

```typescript
// frontend/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.error || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5.7 Running the Frontend

```bash
cd frontend
npm run dev
```

Access at: http://localhost:3000

---

## 5.8 Deliverables Checklist

After completing Phase 5, you should have:

- [ ] Next.js 14 project with App Router
- [ ] Authentication context and protected routes
- [ ] Home page with article submission form
- [ ] Image upload with drag-and-drop
- [ ] Result page with confidence visualization
- [ ] History page with pagination
- [ ] Login and registration pages
- [ ] Admin dashboard (basic)
- [ ] API client with interceptors
- [ ] Responsive design with Tailwind CSS
- [ ] All pages working with backend integration

---

## Next Phase

Once the frontend is complete, proceed to **Phase 6: Integration & Testing**.
