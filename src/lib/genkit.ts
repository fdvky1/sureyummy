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

// Define AI Business Intelligence flow
export const businessInsightsFlow = ai.defineFlow(
  {
    name: 'businessInsights',
    inputSchema: z.object({
      businessData: z.object({
        currentMonthRevenue: z.number(),
        lastMonthRevenue: z.number(),
        revenueGrowth: z.number(),
        avgOrderValue: z.number(),
        lastAvgOrderValue: z.number(),
        avgOrderGrowth: z.number(),
        currentMonthOrderCount: z.number(),
        lastMonthOrderCount: z.number(),
        weeklyGrowth: z.array(z.object({
          week: z.number(),
          revenue: z.number(),
          growth: z.number().optional()
        })),
        categoryMix: z.array(z.object({
          category: z.string(),
          revenue: z.number(),
          percentage: z.string()
        })),
        topItems: z.array(z.object({
          name: z.string(),
          revenue: z.number(),
          quantity: z.number()
        })),
        bottomItems: z.array(z.object({
          name: z.string(),
          revenue: z.number(),
          quantity: z.number()
        })),
        peakHour: z.object({
          hour: z.number(),
          orderCount: z.number(),
          timeRange: z.string()
        }).optional().nullable(),
        slowMovingCount: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable'])
      })
    }),
    outputSchema: z.object({
      analysis: z.object({
        overallHealth: z.string(),
        keyFindings: z.array(z.string()),
        riskFactors: z.array(z.string()),
        opportunities: z.array(z.string())
      }),
      recommendations: z.array(
        z.object({
          type: z.enum(['success', 'warning', 'info', 'error']),
          priority: z.enum(['high', 'medium', 'low']),
          title: z.string(),
          description: z.string(),
          action: z.string(),
          expectedImpact: z.string()
        })
      )
    }),
  },
  async (input) => {
    const { businessData } = input

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount)
    }

    const dataForAI = `
BUSINESS CONTEXT:
Tipe Bisnis: Restoran Nasi Padang dengan POS System
Total Revenue Bulan Ini: ${formatCurrency(businessData.currentMonthRevenue)}
Total Orders: ${businessData.currentMonthOrderCount}
Average Order Value: ${formatCurrency(businessData.avgOrderValue)}

${businessData.lastMonthOrderCount === 0 ? '⚠️ PERHATIAN: Data bulan lalu tidak ada (sistem baru/bisnis baru dimulai). Growth metrics mungkin tidak akurat.\n' : ''}

PERFORMANCE METRICS:
- Revenue Growth: ${businessData.revenueGrowth === 0 && businessData.lastMonthRevenue === 0 ? 'N/A (tidak ada data pembanding)' : businessData.revenueGrowth.toFixed(1) + '% vs bulan lalu'}
- AOV Growth: ${businessData.avgOrderGrowth === 0 && businessData.lastAvgOrderValue === 0 ? 'N/A (tidak ada data pembanding)' : businessData.avgOrderGrowth.toFixed(1) + '%'}
- Order Frequency Growth: ${businessData.lastMonthOrderCount === 0 ? 'N/A (tidak ada data pembanding)' : (((businessData.currentMonthOrderCount - businessData.lastMonthOrderCount) / businessData.lastMonthOrderCount) * 100).toFixed(1) + '%'}

WEEKLY TREND (4 minggu terakhir):
${businessData.weeklyGrowth.map(w => `Week ${w.week}: ${formatCurrency(w.revenue)}${w.growth !== undefined ? ` (${w.growth > 0 ? '+' : ''}${w.growth.toFixed(1)}%)` : ''}`).join('\n')}

CATEGORY PERFORMANCE:
${businessData.categoryMix.map(c => `${c.category}: ${formatCurrency(c.revenue)} (${c.percentage}%)`).join('\n')}

TOP 5 MENU:
${businessData.topItems.map((item, i) => `${i+1}. ${item.name}: ${formatCurrency(item.revenue)} (${item.quantity} porsi)`).join('\n')}

BOTTOM 5 MENU:
${businessData.bottomItems.map((item, i) => `${i+1}. ${item.name}: ${formatCurrency(item.revenue)} (${item.quantity} porsi)`).join('\n')}

OPERATIONAL INSIGHTS:
- Peak Hour: ${businessData.peakHour ? businessData.peakHour.timeRange + ' (' + businessData.peakHour.orderCount + ' orders)' : 'Tidak terdeteksi'}
- Slow Moving Items: ${businessData.slowMovingCount} menu
- Trend Direction: ${businessData.trend}
`

    const aiPrompt = `Kamu adalah AI Business Analyst expert untuk industri F&B, khususnya restoran Nasi Padang.

${dataForAI}

TUGAS:
1. Analisis mendalam performa bisnis dengan mempertimbangkan:
   - Pattern revenue (harian, mingguan, bulanan)
   - Product mix dan contribution margin per kategori
   - Customer behavior (AOV, frequency)
   - Operational efficiency (peak hours)
   ${businessData.lastMonthOrderCount === 0 ? '\n   ⚠️ PENTING: Jika data bulan lalu kosong, JANGAN analisis growth/decline. Fokus pada current performance dan potential optimization saja.' : ''}

2. Identifikasi 3-5 ACTIONABLE INSIGHTS yang spesifik dan dapat dieksekusi:
   - Bukan hanya observasi, tapi strategic recommendation
   - Sertakan reasoning dan expected impact
   - Prioritas: high (urgent), medium (important), low (nice to have)
   - Tipe: warning (masalah), info (observasi), success (opportunity)
   ${businessData.lastMonthOrderCount === 0 ? '   - JANGAN bilang bisnis menurun jika tidak ada data pembanding\n' : ''}

3. Berikan insight dalam Bahasa Indonesia yang profesional tapi mudah dipahami owner restoran
   - Bukan hanya observasi, tapi strategic recommendation
   - Sertakan reasoning dan expected impact
   - Prioritas: high (urgent), medium (important), low (nice to have)
   - Tipe: warning (masalah), info (observasi), success (opportunity)

3. Berikan insight dalam Bahasa Indonesia yang profesional tapi mudah dipahami owner restoran

Format JSON response:
{
  "analysis": {
    "overallHealth": "Ringkasan 2-3 kalimat tentang kondisi bisnis secara keseluruhan",
    "keyFindings": ["finding1", "finding2", "finding3"],
    "riskFactors": ["risk1", "risk2"] atau [] jika tidak ada,
    "opportunities": ["opportunity1", "opportunity2"]
  },
  "recommendations": [
    {
      "type": "warning|info|success|error",
      "priority": "high|medium|low",
      "title": "Judul singkat (max 5 kata)",
      "description": "Penjelasan masalah/insight (1-2 kalimat)",
      "action": "Action items spesifik yang harus dilakukan",
      "expectedImpact": "Dampak yang diharapkan jika action dijalankan"
    }
  ]
}

Berikan 3-5 recommendations yang ACTIONABLE dan STRATEGIC.`

    const llmResponse = await ai.generate({
      model: aiModel,
      prompt: aiPrompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
        model: defaultModel
      },
      output: {
        schema: z.object({
          analysis: z.object({
            overallHealth: z.string(),
            keyFindings: z.array(z.string()),
            riskFactors: z.array(z.string()),
            opportunities: z.array(z.string())
          }),
          recommendations: z.array(
            z.object({
              type: z.enum(['success', 'warning', 'info', 'error']),
              priority: z.enum(['high', 'medium', 'low']),
              title: z.string(),
              description: z.string(),
              action: z.string(),
              expectedImpact: z.string()
            })
          )
        })
      }
    })

    return llmResponse.output || {
      analysis: {
        overallHealth: "Data tidak tersedia",
        keyFindings: [],
        riskFactors: [],
        opportunities: []
      },
      recommendations: []
    }
  }
)

// Helper function to get AI business insights
export async function getAIBusinessInsights(businessData: {
  currentMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
  avgOrderValue: number
  lastAvgOrderValue: number
  avgOrderGrowth: number
  currentMonthOrderCount: number
  lastMonthOrderCount: number
  weeklyGrowth: Array<{ week: number; revenue: number; growth?: number }>
  categoryMix: Array<{ category: string; revenue: number; percentage: string }>
  topItems: Array<{ name: string; revenue: number; quantity: number }>
  bottomItems: Array<{ name: string; revenue: number; quantity: number }>
  peakHour?: { hour: number; orderCount: number; timeRange: string } | null
  slowMovingCount: number
  trend: 'increasing' | 'decreasing' | 'stable'
}) {
  try {
    const result = await businessInsightsFlow({ businessData })
    console.log('[AI Business Insights] Successfully generated AI-powered analysis')
    return { success: true, data: result }
  } catch (error) {
    console.error('[AI Business Insights] Error:', error)
    return { success: false, error: 'Failed to generate AI insights' }
  }
}

