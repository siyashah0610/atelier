import React from 'react'
import { SeasonalType } from '../types'

interface MakeupCategory {
  label: string
  hexes: string[]
}

interface MakeupProfile {
  chromaTip: string
  foundation: MakeupCategory
  contour: MakeupCategory
  bronzer: MakeupCategory
  blush: MakeupCategory
  eyeshadow: MakeupCategory
  mascara: { label: string; hex: string }
  lipsNude: MakeupCategory
  lipsRed: MakeupCategory
}

const PROFILES: Record<string, MakeupProfile> = {
  'Deep Winter': {
    chromaTip: 'Your clear, high-contrast coloring carries saturated, bold pigments — avoid anything sheer or washed out.',
    foundation: {
      label: 'Deep cool-brown with blue-red undertones. Look for shades labeled "C," "Cool," or "Rose" at deep depth.',
      hexes: ['#3D1A1A', '#4A2020', '#5C2A1A', '#6B3828'],
    },
    contour: {
      label: 'Near-black cool ebony. True shadows read grey-black on deep skin — avoid anything warm or brown.',
      hexes: ['#1E0A0A', '#2A1010', '#381818'],
    },
    bronzer: {
      label: 'Deep red-based mahogany. Mimics sun-kissed melanin on deep skin.',
      hexes: ['#6B2020', '#7A2828', '#8B3030'],
    },
    blush: {
      label: 'Vivid fuchsia or deep magenta — high saturation reads natural on deep skin, not clownish.',
      hexes: ['#CC1166', '#BB0055', '#990044', '#AA0060'],
    },
    eyeshadow: {
      label: 'Icy silver and cool violet to contrast; deep jewel-toned plum for definition.',
      hexes: ['#C0C8D8', '#9090B8', '#7766AA', '#4A1A5C'],
    },
    mascara: { label: 'Jet black — carbon black provides essential contrast on deep skin.', hex: '#080808' },
    lipsNude: {
      label: 'Deep berry-brown or dark chocolate. True nudes must be deeply pigmented to register.',
      hexes: ['#6B2A40', '#7A3050', '#8B3848'],
    },
    lipsRed: {
      label: 'Blue-based cherry or blackberry — these read as true red and make teeth look whiter.',
      hexes: ['#CC0033', '#AA0022', '#BB0044', '#990033'],
    },
  },

  'Bright Winter': {
    chromaTip: 'High contrast, clear coloring means you can wear the most saturated, vivid makeup without it overpowering you.',
    foundation: {
      label: 'Light with distinct pink/rose undertones. Look for "Rose," "C," or "Cool" at a light depth.',
      hexes: ['#F0D0D0', '#ECC0C0', '#F5D8D0', '#E8C8C4'],
    },
    contour: {
      label: 'Cool grey-taupe — mimics the shadow naturally cast by light hitting fair skin.',
      hexes: ['#A89090', '#9A8484', '#907878'],
    },
    bronzer: {
      label: 'Rosy-soft brown. Avoid orange; a faint pink warmth looks natural on light cool skin.',
      hexes: ['#CC9090', '#BB8080', '#C08878'],
    },
    blush: {
      label: 'Bright cherry pink or vivid rose — your clear coloring loves high chroma flush.',
      hexes: ['#EE3388', '#DD2277', '#CC1166', '#EE2266'],
    },
    eyeshadow: {
      label: 'Icy whites and sky blues for drama; deep jewel purple for a bold liner look.',
      hexes: ['#DDEEFF', '#99BBEE', '#4466DD', '#8833BB'],
    },
    mascara: { label: 'Jet black — your high contrast coloring handles it beautifully.', hex: '#0A0A14' },
    lipsNude: {
      label: 'Cool pink or icy rose — warm nudes will look muddy against your cool, clear skin.',
      hexes: ['#E88898', '#D87888', '#CC7080'],
    },
    lipsRed: {
      label: 'True red or electric hot pink — vivid and saturated to match your clear coloring.',
      hexes: ['#FF0044', '#EE0033', '#CC0033'],
    },
  },

  'True Winter': {
    chromaTip: 'Clear and cool — go for clean, saturated pigments with no warmth or frostiness.',
    foundation: {
      label: 'Medium cool-tone with pink/rose cast. Look for "Rose Beige," "Cool," or "C" codes.',
      hexes: ['#7A4A4A', '#8A5050', '#9A5858', '#6A4040'],
    },
    contour: {
      label: 'Cool dark brown — should read as a true shadow, not a warm bronze.',
      hexes: ['#6A4040', '#583838', '#4A2C2C'],
    },
    bronzer: {
      label: 'Neutral cool-leaning brown. Skip bright orange bronzers; you want depth, not warmth.',
      hexes: ['#8A5A50', '#9A6858', '#7A4A40'],
    },
    blush: {
      label: 'Deep berry or vivid cool rose — brings life to your cool-toned complexion.',
      hexes: ['#CC2266', '#BB1155', '#DD3377', '#AA0044'],
    },
    eyeshadow: {
      label: 'Navy, emerald, and icy silver — jewel tones make brown/dark eyes striking.',
      hexes: ['#002299', '#006633', '#333366', '#B8C0CC'],
    },
    mascara: { label: 'True black — crisp and clean for defined eyes.', hex: '#080808' },
    lipsNude: {
      label: 'Cool berry-nude or dark rose — warm beige nudes disappear on cool skin.',
      hexes: ['#8A5060', '#9A5868', '#7A4050'],
    },
    lipsRed: {
      label: 'True blue-based red — classic, clean, and cool.',
      hexes: ['#CC0000', '#AA0000', '#CC0033'],
    },
  },

  'Deep Autumn': {
    chromaTip: 'Rich, muted, and earthy — avoid anything icy, bright, or pastel; go for depth and earth tones.',
    foundation: {
      label: 'Rich deep warm brown, chestnut. Look for "Golden," "W," or "Warm" at deep depth.',
      hexes: ['#5C2E0A', '#6A3810', '#7A4820', '#8A5828'],
    },
    contour: {
      label: 'Deep dark warm brown — earthy chestnut that reads as shadow without ashy grey.',
      hexes: ['#3A180A', '#4A2010', '#5A2C18'],
    },
    bronzer: {
      label: 'Burnt sienna and deep terracotta — rich and warm with red undertones.',
      hexes: ['#8B3C0A', '#9A4810', '#A05015', '#B05820'],
    },
    blush: {
      label: 'Brick red and burnt coral — deep earthy flush that looks flush-like, not painted on.',
      hexes: ['#B83808', '#C04010', '#A03008', '#B84815'],
    },
    eyeshadow: {
      label: 'Warm chocolate, terracotta, and deep gold — earthy jewel tones for muted warmth.',
      hexes: ['#8B4A18', '#A06030', '#C07830', '#D49040'],
    },
    mascara: { label: 'Deep espresso — warmer than black, softer and more harmonious.', hex: '#280E04' },
    lipsNude: {
      label: 'Warm chocolate-brown or dark caramel nude.',
      hexes: ['#7A3820', '#8A4828', '#9A5830'],
    },
    lipsRed: {
      label: 'Fiery orange-red or brick — warm-based reds that glow against deep warm skin.',
      hexes: ['#CC4400', '#AA3300', '#BB3800', '#CC4A10'],
    },
  },

  'True Autumn': {
    chromaTip: 'Muted and warm — look for earthy, slightly dusty pigments. Avoid anything icy or neon.',
    foundation: {
      label: 'Warm golden brown or caramel. Look for "Golden," "Caramel," or "W" shades.',
      hexes: ['#8B5A28', '#9A6838', '#A07040', '#B07848'],
    },
    contour: {
      label: 'Rich warm espresso or deep bronze — warm, earthy, not ashy.',
      hexes: ['#6B3E18', '#5A3010', '#7A4820'],
    },
    bronzer: {
      label: 'Golden terracotta and rich copper — warm and glowing.',
      hexes: ['#A07040', '#B08040', '#C89050', '#B07838'],
    },
    blush: {
      label: 'Warm papaya, burnt peach, and golden coral — earthy warmth on the cheeks.',
      hexes: ['#C06838', '#D07848', '#B85A30', '#C87040'],
    },
    eyeshadow: {
      label: 'Bronze, warm gold, and rich copper — earthy metallics that enhance warm eyes.',
      hexes: ['#9B6830', '#B07838', '#C89050', '#A87030'],
    },
    mascara: { label: 'Warm espresso brown — softens eye definition naturally.', hex: '#301808' },
    lipsNude: {
      label: 'Warm caramel or terracotta nude — earthy, not too light.',
      hexes: ['#A05830', '#9A4820', '#B06840'],
    },
    lipsRed: {
      label: 'Warm brick or earthy orange-red.',
      hexes: ['#BB4418', '#CC4E20', '#AA3C10'],
    },
  },

  'Soft Autumn': {
    chromaTip: 'Muted and softly warm — you shine in blended, dusty pigments. Avoid high-chroma or icy shades.',
    foundation: {
      label: 'Warm medium beige with golden-honey undertone. Look for "Warm Beige," "Golden," or "W" shades.',
      hexes: ['#C09060', '#B08050', '#A87848', '#C8A070'],
    },
    contour: {
      label: 'Warm taupe or mushroom — earthy, slightly muted, never grey.',
      hexes: ['#7A5838', '#8A6848', '#9A7858'],
    },
    bronzer: {
      label: 'Sandy golden amber — soft and warm without too much orange.',
      hexes: ['#C09060', '#B88050', '#C8A070'],
    },
    blush: {
      label: 'Dusty peach or muted warm terracotta — soft and earthy.',
      hexes: ['#C08060', '#B07048', '#C08858', '#B87848'],
    },
    eyeshadow: {
      label: 'Muted warm taupes, dusty bronze, and soft brown-rose — nothing too bright.',
      hexes: ['#A07858', '#B08868', '#C09878', '#987058'],
    },
    mascara: { label: 'Warm brown — black would be too stark against your softly muted coloring.', hex: '#281808' },
    lipsNude: {
      label: 'Soft peachy nude or warm dusty rose.',
      hexes: ['#C09070', '#B07860', '#C8A080'],
    },
    lipsRed: {
      label: 'Muted warm brick or dusty coral — avoid bright oranges.',
      hexes: ['#B85830', '#A04820', '#C06030'],
    },
  },

  'Light Spring': {
    chromaTip: 'Delicate and warm — keep pigments light and clear. Heavy, dark, or muted makeup will overwhelm your fair coloring.',
    foundation: {
      label: 'Light warm ivory with a golden-peach base. Look for "Ivory," "Vanilla," or "W1" shades.',
      hexes: ['#F5E0B8', '#EEDAA8', '#F2E4C0', '#F8ECC8'],
    },
    contour: {
      label: 'Light sandy warm brown — very sheer. Heavy contour will look muddy on fair skin.',
      hexes: ['#C8A878', '#B89868', '#D0B888'],
    },
    bronzer: {
      label: 'Light peach or soft golden — mimics a delicate summer flush on fair skin.',
      hexes: ['#DDBC80', '#D4A870', '#E8C890', '#E0B878'],
    },
    blush: {
      label: 'Apricot, soft peach, or light coral — warm and sunny without being heavy.',
      hexes: ['#F0A870', '#E89868', '#F5B078', '#EDA868'],
    },
    eyeshadow: {
      label: 'Champagne, light gold, and warm blush — subtle warmth that brightens your eye area.',
      hexes: ['#F0D090', '#E8C880', '#F0C8A0', '#E8B890'],
    },
    mascara: { label: 'Warm brown or black-brown — black can look too harsh on very fair skin.', hex: '#3A2010' },
    lipsNude: {
      label: 'Light warm peach or peachy-pink nude.',
      hexes: ['#F0A880', '#E89870', '#F5B088'],
    },
    lipsRed: {
      label: 'Bright warm coral or light orange-red — these glow against fair warm skin.',
      hexes: ['#E8603A', '#D84E28', '#F07048'],
    },
  },

  'True Spring': {
    chromaTip: 'Clear and warm — you can wear vivid, fresh colors. Dusty or muted shades will make you look tired.',
    foundation: {
      label: 'Warm golden medium. Look for "Golden Beige," "Warm," or "W" codes with a yellow base.',
      hexes: ['#DDB860', '#E8C878', '#D4A850', '#E0C068'],
    },
    contour: {
      label: 'Warm golden brown — natural shadow with earth warmth.',
      hexes: ['#A07840', '#907030', '#B08848'],
    },
    bronzer: {
      label: 'Golden amber or warm terracotta — sun-kissed warmth that glows.',
      hexes: ['#C89040', '#D4A050', '#C08038', '#D09848'],
    },
    blush: {
      label: 'Coral, warm peach, or golden peach — amplify your warm golden glow.',
      hexes: ['#E88040', '#F09050', '#E87838', '#F0A050'],
    },
    eyeshadow: {
      label: 'Copper, warm gold, and apricot — metallics that harmonize with warm coloring.',
      hexes: ['#C07820', '#D09040', '#E0B050', '#C89038'],
    },
    mascara: { label: 'Warm brown or brown-black — adds definition while staying warm.', hex: '#201008' },
    lipsNude: {
      label: 'Warm peachy-coral nude.',
      hexes: ['#E89858', '#D88040', '#F0A868'],
    },
    lipsRed: {
      label: 'Tomato red or orange-based red — warm-toned for a fresh, natural look.',
      hexes: ['#E05030', '#CC4020', '#D84828'],
    },
  },

  'Bright Spring': {
    chromaTip: 'High contrast and warm-clear — you can carry vivid, saturated color. Go bold and bright.',
    foundation: {
      label: 'Warm clear golden with no muddiness. Look for "Golden," "Sun Beige," or "W" shades.',
      hexes: ['#E8C868', '#DDBA58', '#F0D078', '#E8C060'],
    },
    contour: {
      label: 'Warm sandy brown — bright enough not to look dirty on clear warm skin.',
      hexes: ['#A87838', '#988030', '#B08840'],
    },
    bronzer: {
      label: 'Bright golden or vivid warm bronze — your clear coloring handles the saturation.',
      hexes: ['#D4A040', '#C89030', '#E0B048'],
    },
    blush: {
      label: 'Vivid coral or electric warm peach — your high contrast coloring thrives with bold flush.',
      hexes: ['#F07840', '#E86838', '#F88840', '#F08040'],
    },
    eyeshadow: {
      label: 'Bright coral, electric teal, and vivid gold — lively and warm-clear.',
      hexes: ['#E08038', '#00A8C8', '#F0A840', '#E09030'],
    },
    mascara: { label: 'Dark brown or black — black works beautifully with your clear contrast.', hex: '#181008' },
    lipsNude: {
      label: 'Vivid coral nude or warm peach.',
      hexes: ['#F09058', '#E88048', '#F09868'],
    },
    lipsRed: {
      label: 'Orange-based bright red — vivid and warm, your most flattering red family.',
      hexes: ['#F06030', '#E84E20', '#F05828'],
    },
  },

  'Light Summer': {
    chromaTip: 'Muted and cool — choose dusty, soft pigments. Bright or saturated makeup will clash with your soft coloring.',
    foundation: {
      label: 'Light cool pink-rose. Look for "Rose," "Cool," "C," or "Pink Beige" at fair-light depth.',
      hexes: ['#F0D8D8', '#F5E0DC', '#EACED0', '#F0D4D4'],
    },
    contour: {
      label: 'Cool grey-taupe — shadows read grey-pink on fair cool skin.',
      hexes: ['#C0B0B0', '#B8A8A8', '#C8B8B8'],
    },
    bronzer: {
      label: 'Rosy beige or very soft honey — barely-there warmth so it reads natural.',
      hexes: ['#DEC8C0', '#D4B8B0', '#E8D0C8'],
    },
    blush: {
      label: 'Baby pink, cool lilac, or soft rose — cool-toned flush that mimics natural color.',
      hexes: ['#DDB8C8', '#C8A8B8', '#D4B0C8', '#E0C0D0'],
    },
    eyeshadow: {
      label: 'Dusty rose, soft lavender, and cool mauve — muted and romantic.',
      hexes: ['#C0909C', '#C8A8B8', '#B8A0CC', '#C0A8B4'],
    },
    mascara: { label: 'Dark brown or black-brown — slightly softer than jet black for fair cool skin.', hex: '#3A1C28' },
    lipsNude: {
      label: 'Cool rose nude or soft pink.',
      hexes: ['#D09898', '#C08888', '#D8A8A8'],
    },
    lipsRed: {
      label: 'Blue-based cherry or cool berry — avoid warm/orange reds.',
      hexes: ['#CC3366', '#BB2255', '#CC1155'],
    },
  },

  'True Summer': {
    chromaTip: 'Muted and cool — think dusty, blended pigments. Bright or warm makeup will clash.',
    foundation: {
      label: 'Medium cool with a rosy-pink cast. Look for "Rose Beige," "Cool Medium," or "C" shades.',
      hexes: ['#D4A8A0', '#C89898', '#C0908C', '#CC9898'],
    },
    contour: {
      label: 'Ashy mocha or cool medium brown — muted and shadow-like.',
      hexes: ['#9A7070', '#907070', '#A07878'],
    },
    bronzer: {
      label: 'Rose-brown or neutral earthy brown — not too warm or orange.',
      hexes: ['#B89080', '#AA8078', '#C09888'],
    },
    blush: {
      label: 'Mauve, dusty rose, or crushed berry — cool muted flush for a romantic look.',
      hexes: ['#B87890', '#C08090', '#AA7080', '#C090A0'],
    },
    eyeshadow: {
      label: 'Grey-mauve, dusty plum, and muted rose — cool and blended.',
      hexes: ['#9A8090', '#B0A0A8', '#8878A0', '#A090A0'],
    },
    mascara: { label: 'Deep charcoal-brown — softer than black, enhances without harshness.', hex: '#2A181C' },
    lipsNude: {
      label: 'Muted mauve nude or dusty rose.',
      hexes: ['#C89090', '#B88080', '#C89898'],
    },
    lipsRed: {
      label: 'Cool berry red or deep rose — blue-based for your cool undertone.',
      hexes: ['#BB3366', '#AA2255', '#CC3377'],
    },
  },

  'Soft Summer': {
    chromaTip: 'Very muted and softly cool — go for blurred, dusty, low-chroma makeup. Anything sharp or saturated will overpower you.',
    foundation: {
      label: 'Medium cool-neutral beige with a rose cast. Look for "Neutral Beige," "N," or "Cool Beige" shades.',
      hexes: ['#C8A0A0', '#BF9898', '#B89090', '#C8A8A0'],
    },
    contour: {
      label: 'Muted cool taupe-brown — soft and ashy, never warm.',
      hexes: ['#907070', '#887068', '#988078'],
    },
    bronzer: {
      label: 'Soft muted neutral — barely-warm so it reads natural without orange.',
      hexes: ['#A88878', '#B09080', '#B89888'],
    },
    blush: {
      label: 'Dusty mauve or muted cool rose — soft and barely-there.',
      hexes: ['#B88090', '#C090A0', '#A87888', '#B888A0'],
    },
    eyeshadow: {
      label: 'Muted grey-rose, dusty plum, and soft taupe — blended and low-contrast.',
      hexes: ['#9A8090', '#A89098', '#907888', '#A898A0'],
    },
    mascara: { label: 'Dark charcoal or deep taupe — black can read too harsh for very muted coloring.', hex: '#201818' },
    lipsNude: {
      label: 'Muted cool rose or dusty mauve nude.',
      hexes: ['#C09090', '#B08080', '#C09898'],
    },
    lipsRed: {
      label: 'Muted cool berry or dusty blue-based red — avoid anything bright or orange.',
      hexes: ['#BB3366', '#AA2855', '#B02860'],
    },
  },
}

