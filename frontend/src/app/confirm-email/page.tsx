'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // URL fragment에서 에러 확인
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    // 에러가 있는 경우
    if (error) {
      setStatus('error');
      if (errorCode === 'otp_expired') {
        setMessage('이메일 인증 링크가 만료되었습니다. 다시 회원가입해주세요.');
      } else {
        setMessage('이메일 인증에 실패했습니다.');
      }
      return;
    }

    // URL 파라미터에서 토큰 확인
    const token_hash = searchParams.get('token_hash');
    const token = searchParams.get('token'); // Supabase 직접 인증 URL에서 전달되는 토큰
    const type = searchParams.get('type');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');

    // URL fragment에서도 토큰 확인 (Supabase 직접 인증 URL용)
    const fragmentToken = params.get('token');
    const fragmentType = params.get('type');
    const fragmentAccessToken = params.get('access_token');
    const fragmentRefreshToken = params.get('refresh_token');

    // 토큰이 있는 경우 (이미 인증됨) - query parameter 또는 fragment에서 확인
    if ((access_token && refresh_token) || (fragmentAccessToken && fragmentRefreshToken)) {
      const finalAccessToken = access_token || fragmentAccessToken;
      const finalRefreshToken = refresh_token || fragmentRefreshToken;
      
      // 토큰을 로컬 스토리지에 저장
      localStorage.setItem('accessToken', finalAccessToken!);
      localStorage.setItem('refreshToken', finalRefreshToken!);
      
      // 이미 인증된 경우에도 백엔드에서 사용자 정보 저장을 위해 백엔드로 리다이렉트
      console.log('이미 인증됨, 백엔드에서 사용자 정보 저장 처리');
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/confirm-email?token_hash=${finalAccessToken}&type=signup&already_verified=true`;
      window.location.href = backendUrl;
      return;
    }

    // token_hash 또는 token이 있는 경우 (이메일 링크) - query parameter 또는 fragment에서 확인
    const finalToken = token_hash || token || fragmentToken;
    const finalType = type || fragmentType;
    
    if (finalToken && finalType === 'signup') {
      // 백엔드의 /confirm-email 엔드포인트로 리다이렉트하여 처리
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/confirm-email?token_hash=${finalToken}&type=${finalType}`;
      console.log('백엔드로 리다이렉트:', backendUrl);
      window.location.href = backendUrl;
    } else {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            이메일 인증
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">이메일 인증을 처리하고 있습니다...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-green-600">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-red-600">{message}</p>
              <button
                onClick={() => router.push('/signup')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                회원가입 다시하기
              </button>
              <button
                onClick={() => router.push('/login')}
                className="mt-2 ml-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                로그인 페이지로 이동
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
} 