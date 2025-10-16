// api/index.js
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURACIÓN SEGURA ---
// En Vercel -> Settings -> Environment Variables:
// SUPABASE_URL = https://gqjyuhcrzevxkschomje.supabase.co
// SUPABASE_ANON_KEY = <tu anon key de supabase>
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// --- API PRINCIPAL ---
export default async function handler(req, res) {
  const { action } = req.query
  const body = req.body ? JSON.parse(req.body) : {}

  console.log('🔹 Acción recibida:', action)

  try {
    // 📦 Agregar producto faltante
    if (action === 'add') {
      const { productName, supplierName } = body
      console.log('📥 Datos recibidos:', { productName, supplierName })

      const { data, error } = await supabase
        .from('missing_products')
        .insert([
          {
            product_name: productName,
            supplier_name: supplierName,
            requested_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error
      console.log('🧾 Insert OK:', data)
      return res.status(200).json({ success: true, data })
    }

    // 📋 Obtener lista de faltantes
    if (action === 'getMissing') {
      const { data, error } = await supabase
        .from('missing_products')
        .select('*')
        .order('requested_at', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    }

    // 🕒 Marcar producto como recibido
    if (action === 'markReceived') {
      const { id } = body
      if (!id) throw new Error('Falta el ID del producto.')

      const { data: product, error: getError } = await supabase
        .from('missing_products')
        .select('*')
        .eq('id', id)
        .single()

      if (getError || !product) throw getError || new Error('Producto no encontrado.')

      const requestedDate = new Date(product.requested_at)
      const receivedDate = new Date()
      const responseDays = Math.ceil((receivedDate - requestedDate) / (1000 * 60 * 60 * 24))

      // Inserta en historial
      const { error: insertError } = await supabase
        .from('product_history')
        .insert([
          {
            product_name: product.product_name,
            supplier_name: product.supplier_name,
            requested_at: product.requested_at,
            received_at: receivedDate.toISOString(),
            response_time_days: responseDays
          }
        ])

      if (insertError) throw insertError

      // Elimina de faltantes
      const { error: deleteError } = await supabase
        .from('missing_products')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return res.status(200).json({ success: true })
    }

    // 📜 Obtener historial
    if (action === 'getHistory') {
      const { data, error } = await supabase
        .from('product_history')
        .select('*')
        .order('received_at', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    }

    // 📊 Obtener métricas
    if (action === 'getMetrics') {
      const { data: missing } = await supabase.from('missing_products').select('id')
      const { data: history } = await supabase.from('product_history').select('*')

      const missingCount = missing?.length || 0
      const receivedCount = history?.length || 0
      const avgDays =
        receivedCount > 0
          ? Math.round(history.reduce((acc, h) => acc + (h.response_time_days || 0), 0) / receivedCount)
          : 0

      const supplierCounts = {}
      history.forEach((h) => {
        supplierCounts[h.supplier_name] = (supplierCounts[h.supplier_name] || 0) + 1
      })

      return res.status(200).json({ missingCount, receivedCount, avgDays, supplierCounts })
    }

    // 🚫 Acción no válida
    return res.status(400).json({ error: 'Acción no válida' })
  } catch (err) {
    console.error('❌ Error en API:', err)
    return res.status(500).json({ error: err.message })
  }
}
