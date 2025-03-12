import './globals.css';
import { Inter } from 'next/font/google';
import './components.css'
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Coupon Distribution System',
  description: 'Get exclusive coupons with our fair distribution system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}