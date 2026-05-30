// Map domain patterns to friendly retailer names
const RETAILER_MAP: Record<string, string> = {
  'sephora.com': 'Sephora',
  'ulta.com': 'Ulta Beauty',
  'amazon.com': 'Amazon',
  'amazon.ca': 'Amazon',
  'shopify.com': 'Shopify',
  'etsy.com': 'Etsy',
  'zara.com': 'Zara',
  'h-and-m.com': 'H&M',
  'hm.com': 'H&M',
  'forever21.com': 'Forever 21',
  'aritzia.com': 'Aritzia',
  'uniqlo.com': 'Uniqlo',
  'gap.com': 'Gap',
  'banana-republic.com': 'Banana Republic',
  'bananarepublic.com': 'Banana Republic',
  'oldnavy.com': 'Old Navy',
  'mango.com': 'Mango',
  'f21.com': 'Forever 21',
  'brandy-melville.com': 'Brandy Melville',
  'brandymelville.com': 'Brandy Melville',
  'shein.com': 'Shein',
  'target.com': 'Target',
  'walmart.com': 'Walmart',
  'jcpenney.com': 'JCPenney',
  'macys.com': 'Macy\'s',
  'nordstrom.com': 'Nordstrom',
  'bloomingdales.com': 'Bloomingdale\'s',
  'saksfifthavenue.com': 'Saks Fifth Avenue',
  'net-a-porter.com': 'Net-A-Porter',
  'netaporter.com': 'Net-A-Porter',
  'ssense.com': 'SSENSE',
  'farfetch.com': 'FARFETCH',
  'revolve.com': 'Revolve',
  'asos.com': 'ASOS',
  'shoppingexpress.com.au': 'Shopping Express',
  'stylerunner.com': 'Style Runner',
  'mitchellgold.com': 'Mitchell Gold',
  'cb2.com': 'CB2',
  'wayfair.com': 'Wayfair',
  'overstock.com': 'Overstock',
  '1stdibs.com': '1stDibs',
  'chairish.com': 'Chairish',
  'rubylane.com': 'RubyLane',
  'etsy.co.uk': 'Etsy',
  'topshop.com': 'Topshop',
  'boohoo.com': 'Boohoo',
  'prettylittlething.com': 'PrettyLittleThing',
  'missguided.com': 'Missguided',
  'aesop.com': 'Aesop',
  'glossier.com': 'Glossier',
  'beautycounter.com': 'Beauty Counter',
}

export function extractRetailerFromUrl(url: string | null | undefined): string {
  if (!url) return 'Unknown Store'

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Check exact matches first
    for (const [domain, name] of Object.entries(RETAILER_MAP)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return name
      }
    }

    // Fallback: extract the main domain name and capitalize it
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      // Get the domain name (e.g., 'example' from 'www.example.com')
      const domainName = parts[parts.length - 2]
      return domainName.charAt(0).toUpperCase() + domainName.slice(1)
    }

    return 'Unknown Store'
  } catch {
    return 'Unknown Store'
  }
}
