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
      name: 'openai',
      apiKey,
      baseURL,
    }),
  ],
})

// Define model reference
const aiModel = modelRef({
  name: `openai/${defaultModel}`,
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

    const availableList = availableForRecommendation
      .map(
        (item) =>
          `ID: ${item.id} | ${item.name} - Rp ${item.price.toLocaleString('id-ID')}${item.description ? ` (${item.description})` : ''}`
      )
      .join('\n')

    const prompt = `Kamu adalah asisten restoran Nasi Padang yang ahli dalam merekomendasikan menu.

Pesanan customer saat ini:
${cartSummary}

Menu yang BISA direkomendasikan (belum ada di keranjang):
${availableList}

TUGAS:
Rekomendasikan 2-3 menu tambahan yang paling cocok untuk melengkapi pesanan customer.

KRITERIA:
1. Menu yang direkomendasikan harus melengkapi (complement) pesanan yang sudah ada
2. Pertimbangkan kombinasi rasa, porsi, dan keseimbangan nutrisi
3. HANYA pilih dari menu yang BISA direkomendasikan di atas
4. Untuk minuman, rekomendasikan yang cocok dengan makanan
5. Berikan alasan singkat (maksimal 1 kalimat) dalam Bahasa Indonesia
6. Berikan confidence score 0.7-0.95 berdasarkan seberapa cocok menu tersebut

PENTING: Gunakan ID yang PERSIS sama dengan yang tertera di daftar menu di atas.

Berikan response dalam format JSON dengan struktur:
{
  "recommendations": [
    {
      "menuItemId": "id-persis-dari-daftar",
      "reason": "alasan singkat mengapa cocok",
      "confidence": 0.85
    }
  ]
}

Berikan maksimal 3 rekomendasi yang paling relevan.`

console.log(prompt);
    const llmResponse = await ai.generate({
      model: aiModel,
      prompt,
      output: { 
        schema: z.object({
          recommendations: z.array(
            z.object({
              menuItemId: z.string(),
              reason: z.string(),
              confidence: z.number().min(0.7).max(0.95),
            })
          ),
        }),
      },
    })

    // Use structured output directly from llmResponse.output
    const recommendations = (llmResponse.output?.recommendations || [])
      .slice(0, 3)
      .map((rec) => ({
        menuItemId: rec.menuItemId,
        reason: rec.reason,
        confidence: Math.min(Math.max(rec.confidence || 0.8, 0.7), 0.95),
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

    return { success: true, recommendations }
  } catch (error) {
    console.error('Error getting upsell recommendations:', error)
    return { success: false, error: 'Failed to get recommendations', recommendations: [] }
  }
}

