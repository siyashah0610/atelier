import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { ColorPalette, UserProfile, BodyProfile, FaceAnalysis } from '../types'
import { resizeImageToBase64 } from '../utils/colorUtils'
import PaletteDisplay from '../components/PaletteDisplay'
import BodyStyleDisplay from '../components/BodyStyleDisplay'
import MakeupDisplay from '../components/MakeupDisplay'

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

type Step = 'intro' | 'login' | 'upload' | 'analyzing' | 'reveal' | 'body' | 'sizes' | 'retailers' | 'done'

export default function Onboarding() {
  const { setCurrentPage, setUserProfile, userProfile, dataLoading, initialized } = useApp()
  const { user, signUp, signIn, signInWithGoogle } = useAuth()
  const [step, setStep] = useState<Step>(() => {
    const mode = localStorage.getItem('atelier_auth_mode')
    if (mode === 'login') {
      localStorage.removeItem('atelier_auth_mode')
      return 'login'
    }
    return 'intro'
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null)
  const [analysisMsg, setAnalysisMsg] = useState(0)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [bodyType, setBodyType] = useState('')
  const [height, setHeight] = useState('')
  const [bust, setBust] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [shirtSize, setShirtSize] = useState('')
  const [braSize, setBraSize] = useState('')
  const [pantsSize, setPantsSize] = useState('')
  const [waistRise, setWaistRise] = useState<'high' | 'mid' | 'low' | ''>('')
  const [shoeSize, setShoeSize] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isDragOverUpload, setIsDragOverUpload] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Route the user based on their profile completion status after authentication
  useEffect(() => {
    // Wait until AppContext has finished its initial data load
    if (user && initialized && !dataLoading) {
      if (userProfile?.palette) {
        // Account already completed onboarding -> go directly to profile
        setCurrentPage('profile')
      } else if (step === 'intro') {
        // New account -> skip intro and go to step 2 (photo upload)
        setName(user.user_metadata?.name ?? '')
        setUsername(user.user_metadata?.username ?? '')
        setStep('upload')
      }
    }
  }, [user, initialized, dataLoading, userProfile, step, setCurrentPage])

  // Attach stream to video element once camera modal is rendered
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraOpen])

  // Clean up stream on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])

  const openCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError('Camera access was denied. Please allow camera permissions and try again.')
    }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setFiles((prev) => [...prev, file])
      setPreviews((prev) => [...prev, url])
      closeCamera()
    }, 'image/jpeg', 0.9)
  }

  const flipCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch { closeCamera() }
  }

  const addFiles = (newFiles: File[] | FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 10 - files.length)
    if (!arr.length) return
    setFiles((prev) => [...prev, ...arr])
    arr.forEach((f) => {
      const url = URL.createObjectURL(f)
      setPreviews((prev) => [...prev, url])
    })
  }

  const handleUploadDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (files.length >= 10) return
    setIsDragOverUpload(true)
  }

  const handleUploadDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOverUpload(false)
  }

  const handleUploadDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOverUpload(false)
    if (files.length >= 10) return
    addFiles(e.dataTransfer.files)
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
      const { warnings: w = [], faceAnalysis: fa = null, ...paletteData } = data
      setWarnings(w)
      setPalette(paletteData as ColorPalette)
      if (fa) setFaceAnalysis(fa as FaceAnalysis)
    } catch {
      // Fallback to sample data
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
      // Set sample face analysis if API fails
      setFaceAnalysis({
        faceShape: 'oval',
        analyzedAt: new Date().toISOString(),
        confidence: 0.85,
        makeupTips: {
          contouring: 'Minimal contouring needed; your oval shape is naturally balanced. Use subtle shading on the temples.',
          blush: 'Apply to the apples of your cheeks for a lifted effect.',
          highlight: 'Place highlights on your cheekbones and the center of the forehead.',
          eyeMakeup: 'Neutral to warm tones work best; avoid overly cool purples.',
          browShape: 'Slightly angled brows enhance your natural shape perfectly.',
          lips: 'Warm reds, terracottas, and browns complement your coloring.',
        },
        accessories: {
          earrings: 'Drop earrings and chandeliers frame your face beautifully.',
          necklaces: 'Medium-length necklaces and collars look most flattering.',
          sunglasses: 'Oval or cat-eye frames suit your face shape.',
          hats: 'Most hat styles work well; experiment with different brims.',
        },
        overallAdvice: 'Your oval face shape is versatile; you can pull off most makeup looks and accessory styles.',
      })
    } finally {
      clearInterval(interval)
      setStep('reveal')
    }
  }

  const finish = () => {
    if (!palette) return
    const hasBodyData = bodyType || height || bust || waist || hips || shirtSize || braSize || pantsSize || waistRise || shoeSize
    const profile: UserProfile = {
      id: user?.id ?? crypto.randomUUID(),
      name: name || user?.user_metadata?.name || 'You',
      username: username || user?.user_metadata?.username || 'my_atelier',
      palette,
      favoriteRetailers: selectedRetailers,
      bodyProfile: hasBodyData ? {
        bodyType: bodyType as BodyProfile['bodyType'],
        height: height || undefined,
        bust: bust || undefined,
        waist: waist || undefined,
        hips: hips || undefined,
        shirtSize: shirtSize || undefined,
        braSize: braSize || undefined,
        pantsSize: pantsSize || undefined,
        waistRise: (waistRise as BodyProfile['waistRise']) || undefined,
        shoeSize: shoeSize || undefined,
      } : undefined,
      faceAnalysis: faceAnalysis || undefined,
    }
    setUserProfile(profile)
    setCurrentPage('profile')
  }

  const handleCreateAccount = async () => {
    if (!name.trim()) { setAuthError('Please enter your name.'); return }
    if (!email.trim()) { setAuthError('Please enter your email.'); return }
    if (password.length < 6) { setAuthError('Password must be at least 6 characters.'); return }
    setAuthLoading(true)
    setAuthError(null)
    const err = await signUp(
      email.trim(),
      password,
      name.trim(),
      username.trim() || name.trim().toLowerCase().replace(/\s+/g, '_'),
    )
    setAuthLoading(false)
    if (err) { setAuthError(err); return }
    setStep('upload')
  }

  const handleSignIn = async () => {
    if (!email.trim()) { setAuthError('Please enter your email.'); return }
    if (!password) { setAuthError('Please enter your password.'); return }
    setAuthLoading(true)
    setAuthError(null)
    const err = await signIn(email.trim(), password)
    setAuthLoading(false)
    if (err) { setAuthError(err); return }
    // AppContext will catch the user state change and automatically handle routing
  }

  const toggleRetailer = (r: string) =>
    setSelectedRetailers((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    )

  const estimatedSize = (() => {
    const b = parseFloat(bust), w = parseFloat(waist), h = parseFloat(hips)
    const ref = !isNaN(b) ? b : !isNaN(h) ? h - 2 : !isNaN(w) ? w + 10 : NaN
    if (isNaN(ref)) return null
    if (ref <= 33) return 'XS'
    if (ref <= 35) return 'S'
    if (ref <= 37.5) return 'M'
    if (ref <= 40) return 'L'
    if (ref <= 42) return 'XL'
    return 'XXL'
  })()

  const progress = {
    intro: 0, login: 8, upload: 17, analyzing: 34, reveal: 50, body: 66, sizes: 82, retailers: 93, done: 100,
  }[step]

  return (
    <>
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
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
            </div>
            <div className="pt-2">
              <button onClick={signInWithGoogle} className="w-full py-3.5 bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
            {authError && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                {authError}
              </div>
            )}
            <button
              onClick={handleCreateAccount}
              disabled={authLoading}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account & Continue'}
            </button>
            <p className="text-center text-xs text-stone-400">
              Already have an account?{' '}
              <button onClick={() => setStep('login')} className="font-semibold text-stone-700 hover:underline">
                Sign in
              </button>
            </p>
            <button
              onClick={() => setCurrentPage('landing')}
              className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step: Login ── */}
        {step === 'login' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="font-serif text-3xl text-stone-900">Welcome back.</h1>
              <p className="text-stone-500 mt-3 leading-relaxed">
                Sign in to access your palette and wish lists.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
            </div>
            <div className="pt-2">
              <button onClick={signInWithGoogle} className="w-full py-3.5 bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
            {authError && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                {authError}
              </div>
            )}
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
            <p className="text-center text-xs text-stone-400">
              Don't have an account?{' '}
              <button onClick={() => setStep('intro')} className="font-semibold text-stone-700 hover:underline">
                Sign up
              </button>
            </p>
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
            <div
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
              className={`grid grid-cols-2 gap-3 rounded-2xl transition-colors ${
                isDragOverUpload ? 'bg-stone-50 ring-2 ring-stone-300 ring-offset-2' : ''
              }`}
            >
              <button
                onClick={openCamera}
                disabled={files.length >= 10}
                className="border-2 border-stone-200 rounded-2xl py-8 text-center hover:border-stone-400 transition-colors disabled:opacity-40 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">📸</span>
                <p className="text-sm font-medium text-stone-700">Take a photo</p>
                <p className="text-xs text-stone-400">Live camera</p>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={files.length >= 10}
                className="border-2 border-stone-200 rounded-2xl py-8 text-center hover:border-stone-400 transition-colors disabled:opacity-40 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🖼️</span>
                <p className="text-sm font-medium text-stone-700">Upload photos</p>
                <p className="text-xs text-stone-400">From library</p>
              </button>
            </div>
            {cameraError && (
              <p className="text-xs text-rose-500 text-center">{cameraError}</p>
            )}
            {files.length > 0 && (
              <p className="text-xs text-center text-stone-400">{files.length}/10 photos added</p>
            )}

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
        {/* ── Step: Reveal — Color & Makeup ── */}
        {step === 'reveal' && palette && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 3 of 5 — Color Analysis
              </p>
              <h1 className="font-serif text-3xl text-stone-900">
                You're a{' '}
                <span className="italic">{palette.seasonalType}</span>
              </h1>
            </div>

            {warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">
                  Photo quality notes
                </p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700 leading-relaxed">· {w}</p>
                ))}
                <p className="text-xs text-amber-600 mt-2">
                  Better photos will improve accuracy — you can redo your analysis anytime from your profile.
                </p>
              </div>
            )}

            <PaletteDisplay palette={palette} />

            <div className="border-t border-stone-100 pt-6 space-y-4">
              <div>
                <h2 className="font-serif text-2xl text-stone-900">Your makeup shades.</h2>
                <p className="text-stone-500 mt-1.5 text-sm leading-relaxed">
                  Foundation, blush, contour, and lip colors matched to your exact coloring.
                </p>
              </div>
              <MakeupDisplay seasonalType={palette.seasonalType} />
            </div>

            <button
              onClick={() => setStep('body')}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step: Body — Shape & Style ── */}
        {step === 'body' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 4 of 6 — Style Profile
              </p>
              <h1 className="font-serif text-3xl text-stone-900">Dress your best.</h1>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed">
                Select your body shape to see the silhouettes and styles that flatter you most.
              </p>
            </div>

            {/* Body shape selector */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
                Body Shape
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pear',              label: 'Pear',          emoji: '🍐' },
                  { id: 'hourglass',         label: 'Hourglass',     emoji: '⏳' },
                  { id: 'rectangle',         label: 'Rectangle',     emoji: '▬'  },
                  { id: 'inverted-triangle', label: 'Inv. Triangle', emoji: '▽'  },
                  { id: 'apple',             label: 'Apple',         emoji: '🍎' },
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

            {/* Avatar + style recommendations */}
            {bodyType && <BodyStyleDisplay key={bodyType} bodyType={bodyType} />}

            {/* Optional measurements */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
                  Measurements (Optional)
                </p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Used to refine fit recommendations — never shown publicly.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Height',    val: height, set: setHeight, placeholder: "e.g. 5'7\"" },
                  { label: 'Bust (in)', val: bust,   set: setBust,   placeholder: 'e.g. 36'    },
                  { label: 'Waist (in)',val: waist,  set: setWaist,  placeholder: 'e.g. 28'    },
                  { label: 'Hips (in)', val: hips,   set: setHips,   placeholder: 'e.g. 38'    },
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

              {estimatedSize && (
                <div className="mt-3 flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {estimatedSize}
                  </div>
                  <p className="text-xs text-stone-600">
                    Based on your measurements, we estimate you're a <span className="font-semibold">{estimatedSize}</span>. You'll confirm your actual sizes next.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setStep('sizes')}
                className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setStep('sizes')}
                className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Sizes ── */}
        {step === 'sizes' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Step 5 of 6 — Sizing
              </p>
              <h1 className="font-serif text-3xl text-stone-900">Let's nail your fit.</h1>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed">
                Tell us your usual sizes so we can recommend the right fit every time.
              </p>
            </div>

            {estimatedSize && (
              <div className="flex items-center gap-3 bg-stone-900 text-white rounded-2xl px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-white text-stone-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {estimatedSize}
                </div>
                <div>
                  <p className="text-sm font-semibold">Estimated size: {estimatedSize}</p>
                  <p className="text-xs text-stone-300 mt-0.5">Based on your measurements — confirm or adjust below.</p>
                </div>
              </div>
            )}

            {/* Tops */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Tops & Shirts</p>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2">Shirt size</label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setShirtSize(shirtSize === s ? '' : s)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        shirtSize === s
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Bra size</label>
                <input
                  value={braSize}
                  onChange={(e) => setBraSize(e.target.value)}
                  placeholder="e.g. 34B, 32C"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
            </div>

            {/* Bottoms */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Bottoms</p>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Pants / jeans size</label>
                <input
                  value={pantsSize}
                  onChange={(e) => setPantsSize(e.target.value)}
                  placeholder="e.g. 27, size 6, 28×30"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2">Rise preference</label>
                <div className="flex gap-2">
                  {([
                    { val: 'high', label: 'High-waisted' },
                    { val: 'mid',  label: 'Mid-rise'     },
                    { val: 'low',  label: 'Low-rise'     },
                  ] as { val: 'high' | 'mid' | 'low'; label: string }[]).map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setWaistRise(waistRise === opt.val ? '' : opt.val)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        waistRise === opt.val
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shoes */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Shoes</p>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Shoe size (US)</label>
                <input
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  placeholder="e.g. 8, 8.5, 9"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>
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
                Step 6 of 6 — Your Stores
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

    {/* ── Camera overlay ── */}

    {cameraOpen && (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Video feed */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          {/* Face guide oval */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 300 360" className="w-64 h-80 opacity-50">
              <ellipse
                cx="150" cy="180" rx="120" ry="155"
                fill="none" stroke="white" strokeWidth="2" strokeDasharray="8 6"
              />
            </svg>
          </div>
          {/* Top hint */}
          <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-white/70 text-xs bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Position your face in the guide
            </span>
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-black/90 py-8 px-8 flex items-center justify-between safe-area-bottom">
          {/* Close */}
          <button
            onClick={closeCamera}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl"
          >
            ✕
          </button>

          {/* Shutter */}
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white/60 bg-transparent flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>

          {/* Flip */}
          <button
            onClick={flipCamera}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl"
          >
            ⟳
          </button>
        </div>

        {/* Hidden capture canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )}
    </>
  )
}
