import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Receipt, Package, TrendingUp, Target, FileText, 
  Menu, X, CheckCircle2, Star, ChevronDown, ChevronUp, Facebook, Linkedin, MessageCircle 
} from 'lucide-react';
import { Button } from '../components/ui/Button';

// Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F16] text-white overflow-x-hidden font-sans selection:bg-accent-primary selection:text-white">
      
      {/* 1. Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0F0F16]/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center font-bold text-lg">হ</div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">হিসাব</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-xs">
              <button className="px-3 py-1 bg-white/20 rounded-full text-white">বাং</button>
              <button className="px-3 py-1 text-white/50 hover:text-white">EN</button>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10">লগইন করুন</Button>
            <Button className="bg-accent-primary hover:bg-accent-primary/90 text-white rounded-full">বিনামূল্যে শুরু করুন</Button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-[#0F0F16] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="text-2xl font-bold">হিসাব</span>
              <button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6"/></button>
            </div>
            <div className="flex flex-col gap-6 text-lg">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <div className="h-px bg-white/10 my-4" />
              <Button variant="secondary" className="w-full justify-center">লগইন করুন</Button>
              <Button className="w-full justify-center">বিনামূল্যে শুরু করুন</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden flex flex-col items-center text-center">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent-primary/20 blur-[120px] rounded-full point-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="flex flex-wrap justify-center gap-x-3 text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            {['আপনার', 'ব্যবসার', 'সব', 'হিসাব', 'এক', 'জায়গায়'].map((word, i) => (
              <motion.span 
                key={i} 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className={word === 'হিসাব' ? 'text-accent-primary' : 'text-white'}
              >
                {word}
              </motion.span>
            ))}
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            Track sales, expenses, inventory, and profit — built specifically for Bangladeshi small and medium businesses.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          >
            <Button size="lg" className="rounded-full text-base px-8 bg-accent-primary hover:bg-accent-primary/90">বিনামূল্যে শুরু করুন</Button>
            <Button size="lg" variant="ghost" className="rounded-full text-base px-8 border border-white/20 hover:bg-white/5">ডেমো দেখুন</Button>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, type: 'spring' }}
          className="relative z-10 mt-16 lg:mt-24 w-full max-w-5xl aspect-[16/9] md:aspect-[21/9] rounded-2xl border border-white/10 bg-[#161622] shadow-2xl shadow-accent-primary/20 overflow-hidden flex flex-col"
        >
          {/* Mockup Header */}
          <div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
             <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/></div>
             <div className="flex-1 bg-white/5 rounded-md h-6 mx-4 max-w-md hidden md:block" />
          </div>
          {/* Mockup Body */}
          <div className="flex flex-1 p-4 gap-4">
             <div className="w-48 hidden lg:flex flex-col gap-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-white/5 rounded-md cursor-pointer" />)}
             </div>
             <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-24 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between"><div className="w-16 h-3 bg-white/20 rounded"/><div className="w-24 h-6 bg-white/60 rounded"/></div>
                  <div className="flex-1 h-24 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between"><div className="w-16 h-3 bg-white/20 rounded"/><div className="w-24 h-6 bg-white/60 rounded"/></div>
                  <div className="flex-1 h-24 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between hidden sm:flex"><div className="w-16 h-3 bg-white/20 rounded"/><div className="w-24 h-6 bg-white/60 rounded"/></div>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/5 flex items-end p-4 gap-2">
                   {[40, 70, 45, 90, 65, 80, 50, 100, 85].map((h, i) => (
                     <div key={i} className="flex-1 bg-accent-primary/50 hover:bg-accent-primary transition-colors rounded-t-sm" style={{ height: `${h}%`}} />
                   ))}
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Stats Bar */}
      <section className="border-y border-white/10 bg-white/[0.02] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { label: 'ব্যবসা', value: '১০,০০০+' },
              { label: 'হিসাব', value: '৳৫০ কোটি+' },
              { label: 'সন্তুষ্ট', value: '৯৮%' },
              { label: 'শুরু', value: '৩ মিনিটে' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="space-y-2">
                <h4 className="text-3xl md:text-4xl font-bold text-accent-primary">{stat.value}</h4>
                <p className="text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">যা যা পাবেন</h2>
            <p className="text-white/60 max-w-2xl mx-auto">হিসাব রাখার সব আধুনিক সুবিধা একসাথে</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: BarChart3, title: 'স্মার্ট ড্যাশবোর্ড', desc: 'সব তথ্য এক নজরে' },
              { icon: Receipt, title: 'খরচ ট্র্যাকিং', desc: 'ক্যাটাগরি অনুযায়ী বিশ্লেষণ' },
              { icon: Package, title: 'স্টক ম্যানেজমেন্ট', desc: 'লো স্টক অ্যালার্ট সহ' },
              { icon: TrendingUp, title: 'আর্থিক বিশ্লেষণ', desc: 'চার্ট ও রিপোর্ট' },
              { icon: Target, title: 'AI বাজেট পরিকল্পনা', desc: 'ভবিষ্যৎ খরচের পূর্বানুমান' },
              { icon: FileText, title: 'ইনভয়েস তৈরি', desc: 'প্রফেশনাল PDF ইনভয়েস' },
            ].map((f, i) => (
              <motion.div 
                key={i} variants={fadeInUp}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-accent-primary/20 text-accent-primary rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-white/60">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-white/[0.02] relative">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">কিভাবে কাজ করে</h2>
          </motion.div>
          
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
            
            <motion.div 
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
            >
              {[
                { step: 1, title: 'অ্যাকাউন্ট তৈরি করুন', desc: 'মাত্র ৩০ সেকেন্ডে সাইন আপ করুন' },
                { step: 2, title: 'পণ্য ও খরচ যোগ করুন', desc: 'আপনার ব্যবসার প্রাথমিক ডেটা ইনপুট দিন' },
                { step: 3, title: 'রিয়েল-টাইম ইনসাইট', desc: 'ড্যাশবোর্ডে ব্যবসার অবস্থা পর্যবেক্ষণ করুন' },
              ].map((s, i) => (
                <motion.div key={i} variants={fadeInUp} className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-[#0F0F16] border-2 border-accent-primary/30 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(108,99,255,0.2)]">
                    <span className="text-3xl font-bold text-accent-primary">{s.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-white/60">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">সাশ্রয়ী মূল্যে প্রিমিয়াম সেবা</h2>
            <div className="inline-flex bg-white/5 rounded-full p-1 border border-white/10">
               <button onClick={() => setAnnualBilling(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${!annualBilling ? 'bg-accent-primary text-white' : 'text-white/60 hover:text-white'}`}>মাসিক</button>
               <button onClick={() => setAnnualBilling(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${annualBilling ? 'bg-accent-primary text-white' : 'text-white/60 hover:text-white'}`}>
                 বাৎসরিক <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full">Save 20%</span>
               </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Free */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-2">ফ্রি</h3>
              <div className="text-4xl font-bold mb-6">৳০<span className="text-lg text-white/50 font-normal">/মাস</span></div>
              <ul className="space-y-4 mb-8">
                {['1 business', '100 transactions/month', 'Basic features', 'Email support'].map(f => (
                  <li key={f} className="flex gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-accent-primary shrink-0"/>{f}</li>
                ))}
              </ul>
              <Button className="w-full bg-white/10 hover:bg-white/20">শুরু করুন</Button>
            </motion.div>
            
            {/* Pro */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-gradient-to-b from-accent-primary/20 to-bg-card border border-accent-primary shadow-[0_0_40px_rgba(108,99,255,0.2)] rounded-3xl p-8 relative scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-primary text-white px-4 py-1 rounded-full text-sm font-semibold">সবচেয়ে জনপ্রিয়</div>
              <h3 className="text-2xl font-bold mb-2">প্রো</h3>
              <div className="text-4xl font-bold mb-6">৳{annualBilling ? '৩৯৯' : '৪৯৯'}<span className="text-lg text-white/50 font-normal">/মাস</span></div>
              <ul className="space-y-4 mb-8">
                {['Unlimited transactions', 'All features via Dashboard', 'PDF Export', 'Priority Email support'].map(f => (
                  <li key={f} className="flex gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-accent-primary shrink-0"/>{f}</li>
                ))}
              </ul>
              <Button className="w-full bg-accent-primary hover:bg-accent-primary/90">শুরু করুন</Button>
            </motion.div>

            {/* Business */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-2">বিজনেস</h3>
              <div className="text-4xl font-bold mb-6">৳{annualBilling ? '৭৯৯' : '৯৯৯'}<span className="text-lg text-white/50 font-normal">/মাস</span></div>
              <ul className="space-y-4 mb-8">
                {['Multi-business support', 'Excel export & Advanced AI', 'API Access', '24/7 Phone Support'].map(f => (
                  <li key={f} className="flex gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-accent-primary shrink-0"/>{f}</li>
                ))}
              </ul>
              <Button className="w-full bg-white/10 hover:bg-white/20">শুরু করুন</Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-24 px-4 bg-white/[0.02] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-bold">তারা বলছেন</h2>
          </motion.div>
          
          <div className="flex flex-nowrap md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-8 snap-x">
             {[
               { name: "রাকিব হাসান", type: "গ্রোসারি শপ", loc: "ঢাকা", quote: "হিসাব অ্যাপটির কারণে আমার দোকানের হিসাব রাখা অনেক সহজ হয়েছে।" },
               { name: "সাদিয়া আক্তার", type: "অনলাইন বুটিক", loc: "সিলেট", quote: "স্টক ম্যানেজমেন্ট এবং ইনভয়েস তৈরি করা এখন মাত্র কয়েক ক্লিকেই সম্ভব।" },
               { name: "তানভীর আহমেদ", type: "ফার্মেসি", loc: "চট্টগ্রাম", quote: "বাজেট প্ল্যানারটি অসাধারণ। আগামী মাসের খরচের একটি স্পষ্ট ধারণা পাওয়া যায়।" }
             ].map((t, i) => (
               <div key={i} className="min-w-[300px] md:min-w-0 bg-white/5 p-6 rounded-2xl border border-white/10 snap-center">
                  <div className="flex gap-1 mb-4 text-yellow-500"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/></div>
                  <p className="text-lg text-white/90 mb-6 font-medium">"{t.quote}"</p>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-accent-primary rounded-full flex items-center justify-center font-bold text-lg">{t.name.charAt(0)}</div>
                     <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-sm text-white/50">{t.type}, {t.loc}</div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">সাধারণ প্রশ্নোত্তর</h2>
          </motion.div>
          
          <div className="space-y-4">
            {[
              { q: 'হিসাব অ্যাপটি কি সম্পূর্ণ ফ্রি?', a: 'হ্যাঁ, আমাদের একটি চিরস্থায়ী ফ্রি প্ল্যান রয়েছে যা দিয়ে আপনি বেসিক সব কাজ করতে পারবেন।' },
              { q: 'আমার ডেটা কি নিরাপদ?', a: 'অবশ্যই। আমরা এন্টারপ্রাইজ গ্রেড এনক্রিপশন ব্যবহার করি। আপনার ডেটা শুধু আপনিই দেখতে পারবেন।' },
              { q: 'আমি কি একাধিক ব্যবসা যোগ করতে পারবো?', a: 'হ্যাঁ, বিজনেস প্ল্যানে আপনি আনলিমিটেড ব্যবসা যোগ এবং ম্যানেজ করতে পারবেন।' },
              { q: 'মোবাইল থেকে কি ব্যবহার করা যাবে?', a: 'হ্যাঁ, হিসাব একটি ফুললি রেস্পন্সিভ ওয়েব অ্যাপ যা মোবাইল ব্রাউজার থেকে খুব সুন্দরভাবে কাজ করে।' }
            ].map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-accent-primary" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4 text-white/60"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA Banner */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-accent-primary to-purple-600 p-12 md:p-20 text-center">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">আজই শুরু করুন — সম্পূর্ণ বিনামূল্যে</h2>
              <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">কোন ক্রেডিট কার্ডের প্রয়োজন নেই। ১ মিনিটে একাউন্ট খুলে নিজের ব্যবসার হিসাব রাখুন স্মার্টলি।</p>
              <Button size="lg" className="bg-white text-accent-primary hover:bg-white/90 rounded-full px-10 text-lg font-bold shadow-lg">বিনামূল্যে অ্যাকাউন্ট তৈরি করুন</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-[#0A0A0F] border-t border-white/5 pt-16 pb-8 px-4 text-white/60 text-sm mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center font-bold text-lg text-white">হ</div>
              <span className="text-xl font-bold text-white">হিসাব</span>
            </div>
            <p className="mb-6 max-w-xs">আপনার ব্যবসার বিশ্বস্ত সঙ্গী। সহজ, নিরাপদ এবং সবসময়ের জন্য।</p>
            <div className="flex gap-4">
               <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5"/></a>
               <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5"/></a>
               <a href="#" className="hover:text-white transition-colors"><MessageCircle className="w-5 h-5"/></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center">
          <p>© ২০২৪ হিসাব। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
}
