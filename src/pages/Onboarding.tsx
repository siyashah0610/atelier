import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { ColorPalette, UserProfile } from '../types'
import { resizeImageToBase64 } from '../utils/colorUtils'
import PaletteDisplay from '../components/PaletteDisplay'

const RETAILERS = [
  'Revolve', 'Aritzia', 'Free People', 'Mango', 'ASOS',
  'Zara', 'Reformation', 'H&M', '& Other Stories', 'Everlane',
  'J.Crew', 'Madewell', 'Steve Madden', 'Mejuri', 'Sephora',
]

const ANALYSIS_MESSAGES = [
  'Detecting facial features…',
  'Analyzing skin tone & undertone…',
  'Reading your hair color…',
  'Mapping your color contrast…',
  'Matching to seasonal palettes…',
  'Generating your hex palette…',
]

type Step = 'intro' | 'upload' | 'analyzing' | 'reveal' | 'body' | 'retailers' | 'done'

export default function Onboarding() {
  const { setCurrentPage, setUserProfile } = useApp()
  const [step, setStep] = useState<Step>('intro')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [analysisMsg, setAnalysisMsg] = useState(0)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([])
  const [bodyType, setBodyType] = useState('')
  const [height, setHeight] = useState('')
  const [bust, setBust] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles).slice(0, 10 - files.length)
    setFiles((prev) => [...prev, ...arr])
    arr.forEach((f) => {
      const url = URL.createObjectURL(f)
      setPreviews((prev) => [...prev, url])
    })
  }

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i])
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const runAnalysis = async () => {
    setStep('analyzing')
    const interval = setInterval(() => {
      setAnalysisMsg((m) => (m + 1) % ANALYSIS_MESSAGES.length)
    }, 700)

    try {
      const images = await Promise.all(files.slice(0, 8).map((f) => resizeImageToBase64(f)))
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
      const data = await res.json()
      setPalette(data as ColorPalette)
    } catch {
      // Fallback palette if anything fails
      setPalette({
        seasonalType: 'Soft Autumn',
        description:
          'Your coloring features warm, golden undertones with medium contrast. Muted, earthy tones enhance your natural warmth.',
        undertone: 'warm',
        dominantColors: ['#C19A6B', '#87A878', '#C0634A', '#D4A583', '#6B7A3C', '#C4956A', '#D4825C', '#8B6343'],
        neutrals: ['#F5E6D3', '#E8D5C4', '#D4C4B0', '#C4B4A0', '#A89880'],
        toAvoid: ['#0000FF', '#FF69B4', '#000080', '#FF00FF'],
        metals: ['gold', 'rose gold'],
        allHexCodes: [
          '#C19A6B', '#87A878', '#C0634A', '#D4A583', '#6B7A3C', '#C4956A',
          '#D4825C', '#8B6343', '#B7410E', '#A67C52', '#9B7A5C', '#D4B896',
          '#E8C9A0', '#F5E6D3', '#E8D5C4', '#D4C4B0', '#C4B4A0', '#A89880',
          '#C5A028', '#B8860B', '#7A8C4A', '#9DAF6E', '#4A5C2E', '#D47A5C',
          '#C86042', '#B84A2E', '#8B3A2A', '#6D2A1E', '#C19A6B', '#87A878',
          '#C0634A', '#D4A583', '#6B7A3C', '#C4956A', '#D4825C', '#8B6343',
        ],
      })
    } finally {
      clearInterval(interval)
      setStep('reveal')
    }
  }

  const finish = () => {
    if (!palette) return
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: name || 'You',
      username: username || 'my_atelier',
      palette,
      favoriteRetailers: selectedRetailers,
      bodyProfile:
        bodyType || height || bust || waist || hips
          ? {
              bodyType: bodyType as UserProfile['bodyProfile'] extends undefined ? never : NonNullable<UserProfile['bodyProfile']>['bodyType'],
              height,
              bust,
              waist,
              hips,
            }
          : undefined,
    }
    setUserProfile(profile)
    setCurrentPage('feed')
  }

  const toggleRetailer = (r: string) =>
    setSelectedRetailers((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    )

  const progress = {
    intro: 0, upload: 20, analyzing: 40, reveal: 55, body: 70, retailers: 85, done: 100,
  }[step]

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Progress bar */}
      <div className="h-1 bg-stone-100">
        <div
          className="h-full bg-stone-900 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-5 py-10">

        {/* ── Step: Intro ── */}
        {step === 'intro' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 1 of 5
              </p>
              <h1 className="font-serif text-3xl text-stone-900">Let's start with you.</h1>
              <p className="text-stone-500 mt-3 leading-relaxed">
                A quick profile so we can personalize your experience.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Your name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Username
                </label>
                <div className="flex items-center border border-stone-200 rounded-xl bg-white overflow-hidden">
                  <span className="px-3 text-stone-400 text-sm">@</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, ''))}
                    placeholder="your_handle"
                    className="flex-1 pr-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('upload')}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => setCurrentPage('landing')}
              className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 2 of 5 — Photos
              </p>
              <h1 className="font-serif text-3xl text-stone-900">Upload your photos</h1>
              <p className="text-stone-500 mt-3 leading-relaxed text-sm">
                For the best analysis, use photos with:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-stone-500">
                {['Natural daylight', 'Minimal or no makeup', 'Hair pulled back', 'Face clearly visible'].map(
                  (tip) => (
                    <li key={tip} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> {tip}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Upload area */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-300 rounded-2xl py-10 text-center hover:border-stone-400 transition-colors"
            >
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm font-medium text-stone-700">
                {files.length === 0 ? 'Tap to add photos' : `Add more (${files.length}/10)`}
              </p>
              <p className="text-xs text-stone-400 mt-1">5–10 photos recommended</p>
            </button>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <button
                disabled={files.length < 1}
                onClick={runAnalysis}
                className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Analyze My Colors ({files.length} photo{files.length !== 1 ? 's' : ''})
              </button>
              <button
                onClick={runAnalysis}
                className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
              >
                Skip — use a sample analysis instead
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Analyzing ── */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-stone-900 animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Analyzing your coloring</h2>
              <p className="text-stone-500 text-sm animate-fade-in" key={analysisMsg}>
                {ANALYSIS_MESSAGES[analysisMsg]}
              </p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-stone-300 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Reveal ── */}
        {step === 'reveal' && palette && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 3 of 5 — Your Palette
              </p>
              <h1 className="font-serif text-3xl text-stone-900">
                You're a{' '}
                <span className="italic">{palette.seasonalType}</span>
              </h1>
            </div>
            <PaletteDisplay palette={palette} />
            <button
              onClick={() => setStep('body')}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step: Body ── */}
        {step === 'body' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 4 of 5 — Body Profile (Optional)
              </p>
              <h1 className="font-serif text-3xl text-stone-900">
                Perfect fit, every time.
              </h1>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed">
                Add your measurements so we can filter cuts and silhouettes that flatter your shape.
                This is completely optional and never shown publicly.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
                Body Type
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pear', label: 'Pear', emoji: '🍐' },
                  { id: 'hourglass', label: 'Hourglass', emoji: '⏳' },
                  { id: 'rectangle', label: 'Rectangle', emoji: '▬' },
                  { id: 'inverted-triangle', label: 'Inv. Triangle', emoji: '▽' },
                  { id: 'apple', label: 'Apple', emoji: '🍎' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setBodyType(type.id === bodyType ? '' : type.id)}
                    className={`py-3 px-2 rounded-xl border text-sm transition-colors flex flex-col items-center gap-1 ${
                      bodyType === type.id
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-xl">{type.emoji}</span>
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Height', val: height, set: setHeight, placeholder: 'e.g. 5\'7"' },
                { label: 'Bust (in)', val: bust, set: setBust, placeholder: 'e.g. 36' },
                { label: 'Waist (in)', val: waist, set: setWaist, placeholder: 'e.g. 28' },
                { label: 'Hips (in)', val: hips, set: setHips, placeholder: 'e.g. 38' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    {field.label}
                  </label>
                  <input
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setStep('retailers')}
                className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setStep('retailers')}
                className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Retailers ── */}
        {step === 'retailers' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 5 of 5 — Your Stores
              </p>
              <h1 className="font-serif text-3xl text-stone-900">Where do you love to shop?</h1>
              <p className="text-stone-500 mt-2 text-sm">
                Select your favorite retailers. We'll prioritize their products in your feed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {RETAILERS.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRetailer(r)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    selectedRetailers.includes(r)
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={finish}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
            >
              Enter My Feed →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
