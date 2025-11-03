// src/pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2E8B57" />
        <meta name="description" content="نظام إدارة المزارع الدواجن الذكية - Dashboard لإدارة المستشعرات والوحدات الذكية" />
        <meta name="keywords" content="مزرعة, دواجن, مستشعرات, ذكية, إدارة, زراعة" />
        <meta name="author" content="Poultry Farm System" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="256x256" type="image/x-icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Font Awesome */}
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        
        {/* Google Fonts - Tajawal for Arabic */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Poultry Farm Dashboard" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Poultry Farm" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2E8B57" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="نظام إدارة المزارع الذكية" />
        <meta property="og:description" content="Dashboard متكامل لإدارة مستشعرات المزارع والوحدات الذكية" />
        <meta property="og:site_name" content="Poultry Farm System" />
        <meta property="og:url" content="https://yourdomain.com" />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="نظام إدارة المزارع الذكية" />
        <meta name="twitter:description" content="Dashboard متكامل لإدارة مستشعرات المزارع والوحدات الذكية" />
        
        {/* Additional Performance Optimizations */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Poultry Farm Dashboard",
              "description": "نظام إدارة المزارع الدواجن الذكية",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "author": {
                "@type": "Organization",
                "name": "Poultry Farm System"
              }
            })
          }}
        />
      </Head>
      <body className="antialiased">
        <div id="modal-root"></div>
        <Main />
        <NextScript />
        
        {/* Loading Spinner for Initial Load */}
        <style jsx global>{`
          /* Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #2E8B57;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #256f47;
          }
          
          /* Selection Color */
          ::selection {
            background: #2E8B57;
            color: white;
          }
          
          /* Focus Styles for Accessibility */
          *:focus {
            outline: 2px solid #2E8B57;
            outline-offset: 2px;
          }
          
          /* Smooth Transitions */
          * {
            transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
          }
          
          /* RTL Specific Styles */
          html[dir="rtl"] {
            text-align: right;
          }
          
          html[dir="rtl"] .ltr-only {
            display: none;
          }
          
          html[dir="ltr"] .rtl-only {
            display: none;
          }
          
          /* Print Styles */
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
      </body>
    </Html>
  );
}