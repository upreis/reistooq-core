export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      _backfill_report_org_nulls: {
        Row: {
          created_at: string
          id: string
          reason: string
          table_name: string
        }
        Insert: {
          created_at?: string
          id: string
          reason: string
          table_name: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          table_name?: string
        }
        Relationships: []
      }
      access_attempts: {
        Row: {
          attempt_time: string | null
          blocked_reason: string | null
          email: string | null
          id: string
          ip_address: unknown | null
          session_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_time?: string | null
          blocked_reason?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_time?: string | null
          blocked_reason?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      access_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          organization_id: string
          role_id: string | null
          start_time: string
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          role_id?: string | null
          start_time: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          role_id?: string | null
          start_time?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string
          expires_at: string | null
          href: string | null
          id: string
          kind: string
          link_label: string | null
          message: string
          organization_id: string | null
          target_roles: string[] | null
          target_routes: string[] | null
          target_users: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          href?: string | null
          id?: string
          kind: string
          link_label?: string | null
          message: string
          organization_id?: string | null
          target_roles?: string[] | null
          target_routes?: string[] | null
          target_users?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          href?: string | null
          id?: string
          kind?: string
          link_label?: string | null
          message?: string
          organization_id?: string | null
          target_roles?: string[] | null
          target_routes?: string[] | null
          target_users?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      app_permissions: {
        Row: {
          description: string | null
          key: string
          name: string
        }
        Insert: {
          description?: string | null
          key: string
          name: string
        }
        Update: {
          description?: string | null
          key?: string
          name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          id: string
          ip_address: unknown | null
          module: string | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          severity: string | null
          source_function: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          ip_address?: unknown | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          severity?: string | null
          source_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          ip_address?: unknown | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          severity?: string | null
          source_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categorias_catalogo: {
        Row: {
          ativo: boolean
          categoria_completa: string | null
          categoria_id: string | null
          categoria_principal_id: string | null
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nivel: number
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_completa?: string | null
          categoria_id?: string | null
          categoria_principal_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nivel: number
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_completa?: string | null
          categoria_id?: string | null
          categoria_principal_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nivel?: number
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_catalogo_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_catalogo_categoria_principal_id_fkey"
            columns: ["categoria_principal_id"]
            isOneToOne: false
            referencedRelation: "categorias_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_produtos: {
        Row: {
          ativo: boolean | null
          categoria_completa: string | null
          categoria_id: string | null
          categoria_principal_id: string | null
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nivel: number
          nome: string
          ordem: number | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria_completa?: string | null
          categoria_id?: string | null
          categoria_principal_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nivel?: number
          nome: string
          ordem?: number | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria_completa?: string | null
          categoria_id?: string | null
          categoria_principal_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nivel?: number
          nome?: string
          ordem?: number | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_produtos_categoria_principal_id_fkey"
            columns: ["categoria_principal_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          data_primeiro_pedido: string | null
          data_ultimo_pedido: string | null
          email: string | null
          empresa: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          endereco_uf: string | null
          id: string
          integration_account_id: string | null
          nome_completo: string
          observacoes: string | null
          organization_id: string
          status_cliente: string | null
          telefone: string | null
          ticket_medio: number | null
          total_pedidos: number | null
          updated_at: string
          valor_total_gasto: number | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          data_primeiro_pedido?: string | null
          data_ultimo_pedido?: string | null
          email?: string | null
          empresa?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          endereco_uf?: string | null
          id?: string
          integration_account_id?: string | null
          nome_completo: string
          observacoes?: string | null
          organization_id: string
          status_cliente?: string | null
          telefone?: string | null
          ticket_medio?: number | null
          total_pedidos?: number | null
          updated_at?: string
          valor_total_gasto?: number | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          data_primeiro_pedido?: string | null
          data_ultimo_pedido?: string | null
          email?: string | null
          empresa?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          endereco_uf?: string | null
          id?: string
          integration_account_id?: string | null
          nome_completo?: string
          observacoes?: string | null
          organization_id?: string
          status_cliente?: string | null
          telefone?: string | null
          ticket_medio?: number | null
          total_pedidos?: number | null
          updated_at?: string
          valor_total_gasto?: number | null
        }
        Relationships: []
      }
      componentes_em_uso: {
        Row: {
          created_at: string | null
          id: string
          nome_produto_composicao: string
          organization_id: string
          quantidade_necessaria: number
          sku_componente: string
          sku_produto_composicao: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_produto_composicao: string
          organization_id: string
          quantidade_necessaria?: number
          sku_componente: string
          sku_produto_composicao: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_produto_composicao?: string
          organization_id?: string
          quantidade_necessaria?: number
          sku_componente?: string
          sku_produto_composicao?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          organization_id: string | null
          tipo: string | null
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          organization_id?: string | null
          tipo?: string | null
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          organization_id?: string | null
          tipo?: string | null
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      customer_data_access_log: {
        Row: {
          action: string
          created_at: string
          customer_id: string | null
          id: string
          ip_address: unknown | null
          organization_id: string
          sensitive_data_accessed: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          customer_id?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string
          sensitive_data_accessed?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string
          sensitive_data_accessed?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          id: string
          notes: string | null
          organization_id: string
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_at: string | null
          requested_by_email: string
          response_data: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          organization_id: string
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_at?: string | null
          requested_by_email: string
          response_data?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          organization_id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string | null
          requested_by_email?: string
          response_data?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      devolucoes_avancadas: {
        Row: {
          claim_id: string | null
          created_at: string | null
          dados_claim: Json | null
          dados_mensagens: Json | null
          dados_order: Json | null
          dados_return: Json | null
          data_criacao: string | null
          id: string
          integration_account_id: string | null
          order_id: string
          produto_titulo: string | null
          quantidade: number | null
          sku: string | null
          status_devolucao: string | null
          updated_at: string | null
          valor_retido: number | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string | null
          dados_claim?: Json | null
          dados_mensagens?: Json | null
          dados_order?: Json | null
          dados_return?: Json | null
          data_criacao?: string | null
          id?: string
          integration_account_id?: string | null
          order_id: string
          produto_titulo?: string | null
          quantidade?: number | null
          sku?: string | null
          status_devolucao?: string | null
          updated_at?: string | null
          valor_retido?: number | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string | null
          dados_claim?: Json | null
          dados_mensagens?: Json | null
          dados_order?: Json | null
          dados_return?: Json | null
          data_criacao?: string | null
          id?: string
          integration_account_id?: string | null
          order_id?: string
          produto_titulo?: string | null
          quantidade?: number | null
          sku?: string | null
          status_devolucao?: string | null
          updated_at?: string | null
          valor_retido?: number | null
        }
        Relationships: []
      }
      historico: {
        Row: {
          created_at: string
          descricao: string
          detalhes: Json | null
          id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          descricao: string
          detalhes?: Json | null
          id?: string
          tipo: string
        }
        Update: {
          created_at?: string
          descricao?: string
          detalhes?: Json | null
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      historico_depara: {
        Row: {
          acao: string
          created_at: string
          id: string
          mapeamento_id: string
          motivo: string | null
          organization_id: string | null
          usuario_id: string | null
          valores_anteriores: Json | null
          valores_novos: Json | null
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          mapeamento_id: string
          motivo?: string | null
          organization_id?: string | null
          usuario_id?: string | null
          valores_anteriores?: Json | null
          valores_novos?: Json | null
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          mapeamento_id?: string
          motivo?: string | null
          organization_id?: string | null
          usuario_id?: string | null
          valores_anteriores?: Json | null
          valores_novos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_depara_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_depara_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_importacoes: {
        Row: {
          created_at: string
          dados_originais: Json | null
          detalhes_erro: Json | null
          id: string
          nome_arquivo: string
          organization_id: string
          produtos_erro: number | null
          produtos_processados: number | null
          produtos_sucesso: number | null
          tipo_operacao: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          dados_originais?: Json | null
          detalhes_erro?: Json | null
          id?: string
          nome_arquivo: string
          organization_id: string
          produtos_erro?: number | null
          produtos_processados?: number | null
          produtos_sucesso?: number | null
          tipo_operacao: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          dados_originais?: Json | null
          detalhes_erro?: Json | null
          id?: string
          nome_arquivo?: string
          organization_id?: string
          produtos_erro?: number | null
          produtos_processados?: number | null
          produtos_sucesso?: number | null
          tipo_operacao?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      historico_vendas: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente_documento: string | null
          cliente_nome: string | null
          codigo_barras: string | null
          codigo_rastreamento: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          custo_envio_seller: number | null
          data_pedido: string
          data_prevista: string | null
          date_created: string | null
          delivery_type: string | null
          desconto_cupom: number | null
          descricao: string | null
          empresa: string | null
          frete_pago_cliente: number | null
          id: string
          id_unico: string
          integration_account_id: string | null
          last_updated: string | null
          logistic_mode_principal: string | null
          meta: Json | null
          metodo_envio_combinado: string | null
          metodo_pagamento: string | null
          modo_envio_combinado: string | null
          ncm: string | null
          nome_completo: string | null
          numero: string | null
          numero_ecommerce: string | null
          numero_pedido: string
          numero_venda: string | null
          obs: string | null
          obs_interna: string | null
          observacoes: string | null
          origem: string | null
          pack_id: string | null
          pack_status: string | null
          pack_status_detail: string | null
          pedido_id: string | null
          pickup_id: string | null
          qtd_kit: number | null
          quantidade: number
          quantidade_itens: number | null
          quantidade_kit: number | null
          quantidade_total: number | null
          raw: Json | null
          receita_flex_bonus: number | null
          rua: string | null
          shipping_method: string | null
          shipping_mode: string | null
          situacao: string | null
          sku_estoque: string | null
          sku_kit: string | null
          sku_produto: string
          skus_produtos: string | null
          status: string
          status_baixa: string | null
          status_envio: string | null
          status_mapeamento: string | null
          status_pagamento: string | null
          substatus_detail: string | null
          substatus_estado_atual: string | null
          tags: string[] | null
          taxa_marketplace: number | null
          tipo_entrega: string | null
          tipo_logistico: string | null
          tipo_metodo_envio: string | null
          tipo_pagamento: string | null
          titulo_produto: string | null
          total_itens: number | null
          uf: string | null
          ultima_atualizacao: string | null
          updated_at: string
          url_rastreamento: string | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_liquido_vendedor: number | null
          valor_pago: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_documento?: string | null
          cliente_nome?: string | null
          codigo_barras?: string | null
          codigo_rastreamento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          custo_envio_seller?: number | null
          data_pedido: string
          data_prevista?: string | null
          date_created?: string | null
          delivery_type?: string | null
          desconto_cupom?: number | null
          descricao?: string | null
          empresa?: string | null
          frete_pago_cliente?: number | null
          id?: string
          id_unico: string
          integration_account_id?: string | null
          last_updated?: string | null
          logistic_mode_principal?: string | null
          meta?: Json | null
          metodo_envio_combinado?: string | null
          metodo_pagamento?: string | null
          modo_envio_combinado?: string | null
          ncm?: string | null
          nome_completo?: string | null
          numero?: string | null
          numero_ecommerce?: string | null
          numero_pedido: string
          numero_venda?: string | null
          obs?: string | null
          obs_interna?: string | null
          observacoes?: string | null
          origem?: string | null
          pack_id?: string | null
          pack_status?: string | null
          pack_status_detail?: string | null
          pedido_id?: string | null
          pickup_id?: string | null
          qtd_kit?: number | null
          quantidade?: number
          quantidade_itens?: number | null
          quantidade_kit?: number | null
          quantidade_total?: number | null
          raw?: Json | null
          receita_flex_bonus?: number | null
          rua?: string | null
          shipping_method?: string | null
          shipping_mode?: string | null
          situacao?: string | null
          sku_estoque?: string | null
          sku_kit?: string | null
          sku_produto: string
          skus_produtos?: string | null
          status?: string
          status_baixa?: string | null
          status_envio?: string | null
          status_mapeamento?: string | null
          status_pagamento?: string | null
          substatus_detail?: string | null
          substatus_estado_atual?: string | null
          tags?: string[] | null
          taxa_marketplace?: number | null
          tipo_entrega?: string | null
          tipo_logistico?: string | null
          tipo_metodo_envio?: string | null
          tipo_pagamento?: string | null
          titulo_produto?: string | null
          total_itens?: number | null
          uf?: string | null
          ultima_atualizacao?: string | null
          updated_at?: string
          url_rastreamento?: string | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_liquido_vendedor?: number | null
          valor_pago?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_documento?: string | null
          cliente_nome?: string | null
          codigo_barras?: string | null
          codigo_rastreamento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          custo_envio_seller?: number | null
          data_pedido?: string
          data_prevista?: string | null
          date_created?: string | null
          delivery_type?: string | null
          desconto_cupom?: number | null
          descricao?: string | null
          empresa?: string | null
          frete_pago_cliente?: number | null
          id?: string
          id_unico?: string
          integration_account_id?: string | null
          last_updated?: string | null
          logistic_mode_principal?: string | null
          meta?: Json | null
          metodo_envio_combinado?: string | null
          metodo_pagamento?: string | null
          modo_envio_combinado?: string | null
          ncm?: string | null
          nome_completo?: string | null
          numero?: string | null
          numero_ecommerce?: string | null
          numero_pedido?: string
          numero_venda?: string | null
          obs?: string | null
          obs_interna?: string | null
          observacoes?: string | null
          origem?: string | null
          pack_id?: string | null
          pack_status?: string | null
          pack_status_detail?: string | null
          pedido_id?: string | null
          pickup_id?: string | null
          qtd_kit?: number | null
          quantidade?: number
          quantidade_itens?: number | null
          quantidade_kit?: number | null
          quantidade_total?: number | null
          raw?: Json | null
          receita_flex_bonus?: number | null
          rua?: string | null
          shipping_method?: string | null
          shipping_mode?: string | null
          situacao?: string | null
          sku_estoque?: string | null
          sku_kit?: string | null
          sku_produto?: string
          skus_produtos?: string | null
          status?: string
          status_baixa?: string | null
          status_envio?: string | null
          status_mapeamento?: string | null
          status_pagamento?: string | null
          substatus_detail?: string | null
          substatus_estado_atual?: string | null
          tags?: string[] | null
          taxa_marketplace?: number | null
          tipo_entrega?: string | null
          tipo_logistico?: string | null
          tipo_metodo_envio?: string | null
          tipo_pagamento?: string | null
          titulo_produto?: string | null
          total_itens?: number | null
          uf?: string | null
          ultima_atualizacao?: string | null
          updated_at?: string
          url_rastreamento?: string | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_liquido_vendedor?: number | null
          valor_pago?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_vendas_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_vendas_public: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      integration_accounts: {
        Row: {
          account_identifier: string | null
          cnpj: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          public_auth: Json | null
          token_status: string | null
          updated_at: string
        }
        Insert: {
          account_identifier?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          public_auth?: Json | null
          token_status?: string | null
          updated_at?: string
        }
        Update: {
          account_identifier?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          public_auth?: Json | null
          token_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_accounts_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_secret_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          integration_account_id: string
          ip_address: unknown | null
          provider: string
          requesting_function: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          integration_account_id: string
          ip_address?: unknown | null
          provider: string
          requesting_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          integration_account_id?: string
          ip_address?: unknown | null
          provider?: string
          requesting_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      integration_secrets: {
        Row: {
          access_count: number | null
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          integration_account_id: string
          last_accessed_at: string | null
          meta: Json
          organization_id: string
          payload: Json | null
          provider: string
          refresh_token: string | null
          secret_enc: string
          simple_tokens: string | null
          updated_at: string
          use_simple: boolean | null
        }
        Insert: {
          access_count?: number | null
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          integration_account_id: string
          last_accessed_at?: string | null
          meta?: Json
          organization_id: string
          payload?: Json | null
          provider: string
          refresh_token?: string | null
          secret_enc: string
          simple_tokens?: string | null
          updated_at?: string
          use_simple?: boolean | null
        }
        Update: {
          access_count?: number | null
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          integration_account_id?: string
          last_accessed_at?: string | null
          meta?: Json
          organization_id?: string
          payload?: Json | null
          provider?: string
          refresh_token?: string | null
          secret_enc?: string
          simple_tokens?: string | null
          updated_at?: string
          use_simple?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_integration_account"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_secrets_access_log: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          integration_account_id: string
          ip_address: unknown | null
          provider: string
          requesting_function: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_account_id: string
          ip_address?: unknown | null
          provider: string
          requesting_function?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_account_id?: string
          ip_address?: unknown | null
          provider?: string
          requesting_function?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      integration_secrets_audit: {
        Row: {
          account_id: string
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          requesting_function: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          requesting_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          requesting_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      integration_secrets_backup: {
        Row: {
          account_id: string | null
          created_at: string | null
          enc_data: string | null
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          enc_data?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          enc_data?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          invitation_id: string | null
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_audit_log_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      itens_pedidos: {
        Row: {
          codigo_barras: string | null
          created_at: string
          descricao: string
          empresa: string | null
          id: string
          integration_account_id: string | null
          ncm: string | null
          numero_pedido: string
          numero_venda: string | null
          observacoes: string | null
          pedido_id: string
          quantidade: number
          sku: string
          updated_at: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          codigo_barras?: string | null
          created_at?: string
          descricao: string
          empresa?: string | null
          id?: string
          integration_account_id?: string | null
          ncm?: string | null
          numero_pedido: string
          numero_venda?: string | null
          observacoes?: string | null
          pedido_id: string
          quantidade?: number
          sku: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          codigo_barras?: string | null
          created_at?: string
          descricao?: string
          empresa?: string | null
          id?: string
          integration_account_id?: string | null
          ncm?: string | null
          numero_pedido?: string
          numero_venda?: string | null
          observacoes?: string | null
          pedido_id?: string
          quantidade?: number
          sku?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedidos_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedidos_pedido_fk"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedidos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      logistic_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          description: string | null
          duration_minutes: number | null
          event_date: string
          event_time: string | null
          id: string
          integration_account_id: string | null
          location: string | null
          metadata: Json | null
          notes: string | null
          notification_days_before: number | null
          organization_id: string
          priority: string
          related_pedido_id: string | null
          related_produto_id: string | null
          reminder_sent: boolean | null
          status: string
          title: string
          tracking_code: string | null
          transport_company: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_date: string
          event_time?: string | null
          id?: string
          integration_account_id?: string | null
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          notification_days_before?: number | null
          organization_id: string
          priority?: string
          related_pedido_id?: string | null
          related_produto_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          title: string
          tracking_code?: string | null
          transport_company?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_date?: string
          event_time?: string | null
          id?: string
          integration_account_id?: string | null
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          notification_days_before?: number | null
          organization_id?: string
          priority?: string
          related_pedido_id?: string | null
          related_produto_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          title?: string
          tracking_code?: string | null
          transport_company?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistic_events_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mapeamentos_depara: {
        Row: {
          ativo: boolean
          created_at: string
          data_mapeamento: string | null
          id: string
          motivo_criacao: string | null
          observacoes: string | null
          organization_id: string | null
          pedidos_aguardando: number | null
          prioridade: string | null
          quantidade: number
          sku_correspondente: string | null
          sku_pedido: string
          sku_simples: string | null
          tempo_criacao_pedido: string | null
          updated_at: string
          usuario_mapeamento: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_mapeamento?: string | null
          id?: string
          motivo_criacao?: string | null
          observacoes?: string | null
          organization_id?: string | null
          pedidos_aguardando?: number | null
          prioridade?: string | null
          quantidade?: number
          sku_correspondente?: string | null
          sku_pedido: string
          sku_simples?: string | null
          tempo_criacao_pedido?: string | null
          updated_at?: string
          usuario_mapeamento?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_mapeamento?: string | null
          id?: string
          motivo_criacao?: string | null
          observacoes?: string | null
          organization_id?: string | null
          pedidos_aguardando?: number | null
          prioridade?: string | null
          quantidade?: number
          sku_correspondente?: string | null
          sku_pedido?: string
          sku_simples?: string | null
          tempo_criacao_pedido?: string | null
          updated_at?: string
          usuario_mapeamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mapeamentos_depara_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapeamentos_depara_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_accounts_v2: {
        Row: {
          country_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          last_sync: string | null
          ml_user_id: string
          nickname: string
          organization_id: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          last_sync?: string | null
          ml_user_id: string
          nickname: string
          organization_id: string
          site_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          last_sync?: string | null
          ml_user_id?: string
          nickname?: string
          organization_id?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ml_devolucoes_reclamacoes: {
        Row: {
          amount_claimed: number | null
          amount_refunded: number | null
          buyer_email: string | null
          buyer_id: string | null
          buyer_nickname: string | null
          claim_id: string
          claim_stage: string | null
          claim_status: string
          claim_type: string
          created_at: string
          currency: string | null
          date_closed: string | null
          date_created: string
          date_last_update: string | null
          id: string
          integration_account_id: string
          internal_notes: string | null
          item_id: string | null
          item_title: string | null
          last_message: string | null
          order_id: string
          order_number: string | null
          organization_id: string
          priority: string | null
          processed_at: string | null
          processed_by: string | null
          processed_status: string | null
          quantity: number | null
          raw_data: Json | null
          reason_code: string | null
          reason_description: string | null
          resolution: string | null
          seller_response: string | null
          sku: string | null
          tags: string[] | null
          unit_price: number | null
          updated_at: string
          variation_id: string | null
        }
        Insert: {
          amount_claimed?: number | null
          amount_refunded?: number | null
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          claim_id: string
          claim_stage?: string | null
          claim_status: string
          claim_type: string
          created_at?: string
          currency?: string | null
          date_closed?: string | null
          date_created: string
          date_last_update?: string | null
          id?: string
          integration_account_id: string
          internal_notes?: string | null
          item_id?: string | null
          item_title?: string | null
          last_message?: string | null
          order_id: string
          order_number?: string | null
          organization_id?: string
          priority?: string | null
          processed_at?: string | null
          processed_by?: string | null
          processed_status?: string | null
          quantity?: number | null
          raw_data?: Json | null
          reason_code?: string | null
          reason_description?: string | null
          resolution?: string | null
          seller_response?: string | null
          sku?: string | null
          tags?: string[] | null
          unit_price?: number | null
          updated_at?: string
          variation_id?: string | null
        }
        Update: {
          amount_claimed?: number | null
          amount_refunded?: number | null
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          claim_id?: string
          claim_stage?: string | null
          claim_status?: string
          claim_type?: string
          created_at?: string
          currency?: string | null
          date_closed?: string | null
          date_created?: string
          date_last_update?: string | null
          id?: string
          integration_account_id?: string
          internal_notes?: string | null
          item_id?: string | null
          item_title?: string | null
          last_message?: string | null
          order_id?: string
          order_number?: string | null
          organization_id?: string
          priority?: string | null
          processed_at?: string | null
          processed_by?: string | null
          processed_status?: string | null
          quantity?: number | null
          raw_data?: Json | null
          reason_code?: string | null
          reason_description?: string | null
          resolution?: string | null
          seller_response?: string | null
          sku?: string | null
          tags?: string[] | null
          unit_price?: number | null
          updated_at?: string
          variation_id?: string | null
        }
        Relationships: []
      }
      ml_orders_completas: {
        Row: {
          buyer_id: string | null
          buyer_nickname: string | null
          claims_count: number | null
          created_at: string | null
          currency: string | null
          date_created: string | null
          has_claims: boolean | null
          id: number
          integration_account_id: string | null
          item_title: string | null
          order_id: string
          organization_id: string
          quantity: number | null
          raw_data: Json | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          buyer_nickname?: string | null
          claims_count?: number | null
          created_at?: string | null
          currency?: string | null
          date_created?: string | null
          has_claims?: boolean | null
          id?: number
          integration_account_id?: string | null
          item_title?: string | null
          order_id: string
          organization_id: string
          quantity?: number | null
          raw_data?: Json | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          buyer_nickname?: string | null
          claims_count?: number | null
          created_at?: string | null
          currency?: string | null
          date_created?: string | null
          has_claims?: boolean | null
          id?: number
          integration_account_id?: string | null
          item_title?: string | null
          order_id?: string
          organization_id?: string
          quantity?: number | null
          raw_data?: Json | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_orders_completas_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_orders_completas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_reverse_engineering_results: {
        Row: {
          created_at: string
          id: string
          integration_account_id: string
          mapping_results: Json
          organization_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_account_id: string
          mapping_results: Json
          organization_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_account_id?: string
          mapping_results?: Json
          organization_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          observacoes: string | null
          produto_id: string
          quantidade_anterior: number
          quantidade_movimentada: number
          quantidade_nova: number
          tipo_movimentacao: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          produto_id: string
          quantidade_anterior: number
          quantidade_movimentada: number
          quantidade_nova: number
          tipo_movimentacao: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          produto_id?: string
          quantidade_anterior?: number
          quantidade_movimentada?: number
          quantidade_nova?: number
          tipo_movimentacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          is_shared: boolean | null
          last_edited_by: string | null
          metadata: Json | null
          organization_id: string
          related_cliente_id: string | null
          related_pedido_id: string | null
          related_produto_id: string | null
          shared_with: string[] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string | null
          created_by: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          is_shared?: boolean | null
          last_edited_by?: string | null
          metadata?: Json | null
          organization_id: string
          related_cliente_id?: string | null
          related_pedido_id?: string | null
          related_produto_id?: string | null
          shared_with?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          is_shared?: boolean | null
          last_edited_by?: string | null
          metadata?: Json | null
          organization_id?: string
          related_cliente_id?: string | null
          related_pedido_id?: string | null
          related_produto_id?: string | null
          shared_with?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          code_verifier: string
          created_at: string
          expires_at: string
          id: string
          organization_id: string | null
          provider: string | null
          redirect_uri: string | null
          state_value: string | null
          used: boolean | null
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string | null
          provider?: string | null
          redirect_uri?: string | null
          state_value?: string | null
          used?: boolean | null
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string | null
          provider?: string | null
          redirect_uri?: string | null
          state_value?: string | null
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          plano: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          plano?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          plano?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          token: string
          used: boolean | null
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          token: string
          used?: boolean | null
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          token?: string
          used?: boolean | null
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cidade: string | null
          codigo_rastreamento: string | null
          cpf_cnpj: string | null
          created_at: string
          data_pedido: string
          data_prevista: string | null
          empresa: string | null
          id: string
          integration_account_id: string | null
          nome_cliente: string
          numero: string
          numero_ecommerce: string | null
          numero_venda: string | null
          obs: string | null
          obs_interna: string | null
          situacao: string
          uf: string | null
          updated_at: string
          url_rastreamento: string | null
          valor_desconto: number
          valor_frete: number
          valor_total: number
        }
        Insert: {
          cidade?: string | null
          codigo_rastreamento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_pedido: string
          data_prevista?: string | null
          empresa?: string | null
          id?: string
          integration_account_id?: string | null
          nome_cliente: string
          numero: string
          numero_ecommerce?: string | null
          numero_venda?: string | null
          obs?: string | null
          obs_interna?: string | null
          situacao: string
          uf?: string | null
          updated_at?: string
          url_rastreamento?: string | null
          valor_desconto?: number
          valor_frete?: number
          valor_total: number
        }
        Update: {
          cidade?: string | null
          codigo_rastreamento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_pedido?: string
          data_prevista?: string | null
          empresa?: string | null
          id?: string
          integration_account_id?: string | null
          nome_cliente?: string
          numero?: string
          numero_ecommerce?: string | null
          numero_venda?: string | null
          obs?: string | null
          obs_interna?: string | null
          situacao?: string
          uf?: string | null
          updated_at?: string
          url_rastreamento?: string | null
          valor_desconto?: number
          valor_frete?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_componentes: {
        Row: {
          created_at: string
          id: string
          nome_componente: string
          organization_id: string
          quantidade: number
          sku_componente: string
          sku_produto: string
          unidade_medida_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_componente: string
          organization_id: string
          quantidade?: number
          sku_componente: string
          sku_produto: string
          unidade_medida_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_componente?: string
          organization_id?: string
          quantidade?: number
          sku_componente?: string
          sku_produto?: string
          unidade_medida_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_componentes_unidade_medida_id_fkey"
            columns: ["unidade_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_imagens: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string | null
          ordem: number | null
          principal: boolean | null
          produto_id: string
          tamanho_arquivo: number | null
          tipo_mime: string | null
          updated_at: string
          url_imagem: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          ordem?: number | null
          principal?: boolean | null
          produto_id: string
          tamanho_arquivo?: number | null
          tipo_mime?: string | null
          updated_at?: string
          url_imagem: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          ordem?: number | null
          principal?: boolean | null
          produto_id?: string
          tamanho_arquivo?: number | null
          tipo_mime?: string | null
          updated_at?: string
          url_imagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produto_imagens_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_tag_relacionamentos: {
        Row: {
          created_at: string
          produto_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          produto_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          produto_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produto_tag_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produto_tag_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "produto_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_tags: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          organization_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          organization_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          organization_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          categoria_id: string | null
          categoria_nivel2: string | null
          categoria_principal: string | null
          codigo_barras: string | null
          created_at: string
          descricao: string | null
          estoque_maximo: number
          estoque_minimo: number
          id: string
          integration_account_id: string | null
          localizacao: string | null
          nome: string
          organization_id: string | null
          preco_custo: number | null
          preco_venda: number | null
          produto_origem_id: string | null
          quantidade_atual: number
          sku_gerado_automaticamente: boolean | null
          sku_interno: string
          status: string
          subcategoria: string | null
          ultima_movimentacao: string | null
          unidade_medida_id: string
          updated_at: string
          url_imagem: string | null
          versao: number | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          categoria_id?: string | null
          categoria_nivel2?: string | null
          categoria_principal?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          estoque_maximo?: number
          estoque_minimo?: number
          id?: string
          integration_account_id?: string | null
          localizacao?: string | null
          nome: string
          organization_id?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          produto_origem_id?: string | null
          quantidade_atual?: number
          sku_gerado_automaticamente?: boolean | null
          sku_interno: string
          status?: string
          subcategoria?: string | null
          ultima_movimentacao?: string | null
          unidade_medida_id: string
          updated_at?: string
          url_imagem?: string | null
          versao?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          categoria_id?: string | null
          categoria_nivel2?: string | null
          categoria_principal?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          estoque_maximo?: number
          estoque_minimo?: number
          id?: string
          integration_account_id?: string | null
          localizacao?: string | null
          nome?: string
          organization_id?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          produto_origem_id?: string | null
          quantidade_atual?: number
          sku_gerado_automaticamente?: boolean | null
          sku_interno?: string
          status?: string
          subcategoria?: string | null
          ultima_movimentacao?: string | null
          unidade_medida_id?: string
          updated_at?: string
          url_imagem?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_unidade_medida_id_fkey"
            columns: ["unidade_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_composicoes: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          categoria_nivel2: string | null
          categoria_principal: string | null
          codigo_barras: string | null
          created_at: string | null
          descricao: string | null
          estoque_minimo: number | null
          id: string
          nome: string
          organization_id: string
          preco_custo: number | null
          preco_venda: number | null
          quantidade_atual: number | null
          sku_interno: string
          status: string | null
          subcategoria: string | null
          updated_at: string | null
          url_imagem: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          categoria_nivel2?: string | null
          categoria_principal?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          organization_id: string
          preco_custo?: number | null
          preco_venda?: number | null
          quantidade_atual?: number | null
          sku_interno: string
          status?: string | null
          subcategoria?: string | null
          updated_at?: string | null
          url_imagem?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          categoria_nivel2?: string | null
          categoria_principal?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          organization_id?: string
          preco_custo?: number | null
          preco_venda?: number | null
          quantidade_atual?: number | null
          sku_interno?: string
          status?: string | null
          subcategoria?: string | null
          updated_at?: string | null
          url_imagem?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cargo: string | null
          configuracoes_notificacao: Json | null
          created_at: string
          departamento: string | null
          id: string
          nome_completo: string | null
          nome_exibicao: string | null
          onboarding_banner_dismissed: boolean
          organizacao_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          configuracoes_notificacao?: Json | null
          created_at?: string
          departamento?: string | null
          id: string
          nome_completo?: string | null
          nome_exibicao?: string | null
          onboarding_banner_dismissed?: boolean
          organizacao_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          configuracoes_notificacao?: Json | null
          created_at?: string
          departamento?: string | null
          id?: string
          nome_completo?: string | null
          nome_exibicao?: string | null
          onboarding_banner_dismissed?: boolean
          organizacao_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_key: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_key: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          organization_id: string
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id: string
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sync_control: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          process_name: string
          progress: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          process_name: string
          progress?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          process_name?: string
          progress?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_control_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_control_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          href: string | null
          id: string
          kind: string
          link_label: string | null
          message: string
          organization_id: string | null
          priority: number | null
          target_roles: string[] | null
          target_routes: string[] | null
          target_users: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          href?: string | null
          id?: string
          kind: string
          link_label?: string | null
          message: string
          organization_id?: string | null
          priority?: number | null
          target_roles?: string[] | null
          target_routes?: string[] | null
          target_users?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          href?: string | null
          id?: string
          kind?: string
          link_label?: string | null
          message?: string
          organization_id?: string | null
          priority?: number | null
          target_roles?: string[] | null
          target_routes?: string[] | null
          target_users?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_backups: {
        Row: {
          backup_type: string
          checksum: string | null
          completed_at: string | null
          error_message: string | null
          file_path: string
          file_size: number | null
          id: string
          organization_id: string
          retention_until: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          backup_type: string
          checksum?: string | null
          completed_at?: string | null
          error_message?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          organization_id: string
          retention_until?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          error_message?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          organization_id?: string
          retention_until?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      tiny_v3_audit: {
        Row: {
          action: string
          actor: string | null
          at: string
          detail: Json
          id: number
        }
        Insert: {
          action: string
          actor?: string | null
          at?: string
          detail: Json
          id?: number
        }
        Update: {
          action?: string
          actor?: string | null
          at?: string
          detail?: Json
          id?: number
        }
        Relationships: []
      }
      tiny_v3_credentials: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          id: string
          organization_id: string
          redirect_uri: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          organization_id: string
          redirect_uri: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          organization_id?: string
          redirect_uri?: string
          updated_at?: string
        }
        Relationships: []
      }
      tiny_v3_tokens: {
        Row: {
          access_token: string | null
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          abreviacao: string
          ativo: boolean
          created_at: string
          fator_conversao: number
          id: string
          nome: string
          organization_id: string
          tipo: string
          unidade_base: boolean
          updated_at: string
        }
        Insert: {
          abreviacao: string
          ativo?: boolean
          created_at?: string
          fator_conversao?: number
          id?: string
          nome: string
          organization_id: string
          tipo: string
          unidade_base?: boolean
          updated_at?: string
        }
        Update: {
          abreviacao?: string
          ativo?: boolean
          created_at?: string
          fator_conversao?: number
          id?: string
          nome?: string
          organization_id?: string
          tipo?: string
          unidade_base?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_dismissed_notifications: {
        Row: {
          dismissed_at: string
          id: string
          notification_id: string
          notification_type: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          notification_id: string
          notification_type: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          notification_id?: string
          notification_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          allow: boolean
          created_at: string
          id: string
          organization_id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          allow: boolean
          created_at?: string
          id?: string
          organization_id: string
          permission_key: string
          user_id: string
        }
        Update: {
          allow?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clientes_secure: {
        Row: {
          cpf_cnpj: string | null
          created_at: string | null
          data_is_masked: boolean | null
          data_primeiro_pedido: string | null
          data_ultimo_pedido: string | null
          email: string | null
          empresa: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          endereco_uf: string | null
          id: string | null
          integration_account_id: string | null
          nome_completo: string | null
          observacoes: string | null
          organization_id: string | null
          status_cliente: string | null
          telefone: string | null
          ticket_medio: number | null
          total_pedidos: number | null
          updated_at: string | null
          valor_total_gasto: number | null
        }
        Insert: {
          cpf_cnpj?: never
          created_at?: string | null
          data_is_masked?: never
          data_primeiro_pedido?: string | null
          data_ultimo_pedido?: string | null
          email?: never
          empresa?: string | null
          endereco_bairro?: never
          endereco_cep?: never
          endereco_cidade?: string | null
          endereco_numero?: never
          endereco_rua?: never
          endereco_uf?: string | null
          id?: string | null
          integration_account_id?: string | null
          nome_completo?: string | null
          observacoes?: string | null
          organization_id?: string | null
          status_cliente?: string | null
          telefone?: never
          ticket_medio?: number | null
          total_pedidos?: number | null
          updated_at?: string | null
          valor_total_gasto?: number | null
        }
        Update: {
          cpf_cnpj?: never
          created_at?: string | null
          data_is_masked?: never
          data_primeiro_pedido?: string | null
          data_ultimo_pedido?: string | null
          email?: never
          empresa?: string | null
          endereco_bairro?: never
          endereco_cep?: never
          endereco_cidade?: string | null
          endereco_numero?: never
          endereco_rua?: never
          endereco_uf?: string | null
          id?: string | null
          integration_account_id?: string | null
          nome_completo?: string | null
          observacoes?: string | null
          organization_id?: string | null
          status_cliente?: string | null
          telefone?: never
          ticket_medio?: number | null
          total_pedidos?: number | null
          updated_at?: string | null
          valor_total_gasto?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation_secure: {
        Args: { _token: string }
        Returns: Json
      }
      accept_invite: {
        Args: { _token: string }
        Returns: Json
      }
      admin_list_profiles: {
        Args:
          | { _limit?: number; _offset?: number; _search?: string }
          | { _search?: string }
        Returns: {
          cargo: string
          created_at: string
          departamento: string
          id: string
          nome_completo: string
          nome_exibicao: string
          organizacao_id: string
          telefone: string
        }[]
      }
      admin_update_profile: {
        Args: { _updates: Json; _user_id: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          cargo: string | null
          configuracoes_notificacao: Json | null
          created_at: string
          departamento: string | null
          id: string
          nome_completo: string | null
          nome_exibicao: string | null
          onboarding_banner_dismissed: boolean
          organizacao_id: string | null
          telefone: string | null
          updated_at: string
        }
      }
      backfill_config_for_current_org: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      backfill_historico_vendas_orphans: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      baixar_estoque_direto: {
        Args: { p_baixas: Json }
        Returns: Json
      }
      can_view_sensitive_customer_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_access_schedule: {
        Args: { _user_id: string }
        Returns: boolean
      }
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sensitive_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_oauth_states: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_onboarding: {
        Args: {
          org_cnpj: string
          org_nome: string
          tiny_token: string
          user_cargo: string
          user_nome: string
        }
        Returns: Json
      }
      converter_quantidade: {
        Args: {
          quantidade_origem: number
          unidade_destino_id: string
          unidade_origem_id: string
        }
        Returns: number
      }
      count_baixados: {
        Args: {
          _account_ids: string[]
          _from?: string
          _search?: string
          _to?: string
        }
        Returns: number
      }
      count_mapeamentos_pendentes: {
        Args:
          | {
              _account_ids?: string[]
              _cidade?: string
              _from?: string
              _search?: string
              _shipping_status?: string
              _to?: string
              _uf?: string
              _valor_max?: number
              _valor_min?: number
            }
          | { _account_ids?: string[]; _from?: string; _to?: string }
        Returns: number
      }
      create_integration_secret_secure: {
        Args: {
          access_token?: string
          account_id: string
          client_id?: string
          client_secret?: string
          expires_at?: string
          org_id: string
          payload?: Json
          provider_name: string
          refresh_token?: string
        }
        Returns: string
      }
      create_invitation: {
        Args: { _email: string; _expires_in_days?: number; _role_id: string }
        Returns: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role_id: string
          status: string
          token: string
        }
      }
      create_logistic_events_from_pedido: {
        Args: { p_pedido_data: Json }
        Returns: string[]
      }
      debug_historico_visibilidade: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      decrypt_simple: {
        Args: { encrypted_data: string }
        Returns: string
      }
      encrypt_simple: {
        Args: { data: string }
        Returns: string
      }
      ensure_current_org: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_integrations_manager_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_historico_integration_accounts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_category_hierarchy_from_products: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_password_reset_token: {
        Args: { _email: string }
        Returns: Json
      }
      gerar_sku_automatico: {
        Args: { org_id: string; prefixo?: string }
        Returns: string
      }
      get_categorias_hierarquicas: {
        Args: { org_id: string }
        Returns: {
          ativo: boolean
          categoria_completa: string
          categoria_id: string
          categoria_principal_id: string
          cor: string
          created_at: string
          descricao: string
          icone: string
          id: string
          nivel: number
          nome: string
          ordem: number
          updated_at: string
        }[]
      }
      get_current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_secure: {
        Args: { customer_id: string }
        Returns: {
          cpf_cnpj: string
          created_at: string
          data_primeiro_pedido: string
          data_ultimo_pedido: string
          email: string
          empresa: string
          endereco_bairro: string
          endereco_cep: string
          endereco_cidade: string
          endereco_numero: string
          endereco_rua: string
          endereco_uf: string
          id: string
          integration_account_id: string
          nome_completo: string
          observacoes: string
          organization_id: string
          status_cliente: string
          telefone: string
          ticket_medio: number
          total_pedidos: number
          updated_at: string
          valor_total_gasto: number
        }[]
      }
      get_historico_vendas_browse: {
        Args: {
          _end?: string
          _limit?: number
          _offset?: number
          _search?: string
          _start?: string
        }
        Returns: {
          bairro: string
          cep: string
          cidade: string
          cliente_nome: string
          codigo_barras: string
          codigo_rastreamento: string
          cpf_cnpj: string
          created_at: string
          created_by: string
          custo_envio_seller: number
          data_pedido: string
          data_prevista: string
          date_created: string
          delivery_type: string
          desconto_cupom: number
          descricao: string
          empresa: string
          frete_pago_cliente: number
          id: string
          id_unico: string
          integration_account_id: string
          last_updated: string
          logistic_mode_principal: string
          meta: Json
          metodo_envio_combinado: string
          metodo_pagamento: string
          modo_envio_combinado: string
          ncm: string
          nome_completo: string
          numero: string
          numero_ecommerce: string
          numero_pedido: string
          numero_venda: string
          obs: string
          obs_interna: string
          observacoes: string
          pack_id: string
          pack_status: string
          pack_status_detail: string
          pedido_id: string
          pickup_id: string
          qtd_kit: number
          quantidade: number
          quantidade_itens: number
          quantidade_total: number
          receita_flex_bonus: number
          rua: string
          shipping_method: string
          shipping_mode: string
          situacao: string
          sku_estoque: string
          sku_kit: string
          sku_produto: string
          skus_produtos: string
          status: string
          status_baixa: string
          status_envio: string
          status_mapeamento: string
          status_pagamento: string
          substatus_detail: string
          substatus_estado_atual: string
          tags: string[]
          taxa_marketplace: number
          tipo_logistico: string
          tipo_metodo_envio: string
          tipo_pagamento: string
          titulo_produto: string
          total_itens: number
          uf: string
          ultima_atualizacao: string
          updated_at: string
          url_rastreamento: string
          valor_desconto: number
          valor_frete: number
          valor_liquido_vendedor: number
          valor_pago: number
          valor_total: number
          valor_unitario: number
        }[]
      }
      get_historico_vendas_list: {
        Args: {
          _end?: string
          _limit?: number
          _offset?: number
          _search?: string
          _start?: string
        }
        Returns: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente_documento: string | null
          cliente_nome: string | null
          codigo_barras: string | null
          codigo_rastreamento: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          custo_envio_seller: number | null
          data_pedido: string
          data_prevista: string | null
          date_created: string | null
          delivery_type: string | null
          desconto_cupom: number | null
          descricao: string | null
          empresa: string | null
          frete_pago_cliente: number | null
          id: string
          id_unico: string
          integration_account_id: string | null
          last_updated: string | null
          logistic_mode_principal: string | null
          meta: Json | null
          metodo_envio_combinado: string | null
          metodo_pagamento: string | null
          modo_envio_combinado: string | null
          ncm: string | null
          nome_completo: string | null
          numero: string | null
          numero_ecommerce: string | null
          numero_pedido: string
          numero_venda: string | null
          obs: string | null
          obs_interna: string | null
          observacoes: string | null
          origem: string | null
          pack_id: string | null
          pack_status: string | null
          pack_status_detail: string | null
          pedido_id: string | null
          pickup_id: string | null
          qtd_kit: number | null
          quantidade: number
          quantidade_itens: number | null
          quantidade_kit: number | null
          quantidade_total: number | null
          raw: Json | null
          receita_flex_bonus: number | null
          rua: string | null
          shipping_method: string | null
          shipping_mode: string | null
          situacao: string | null
          sku_estoque: string | null
          sku_kit: string | null
          sku_produto: string
          skus_produtos: string | null
          status: string
          status_baixa: string | null
          status_envio: string | null
          status_mapeamento: string | null
          status_pagamento: string | null
          substatus_detail: string | null
          substatus_estado_atual: string | null
          tags: string[] | null
          taxa_marketplace: number | null
          tipo_entrega: string | null
          tipo_logistico: string | null
          tipo_metodo_envio: string | null
          tipo_pagamento: string | null
          titulo_produto: string | null
          total_itens: number | null
          uf: string | null
          ultima_atualizacao: string | null
          updated_at: string
          url_rastreamento: string | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_liquido_vendedor: number | null
          valor_pago: number | null
          valor_total: number
          valor_unitario: number
        }[]
      }
      get_historico_vendas_masked: {
        Args:
          | {
              _end?: string
              _limit?: number
              _offset?: number
              _search?: string
              _start?: string
            }
          | {
              _end?: string
              _limit?: number
              _offset?: number
              _search?: string
              _start?: string
            }
        Returns: {
          cidade: string
          cliente_documento: string
          cliente_nome: string
          codigo_barras: string
          codigo_rastreamento: string
          cpf_cnpj: string
          created_at: string
          custo_envio_seller: number
          data_pedido: string
          data_prevista: string
          desconto_cupom: number
          descricao: string
          empresa: string
          frete_pago_cliente: number
          id: string
          id_unico: string
          integration_account_id: string
          logistic_mode_principal: string
          metodo_envio_combinado: string
          metodo_pagamento: string
          modo_envio_combinado: string
          ncm: string
          nome_completo: string
          numero_ecommerce: string
          numero_pedido: string
          numero_venda: string
          obs: string
          obs_interna: string
          observacoes: string
          pedido_id: string
          qtd_kit: number
          quantidade: number
          quantidade_kit: number
          quantidade_total: number
          receita_flex_bonus: number
          situacao: string
          sku_estoque: string
          sku_kit: string
          sku_produto: string
          status: string
          status_baixa: string
          status_envio: string
          status_mapeamento: string
          status_pagamento: string
          substatus_estado_atual: string
          taxa_marketplace: number
          tipo_entrega: string
          tipo_logistico: string
          tipo_metodo_envio: string
          tipo_pagamento: string
          titulo_produto: string
          total_itens: number
          uf: string
          ultima_atualizacao: string
          updated_at: string
          url_rastreamento: string
          valor_desconto: number
          valor_frete: number
          valor_liquido_vendedor: number
          valor_pago: number
          valor_total: number
          valor_unitario: number
        }[]
      }
      get_integration_secret: {
        Args: { _key: string; _provider: string }
        Returns: string
      }
      get_integration_secret_secure: {
        Args: {
          account_id: string
          provider_name: string
          requesting_function?: string
        }
        Returns: {
          access_token: string
          client_id: string
          client_secret: string
          expires_at: string
          payload: Json
          refresh_token: string
        }[]
      }
      get_low_stock_products: {
        Args: Record<PropertyKey, never>
        Returns: {
          ativo: boolean
          categoria: string | null
          categoria_id: string | null
          categoria_nivel2: string | null
          categoria_principal: string | null
          codigo_barras: string | null
          created_at: string
          descricao: string | null
          estoque_maximo: number
          estoque_minimo: number
          id: string
          integration_account_id: string | null
          localizacao: string | null
          nome: string
          organization_id: string | null
          preco_custo: number | null
          preco_venda: number | null
          produto_origem_id: string | null
          quantidade_atual: number
          sku_gerado_automaticamente: boolean | null
          sku_interno: string
          status: string
          subcategoria: string | null
          ultima_movimentacao: string | null
          unidade_medida_id: string
          updated_at: string
          url_imagem: string | null
          versao: number | null
        }[]
      }
      get_low_stock_products_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_mapeamentos_by_skus: {
        Args: { skus: string[] }
        Returns: {
          quantidade: number
          sku_correspondente: string
          sku_pedido: string
          sku_simples: string
        }[]
      }
      get_masked_clients: {
        Args: Record<PropertyKey, never>
        Returns: {
          cpf_cnpj: string
          created_at: string
          data_primeiro_pedido: string
          data_ultimo_pedido: string
          email: string
          empresa: string
          endereco_cidade: string
          endereco_uf: string
          id: string
          nome_completo: string
          observacoes: string
          organization_id: string
          status_cliente: string
          telefone: string
          ticket_medio: number
          total_pedidos: number
          updated_at: string
          valor_total_gasto: number
        }[]
      }
      get_masked_sales_history: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          cliente_nome: string
          data_pedido: string
          id: string
          numero_pedido: string
          organization_id: string
          status: string
          valor_total: number
        }[]
      }
      get_my_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          bio: string | null
          cargo: string | null
          configuracoes_notificacao: Json | null
          created_at: string
          departamento: string | null
          id: string
          nome_completo: string | null
          nome_exibicao: string | null
          onboarding_banner_dismissed: boolean
          organizacao_id: string | null
          telefone: string | null
          updated_at: string
        }[]
      }
      get_org_id_from_oauth_state: {
        Args: { p_state_value: string }
        Returns: string
      }
      get_pedidos_masked_v2: {
        Args: {
          _end_date?: string
          _integration_account_id?: string
          _limit?: number
          _offset?: number
          _search?: string
          _situacao?: string
          _start_date?: string
        }
        Returns: {
          cidade: string
          codigo_rastreamento: string
          cpf_cnpj: string
          created_at: string
          data_pedido: string
          data_prevista: string
          empresa: string
          id: string
          integration_account_id: string
          nome_cliente: string
          numero: string
          numero_ecommerce: string
          numero_venda: string
          obs: string
          obs_interna: string
          situacao: string
          uf: string
          updated_at: string
          url_rastreamento: string
          valor_desconto: number
          valor_frete: number
          valor_total: number
        }[]
      }
      get_profile_safe: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          cargo: string
          created_at: string
          departamento: string
          id: string
          nome_completo: string
          nome_exibicao: string
          organizacao_id: string
        }[]
      }
      get_profile_secure: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          cargo: string
          created_at: string
          departamento: string
          id: string
          nome_completo: string
          nome_exibicao: string
          organizacao_id: string
        }[]
      }
      get_profiles_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          cargo: string
          configuracoes_notificacao: Json
          created_at: string
          departamento: string
          id: string
          nome_completo: string
          nome_exibicao: string
          onboarding_banner_dismissed: boolean
          organizacao_id: string
          telefone: string
          updated_at: string
        }[]
      }
      get_user_organization_id: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      has_permission: {
        Args: { permission_key: string }
        Returns: boolean
      }
      hv_delete: {
        Args: { _id: string }
        Returns: undefined
      }
      hv_delete_many: {
        Args: { _ids: string[] }
        Returns: undefined
      }
      hv_exists: {
        Args: { p_id_unico: string }
        Returns: boolean
      }
      hv_exists_many: {
        Args: { p_ids_unicos: string[] }
        Returns: {
          id_unico: string
          pedido_exists: boolean
        }[]
      }
      hv_fix_orphans: {
        Args: { default_account_id?: string }
        Returns: number
      }
      hv_insert: {
        Args: { p: Json }
        Returns: string
      }
      hv_orphaned_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      log_audit_enhanced: {
        Args: {
          p_action: string
          p_duration_ms?: number
          p_module?: string
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_severity?: string
          p_source_function?: string
        }
        Returns: undefined
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      log_customer_access: {
        Args:
          | { access_type?: string; customer_id: string; details?: Json }
          | {
              p_action: string
              p_customer_id: string
              p_sensitive_accessed?: boolean
            }
        Returns: undefined
      }
      log_customer_data_access: {
        Args: { p_action?: string; p_customer_id: string }
        Returns: undefined
      }
      log_secret_access: {
        Args: {
          p_account_id: string
          p_action: string
          p_error?: string
          p_function?: string
          p_provider: string
          p_success?: boolean
        }
        Returns: undefined
      }
      log_security_access: {
        Args: {
          p_action: string
          p_resource_id: string
          p_resource_type: string
          p_sensitive_data?: boolean
        }
        Returns: undefined
      }
      mark_oauth_state_used: {
        Args: { p_state_value: string }
        Returns: boolean
      }
      mask_cpf_cnpj: {
        Args: { document: string }
        Returns: string
      }
      mask_customer_address: {
        Args: { address: string }
        Returns: string
      }
      mask_customer_cep: {
        Args: { cep: string }
        Returns: string
      }
      mask_customer_data: {
        Args: {
          p_cpf_cnpj: string
          p_email: string
          p_endereco_bairro: string
          p_endereco_cep: string
          p_endereco_cidade: string
          p_endereco_numero: string
          p_endereco_rua: string
          p_endereco_uf: string
          p_nome_completo: string
          p_telefone: string
        }
        Returns: Json
      }
      mask_customer_phone: {
        Args: { phone: string }
        Returns: string
      }
      mask_document: {
        Args: { doc: string }
        Returns: string
      }
      mask_email: {
        Args: { email_addr: string }
        Returns: string
      }
      mask_name: {
        Args: { full_name: string }
        Returns: string
      }
      mask_phone_secure: {
        Args: { phone_input: string }
        Returns: string
      }
      refresh_ml_token: {
        Args: {
          p_account_id: string
          p_expires_at: string
          p_new_access_token: string
          p_new_refresh_token: string
        }
        Returns: Json
      }
      revoke_invitation: {
        Args: { _id: string }
        Returns: Json
      }
      search_customers_secure: {
        Args: { limit_count?: number; search_term?: string }
        Returns: {
          cpf_cnpj: string
          created_at: string
          data_primeiro_pedido: string
          data_ultimo_pedido: string
          email: string
          empresa: string
          endereco_bairro: string
          endereco_cep: string
          endereco_cidade: string
          endereco_numero: string
          endereco_rua: string
          endereco_uf: string
          id: string
          integration_account_id: string
          nome_completo: string
          observacoes: string
          organization_id: string
          status_cliente: string
          telefone: string
          ticket_medio: number
          total_pedidos: number
          updated_at: string
          valor_total_gasto: number
        }[]
      }
      security_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      seed_admin_role_for_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: undefined
      }
      seed_default_categories: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      set_integration_secret: {
        Args: { _key: string; _provider: string; _value: string }
        Returns: undefined
      }
      sincronizar_componentes_em_uso: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      split_existing_categories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_cliente_from_pedido: {
        Args:
          | Record<PropertyKey, never>
          | {
              p_cidade?: string
              p_cpf_cnpj?: string
              p_data_pedido?: string
              p_empresa?: string
              p_integration_account_id?: string
              p_nome_cliente: string
              p_uf?: string
              p_valor_pedido?: number
            }
        Returns: string
      }
      tiny3_get_credentials: {
        Args: { _client_id: string } | { _org_id: string }
        Returns: {
          client_id: string
          client_secret: string
          redirect_uri: string
        }[]
      }
      tiny3_get_tokens: {
        Args: { _client_id: string }
        Returns: {
          access_token: string
          client_id: string
          expires_at: string
          refresh_token: string
        }[]
      }
      tiny3_set_credentials: {
        Args:
          | {
              _client_id: string
              _client_secret: string
              _org_id: string
              _redirect_uri?: string
            }
          | {
              _client_id: string
              _client_secret: string
              _redirect_uri?: string
            }
        Returns: undefined
      }
      tiny3_set_tokens: {
        Args: {
          _access_token: string
          _client_id: string
          _expires_at: string
          _refresh_token: string
        }
        Returns: undefined
      }
      update_integration_secret_secure: {
        Args: {
          account_id: string
          new_access_token?: string
          new_client_id?: string
          new_client_secret?: string
          new_expires_at?: string
          new_payload?: Json
          new_refresh_token?: string
          provider_name: string
        }
        Returns: boolean
      }
      user_matches_announcement: {
        Args: { target_roles: string[]; target_users: string[] }
        Returns: boolean
      }
      validate_invitation_token: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          is_valid: boolean
          organization_name: string
          role_name: string
        }[]
      }
      validate_invitation_token_secure: {
        Args: { p_token: string }
        Returns: {
          expires_at: string
          is_valid: boolean
          organization_name: string
          role_name: string
        }[]
      }
      validate_security_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_view_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_security_definer: boolean
          view_name: string
        }[]
      }
    }
    Enums: {
      integration_provider: "tiny" | "shopee" | "mercadolivre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      integration_provider: ["tiny", "shopee", "mercadolivre"],
    },
  },
} as const
