"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  ChevronRight,
  Globe,
  Layers,
  FileText,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Crown,
  Check
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const features = [
    {
      title: "Precision Pricing",
      description: "Stop guessing. Use our engine to calculate material and labor costs with total accuracy.",
      icon: <Calculator className="h-6 w-6" />,
    },
    {
      title: "Pro Estimates",
      description: "Create stunning, professional quotes in seconds that win over high-end clients.",
      icon: <FileText className="h-6 w-6" />,
    },
    {
      title: "Branded Website",
      description: "Launch your own luxury storefront to showcase your brand and services online.",
      icon: <Globe className="h-6 w-6" />,
    },
    {
      title: "Scale Anywhere",
      description: "Manage multiple cities and teams from one centralized dashboard. Built for growth.",
      icon: <MapPin className="h-6 w-6" />,
    },
    {
      title: "Smart Tiers",
      description: "Offer different budget options (Basic, Standard, Luxe) automatically toEvery client.",
      icon: <Layers className="h-6 w-6" />,
    },
    {
      title: "Elite Reporting",
      description: "Track your studio's health with deep analytics and professional PDF exports.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Set Your Rates",
      description: "Inside your private dashboard, define your costs and margins once."
    },
    {
      number: "02",
      title: "Launch Your Site",
      description: "Go live with a branded website that lets clients request quotes 24/7."
    },
    {
      number: "03",
      title: "Close the Deal",
      description: "Send smart estimates and turn leads into high-paying projects."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black selection:bg-black selection:text-white overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">
              U
            </div>
            <span className="text-xl font-black tracking-tighter text-black uppercase italic">unmatrix.io</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">Process</Link>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <Link href="/login" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">Sign In</Link>
            <Link href="/signup">
              <Button className="bg-black text-white hover:bg-black/90 px-6 rounded-none h-11 text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/10">
                Launch Your Studio
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-40 px-6">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-50 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gray-50 blur-[100px] rounded-full"></div>
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-10 mb-24">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-gray-600 text-[11px] font-bold tracking-[0.15em] uppercase"
              >
                <Crown className="w-4 h-4 text-black" />
                The Future of Interior Design Studios
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl md:text-8xl font-black tracking-tighter text-black leading-[0.9] max-w-5xl mx-auto uppercase italic"
              >
                Master Your Studio. <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-gray-700 to-black">Scale with Precision.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium"
              >
                The simplest operating system for interior design firms. Define your pricing, launch your branded site, and close projects faster than ever.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
              >
                <Link href="/signup">
                  <Button size="lg" className="bg-black hover:bg-gray-900 text-white h-16 px-12 rounded-none text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 group">
                    Launch Your Studio
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="h-16 px-12 rounded-none text-sm font-black uppercase tracking-[0.2em] border-black text-black hover:bg-black hover:text-white transition-all">
                    See the Demo
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Clean Professional Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.8 }}
              className="relative px-4"
            >
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent to-white/10 blur-3xl rounded-full -z-10"></div>
              <div className="relative rounded-none border border-gray-100 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden max-w-5xl mx-auto p-2">
                <div className="bg-gray-50 p-6 h-[450px] md:h-[550px] flex flex-col gap-6 overflow-hidden">
                  <div className="flex gap-8 h-full">
                    <div className="hidden md:flex flex-col gap-6 w-56 border-r border-gray-200 pr-6">
                      <div className="h-8 w-24 bg-black rounded-sm mb-4"></div>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-11 w-full rounded-none flex items-center px-4 gap-3 ${i === 1 ? 'bg-white shadow-sm border-l-2 border-black' : ''}`}>
                          <div className={`h-4 w-4 rounded-sm ${i === 1 ? 'bg-black' : 'bg-gray-200'}`}></div>
                          <div className={`h-2 w-20 ${i === 1 ? 'bg-black' : 'bg-gray-200'}`}></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-8">
                      <div className="flex justify-between items-end">
                        <div className="space-y-3">
                          <div className="h-8 w-48 bg-white border border-gray-100 px-4 flex items-center shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
                          </div>
                        </div>
                        <div className="h-10 w-32 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center italic">Live System</div>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-32 bg-white border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
                            <div className="h-8 w-8 bg-gray-50 flex items-center justify-center">
                              <Check className="h-4 w-4 text-black" />
                            </div>
                            <div className="h-2 w-full bg-gray-100"></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 p-8 shadow-sm">
                        <div className="flex gap-4 mb-6">
                          <div className="h-10 w-10 bg-black"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-100"></div>
                            <div className="h-2 w-48 bg-gray-50"></div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {[1, 2].map(i => (
                            <div key={i} className="h-4 w-full bg-gray-50"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Simplified Feature Grid */}
        <section id="features" className="py-40 bg-white border-y border-gray-50">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-24 space-y-4">
              <h2 className="text-[10px] font-black tracking-[0.4em] text-black uppercase">System Features</h2>
              <p className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase italic">Everything You Need.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="space-y-6 group"
                >
                  <div className="w-14 h-14 bg-black text-white flex items-center justify-center group-hover:bg-gray-800 transition-colors shadow-xl shadow-black/5">
                    {feature.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-black uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Simplified Process Section */}
        <section id="how-it-works" className="py-40 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-24 items-center">
              <div className="lg:w-1/2 space-y-12">
                <div className="space-y-6">
                  <h2 className="text-[10px] font-black tracking-[0.4em] text-black uppercase">How it works</h2>
                  <p className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase italic">Simple. Fast. Powerful.</p>
                </div>

                <div className="space-y-8">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-8 items-start group">
                      <div className="text-2xl font-black text-black shrink-0">{step.number}</div>
                      <div className="space-y-2 border-b border-gray-100 pb-8 w-full group-hover:border-black transition-colors">
                        <h4 className="text-xl font-black text-black uppercase">{step.title}</h4>
                        <p className="text-gray-500 leading-relaxed text-sm font-medium">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="relative border border-gray-100 bg-white p-12 shadow-2xl">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-20 bg-black"></div>
                      <div className="h-3 w-8 bg-gray-100"></div>
                    </div>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4">
                          <div className="h-3 w-full bg-gray-50"></div>
                          <div className="h-3 w-12 bg-gray-100"></div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-8 flex justify-between">
                      <div className="h-6 w-24 bg-gray-100"></div>
                      <div className="h-6 w-16 bg-black"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simplified Final CTA */}
        <section className="py-40 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-black p-16 md:p-24 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

              <div className="relative z-10 space-y-12">
                <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-tight">
                  Start Your Studio <br />
                  <span className="text-white/40">In Minutes.</span>
                </h2>
                <div className="flex justify-center">
                  <Link href="/signup">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100 h-16 px-16 rounded-none text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95">
                      Launch Your Studio
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center text-white font-black text-lg">
                  U
                </div>
                <span className="text-xl font-black tracking-tighter text-black uppercase italic">unmatrix.io</span>
              </div>
              <p className="text-gray-400 max-w-xs text-xs font-bold uppercase tracking-widest leading-relaxed">
                The interior design operating system. Precision growth for modern studios.
              </p>
            </div>

            <div className="flex gap-20">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black tracking-widest text-black uppercase">Navigation</h4>
                <ul className="space-y-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <li><Link href="#features" className="hover:text-black transition-colors">Features</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-black transition-colors">Process</Link></li>
                  <li><Link href="/login" className="hover:text-black transition-colors">Sign In</Link></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black tracking-widest text-black uppercase">Admin</h4>
                <ul className="space-y-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <li><Link href="/admin" className="hover:text-black transition-colors">Central Command</Link></li>
                  <li><Link href="/dashboard" className="hover:text-black transition-colors">Console</Link></li>
                  <li><span className="opacity-50">&copy; 2025</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-20 text-[9px] font-black tracking-[0.4em] text-gray-300 uppercase">
            Built for the architects of the new aesthetic.
          </div>
        </div>
      </footer>
    </div>
  );
}
