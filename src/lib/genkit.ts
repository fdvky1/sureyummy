import { genkit, z, modelRef } from 'genkit'
import { openAICompatible } from '@genkit-ai/compat-oai'

// Parse OPENAI_CONFIG from environment: "baseurl|apikey|model"
function parseOpenAIConfig() {
  const config = process.env.OPENAI_CONFIG
  if (!config) {
    throw new Error('OPENAI_CONFIG environment variable is not set. Format: "baseurl|apikey|model"')
  }
  
  const [baseURL, apiKey, model] = config.split('|')
  
  if (!baseURL || !apiKey || !model) {
    throw new Error('Invalid OPENAI_CONFIG format. Expected: "baseurl|apikey|model"')
  }
  
  return { baseURL, apiKey, model }
}

const { baseURL, apiKey, model: defaultModel } = parseOpenAIConfig()

// Initialize Genkit with OpenAI compatible provider
const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'openai-compatible',
      apiKey,
      baseURL,
    }),
  ],
})

// Define model reference
const aiModel = modelRef({
  name: `openai-compatible/${defaultModel}`,
})

// Define the upselling flow
export const upsellFlow = ai.defineFlow(
  {
    name: 'upsellRecommendations',
    inputSchema: z.object({
      cartItems: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          quantity: z.number(),
        })
      ),
      availableMenuItems: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional().nullable(),
          price: z.number(),
          image: z.string().optional().nullable(),
          category: z.string().optional().nullable(),
        })
      ),
    }),
    outputSchema: z.object({
      recommendations: z.array(
        z.object({
          menuItemId: z.string(),
          reason: z.string(),
          confidence: z.number(),
        })
      ),
    }),
  },
  async (input) => {
    const { cartItems, availableMenuItems } = input

    // Build prompt for AI
    const cartSummary = cartItems
      .map((item) => `${item.name} (x${item.quantity})`)
      .join(', ')

    const menuList = availableMenuItems
      .map(
        (item) =>
          `ID: ${item.id} | ${item.name} - Rp ${item.price.toLocaleString('id-ID')}${item.description ? ` (${item.description})` : ''}`
      )
      .join('\n')

    // Get IDs of items already in cart
    const cartItemIds = cartItems.map((item) => item.id)
    const availableForRecommendation = availableMenuItems.filter(
      (item) => !cartItemIds.includes(item.id)
    )

    if (availableForRecommendation.length === 0) {
      return { recommendations: [] }
    }

    // Shuffle and limit menu for variety (max 20 random items to reduce token usage)
    const shuffled = [...availableForRecommendation].sort(() => Math.random() - 0.5)
    const sampledMenu = shuffled.slice(0, Math.min(20, shuffled.length))

    const availableList = sampledMenu
      .map(
        (item) =>
          `ID: ${item.id} | ${item.name} - Rp ${item.price.toLocaleString('id-ID')} [${item.category || 'UNCATEGORIZED'}]${item.description ? ` (${item.description})` : ''}`
      )
      .join('\n')

    // Analyze cart to provide better context
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    
    // Get categories from actual menu items instead of string matching
    const cartMenuItems = cartItems.map(cartItem => 
      availableMenuItems.find(m => m.id === cartItem.id)
    ).filter(Boolean)
    
    const hasMainDish = cartMenuItems.some(item => 
      item?.category === 'MAIN_COURSE'
    )
    const hasDrink = cartMenuItems.some(item => 
      item?.category === 'BEVERAGE'
    )
    const hasSide = cartMenuItems.some(item => 
      item?.category === 'SIDE_DISH'
    )
    const hasAppetizer = cartMenuItems.some(item => 
      item?.category === 'APPETIZER'
    )
    const hasDessert = cartMenuItems.some(item => 
      item?.category === 'DESSERT'
    )

    const contextHints = []
    if (!hasDrink && hasMainDish) contextHints.push('Belum ada minuman - prioritaskan BEVERAGE untuk makanan berat')
    if (!hasSide && hasMainDish) contextHints.push('Kurang lauk pendamping - pertimbangkan SIDE_DISH atau sayur')
    if (!hasAppetizer && !hasSide) contextHints.push('Tidak ada pembuka - APPETIZER bisa menarik')
    if (hasMainDish && !hasDrink) contextHints.push('Makanan berat tanpa minuman - es/jus sangat dibutuhkan')
    if (!hasDessert && (hasDrink || hasMainDish)) contextHints.push('Belum ada penutup - DESSERT bisa melengkapi')
    
    const contextNote = contextHints.length > 0 
      ? `\n\nKONTEKS PENTING:\n${contextHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : ''

    const prompt = `Kamu adalah asisten restoran Nasi Padang yang ahli dalam merekomendasikan menu dengan variasi tinggi.

Pesanan customer saat ini:
${cartSummary} (Total: ${totalItems} item)${contextNote}

Menu yang BISA direkomendasikan (sample acak dari menu tersedia):
${availableList}

TUGAS:
Rekomendasikan 2-3 menu tambahan yang BERBEDA dari biasanya namun tetap cocok untuk melengkapi pesanan.

KRITERIA:
1. VARIASI adalah prioritas utama - jangan selalu rekomendasikan menu yang sama
2. Pertimbangkan kombinasi: kategori (lihat [CATEGORY]), rasa (pedas/gurih/asam), tekstur (kering/berkuah)
3. Gunakan kategori untuk melengkapi pesanan:
   - MAIN_COURSE: Lauk utama (ayam, ikan, daging, telur)
   - SIDE_DISH: Pendamping (sayur, kerupuk, perkedel)
   - BEVERAGE: Minuman (es, teh, kopi, jus)
   - APPETIZER: Pembuka (keripik, camilan)
   - DESSERT: Penutup (es campur, dsb)
4. Jika sudah ada MAIN_COURSE, rekomendasikan BEVERAGE atau SIDE_DISH
5. Jika belum ada minuman, prioritaskan BEVERAGE yang cocok
6. Pertimbangkan harga - seimbangkan antara menu mahal dan terjangkau
7. Berikan alasan singkat (maksimal 1 kalimat) dalam Bahasa Indonesia
8. Confidence score 0.6-0.95:
   - 0.85-0.95: Sangat cocok dan melengkapi sempurna
   - 0.75-0.84: Cocok dan menarik
   - 0.6-0.74: Alternatif bagus untuk variasi

PENTING: 
- Gunakan ID yang PERSIS sama dengan yang tertera di daftar menu di atas
- JANGAN selalu rekomendasikan menu populer yang sama
- Eksplorasi menu yang kurang umum tapi tetap relevan

Format JSON response:
{
  "recommendations": [
    {
      "menuItemId": "id-persis-dari-daftar",
      "reason": "alasan singkat mengapa cocok",
      "confidence": 0.85
    }
  ]
}

Berikan maksimal 3 rekomendasi yang BERAGAM.`

    const llmResponse = await ai.generate({
      model: aiModel,
      prompt,
      config: {
        temperature: 0.9, // Higher temperature for more variety
        topP: 0.95,
        model: defaultModel // Ensure model is set
      },
      output: { 
        schema: z.object({
          recommendations: z.array(
            z.object({
              menuItemId: z.string(),
              reason: z.string(),
              confidence: z.number().min(0.6).max(0.95),
            })
          ),
        }),
      },
    }).catch((err) => {
      console.error('Error during AI generation:', err)
      throw err
    })

    // Use structured output directly from llmResponse.output
    const recommendations = (llmResponse.output?.recommendations || [])
      .slice(0, 3)
      .map((rec) => ({
        menuItemId: rec.menuItemId,
        reason: rec.reason,
        confidence: Math.min(Math.max(rec.confidence || 0.75, 0.6), 0.95),
      }))

    return { recommendations }
  }
)

// Helper function to run the flow
export async function getUpsellRecommendations(
  cartItems: Array<{ id: string; name: string; price: number; quantity: number }>,
  availableMenuItems: Array<{
    id: string
    name: string
    description?: string | null
    price: number
    image?: string | null
    category?: string | null
  }>
) {
  try {
    const result = await upsellFlow({ cartItems, availableMenuItems })

    // Match menu item IDs with actual menu items
    const recommendations = result.recommendations
      .map((rec) => {
        const menuItem = availableMenuItems.find((m) => m.id === rec.menuItemId)
        if (!menuItem) return null

        return {
          menuItem,
          reason: rec.reason,
          confidence: rec.confidence,
        }
      })
      .filter((rec): rec is NonNullable<typeof rec> => rec !== null)

    // Log for debugging variety
    // console.log('[AI Upsell] Recommended:', recommendations.map(r => r.menuItem.name).join(', '))

    return { success: true, recommendations }
  } catch (error) {
    console.error('Error getting upsell recommendations:', error)
    return { success: false, error: 'Failed to get recommendations', recommendations: [] }
  }
}

