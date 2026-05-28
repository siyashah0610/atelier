import React from 'react'
import { useApp } from '../context/AppContext'

const PALETTE_EXAMPLES = [
  { name: 'Soft Autumn', colors: ['#C19A6B', '#87A878', '#C0634A', '#D4A583', '#6B7A3C'] },
  { name: 'Deep Winter', colors: ['#6D1A36', '#1F3A5C', '#0B5E42', '#36454F', '#C9B1DB'] },
  { name: 'Light Summer', colors: ['#D4A3A3', '#C9B1DB', '#87A878', '#5B7FA6', '#D4919A'] },
  { name: 'True Spring', colors: ['#C0634A', '#C5A028', '#87A878', '#E8806A', '#D4A583'] },
]

const FEATURES = [
  {
    icon: '✦',
    title: 'AI Color Analysis',
    description:
      'Upload 5–10 photos and our AI determines your exact seasonal palette — all 40 of your best hex codes.',
  },
  {
    icon: '◈',
    title: 'Personalized Feed',
    description:
      'Every product in your feed is palette-matched. No more scrolling through colors that will never suit you.',
  },
  {
    icon: '⬡',
    title: 'Wish Lists & Face Analysis',
    description:
      'Save analyses into public or private wish lists, and get personalised makeup tips from your face shape.',
  },
  {
    icon: '◉',
    title: 'Unified Cart',
    description:
      'Shop Revolve, Aritzia, Sephora — all in one place. One review of your cart, then check out per retailer.',
  },
]

export default function Landing() {
  const { setCurrentPage } = useApp()

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <span className="font-serif text-2xl font-semibold text-stone-900">atelier</span>
        <button
          onClick={() => {
            localStorage.setItem('atelier_auth_mode', 'login')
            setCurrentPage('onboarding')
          }}
          className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Now in early access
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl text-stone-900 leading-[1.1] mb-6">
            Shop only in{' '}
            <span className="italic">your colors.</span>
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed mb-8">
            Upload a few photos. Atelier analyzes your skin tone, hair, and eyes to find your
            exact color palette — then filters every product from your favorite stores to only
            what will actually flatter you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCurrentPage('onboarding')}
              className="px-7 py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition-colors"
            >
              Get Your Color Analysis
            </button>
            <button
              onClick={() => setCurrentPage('onboarding')}
              className="px-7 py-3.5 border border-stone-300 text-stone-700 text-sm font-medium rounded-full hover:border-stone-500 transition-colors"
            >
              See a Demo
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-4">
            Free to start · No credit card required
          </p>
        </div>

        {/* Palette examples */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-md">
          {PALETTE_EXAMPLES.map((example) => (
            <div
              key={example.name}
              className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100"
            >
              <div className="flex gap-1.5 mb-3">
                {example.colors.map((hex, i) => (
                  <div
                    key={i}
                    className="flex-1 h-12 rounded-lg"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-stone-700 font-serif">{example.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <span className="text-2xl text-stone-400">{f.icon}</span>
              <h3 className="font-serif text-lg text-stone-900 mt-3 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="font-serif text-4xl text-stone-900 mb-4">How it works</h2>
        <p className="text-stone-500 mb-16">Three steps to never buying the wrong color again.</p>
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            {
              step: '01',
              title: 'Upload Your Photos',
              desc: 'Take 5–10 photos in natural light — no makeup, hair back. Our quality check guides you.',
            },
            {
              step: '02',
              title: 'Receive Your Palette',
              desc: 'In seconds, get your seasonal type and a personalized palette of 40 hex codes.',
            },
            {
              step: '03',
              title: 'Shop Your Feed',
              desc: 'Browse a curated feed from your favorite stores — filtered to only your best colors.',
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center">
              <span className="font-serif text-4xl text-stone-200 font-bold mb-4">{item.step}</span>
              <h4 className="font-serif text-lg text-stone-900 mb-2">{item.title}</h4>
              <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-900 py-20 px-6 text-center">
        <h2 className="font-serif text-4xl text-white mb-4">
          Ready to shop in your colors?
        </h2>
        <p className="text-stone-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Join thousands of women who finally shop with confidence — knowing every piece in their feed
          was chosen for them.
        </p>
        <button
          onClick={() => setCurrentPage('onboarding')}
          className="px-8 py-4 bg-white text-stone-900 text-sm font-semibold rounded-full hover:bg-stone-100 transition-colors"
        >
          Start My Color Analysis
        </button>
      </section>

      <footer className="py-8 text-center text-xs text-stone-400 border-t border-stone-100">
        © 2026 Atelier · All rights reserved
      </footer>
    </div>
  )
}
