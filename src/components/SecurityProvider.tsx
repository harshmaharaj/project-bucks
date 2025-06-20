
import React, { useEffect } from 'react';
import { getSecurityHeaders } from '@/utils/security';

interface SecurityProviderProps {
  children: React.ReactNode;
}

const SecurityProvider = ({ children }: SecurityProviderProps) => {
  useEffect(() => {
    // Add security headers to the document (for development reference)
    const headers = getSecurityHeaders();
    
    // Create meta tags for security headers (some can be set this way)
    const metaElements = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
      { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
    ];

    metaElements.forEach(({ name, 'http-equiv': httpEquiv, content }) => {
      const existingMeta = document.querySelector(
        name ? `meta[name="${name}"]` : `meta[http-equiv="${httpEquiv}"]`
      );
      
      if (!existingMeta) {
        const meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (httpEquiv) meta.setAttribute('http-equiv', httpEquiv);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    });

    // Add CSP meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', headers['Content-Security-Policy']);
      document.head.appendChild(meta);
    }

    // CSRF protection - add token to forms
    const addCSRFToken = () => {
      const token = Math.random().toString(36).substring(2);
      sessionStorage.setItem('csrf_token', token);
      
      // Add to all forms
      document.querySelectorAll('form').forEach((form) => {
        const existingToken = form.querySelector('input[name="csrf_token"]');
        if (!existingToken) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'csrf_token';
          input.value = token;
          form.appendChild(input);
        }
      });
    };

    // Add CSRF tokens to forms
    addCSRFToken();

    // Re-add CSRF tokens when DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'FORM' || element.querySelector('form')) {
                addCSRFToken();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Prevent clickjacking
    if (window.self !== window.top) {
      window.top!.location = window.self.location;
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;