const SECTIONS = [
  { key: 'foundation', title: 'Foundation & Concealer', icon: '💧' },
  { key: 'contour',    title: 'Contour',                icon: '🔲' },
  { key: 'bronzer',    title: 'Bronzer',                icon: '☀️' },
  { key: 'blush',      title: 'Blush',                  icon: '🌸' },
  { key: 'eyeshadow',  title: 'Eyeshadow',              icon: '✨' },
  { key: 'lipsNude',   title: 'Nude Lips',              icon: '💋' },
  { key: 'lipsRed',    title: 'Bold Lips',              icon: '❤️' },
] as const

interface Props {
  seasonalType: SeasonalType
}

export default function MakeupDisplay({ seasonalType }: Props) {
  const profile = PROFILES[seasonalType]
  if (!profile) return null

  return (
    <div className="space-y-5">
      {/* Chroma tip */}
      <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
        <p className="text-xs text-stone-500 leading-relaxed italic">{profile.chromaTip}</p>
      </div>

      {/* Makeup sections */}
      <div className="space-y-5">
        {SECTIONS.map(({ key, title, icon }) => {
          const section = profile[key] as MakeupCategory
          return (
            <div key={key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{icon}</span>
                <p className="text-xs font-semibold text-stone-700 uppercase tracking-widest">{title}</p>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed mb-2.5">{section.label}</p>
              <div className="flex flex-wrap gap-2">
                {section.hexes.map((hex, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-9 h-9 rounded-full shadow-md border-2 border-white"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[9px] text-stone-400 font-mono">{hex.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Mascara — single swatch + label */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">🖤</span>
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-widest">Mascara & Eyeliner</p>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed mb-2.5">{profile.mascara.label}</p>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full shadow-md border-2 border-white"
              style={{ backgroundColor: profile.mascara.hex }}
            />
            <span className="text-[9px] text-stone-400 font-mono">{profile.mascara.hex.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
