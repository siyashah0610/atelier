export interface StoredProfile {
  name: string
  palette: {
    seasonalType: string
    undertone: string
    dominantColors: string[]
    neutrals: string[]
    toAvoid: string[]
    allHexCodes: string[]
  } | null
  bodyProfile: {
    bodyType?: string
    height?: string
    bust?: string
    waist?: string
    hips?: string
    shirtSize?: string
    pantsSize?: string
    shoeSize?: string
  } | null
  faceAnalysis: {
    faceShape: string
  } | null
}

export function getProfile(): Promise<StoredProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('atelier_profile', (result) => {
      resolve(result['atelier_profile'] ?? null)
    })
  })
}

export function saveProfile(profile: StoredProfile): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ atelier_profile: profile }, resolve)
  })
}

export function clearProfile(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove('atelier_profile', resolve)
  })
}

export function getActiveTabUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url ?? null)
    })
  })
}
