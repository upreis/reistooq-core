import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  sku: string
  nome: string
  fornecedor?: string
  categoria?: string
  preco?: number
  caixas?: number
  imagem?: string
  imagem_fornecedor?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { products } = await req.json()
    
    if (!products || !Array.isArray(products)) {
      throw new Error('Produtos inválidos fornecidos')
    }

    console.log(`Processing Excel export for ${products.length} products`)

    // Create Excel workbook data structure
    const headers = ['SKU', 'Nome do Produto', 'Fornecedor', 'Categoria', 'Preço', 'Caixas', 'Imagem', 'Imagem do Fornecedor']
    
    const rows = products.map((product: Product) => [
      product.sku || '',
      product.nome || '',
      product.fornecedor || '',
      product.categoria || '',
      product.preco || 0,
      product.caixas || 0,
      product.imagem ? 'VER IMAGEM NO SISTEMA' : '',
      product.imagem_fornecedor ? 'VER IMAGEM NO SISTEMA' : ''
    ])

    // Create CSV content (Excel format)
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n')

    // For now, return CSV as we cannot embed images reliably in browser
    // Future enhancement: Use a proper Excel library on server side
    const response = new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="cotacoes_produtos.csv"'
      }
    })

    console.log('Excel export completed successfully')
    return response

  } catch (error) {
    console.error('Error in excel-with-images function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})