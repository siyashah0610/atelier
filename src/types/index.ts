export type SeasonalType =
  | 'Deep Winter'
  | 'Bright Winter'
  | 'True Winter'
  | 'Deep Autumn'
  | 'True Autumn'
  | 'Soft Autumn'
  | 'Light Spring'
  | 'True Spring'
  | 'Bright Spring'
  | 'Light Summer'
  | 'True Summer'
  | 'Soft Summer'

export interface ColorPalette {
  seasonalType: SeasonalType
  description: string
  undertone: 'warm' | 'cool' | 'neutral'
  confidenceScore?: number
  dominantColors: string[]
  coolColors?: string[]
  warmColors?: string[]
  neutrals: string[]
  toAvoid: string[]
  metals: ('silver' | 'gold' | 'rose gold')[]
  allHexCodes: string[]
}

export interface BodyProfile {
  height?: string
  bust?: string
  waist?: string
  hips?: string
  inseam?: string
  bodyType?: 'pear' | 'hourglass' | 'rectangle' | 'inverted-triangle' | 'apple'
  shirtSize?: string
  braSize?: string
  pantsSize?: string
  waistRise?: 'high' | 'mid' | 'low'
  shoeSize?: string
}

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong' | 'triangle'

export interface FaceAnalysis {
  faceShape: FaceShape
  analyzedAt: string
  confidence: number
  makeupTips: {
    contouring: string
    blush: string
    highlight: string
    eyeMakeup: string
    browShape: string
    lips: string
  }
  accessories: {
    earrings: string
    necklaces: string
    sunglasses: string
    hats: string
  }
  overallAdvice: string
}

export interface UserProfile {
  id: string
  name: string
  username: string
  palette?: ColorPalette
  bodyProfile?: BodyProfile
  faceAnalysis?: FaceAnalysis
  favoriteRetailers: string[]
}

export type ProductCategory = 'clothing' | 'shoes' | 'jewelry' | 'bags' | 'makeup'

export interface ColorOption {
  name: string
  hex: string
  matchScore: number
  url: string
  imageUrl: string
}

export interface Product {
  id: string
  name: string
  brand: string
  retailer: string
  price: number
  originalPrice?: number
  category: ProductCategory
  subcategory?: string
  imageUrl: string
  hexColors: string[]
  sizes?: string[]
  rating: number
  reviewCount: number
  affiliateUrl: string
  tags: string[]
  bodyTypeTags?: string[]
  aspectRatio?: 'tall' | 'square'
  matchScore?: number
  colorOptions?: ColorOption[]
}

export interface CartItem {
  product: Product
  size?: string
  quantity: number
}

export interface WishListItem {
  id: string
  addedAt: string
  analysisId: string
  productName: string
  productBrand: string
  productCategory: string
  productImageUrl: string | null
  productPrice: number | null
  storeName: string
  colorScore: number
  colorVerdict: string
  chosenColor: {
    name: string
    hex: string
    url: string | null
    imageUrl: string | null
    matchScore: number
    verdict: string
  } | null
}

export interface WishList {
  id: string
  name: string
  description?: string
  isPublic: boolean
  items: WishListItem[]
  createdAt: string
  updatedAt: string
}

export type Page = 'landing' | 'auth' | 'onboarding' | 'feed' | 'wishlists' | 'profile' | 'cart' | 'check' | 'analyses'

export interface SavedAnalysis {
  id: string
  savedAt: string
  productName: string
  productBrand: string
  productCategory: string
  productPrice: number | null
  productImageUrl: string | null
  productUrl: string | null
  colorScore: number
  colorVerdict: string
  overallRecommendation: string
  topColorPicks: Array<{
    name: string
    hex: string
    matchScore: number
    verdict: string
    url: string | null
    imageUrl: string | null
    reasoning?: string
  }>
  storeName: string
  isFavorited?: boolean
  wishListIds?: string[]
  recommendedSize?: string | null
  fullAnalysis?: {
    bodyTypeScore: number | null
    bodyTypeVerdict: string | null
    colorReasoning: string
    fitReasoning: string | null
    suggestedStyling: string | null
    sizeReasoning?: string | null
    allOptions: Array<{
      name: string
      hex: string
      url: string | null
      imageUrl: string | null
      matchScore: number
      verdict: string
      colorReasoning: string
      fitReasoning: string | null
    }>
  }
}
