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
  dominantColors: string[]   // statement / best colors for the season
  coolColors?: string[]      // blues, purples, teals
  warmColors?: string[]      // reds, oranges, earthy tones
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
}

export interface UserProfile {
  id: string
  name: string
  username: string
  palette?: ColorPalette
  bodyProfile?: BodyProfile
  favoriteRetailers: string[]
}

export type ProductCategory = 'clothing' | 'shoes' | 'jewelry' | 'bags' | 'makeup'

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
}

export interface CartItem {
  product: Product
  size?: string
  quantity: number
}

export interface Board {
  id: string
  name: string
  description?: string
  isPublic: boolean
  coverImage?: string
  products: Product[]
  createdAt: string
  updatedAt: string
  type: 'inspiration' | 'outfit' | 'capsule'
}

export type Page = 'landing' | 'onboarding' | 'feed' | 'boards' | 'profile' | 'cart' | 'check' | 'analyses'

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
  fullAnalysis?: {
    bodyTypeScore: number | null
    bodyTypeVerdict: string | null
    colorReasoning: string
    fitReasoning: string | null
    suggestedStyling: string | null
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
