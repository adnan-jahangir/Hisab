import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Users } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg-base text-text-primary">
      {/* Left Half (Desktop) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-bg-card to-bg-base border-r border-border items-center justify-center p-12">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center font-bold text-2xl text-white">H</div>
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-light to-white">Hisab</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Your Trusted Business Partner</h1>
            <p className="text-text-muted text-lg mb-12">Manage your accounts easily, grow your business.</p>

            <div className="space-y-6">
              {[
                { icon: TrendingUp, title: 'Real-time Accounting', desc: 'Know your business status anytime, anywhere.' },
                { icon: ShieldCheck, title: 'Secure Data', desc: 'All your information is 100% secure and encrypted.' },
                { icon: Users, title: 'Multi-user Support', desc: 'Collaborate with your employees seamlessly.' },
              ].map((f, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{f.title}</h3>
                    <p className="text-text-muted text-sm">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Half */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {children}
          
          <footer className="mt-10 text-center">
            <p className="text-xs text-text-muted font-semibold tracking-wide">
              Developed by <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-light text-sm">Adnan Jahangir</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
