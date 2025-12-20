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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      ai_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          organization_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          organization_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          organization_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          affected_route: string | null
          confidence_score: number | null
          created_at: string
          description: string
          id: string
          implementation_notes: string | null
          insight_type: string
          organization_id: string
          priority: string
          raw_data: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_replay_ids: string[] | null
          status: string
          suggested_improvement: string | null
          title: string
          updated_at: string
          user_actions_analyzed: number | null
        }
        Insert: {
          affected_route?: string | null
          confidence_score?: number | null
          created_at?: string
          description: string
          id?: string
          implementation_notes?: string | null
          insight_type: string
          organization_id: string
          priority?: string
          raw_data?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_replay_ids?: string[] | null
          status?: string
          suggested_improvement?: string | null
          title: string
          updated_at?: string
          user_actions_analyzed?: number | null
        }
        Update: {
          affected_route?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          id?: string
          implementation_notes?: string | null
          insight_type?: string
          organization_id?: string
          priority?: string
          raw_data?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_replay_ids?: string[] | null
          status?: string
          suggested_improvement?: string | null
          title?: string
          updated_at?: string
          user_actions_analyzed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_organization_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      background_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          max_retries: number | null
          metadata: Json | null
          priority: number | null
          resource_id: string
          resource_type: string
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          resource_id: string
          resource_type: string
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          resource_id?: string
          resource_type?: string
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
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
      composicoes_insumos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          local_id: string
          observacoes: string | null
          organization_id: string
          quantidade: number
          sku_insumo: string
          sku_produto: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          local_id: string
          observacoes?: string | null
          organization_id: string
          quantidade?: number
          sku_insumo: string
          sku_produto: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          local_id?: string
          observacoes?: string | null
          organization_id?: string
          quantidade?: number
          sku_insumo?: string
          sku_produto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "composicoes_insumos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composicoes_insumos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_importacoes_historico: {
        Row: {
          created_at: string | null
          created_by: string | null
          detalhes_erro: Json | null
          fornecedor_id: string | null
          id: string
          linhas_erro: number | null
          linhas_processadas: number | null
          nome_arquivo: string
          organization_id: string
          produtos_atualizados: number | null
          produtos_novos: number | null
          status: string | null
          tipo_arquivo: string
          total_linhas: number | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          detalhes_erro?: Json | null
          fornecedor_id?: string | null
          id?: string
          linhas_erro?: number | null
          linhas_processadas?: number | null
          nome_arquivo: string
          organization_id?: string
          produtos_atualizados?: number | null
          produtos_novos?: number | null
          status?: string | null
          tipo_arquivo: string
          total_linhas?: number | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          detalhes_erro?: Json | null
          fornecedor_id?: string | null
          id?: string
          linhas_erro?: number | null
          linhas_processadas?: number | null
          nome_arquivo?: string
          organization_id?: string
          produtos_atualizados?: number | null
          produtos_novos?: number | null
          status?: string | null
          tipo_arquivo?: string
          total_linhas?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_importacoes_historico_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_movimentacoes_estoque: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_recebimento: string | null
          data_validade: string | null
          id: string
          lote: string | null
          observacoes: string | null
          organization_id: string
          pedido_compra_id: string | null
          produto_id: string | null
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_recebimento?: string | null
          data_validade?: string | null
          id?: string
          lote?: string | null
          observacoes?: string | null
          organization_id?: string
          pedido_compra_id?: string | null
          produto_id?: string | null
          quantidade: number
          valor_unitario: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_recebimento?: string | null
          data_validade?: string | null
          id?: string
          lote?: string | null
          observacoes?: string | null
          organization_id?: string
          pedido_compra_id?: string | null
          produto_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_movimentacoes_estoque_pedido_compra_id_fkey"
            columns: ["pedido_compra_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
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
      cotacoes: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_abertura: string
          data_fechamento: string | null
          descricao: string
          id: string
          numero_cotacao: string
          observacoes: string | null
          organization_id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_abertura?: string
          data_fechamento?: string | null
          descricao: string
          id?: string
          numero_cotacao: string
          observacoes?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_abertura?: string
          data_fechamento?: string | null
          descricao?: string
          id?: string
          numero_cotacao?: string
          observacoes?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      cotacoes_arquivos: {
        Row: {
          cotacao_id: string
          created_at: string
          created_by: string
          dados_processados: Json | null
          detalhes_erro: Json | null
          id: string
          linhas_erro: number | null
          linhas_processadas: number | null
          nome_arquivo: string
          organization_id: string
          status: string
          tipo_arquivo: string
          total_linhas: number | null
          updated_at: string
          url_arquivo: string | null
        }
        Insert: {
          cotacao_id: string
          created_at?: string
          created_by?: string
          dados_processados?: Json | null
          detalhes_erro?: Json | null
          id?: string
          linhas_erro?: number | null
          linhas_processadas?: number | null
          nome_arquivo: string
          organization_id?: string
          status?: string
          tipo_arquivo: string
          total_linhas?: number | null
          updated_at?: string
          url_arquivo?: string | null
        }
        Update: {
          cotacao_id?: string
          created_at?: string
          created_by?: string
          dados_processados?: Json | null
          detalhes_erro?: Json | null
          id?: string
          linhas_erro?: number | null
          linhas_processadas?: number | null
          nome_arquivo?: string
          organization_id?: string
          status?: string
          tipo_arquivo?: string
          total_linhas?: number | null
          updated_at?: string
          url_arquivo?: string | null
        }
        Relationships: []
      }
      cotacoes_fornecedores: {
        Row: {
          cotacao_id: string | null
          created_at: string | null
          data_envio: string | null
          data_resposta: string | null
          fornecedor_id: string | null
          id: string
          observacoes_fornecedor: string | null
          organization_id: string
          valor_total_proposta: number | null
        }
        Insert: {
          cotacao_id?: string | null
          created_at?: string | null
          data_envio?: string | null
          data_resposta?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes_fornecedor?: string | null
          organization_id?: string
          valor_total_proposta?: number | null
        }
        Update: {
          cotacao_id?: string | null
          created_at?: string | null
          data_envio?: string | null
          data_resposta?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes_fornecedor?: string | null
          organization_id?: string
          valor_total_proposta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_fornecedores_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_fornecedores_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes_internacionais: {
        Row: {
          container_tipo: string | null
          created_at: string
          created_by: string
          data_abertura: string
          data_fechamento: string | null
          descricao: string
          fator_multiplicador: number
          id: string
          moeda_origem: string
          numero_cotacao: string
          observacoes: string | null
          organization_id: string
          pais_origem: string
          produtos: Json
          status: string
          total_cbm: number | null
          total_peso_kg: number | null
          total_quantidade: number | null
          total_valor_brl: number | null
          total_valor_origem: number | null
          total_valor_usd: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          container_tipo?: string | null
          created_at?: string
          created_by?: string
          data_abertura?: string
          data_fechamento?: string | null
          descricao: string
          fator_multiplicador?: number
          id?: string
          moeda_origem?: string
          numero_cotacao: string
          observacoes?: string | null
          organization_id?: string
          pais_origem?: string
          produtos?: Json
          status?: string
          total_cbm?: number | null
          total_peso_kg?: number | null
          total_quantidade?: number | null
          total_valor_brl?: number | null
          total_valor_origem?: number | null
          total_valor_usd?: number | null
          updated_at?: string
          updated_by?: string
        }
        Update: {
          container_tipo?: string | null
          created_at?: string
          created_by?: string
          data_abertura?: string
          data_fechamento?: string | null
          descricao?: string
          fator_multiplicador?: number
          id?: string
          moeda_origem?: string
          numero_cotacao?: string
          observacoes?: string | null
          organization_id?: string
          pais_origem?: string
          produtos?: Json
          status?: string
          total_cbm?: number | null
          total_peso_kg?: number | null
          total_quantidade?: number | null
          total_valor_brl?: number | null
          total_valor_origem?: number | null
          total_valor_usd?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      cotacoes_itens: {
        Row: {
          cotacao_id: string | null
          created_at: string | null
          especificacoes: string | null
          id: string
          organization_id: string
          produto_id: string | null
          quantidade: number
        }
        Insert: {
          cotacao_id?: string | null
          created_at?: string | null
          especificacoes?: string | null
          id?: string
          organization_id?: string
          produto_id?: string | null
          quantidade: number
        }
        Update: {
          cotacao_id?: string | null
          created_at?: string | null
          especificacoes?: string | null
          id?: string
          organization_id?: string
          produto_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_itens_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes_propostas: {
        Row: {
          cotacao_fornecedor_id: string | null
          cotacao_item_id: string | null
          created_at: string | null
          id: string
          observacoes: string | null
          organization_id: string
          prazo_entrega: number | null
          valor_unitario: number
        }
        Insert: {
          cotacao_fornecedor_id?: string | null
          cotacao_item_id?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          prazo_entrega?: number | null
          valor_unitario: number
        }
        Update: {
          cotacao_fornecedor_id?: string | null
          cotacao_item_id?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          prazo_entrega?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_propostas_cotacao_fornecedor_id_fkey"
            columns: ["cotacao_fornecedor_id"]
            isOneToOne: false
            referencedRelation: "cotacoes_fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_propostas_cotacao_item_id_fkey"
            columns: ["cotacao_item_id"]
            isOneToOne: false
            referencedRelation: "cotacoes_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_data_access_log: {
        Row: {
          action: string
          created_at: string
          customer_id: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          acao_seller_necessaria: string | null
          account_name: string | null
          anexos_ml: Json | null
          campos_atualizados: Json | null
          carrier_info: Json | null
          categoria_problema: string | null
          claim_fulfilled: boolean | null
          claim_id: string | null
          claim_quantity_type: string | null
          claim_stage: string | null
          codigo_rastreamento: string | null
          codigo_rastreamento_devolucao: string | null
          comprador_cpf: string | null
          comprador_nickname: string | null
          comprador_nome_completo: string | null
          created_at: string | null
          custo_devolucao_ml: number | null
          custo_devolucao_ml_usd: number | null
          dados_acoes_disponiveis: Json | null
          dados_available_actions: Json | null
          dados_buyer_info: Json | null
          dados_claim: Json | null
          dados_comunicacao: Json | null
          dados_costs: Json | null
          dados_custos_logistica: Json | null
          dados_deadlines: Json | null
          dados_financial_info: Json | null
          dados_fulfillment: Json | null
          dados_lead_time: Json | null
          dados_mensagens: Json | null
          dados_order: Json | null
          dados_product_condition: Json | null
          dados_product_info: Json | null
          dados_quantities: Json | null
          dados_reasons: Json | null
          dados_refund_info: Json | null
          dados_return: Json | null
          dados_review: Json | null
          dados_reviews: Json | null
          dados_shipping_costs: Json | null
          dados_tracking_info: Json | null
          data_atualizacao_devolucao: string | null
          data_chegada_produto: string | null
          data_criacao: string | null
          data_criacao_claim: string | null
          data_criacao_devolucao: string | null
          data_fechamento_claim: string | null
          data_fechamento_devolucao: string | null
          data_inicio_return: string | null
          data_reembolso: string | null
          data_status_analise: string | null
          data_ultima_movimentacao: string | null
          data_ultimo_status: string | null
          descricao_ultimo_status: string | null
          eh_troca: boolean | null
          em_mediacao: boolean | null
          endereco_destino: Json | null
          fonte_dados_primaria: string | null
          has_related_return: boolean | null
          hash_verificacao: string | null
          historico_status: Json | null
          id: string
          integration_account_id: string | null
          internal_tags: string[] | null
          localizacao_atual: string | null
          marcos_temporais: Json | null
          marketplace_origem: string | null
          metodo_pagamento: string | null
          metodo_reembolso: string | null
          metodo_resolucao: string | null
          moeda_custo: string | null
          moeda_custo_devolucao_ml: string | null
          moeda_reembolso: string | null
          motivo_categoria: string | null
          nota_fiscal_autorizada: boolean | null
          numero_interacoes: number | null
          observacoes_review: string | null
          order_id: string
          origem_timeline: string | null
          parcelas: number | null
          produto_titulo: string | null
          produto_troca_id: string | null
          quantidade: number | null
          reason_category: string | null
          reason_detail: string | null
          reason_expected_resolutions: string[] | null
          reason_id: string | null
          reason_name: string | null
          reason_priority: string | null
          reason_rules_engine: string[] | null
          reason_type: string | null
          related_entities: Json | null
          responsavel_custo: string | null
          resultado_final: string | null
          return_id: string | null
          return_intermediate_check: Json | null
          return_resource_type: string | null
          review_id: string | null
          review_result: string | null
          review_status: string | null
          revisor_responsavel: string | null
          shipment_costs: Json | null
          shipment_id: string | null
          shipment_id_devolucao: number | null
          sku: string | null
          snapshot_anterior: Json | null
          status_analise: string | null
          status_devolucao: string | null
          status_moderacao: string | null
          status_produto_novo: string | null
          status_rastreamento: string | null
          status_rastreamento_devolucao: string | null
          status_rastreamento_pedido: string | null
          status_transporte_atual: string | null
          subtipo_devolucao: string | null
          tags_automaticas: string[] | null
          tags_pedido: string[] | null
          tem_financeiro: boolean | null
          tem_review: boolean | null
          tem_sla: boolean | null
          timeline_consolidado: Json | null
          timeline_events: Json | null
          timeline_mensagens: Json | null
          tipo_claim: string | null
          tipo_envio_devolucao: string | null
          tipo_logistica: string | null
          tipo_pagamento: string | null
          tracking_events: Json | null
          tracking_history: Json | null
          transaction_id: string | null
          transportadora: string | null
          transportadora_devolucao: string | null
          ultima_atualizacao_real: string | null
          ultima_mensagem_data: string | null
          ultima_mensagem_remetente: string | null
          ultima_sincronizacao: string | null
          updated_at: string | null
          url_rastreamento: string | null
          usuario_status_analise: string | null
          usuario_ultima_acao: string | null
          valor_original_produto: number | null
          valor_parcela: number | null
          valor_retido: number | null
          versao_api_utilizada: string | null
        }
        Insert: {
          acao_seller_necessaria?: string | null
          account_name?: string | null
          anexos_ml?: Json | null
          campos_atualizados?: Json | null
          carrier_info?: Json | null
          categoria_problema?: string | null
          claim_fulfilled?: boolean | null
          claim_id?: string | null
          claim_quantity_type?: string | null
          claim_stage?: string | null
          codigo_rastreamento?: string | null
          codigo_rastreamento_devolucao?: string | null
          comprador_cpf?: string | null
          comprador_nickname?: string | null
          comprador_nome_completo?: string | null
          created_at?: string | null
          custo_devolucao_ml?: number | null
          custo_devolucao_ml_usd?: number | null
          dados_acoes_disponiveis?: Json | null
          dados_available_actions?: Json | null
          dados_buyer_info?: Json | null
          dados_claim?: Json | null
          dados_comunicacao?: Json | null
          dados_costs?: Json | null
          dados_custos_logistica?: Json | null
          dados_deadlines?: Json | null
          dados_financial_info?: Json | null
          dados_fulfillment?: Json | null
          dados_lead_time?: Json | null
          dados_mensagens?: Json | null
          dados_order?: Json | null
          dados_product_condition?: Json | null
          dados_product_info?: Json | null
          dados_quantities?: Json | null
          dados_reasons?: Json | null
          dados_refund_info?: Json | null
          dados_return?: Json | null
          dados_review?: Json | null
          dados_reviews?: Json | null
          dados_shipping_costs?: Json | null
          dados_tracking_info?: Json | null
          data_atualizacao_devolucao?: string | null
          data_chegada_produto?: string | null
          data_criacao?: string | null
          data_criacao_claim?: string | null
          data_criacao_devolucao?: string | null
          data_fechamento_claim?: string | null
          data_fechamento_devolucao?: string | null
          data_inicio_return?: string | null
          data_reembolso?: string | null
          data_status_analise?: string | null
          data_ultima_movimentacao?: string | null
          data_ultimo_status?: string | null
          descricao_ultimo_status?: string | null
          eh_troca?: boolean | null
          em_mediacao?: boolean | null
          endereco_destino?: Json | null
          fonte_dados_primaria?: string | null
          has_related_return?: boolean | null
          hash_verificacao?: string | null
          historico_status?: Json | null
          id?: string
          integration_account_id?: string | null
          internal_tags?: string[] | null
          localizacao_atual?: string | null
          marcos_temporais?: Json | null
          marketplace_origem?: string | null
          metodo_pagamento?: string | null
          metodo_reembolso?: string | null
          metodo_resolucao?: string | null
          moeda_custo?: string | null
          moeda_custo_devolucao_ml?: string | null
          moeda_reembolso?: string | null
          motivo_categoria?: string | null
          nota_fiscal_autorizada?: boolean | null
          numero_interacoes?: number | null
          observacoes_review?: string | null
          order_id: string
          origem_timeline?: string | null
          parcelas?: number | null
          produto_titulo?: string | null
          produto_troca_id?: string | null
          quantidade?: number | null
          reason_category?: string | null
          reason_detail?: string | null
          reason_expected_resolutions?: string[] | null
          reason_id?: string | null
          reason_name?: string | null
          reason_priority?: string | null
          reason_rules_engine?: string[] | null
          reason_type?: string | null
          related_entities?: Json | null
          responsavel_custo?: string | null
          resultado_final?: string | null
          return_id?: string | null
          return_intermediate_check?: Json | null
          return_resource_type?: string | null
          review_id?: string | null
          review_result?: string | null
          review_status?: string | null
          revisor_responsavel?: string | null
          shipment_costs?: Json | null
          shipment_id?: string | null
          shipment_id_devolucao?: number | null
          sku?: string | null
          snapshot_anterior?: Json | null
          status_analise?: string | null
          status_devolucao?: string | null
          status_moderacao?: string | null
          status_produto_novo?: string | null
          status_rastreamento?: string | null
          status_rastreamento_devolucao?: string | null
          status_rastreamento_pedido?: string | null
          status_transporte_atual?: string | null
          subtipo_devolucao?: string | null
          tags_automaticas?: string[] | null
          tags_pedido?: string[] | null
          tem_financeiro?: boolean | null
          tem_review?: boolean | null
          tem_sla?: boolean | null
          timeline_consolidado?: Json | null
          timeline_events?: Json | null
          timeline_mensagens?: Json | null
          tipo_claim?: string | null
          tipo_envio_devolucao?: string | null
          tipo_logistica?: string | null
          tipo_pagamento?: string | null
          tracking_events?: Json | null
          tracking_history?: Json | null
          transaction_id?: string | null
          transportadora?: string | null
          transportadora_devolucao?: string | null
          ultima_atualizacao_real?: string | null
          ultima_mensagem_data?: string | null
          ultima_mensagem_remetente?: string | null
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          url_rastreamento?: string | null
          usuario_status_analise?: string | null
          usuario_ultima_acao?: string | null
          valor_original_produto?: number | null
          valor_parcela?: number | null
          valor_retido?: number | null
          versao_api_utilizada?: string | null
        }
        Update: {
          acao_seller_necessaria?: string | null
          account_name?: string | null
          anexos_ml?: Json | null
          campos_atualizados?: Json | null
          carrier_info?: Json | null
          categoria_problema?: string | null
          claim_fulfilled?: boolean | null
          claim_id?: string | null
          claim_quantity_type?: string | null
          claim_stage?: string | null
          codigo_rastreamento?: string | null
          codigo_rastreamento_devolucao?: string | null
          comprador_cpf?: string | null
          comprador_nickname?: string | null
          comprador_nome_completo?: string | null
          created_at?: string | null
          custo_devolucao_ml?: number | null
          custo_devolucao_ml_usd?: number | null
          dados_acoes_disponiveis?: Json | null
          dados_available_actions?: Json | null
          dados_buyer_info?: Json | null
          dados_claim?: Json | null
          dados_comunicacao?: Json | null
          dados_costs?: Json | null
          dados_custos_logistica?: Json | null
          dados_deadlines?: Json | null
          dados_financial_info?: Json | null
          dados_fulfillment?: Json | null
          dados_lead_time?: Json | null
          dados_mensagens?: Json | null
          dados_order?: Json | null
          dados_product_condition?: Json | null
          dados_product_info?: Json | null
          dados_quantities?: Json | null
          dados_reasons?: Json | null
          dados_refund_info?: Json | null
          dados_return?: Json | null
          dados_review?: Json | null
          dados_reviews?: Json | null
          dados_shipping_costs?: Json | null
          dados_tracking_info?: Json | null
          data_atualizacao_devolucao?: string | null
          data_chegada_produto?: string | null
          data_criacao?: string | null
          data_criacao_claim?: string | null
          data_criacao_devolucao?: string | null
          data_fechamento_claim?: string | null
          data_fechamento_devolucao?: string | null
          data_inicio_return?: string | null
          data_reembolso?: string | null
          data_status_analise?: string | null
          data_ultima_movimentacao?: string | null
          data_ultimo_status?: string | null
          descricao_ultimo_status?: string | null
          eh_troca?: boolean | null
          em_mediacao?: boolean | null
          endereco_destino?: Json | null
          fonte_dados_primaria?: string | null
          has_related_return?: boolean | null
          hash_verificacao?: string | null
          historico_status?: Json | null
          id?: string
          integration_account_id?: string | null
          internal_tags?: string[] | null
          localizacao_atual?: string | null
          marcos_temporais?: Json | null
          marketplace_origem?: string | null
          metodo_pagamento?: string | null
          metodo_reembolso?: string | null
          metodo_resolucao?: string | null
          moeda_custo?: string | null
          moeda_custo_devolucao_ml?: string | null
          moeda_reembolso?: string | null
          motivo_categoria?: string | null
          nota_fiscal_autorizada?: boolean | null
          numero_interacoes?: number | null
          observacoes_review?: string | null
          order_id?: string
          origem_timeline?: string | null
          parcelas?: number | null
          produto_titulo?: string | null
          produto_troca_id?: string | null
          quantidade?: number | null
          reason_category?: string | null
          reason_detail?: string | null
          reason_expected_resolutions?: string[] | null
          reason_id?: string | null
          reason_name?: string | null
          reason_priority?: string | null
          reason_rules_engine?: string[] | null
          reason_type?: string | null
          related_entities?: Json | null
          responsavel_custo?: string | null
          resultado_final?: string | null
          return_id?: string | null
          return_intermediate_check?: Json | null
          return_resource_type?: string | null
          review_id?: string | null
          review_result?: string | null
          review_status?: string | null
          revisor_responsavel?: string | null
          shipment_costs?: Json | null
          shipment_id?: string | null
          shipment_id_devolucao?: number | null
          sku?: string | null
          snapshot_anterior?: Json | null
          status_analise?: string | null
          status_devolucao?: string | null
          status_moderacao?: string | null
          status_produto_novo?: string | null
          status_rastreamento?: string | null
          status_rastreamento_devolucao?: string | null
          status_rastreamento_pedido?: string | null
          status_transporte_atual?: string | null
          subtipo_devolucao?: string | null
          tags_automaticas?: string[] | null
          tags_pedido?: string[] | null
          tem_financeiro?: boolean | null
          tem_review?: boolean | null
          tem_sla?: boolean | null
          timeline_consolidado?: Json | null
          timeline_events?: Json | null
          timeline_mensagens?: Json | null
          tipo_claim?: string | null
          tipo_envio_devolucao?: string | null
          tipo_logistica?: string | null
          tipo_pagamento?: string | null
          tracking_events?: Json | null
          tracking_history?: Json | null
          transaction_id?: string | null
          transportadora?: string | null
          transportadora_devolucao?: string | null
          ultima_atualizacao_real?: string | null
          ultima_mensagem_data?: string | null
          ultima_mensagem_remetente?: string | null
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          url_rastreamento?: string | null
          usuario_status_analise?: string | null
          usuario_ultima_acao?: string | null
          valor_original_produto?: number | null
          valor_parcela?: number | null
          valor_retido?: number | null
          versao_api_utilizada?: string | null
        }
        Relationships: []
      }
      devolucoes_notificacoes: {
        Row: {
          claim_id: number
          created_at: string | null
          dados_contexto: Json | null
          deadline_date: string | null
          expires_at: string | null
          horas_restantes: number | null
          id: string
          integration_account_id: string
          lida: boolean | null
          lida_em: string | null
          lida_por: string | null
          mensagem: string
          order_id: string
          organization_id: string
          prioridade: string
          resolvida: boolean | null
          resolvida_em: string | null
          return_id: number
          tipo_notificacao: string
          titulo: string
        }
        Insert: {
          claim_id: number
          created_at?: string | null
          dados_contexto?: Json | null
          deadline_date?: string | null
          expires_at?: string | null
          horas_restantes?: number | null
          id?: string
          integration_account_id: string
          lida?: boolean | null
          lida_em?: string | null
          lida_por?: string | null
          mensagem: string
          order_id: string
          organization_id: string
          prioridade?: string
          resolvida?: boolean | null
          resolvida_em?: string | null
          return_id: number
          tipo_notificacao: string
          titulo: string
        }
        Update: {
          claim_id?: number
          created_at?: string | null
          dados_contexto?: Json | null
          deadline_date?: string | null
          expires_at?: string | null
          horas_restantes?: number | null
          id?: string
          integration_account_id?: string
          lida?: boolean | null
          lida_em?: string | null
          lida_por?: string | null
          mensagem?: string
          order_id?: string
          organization_id?: string
          prioridade?: string
          resolvida?: boolean | null
          resolvida_em?: string | null
          return_id?: number
          tipo_notificacao?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "devolucoes_notificacoes_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolucoes_notificacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucoes_sync_status: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          integration_account_id: string
          items_failed: number | null
          items_synced: number | null
          items_total: number | null
          last_sync_at: string | null
          last_sync_status: string | null
          sync_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          integration_account_id: string
          items_failed?: number | null
          items_synced?: number | null
          items_total?: number | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          sync_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          integration_account_id?: string
          items_failed?: number | null
          items_synced?: number | null
          items_total?: number | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          sync_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devolucoes_sync_status_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_por_local: {
        Row: {
          created_at: string
          id: string
          local_id: string
          organization_id: string
          produto_id: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_id: string
          organization_id: string
          produto_id: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          local_id?: string
          organization_id?: string
          produto_id?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_por_local_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_por_local_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_processamento_claims: {
        Row: {
          atualizado_em: string | null
          claim_data: Json
          claim_id: string
          criado_em: string | null
          erro_mensagem: string | null
          id: string
          integration_account_id: string
          max_tentativas: number | null
          order_id: string | null
          processado_em: string | null
          status: string
          tentativas: number | null
        }
        Insert: {
          atualizado_em?: string | null
          claim_data: Json
          claim_id: string
          criado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          integration_account_id: string
          max_tentativas?: number | null
          order_id?: string | null
          processado_em?: string | null
          status?: string
          tentativas?: number | null
        }
        Update: {
          atualizado_em?: string | null
          claim_data?: Json
          claim_id?: string
          criado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          integration_account_id?: string
          max_tentativas?: number | null
          order_id?: string | null
          processado_em?: string | null
          status?: string
          tentativas?: number | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          avaliacao: number | null
          categoria: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_principal: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          telefone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          avaliacao?: number | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_principal?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string
          telefone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          avaliacao?: number | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_principal?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          telefone?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          conditions: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          custo_envio_seller: number | null
          custo_fixo_meli: number | null
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
          level_id: string | null
          local_estoque: string | null
          local_estoque_id: string | null
          local_estoque_nome: string | null
          logistic_mode_principal: string | null
          logistic_type: string | null
          marketplace: string | null
          marketplace_origem: string | null
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
          power_seller_status: string | null
          qtd_kit: number | null
          quantidade: number
          quantidade_itens: number | null
          quantidade_kit: number | null
          quantidade_total: number | null
          raw: Json | null
          raw_data: Json | null
          receita_flex_bonus: number | null
          rua: string | null
          shipping_method: string | null
          shipping_mode: string | null
          shipping_shipping_status: string | null
          shipping_substatus: string | null
          situacao: string | null
          sku_estoque: string | null
          sku_kit: string | null
          sku_produto: string
          skus_produtos: string | null
          status: string
          status_baixa: string | null
          status_envio: string | null
          status_insumos: string | null
          status_mapeamento: string | null
          status_pagamento: string | null
          status_resumos: string | null
          substatus_detail: string | null
          substatus_estado_atual: string | null
          tags: string[] | null
          taxa_marketplace: number | null
          tipo_entrega: string | null
          tipo_logistico: string | null
          tipo_metodo_envio: string | null
          tipo_pagamento: string | null
          titulo_anuncio: string | null
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
          conditions?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          custo_envio_seller?: number | null
          custo_fixo_meli?: number | null
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
          level_id?: string | null
          local_estoque?: string | null
          local_estoque_id?: string | null
          local_estoque_nome?: string | null
          logistic_mode_principal?: string | null
          logistic_type?: string | null
          marketplace?: string | null
          marketplace_origem?: string | null
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
          power_seller_status?: string | null
          qtd_kit?: number | null
          quantidade?: number
          quantidade_itens?: number | null
          quantidade_kit?: number | null
          quantidade_total?: number | null
          raw?: Json | null
          raw_data?: Json | null
          receita_flex_bonus?: number | null
          rua?: string | null
          shipping_method?: string | null
          shipping_mode?: string | null
          shipping_shipping_status?: string | null
          shipping_substatus?: string | null
          situacao?: string | null
          sku_estoque?: string | null
          sku_kit?: string | null
          sku_produto: string
          skus_produtos?: string | null
          status?: string
          status_baixa?: string | null
          status_envio?: string | null
          status_insumos?: string | null
          status_mapeamento?: string | null
          status_pagamento?: string | null
          status_resumos?: string | null
          substatus_detail?: string | null
          substatus_estado_atual?: string | null
          tags?: string[] | null
          taxa_marketplace?: number | null
          tipo_entrega?: string | null
          tipo_logistico?: string | null
          tipo_metodo_envio?: string | null
          tipo_pagamento?: string | null
          titulo_anuncio?: string | null
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
          conditions?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          custo_envio_seller?: number | null
          custo_fixo_meli?: number | null
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
          level_id?: string | null
          local_estoque?: string | null
          local_estoque_id?: string | null
          local_estoque_nome?: string | null
          logistic_mode_principal?: string | null
          logistic_type?: string | null
          marketplace?: string | null
          marketplace_origem?: string | null
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
          power_seller_status?: string | null
          qtd_kit?: number | null
          quantidade?: number
          quantidade_itens?: number | null
          quantidade_kit?: number | null
          quantidade_total?: number | null
          raw?: Json | null
          raw_data?: Json | null
          receita_flex_bonus?: number | null
          rua?: string | null
          shipping_method?: string | null
          shipping_mode?: string | null
          shipping_shipping_status?: string | null
          shipping_substatus?: string | null
          situacao?: string | null
          sku_estoque?: string | null
          sku_kit?: string | null
          sku_produto?: string
          skus_produtos?: string | null
          status?: string
          status_baixa?: string | null
          status_envio?: string | null
          status_insumos?: string | null
          status_mapeamento?: string | null
          status_pagamento?: string | null
          status_resumos?: string | null
          substatus_detail?: string | null
          substatus_estado_atual?: string | null
          tags?: string[] | null
          taxa_marketplace?: number | null
          tipo_entrega?: string | null
          tipo_logistico?: string | null
          tipo_metodo_envio?: string | null
          tipo_pagamento?: string | null
          titulo_anuncio?: string | null
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
            foreignKeyName: "fk_historico_vendas_local_estoque"
            columns: ["local_estoque_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
            referencedColumns: ["id"]
          },
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
      importacoes_shopee: {
        Row: {
          baixas_realizadas: number | null
          created_at: string
          created_by: string | null
          detalhes_erros: Json | null
          erro_mensagem: string | null
          id: string
          linhas_erro: number | null
          linhas_processadas: number | null
          nome_arquivo: string
          organization_id: string
          pedidos_duplicados: number | null
          pedidos_novos: number | null
          status: string | null
          total_linhas: number | null
        }
        Insert: {
          baixas_realizadas?: number | null
          created_at?: string
          created_by?: string | null
          detalhes_erros?: Json | null
          erro_mensagem?: string | null
          id?: string
          linhas_erro?: number | null
          linhas_processadas?: number | null
          nome_arquivo: string
          organization_id: string
          pedidos_duplicados?: number | null
          pedidos_novos?: number | null
          status?: string | null
          total_linhas?: number | null
        }
        Update: {
          baixas_realizadas?: number | null
          created_at?: string
          created_by?: string | null
          detalhes_erros?: Json | null
          erro_mensagem?: string | null
          id?: string
          linhas_erro?: number | null
          linhas_processadas?: number | null
          nome_arquivo?: string
          organization_id?: string
          pedidos_duplicados?: number | null
          pedidos_novos?: number | null
          status?: string | null
          total_linhas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "importacoes_shopee_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_accounts: {
        Row: {
          account_identifier: string | null
          claims_cached: number | null
          claims_fetched: number | null
          cnpj: string | null
          created_at: string
          id: string
          is_active: boolean
          last_claims_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          name: string
          organization_id: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          public_auth: Json | null
          sync_duration_ms: number | null
          token_status: string | null
          updated_at: string
        }
        Insert: {
          account_identifier?: string | null
          claims_cached?: number | null
          claims_fetched?: number | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_claims_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name: string
          organization_id?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          public_auth?: Json | null
          sync_duration_ms?: number | null
          token_status?: string | null
          updated_at?: string
        }
        Update: {
          account_identifier?: string | null
          claims_cached?: number | null
          claims_fetched?: number | null
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_claims_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name?: string
          organization_id?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          public_auth?: Json | null
          sync_duration_ms?: number | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          ip_address: unknown
          requesting_function: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          requesting_function?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
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
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          ip_address?: unknown
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
      knowledge_base: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          organization_id: string | null
          source: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          source: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          source?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locais_estoque: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          endereco: string | null
          id: string
          is_system: boolean
          nome: string
          organization_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          is_system?: boolean
          nome: string
          organization_id: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          is_system?: boolean
          nome?: string
          organization_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
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
      logs_atualizacao: {
        Row: {
          created_at: string | null
          duracao_ms: number | null
          erro: string | null
          id: string
          integration_account_id: string | null
          quantidade: number | null
          status: string
          timestamp: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          duracao_ms?: number | null
          erro?: string | null
          id?: string
          integration_account_id?: string | null
          quantidade?: number | null
          status: string
          timestamp?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          duracao_ms?: number | null
          erro?: string | null
          id?: string
          integration_account_id?: string | null
          quantidade?: number | null
          status?: string
          timestamp?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_atualizacao_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mapeamento_locais_estoque: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          empresa: string
          id: string
          local_estoque_id: string
          marketplace: string
          observacoes: string | null
          organization_id: string
          tipo_logistico: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          empresa: string
          id?: string
          local_estoque_id: string
          marketplace: string
          observacoes?: string | null
          organization_id: string
          tipo_logistico: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          empresa?: string
          id?: string
          local_estoque_id?: string
          marketplace?: string
          observacoes?: string | null
          organization_id?: string
          tipo_logistico?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapeamento_locais_estoque_local_estoque_id_fkey"
            columns: ["local_estoque_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
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
      ml_claims: {
        Row: {
          buyer_id: number | null
          buyer_nickname: string | null
          claim_data: Json
          claim_id: string
          created_at: string | null
          currency_id: string | null
          date_closed: string | null
          date_created: string | null
          id: string
          integration_account_id: string
          last_synced_at: string | null
          last_updated: string | null
          order_id: string
          organization_id: string
          reason_id: string | null
          refund_amount: number | null
          return_id: string | null
          stage: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: number | null
          buyer_nickname?: string | null
          claim_data: Json
          claim_id: string
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: string
          integration_account_id: string
          last_synced_at?: string | null
          last_updated?: string | null
          order_id: string
          organization_id: string
          reason_id?: string | null
          refund_amount?: number | null
          return_id?: string | null
          stage?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: number | null
          buyer_nickname?: string | null
          claim_data?: Json
          claim_id?: string
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: string
          integration_account_id?: string
          last_synced_at?: string | null
          last_updated?: string | null
          order_id?: string
          organization_id?: string
          reason_id?: string | null
          refund_amount?: number | null
          return_id?: string | null
          stage?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_devolucoes_historico_acoes: {
        Row: {
          action_data: Json | null
          action_name: string
          action_status: string
          action_type: string
          api_response: Json | null
          claim_id: number
          executed_at: string
          executed_by: string | null
          id: string
          integration_account_id: string
          return_id: number
        }
        Insert: {
          action_data?: Json | null
          action_name: string
          action_status?: string
          action_type: string
          api_response?: Json | null
          claim_id: number
          executed_at?: string
          executed_by?: string | null
          id?: string
          integration_account_id: string
          return_id: number
        }
        Update: {
          action_data?: Json | null
          action_name?: string
          action_status?: string
          action_type?: string
          api_response?: Json | null
          claim_id?: number
          executed_at?: string
          executed_by?: string | null
          id?: string
          integration_account_id?: string
          return_id?: number
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
          claim_id: string | null
          claim_stage: string | null
          claim_status: string | null
          claim_type: string | null
          created_at: string
          currency: string | null
          dados_claim: Json | null
          dados_mensagens: Json | null
          dados_order: Json | null
          dados_return: Json | null
          data_criacao: string | null
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
          produto_titulo: string | null
          quantidade: number | null
          quantity: number | null
          raw_data: Json | null
          reason_code: string | null
          reason_description: string | null
          resolution: string | null
          return_id: string | null
          seller_response: string | null
          sku: string | null
          status_devolucao: string | null
          tags: string[] | null
          unit_price: number | null
          updated_at: string
          valor_retido: number | null
          variation_id: string | null
        }
        Insert: {
          amount_claimed?: number | null
          amount_refunded?: number | null
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          claim_id?: string | null
          claim_stage?: string | null
          claim_status?: string | null
          claim_type?: string | null
          created_at?: string
          currency?: string | null
          dados_claim?: Json | null
          dados_mensagens?: Json | null
          dados_order?: Json | null
          dados_return?: Json | null
          data_criacao?: string | null
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
          produto_titulo?: string | null
          quantidade?: number | null
          quantity?: number | null
          raw_data?: Json | null
          reason_code?: string | null
          reason_description?: string | null
          resolution?: string | null
          return_id?: string | null
          seller_response?: string | null
          sku?: string | null
          status_devolucao?: string | null
          tags?: string[] | null
          unit_price?: number | null
          updated_at?: string
          valor_retido?: number | null
          variation_id?: string | null
        }
        Update: {
          amount_claimed?: number | null
          amount_refunded?: number | null
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          claim_id?: string | null
          claim_stage?: string | null
          claim_status?: string | null
          claim_type?: string | null
          created_at?: string
          currency?: string | null
          dados_claim?: Json | null
          dados_mensagens?: Json | null
          dados_order?: Json | null
          dados_return?: Json | null
          data_criacao?: string | null
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
          produto_titulo?: string | null
          quantidade?: number | null
          quantity?: number | null
          raw_data?: Json | null
          reason_code?: string | null
          reason_description?: string | null
          resolution?: string | null
          return_id?: string | null
          seller_response?: string | null
          sku?: string | null
          status_devolucao?: string | null
          tags?: string[] | null
          unit_price?: number | null
          updated_at?: string
          valor_retido?: number | null
          variation_id?: string | null
        }
        Relationships: []
      }
      ml_orders: {
        Row: {
          buyer_email: string | null
          buyer_id: number | null
          buyer_nickname: string | null
          created_at: string | null
          currency_id: string | null
          date_closed: string | null
          date_created: string | null
          fulfilled: boolean | null
          id: string
          integration_account_id: string
          last_synced_at: string | null
          last_updated: string | null
          ml_order_id: string
          order_data: Json
          order_date: string | null
          organization_id: string
          pack_id: number | null
          paid_amount: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          buyer_email?: string | null
          buyer_id?: number | null
          buyer_nickname?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          fulfilled?: boolean | null
          id?: string
          integration_account_id: string
          last_synced_at?: string | null
          last_updated?: string | null
          ml_order_id: string
          order_data: Json
          order_date?: string | null
          organization_id: string
          pack_id?: number | null
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          buyer_email?: string | null
          buyer_id?: number | null
          buyer_nickname?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          fulfilled?: boolean | null
          id?: string
          integration_account_id?: string
          last_synced_at?: string | null
          last_updated?: string | null
          ml_order_id?: string
          order_data?: Json
          order_date?: string | null
          organization_id?: string
          pack_id?: number | null
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_orders_cache: {
        Row: {
          cached_at: string
          created_at: string
          id: string
          integration_account_id: string
          order_data: Json
          order_id: string
          organization_id: string
          ttl_expires_at: string
        }
        Insert: {
          cached_at?: string
          created_at?: string
          id?: string
          integration_account_id: string
          order_data: Json
          order_id: string
          organization_id: string
          ttl_expires_at: string
        }
        Update: {
          cached_at?: string
          created_at?: string
          id?: string
          integration_account_id?: string
          order_data?: Json
          order_id?: string
          organization_id?: string
          ttl_expires_at?: string
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
      ml_vendas_comenvio: {
        Row: {
          account_name: string | null
          buyer_first_name: string | null
          buyer_id: string | null
          buyer_last_name: string | null
          buyer_name: string | null
          buyer_nickname: string | null
          carrier: string | null
          created_at: string | null
          currency_id: string | null
          date_closed: string | null
          date_created: string | null
          id: string
          integration_account_id: string
          item_id: string | null
          item_quantity: number | null
          item_sku: string | null
          item_title: string | null
          items: Json | null
          items_count: number | null
          items_quantity: number | null
          last_synced_at: string | null
          logistic_type: string | null
          order_data: Json | null
          order_id: string
          order_status: string | null
          organization_id: string
          paid_amount: number | null
          payment_status: string | null
          shipment_id: string | null
          shipping_deadline: string | null
          shipping_id: string | null
          shipping_status: string | null
          status: string | null
          total_amount: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          buyer_first_name?: string | null
          buyer_id?: string | null
          buyer_last_name?: string | null
          buyer_name?: string | null
          buyer_nickname?: string | null
          carrier?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: string
          integration_account_id: string
          item_id?: string | null
          item_quantity?: number | null
          item_sku?: string | null
          item_title?: string | null
          items?: Json | null
          items_count?: number | null
          items_quantity?: number | null
          last_synced_at?: string | null
          logistic_type?: string | null
          order_data?: Json | null
          order_id: string
          order_status?: string | null
          organization_id: string
          paid_amount?: number | null
          payment_status?: string | null
          shipment_id?: string | null
          shipping_deadline?: string | null
          shipping_id?: string | null
          shipping_status?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          buyer_first_name?: string | null
          buyer_id?: string | null
          buyer_last_name?: string | null
          buyer_name?: string | null
          buyer_nickname?: string | null
          carrier?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: string
          integration_account_id?: string
          item_id?: string | null
          item_quantity?: number | null
          item_sku?: string | null
          item_title?: string | null
          items?: Json | null
          items_count?: number | null
          items_quantity?: number | null
          last_synced_at?: string | null
          logistic_type?: string | null
          order_data?: Json | null
          order_id?: string
          order_status?: string | null
          organization_id?: string
          paid_amount?: number | null
          payment_status?: string | null
          shipment_id?: string | null
          shipping_deadline?: string | null
          shipping_id?: string | null
          shipping_status?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_vendas_comenvio_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          id: string
          local_id: string | null
          metadados: Json | null
          motivo: string | null
          nome_produto: string | null
          observacoes: string | null
          organization_id: string | null
          origem_movimentacao: string | null
          pagina_origem: string | null
          produto_id: string
          quantidade: number | null
          quantidade_anterior: number
          quantidade_movimentada: number
          quantidade_nova: number
          referencia_id: string | null
          referencia_tipo: string | null
          sku_produto: string | null
          tipo_movimentacao: string
          usuario_email: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          local_id?: string | null
          metadados?: Json | null
          motivo?: string | null
          nome_produto?: string | null
          observacoes?: string | null
          organization_id?: string | null
          origem_movimentacao?: string | null
          pagina_origem?: string | null
          produto_id: string
          quantidade?: number | null
          quantidade_anterior: number
          quantidade_movimentada: number
          quantidade_nova: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          sku_produto?: string | null
          tipo_movimentacao: string
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          local_id?: string | null
          metadados?: Json | null
          motivo?: string | null
          nome_produto?: string | null
          observacoes?: string | null
          organization_id?: string | null
          origem_movimentacao?: string | null
          pagina_origem?: string | null
          produto_id?: string
          quantidade?: number | null
          quantidade_anterior?: number
          quantidade_movimentada?: number
          quantidade_nova?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          sku_produto?: string | null
          tipo_movimentacao?: string
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
            referencedColumns: ["id"]
          },
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
      oms_customers: {
        Row: {
          billing_address: Json | null
          created_at: string
          doc: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          payment_terms: string | null
          phone: string | null
          price_tier: string | null
          shipping_address: Json | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          doc?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          price_tier?: string | null
          shipping_address?: Json | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          doc?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          price_tier?: string | null
          shipping_address?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oms_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      oms_order_items: {
        Row: {
          created_at: string
          discount_pct: number | null
          discount_value: number | null
          id: string
          order_id: string
          product_id: string | null
          qty: number
          sku: string
          tax_value: number | null
          title: string
          total: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number | null
          discount_value?: number | null
          id?: string
          order_id: string
          product_id?: string | null
          qty: number
          sku: string
          tax_value?: number | null
          title: string
          total: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_pct?: number | null
          discount_value?: number | null
          id?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          sku?: string
          tax_value?: number | null
          title?: string
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oms_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "oms_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      oms_orders: {
        Row: {
          confirmed_at: string | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_date: string | null
          discount_amount: number | null
          discount_type: string | null
          grand_total: number
          id: string
          internal_notes: string | null
          notes: string | null
          number: string
          order_date: string
          organization_id: string | null
          payment_method: string | null
          payment_term_days: number | null
          payment_terms: string | null
          sales_rep_id: string | null
          shipping_method: string | null
          shipping_total: number | null
          status: string | null
          subtotal: number
          tax_total: number | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          grand_total?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          number: string
          order_date?: string
          organization_id?: string | null
          payment_method?: string | null
          payment_term_days?: number | null
          payment_terms?: string | null
          sales_rep_id?: string | null
          shipping_method?: string | null
          shipping_total?: number | null
          status?: string | null
          subtotal?: number
          tax_total?: number | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          grand_total?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          number?: string
          order_date?: string
          organization_id?: string | null
          payment_method?: string | null
          payment_term_days?: number | null
          payment_terms?: string | null
          sales_rep_id?: string | null
          shipping_method?: string | null
          shipping_total?: number | null
          status?: string | null
          subtotal?: number
          tax_total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oms_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "oms_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oms_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oms_orders_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "oms_sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      oms_sales_reps: {
        Row: {
          created_at: string
          default_commission_pct: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_commission_pct?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_commission_pct?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oms_sales_reps_organization_id_fkey"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          flex_logistic_type: string | null
          flex_net_cost: number | null
          flex_order_cost: number | null
          flex_special_discount: number | null
          id: string
          integration_account_id: string | null
          level_id: string | null
          local_estoque_id: string | null
          marketplace_origem: string | null
          nome_cliente: string
          numero: string
          numero_ecommerce: string | null
          numero_venda: string | null
          obs: string | null
          obs_interna: string | null
          power_seller_status: string | null
          receita_flex: number | null
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
          flex_logistic_type?: string | null
          flex_net_cost?: number | null
          flex_order_cost?: number | null
          flex_special_discount?: number | null
          id?: string
          integration_account_id?: string | null
          level_id?: string | null
          local_estoque_id?: string | null
          marketplace_origem?: string | null
          nome_cliente: string
          numero: string
          numero_ecommerce?: string | null
          numero_venda?: string | null
          obs?: string | null
          obs_interna?: string | null
          power_seller_status?: string | null
          receita_flex?: number | null
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
          flex_logistic_type?: string | null
          flex_net_cost?: number | null
          flex_order_cost?: number | null
          flex_special_discount?: number | null
          id?: string
          integration_account_id?: string | null
          level_id?: string | null
          local_estoque_id?: string | null
          marketplace_origem?: string | null
          nome_cliente?: string
          numero?: string
          numero_ecommerce?: string | null
          numero_venda?: string | null
          obs?: string | null
          obs_interna?: string | null
          power_seller_status?: string | null
          receita_flex?: number | null
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
          {
            foreignKeyName: "pedidos_local_estoque_id_fkey"
            columns: ["local_estoque_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_cancelados_ml: {
        Row: {
          acao_seller_necessaria: boolean | null
          acoes_necessarias_review: Json | null
          anexos_count: number | null
          anexos_ml: Json | null
          buyer_id: string | null
          buyer_nickname: string | null
          buyer_reputation: Json | null
          campos_faltantes: Json | null
          carrier_info: Json | null
          categoria_problema: string | null
          claim_fulfilled: boolean | null
          claim_id: string | null
          codigo_rastreamento: string | null
          codigo_rastreamento_devolucao: string | null
          comprador_cep: string | null
          comprador_cidade: string | null
          comprador_cpf_cnpj: string | null
          comprador_endereco: string | null
          comprador_estado: string | null
          comprador_nickname: string | null
          comprador_nome_completo: string | null
          comprador_pais: string | null
          comprador_reputacao: Json | null
          confiabilidade_dados: string | null
          created_at: string | null
          custo_envio_devolucao: number | null
          custo_frete_devolucao: number | null
          custo_logistica_total: number | null
          custo_logistico_total: number | null
          dados_completos: boolean | null
          dados_incompletos: boolean | null
          data_criacao_claim: string | null
          data_estimada_troca: string | null
          data_fechamento_claim: string | null
          data_inicio_mediacao: string | null
          data_inicio_return: string | null
          data_inicio_review: string | null
          data_limite_troca: string | null
          data_primeira_acao: string | null
          data_processamento_reembolso: string | null
          data_ultima_movimentacao: string | null
          data_vencimento_acao: string | null
          date_closed: string | null
          date_created: string | null
          descricao_custos: Json | null
          destino_devolucao: string | null
          detalhes_mediacao: Json | null
          dias_ate_resolucao: number | null
          dias_restantes_acao: number | null
          eficiencia_resolucao: string | null
          eh_troca: boolean | null
          em_mediacao: boolean | null
          endereco_destino: Json | null
          endereco_destino_devolucao: string | null
          escalado_para_ml: boolean | null
          feedback_comprador: string | null
          feedback_comprador_final: string | null
          feedback_vendedor: string | null
          fonte_dados_primaria: string | null
          hash_verificacao: string | null
          historico_localizacoes: Json | null
          historico_status: Json | null
          id: string
          impacto_financeiro_vendedor: number | null
          impacto_reputacao: string | null
          integration_account_id: string | null
          internal_tags: string[] | null
          item_id: string | null
          item_title: string | null
          localizacao_atual: string | null
          marcos_temporais: Json | null
          marketplace_origem: string | null
          mediador_ml: string | null
          mensagens_nao_lidas: number | null
          metodo_pagamento: string | null
          metodo_resolucao: string | null
          moeda_custo: string | null
          moeda_reembolso: string | null
          motivo_categoria: string | null
          necessita_acao_manual: boolean | null
          nivel_complexidade: string | null
          nivel_prioridade: string | null
          nota_fiscal_autorizada: boolean | null
          numero_interacoes: number | null
          numero_parcelas: number | null
          observacoes_review: string | null
          order_id: string
          parcelas: number | null
          percentual_reembolsado: number | null
          prazo_revisao_dias: number | null
          previsao_entrega_vendedor: string | null
          problemas_encontrados: Json | null
          produto_categoria: string | null
          produto_thumbnail: string | null
          produto_troca_id: string | null
          produto_troca_titulo: string | null
          produto_warranty: string | null
          proxima_acao_requerida: string | null
          qualidade_comunicacao: string | null
          quantity: number | null
          rating_comprador: number | null
          rating_vendedor: number | null
          reason_category: string | null
          reason_detail: string | null
          reason_expected_resolutions: string[] | null
          reason_flow: string | null
          reason_id: string | null
          reason_name: string | null
          reason_priority: string | null
          reason_rules_engine: string[] | null
          reason_type: string | null
          responsavel_custo: string | null
          resultado_final: string | null
          resultado_mediacao: string | null
          return_intermediate_check: Json | null
          review_id: string | null
          review_result: string | null
          review_status: string | null
          revisor_responsavel: string | null
          satisfacao_comprador: string | null
          score_qualidade: number | null
          score_satisfacao_final: number | null
          seller_reputation: Json | null
          shipment_costs: Json | null
          shipment_delays: Json | null
          shipment_id: string | null
          shipment_id_devolucao: number | null
          sku: string | null
          sla_cumprido: boolean | null
          status: string | null
          status_devolucao: string | null
          status_dinheiro: string | null
          status_produto_novo: string | null
          status_rastreamento: string | null
          status_rastreamento_devolucao: string | null
          status_transporte_atual: string | null
          subcategoria_problema: string | null
          subtipo_claim: string | null
          tags_automaticas: string[] | null
          tags_pedido: string[] | null
          taxa_ml_reembolsada: number | null
          taxa_ml_reembolso: number | null
          taxa_satisfacao: number | null
          tem_financeiro: boolean | null
          tem_review: boolean | null
          tem_sla: boolean | null
          tempo_analise_ml: number | null
          tempo_limite_acao: string | null
          tempo_primeira_resposta_vendedor: number | null
          tempo_resposta_comprador: number | null
          tempo_resposta_medio: number | null
          tempo_total_resolucao: number | null
          tempo_transito_dias: number | null
          timeline_consolidado: Json | null
          timeline_events: Json | null
          timeline_mensagens: Json | null
          tipo_claim: string | null
          tipo_pagamento: string | null
          total_amount: number | null
          total_evidencias: number | null
          tracking_events: Json | null
          tracking_history: Json | null
          transaction_id: string | null
          transportadora: string | null
          transportadora_devolucao: string | null
          ultima_mensagem_data: string | null
          ultima_mensagem_remetente: string | null
          updated_at: string | null
          url_rastreamento: string | null
          usuario_ultima_acao: string | null
          valor_compensacao: number | null
          valor_diferenca_troca: number | null
          valor_original_produto: number | null
          valor_parcela: number | null
          valor_reembolsado_produto: number | null
          versao_api_utilizada: string | null
        }
        Insert: {
          acao_seller_necessaria?: boolean | null
          acoes_necessarias_review?: Json | null
          anexos_count?: number | null
          anexos_ml?: Json | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          buyer_reputation?: Json | null
          campos_faltantes?: Json | null
          carrier_info?: Json | null
          categoria_problema?: string | null
          claim_fulfilled?: boolean | null
          claim_id?: string | null
          codigo_rastreamento?: string | null
          codigo_rastreamento_devolucao?: string | null
          comprador_cep?: string | null
          comprador_cidade?: string | null
          comprador_cpf_cnpj?: string | null
          comprador_endereco?: string | null
          comprador_estado?: string | null
          comprador_nickname?: string | null
          comprador_nome_completo?: string | null
          comprador_pais?: string | null
          comprador_reputacao?: Json | null
          confiabilidade_dados?: string | null
          created_at?: string | null
          custo_envio_devolucao?: number | null
          custo_frete_devolucao?: number | null
          custo_logistica_total?: number | null
          custo_logistico_total?: number | null
          dados_completos?: boolean | null
          dados_incompletos?: boolean | null
          data_criacao_claim?: string | null
          data_estimada_troca?: string | null
          data_fechamento_claim?: string | null
          data_inicio_mediacao?: string | null
          data_inicio_return?: string | null
          data_inicio_review?: string | null
          data_limite_troca?: string | null
          data_primeira_acao?: string | null
          data_processamento_reembolso?: string | null
          data_ultima_movimentacao?: string | null
          data_vencimento_acao?: string | null
          date_closed?: string | null
          date_created?: string | null
          descricao_custos?: Json | null
          destino_devolucao?: string | null
          detalhes_mediacao?: Json | null
          dias_ate_resolucao?: number | null
          dias_restantes_acao?: number | null
          eficiencia_resolucao?: string | null
          eh_troca?: boolean | null
          em_mediacao?: boolean | null
          endereco_destino?: Json | null
          endereco_destino_devolucao?: string | null
          escalado_para_ml?: boolean | null
          feedback_comprador?: string | null
          feedback_comprador_final?: string | null
          feedback_vendedor?: string | null
          fonte_dados_primaria?: string | null
          hash_verificacao?: string | null
          historico_localizacoes?: Json | null
          historico_status?: Json | null
          id?: string
          impacto_financeiro_vendedor?: number | null
          impacto_reputacao?: string | null
          integration_account_id?: string | null
          internal_tags?: string[] | null
          item_id?: string | null
          item_title?: string | null
          localizacao_atual?: string | null
          marcos_temporais?: Json | null
          marketplace_origem?: string | null
          mediador_ml?: string | null
          mensagens_nao_lidas?: number | null
          metodo_pagamento?: string | null
          metodo_resolucao?: string | null
          moeda_custo?: string | null
          moeda_reembolso?: string | null
          motivo_categoria?: string | null
          necessita_acao_manual?: boolean | null
          nivel_complexidade?: string | null
          nivel_prioridade?: string | null
          nota_fiscal_autorizada?: boolean | null
          numero_interacoes?: number | null
          numero_parcelas?: number | null
          observacoes_review?: string | null
          order_id: string
          parcelas?: number | null
          percentual_reembolsado?: number | null
          prazo_revisao_dias?: number | null
          previsao_entrega_vendedor?: string | null
          problemas_encontrados?: Json | null
          produto_categoria?: string | null
          produto_thumbnail?: string | null
          produto_troca_id?: string | null
          produto_troca_titulo?: string | null
          produto_warranty?: string | null
          proxima_acao_requerida?: string | null
          qualidade_comunicacao?: string | null
          quantity?: number | null
          rating_comprador?: number | null
          rating_vendedor?: number | null
          reason_category?: string | null
          reason_detail?: string | null
          reason_expected_resolutions?: string[] | null
          reason_flow?: string | null
          reason_id?: string | null
          reason_name?: string | null
          reason_priority?: string | null
          reason_rules_engine?: string[] | null
          reason_type?: string | null
          responsavel_custo?: string | null
          resultado_final?: string | null
          resultado_mediacao?: string | null
          return_intermediate_check?: Json | null
          review_id?: string | null
          review_result?: string | null
          review_status?: string | null
          revisor_responsavel?: string | null
          satisfacao_comprador?: string | null
          score_qualidade?: number | null
          score_satisfacao_final?: number | null
          seller_reputation?: Json | null
          shipment_costs?: Json | null
          shipment_delays?: Json | null
          shipment_id?: string | null
          shipment_id_devolucao?: number | null
          sku?: string | null
          sla_cumprido?: boolean | null
          status?: string | null
          status_devolucao?: string | null
          status_dinheiro?: string | null
          status_produto_novo?: string | null
          status_rastreamento?: string | null
          status_rastreamento_devolucao?: string | null
          status_transporte_atual?: string | null
          subcategoria_problema?: string | null
          subtipo_claim?: string | null
          tags_automaticas?: string[] | null
          tags_pedido?: string[] | null
          taxa_ml_reembolsada?: number | null
          taxa_ml_reembolso?: number | null
          taxa_satisfacao?: number | null
          tem_financeiro?: boolean | null
          tem_review?: boolean | null
          tem_sla?: boolean | null
          tempo_analise_ml?: number | null
          tempo_limite_acao?: string | null
          tempo_primeira_resposta_vendedor?: number | null
          tempo_resposta_comprador?: number | null
          tempo_resposta_medio?: number | null
          tempo_total_resolucao?: number | null
          tempo_transito_dias?: number | null
          timeline_consolidado?: Json | null
          timeline_events?: Json | null
          timeline_mensagens?: Json | null
          tipo_claim?: string | null
          tipo_pagamento?: string | null
          total_amount?: number | null
          total_evidencias?: number | null
          tracking_events?: Json | null
          tracking_history?: Json | null
          transaction_id?: string | null
          transportadora?: string | null
          transportadora_devolucao?: string | null
          ultima_mensagem_data?: string | null
          ultima_mensagem_remetente?: string | null
          updated_at?: string | null
          url_rastreamento?: string | null
          usuario_ultima_acao?: string | null
          valor_compensacao?: number | null
          valor_diferenca_troca?: number | null
          valor_original_produto?: number | null
          valor_parcela?: number | null
          valor_reembolsado_produto?: number | null
          versao_api_utilizada?: string | null
        }
        Update: {
          acao_seller_necessaria?: boolean | null
          acoes_necessarias_review?: Json | null
          anexos_count?: number | null
          anexos_ml?: Json | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          buyer_reputation?: Json | null
          campos_faltantes?: Json | null
          carrier_info?: Json | null
          categoria_problema?: string | null
          claim_fulfilled?: boolean | null
          claim_id?: string | null
          codigo_rastreamento?: string | null
          codigo_rastreamento_devolucao?: string | null
          comprador_cep?: string | null
          comprador_cidade?: string | null
          comprador_cpf_cnpj?: string | null
          comprador_endereco?: string | null
          comprador_estado?: string | null
          comprador_nickname?: string | null
          comprador_nome_completo?: string | null
          comprador_pais?: string | null
          comprador_reputacao?: Json | null
          confiabilidade_dados?: string | null
          created_at?: string | null
          custo_envio_devolucao?: number | null
          custo_frete_devolucao?: number | null
          custo_logistica_total?: number | null
          custo_logistico_total?: number | null
          dados_completos?: boolean | null
          dados_incompletos?: boolean | null
          data_criacao_claim?: string | null
          data_estimada_troca?: string | null
          data_fechamento_claim?: string | null
          data_inicio_mediacao?: string | null
          data_inicio_return?: string | null
          data_inicio_review?: string | null
          data_limite_troca?: string | null
          data_primeira_acao?: string | null
          data_processamento_reembolso?: string | null
          data_ultima_movimentacao?: string | null
          data_vencimento_acao?: string | null
          date_closed?: string | null
          date_created?: string | null
          descricao_custos?: Json | null
          destino_devolucao?: string | null
          detalhes_mediacao?: Json | null
          dias_ate_resolucao?: number | null
          dias_restantes_acao?: number | null
          eficiencia_resolucao?: string | null
          eh_troca?: boolean | null
          em_mediacao?: boolean | null
          endereco_destino?: Json | null
          endereco_destino_devolucao?: string | null
          escalado_para_ml?: boolean | null
          feedback_comprador?: string | null
          feedback_comprador_final?: string | null
          feedback_vendedor?: string | null
          fonte_dados_primaria?: string | null
          hash_verificacao?: string | null
          historico_localizacoes?: Json | null
          historico_status?: Json | null
          id?: string
          impacto_financeiro_vendedor?: number | null
          impacto_reputacao?: string | null
          integration_account_id?: string | null
          internal_tags?: string[] | null
          item_id?: string | null
          item_title?: string | null
          localizacao_atual?: string | null
          marcos_temporais?: Json | null
          marketplace_origem?: string | null
          mediador_ml?: string | null
          mensagens_nao_lidas?: number | null
          metodo_pagamento?: string | null
          metodo_resolucao?: string | null
          moeda_custo?: string | null
          moeda_reembolso?: string | null
          motivo_categoria?: string | null
          necessita_acao_manual?: boolean | null
          nivel_complexidade?: string | null
          nivel_prioridade?: string | null
          nota_fiscal_autorizada?: boolean | null
          numero_interacoes?: number | null
          numero_parcelas?: number | null
          observacoes_review?: string | null
          order_id?: string
          parcelas?: number | null
          percentual_reembolsado?: number | null
          prazo_revisao_dias?: number | null
          previsao_entrega_vendedor?: string | null
          problemas_encontrados?: Json | null
          produto_categoria?: string | null
          produto_thumbnail?: string | null
          produto_troca_id?: string | null
          produto_troca_titulo?: string | null
          produto_warranty?: string | null
          proxima_acao_requerida?: string | null
          qualidade_comunicacao?: string | null
          quantity?: number | null
          rating_comprador?: number | null
          rating_vendedor?: number | null
          reason_category?: string | null
          reason_detail?: string | null
          reason_expected_resolutions?: string[] | null
          reason_flow?: string | null
          reason_id?: string | null
          reason_name?: string | null
          reason_priority?: string | null
          reason_rules_engine?: string[] | null
          reason_type?: string | null
          responsavel_custo?: string | null
          resultado_final?: string | null
          resultado_mediacao?: string | null
          return_intermediate_check?: Json | null
          review_id?: string | null
          review_result?: string | null
          review_status?: string | null
          revisor_responsavel?: string | null
          satisfacao_comprador?: string | null
          score_qualidade?: number | null
          score_satisfacao_final?: number | null
          seller_reputation?: Json | null
          shipment_costs?: Json | null
          shipment_delays?: Json | null
          shipment_id?: string | null
          shipment_id_devolucao?: number | null
          sku?: string | null
          sla_cumprido?: boolean | null
          status?: string | null
          status_devolucao?: string | null
          status_dinheiro?: string | null
          status_produto_novo?: string | null
          status_rastreamento?: string | null
          status_rastreamento_devolucao?: string | null
          status_transporte_atual?: string | null
          subcategoria_problema?: string | null
          subtipo_claim?: string | null
          tags_automaticas?: string[] | null
          tags_pedido?: string[] | null
          taxa_ml_reembolsada?: number | null
          taxa_ml_reembolso?: number | null
          taxa_satisfacao?: number | null
          tem_financeiro?: boolean | null
          tem_review?: boolean | null
          tem_sla?: boolean | null
          tempo_analise_ml?: number | null
          tempo_limite_acao?: string | null
          tempo_primeira_resposta_vendedor?: number | null
          tempo_resposta_comprador?: number | null
          tempo_resposta_medio?: number | null
          tempo_total_resolucao?: number | null
          tempo_transito_dias?: number | null
          timeline_consolidado?: Json | null
          timeline_events?: Json | null
          timeline_mensagens?: Json | null
          tipo_claim?: string | null
          tipo_pagamento?: string | null
          total_amount?: number | null
          total_evidencias?: number | null
          tracking_events?: Json | null
          tracking_history?: Json | null
          transaction_id?: string | null
          transportadora?: string | null
          transportadora_devolucao?: string | null
          ultima_mensagem_data?: string | null
          ultima_mensagem_remetente?: string | null
          updated_at?: string | null
          url_rastreamento?: string | null
          usuario_ultima_acao?: string | null
          valor_compensacao?: number | null
          valor_diferenca_troca?: number | null
          valor_original_produto?: number | null
          valor_parcela?: number | null
          valor_reembolsado_produto?: number | null
          versao_api_utilizada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cancelados_ml_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_entrega_prevista: string | null
          data_pedido: string
          fornecedor_id: string | null
          id: string
          numero_pedido: string
          observacoes: string | null
          organization_id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_entrega_prevista?: string | null
          data_pedido?: string
          fornecedor_id?: string | null
          id?: string
          numero_pedido: string
          observacoes?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_entrega_prevista?: string | null
          data_pedido?: string
          fornecedor_id?: string | null
          id?: string
          numero_pedido?: string
          observacoes?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra_itens: {
        Row: {
          created_at: string | null
          id: string
          observacoes: string | null
          organization_id: string
          pedido_compra_id: string | null
          produto_id: string | null
          quantidade: number
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          pedido_compra_id?: string | null
          produto_id?: string | null
          quantidade: number
          valor_total?: number | null
          valor_unitario: number
        }
        Update: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          pedido_compra_id?: string | null
          produto_id?: string | null
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_itens_pedido_compra_id_fkey"
            columns: ["pedido_compra_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_shopee: {
        Row: {
          baixa_estoque_realizada: boolean | null
          comprador_nome: string | null
          comprador_telefone: string | null
          created_at: string
          dados_originais: Json | null
          data_baixa_estoque: string | null
          data_entrega: string | null
          data_envio: string | null
          data_pedido: string | null
          desconto: number | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_rua: string | null
          frete: number | null
          id: string
          importacao_id: string | null
          order_id: string
          order_status: string | null
          organization_id: string
          preco_total: number | null
          preco_unitario: number | null
          produto_nome: string | null
          quantidade: number | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          baixa_estoque_realizada?: boolean | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
          created_at?: string
          dados_originais?: Json | null
          data_baixa_estoque?: string | null
          data_entrega?: string | null
          data_envio?: string | null
          data_pedido?: string | null
          desconto?: number | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_rua?: string | null
          frete?: number | null
          id?: string
          importacao_id?: string | null
          order_id: string
          order_status?: string | null
          organization_id: string
          preco_total?: number | null
          preco_unitario?: number | null
          produto_nome?: string | null
          quantidade?: number | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          baixa_estoque_realizada?: boolean | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
          created_at?: string
          dados_originais?: Json | null
          data_baixa_estoque?: string | null
          data_entrega?: string | null
          data_envio?: string | null
          data_pedido?: string | null
          desconto?: number | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_rua?: string | null
          frete?: number | null
          id?: string
          importacao_id?: string | null
          order_id?: string
          order_status?: string | null
          organization_id?: string
          preco_total?: number | null
          preco_unitario?: number | null
          produto_nome?: string | null
          quantidade?: number | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_shopee_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_componentes: {
        Row: {
          created_at: string
          id: string
          local_id: string
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
          local_id: string
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
          local_id?: string
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
            foreignKeyName: "produto_componentes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estoque"
            referencedColumns: ["id"]
          },
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
          altura_cm: number | null
          ativo: boolean
          categoria: string | null
          categoria_id: string | null
          categoria_nivel2: string | null
          categoria_principal: string | null
          codigo_barras: string | null
          codigo_cest: string | null
          cofins: number | null
          comprimento_cm: number | null
          cor: string | null
          created_at: string
          cubagem_cm3: number | null
          descricao: string | null
          dias_preparacao: number | null
          eh_produto_pai: boolean
          estoque_maximo: number
          estoque_minimo: number
          icms: number | null
          id: string
          imagem_fornecedor: string | null
          imposto_importacao: number | null
          integration_account_id: string | null
          ipi: number | null
          largura_cm: number | null
          localizacao: string | null
          material: string | null
          ncm: string | null
          nome: string
          numero_volumes: number | null
          observacoes: string | null
          organization_id: string | null
          origem: number | null
          package: string | null
          pcs_ctn: number | null
          peso_bruto_kg: number | null
          peso_cx_master_kg: number | null
          peso_liquido_kg: number | null
          peso_unitario_g: number | null
          pis: number | null
          preco_custo: number | null
          preco_venda: number | null
          produto_origem_id: string | null
          quantidade_atual: number
          sku_gerado_automaticamente: boolean | null
          sku_interno: string
          sku_pai: string | null
          sob_encomenda: boolean | null
          status: string
          subcategoria: string | null
          tipo_embalagem: string | null
          ultima_movimentacao: string | null
          unidade_medida_id: string
          unit: string | null
          updated_at: string
          url_imagem: string | null
          versao: number | null
        }
        Insert: {
          altura_cm?: number | null
          ativo?: boolean
          categoria?: string | null
          categoria_id?: string | null
          categoria_nivel2?: string | null
          categoria_principal?: string | null
          codigo_barras?: string | null
          codigo_cest?: string | null
          cofins?: number | null
          comprimento_cm?: number | null
          cor?: string | null
          created_at?: string
          cubagem_cm3?: number | null
          descricao?: string | null
          dias_preparacao?: number | null
          eh_produto_pai?: boolean
          estoque_maximo?: number
          estoque_minimo?: number
          icms?: number | null
          id?: string
          imagem_fornecedor?: string | null
          imposto_importacao?: number | null
          integration_account_id?: string | null
          ipi?: number | null
          largura_cm?: number | null
          localizacao?: string | null
          material?: string | null
          ncm?: string | null
          nome: string
          numero_volumes?: number | null
          observacoes?: string | null
          organization_id?: string | null
          origem?: number | null
          package?: string | null
          pcs_ctn?: number | null
          peso_bruto_kg?: number | null
          peso_cx_master_kg?: number | null
          peso_liquido_kg?: number | null
          peso_unitario_g?: number | null
          pis?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          produto_origem_id?: string | null
          quantidade_atual?: number
          sku_gerado_automaticamente?: boolean | null
          sku_interno: string
          sku_pai?: string | null
          sob_encomenda?: boolean | null
          status?: string
          subcategoria?: string | null
          tipo_embalagem?: string | null
          ultima_movimentacao?: string | null
          unidade_medida_id: string
          unit?: string | null
          updated_at?: string
          url_imagem?: string | null
          versao?: number | null
        }
        Update: {
          altura_cm?: number | null
          ativo?: boolean
          categoria?: string | null
          categoria_id?: string | null
          categoria_nivel2?: string | null
          categoria_principal?: string | null
          codigo_barras?: string | null
          codigo_cest?: string | null
          cofins?: number | null
          comprimento_cm?: number | null
          cor?: string | null
          created_at?: string
          cubagem_cm3?: number | null
          descricao?: string | null
          dias_preparacao?: number | null
          eh_produto_pai?: boolean
          estoque_maximo?: number
          estoque_minimo?: number
          icms?: number | null
          id?: string
          imagem_fornecedor?: string | null
          imposto_importacao?: number | null
          integration_account_id?: string | null
          ipi?: number | null
          largura_cm?: number | null
          localizacao?: string | null
          material?: string | null
          ncm?: string | null
          nome?: string
          numero_volumes?: number | null
          observacoes?: string | null
          organization_id?: string | null
          origem?: number | null
          package?: string | null
          pcs_ctn?: number | null
          peso_bruto_kg?: number | null
          peso_cx_master_kg?: number | null
          peso_liquido_kg?: number | null
          peso_unitario_g?: number | null
          pis?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          produto_origem_id?: string | null
          quantidade_atual?: number
          sku_gerado_automaticamente?: boolean | null
          sku_interno?: string
          sku_pai?: string | null
          sob_encomenda?: boolean | null
          status?: string
          subcategoria?: string | null
          tipo_embalagem?: string | null
          ultima_movimentacao?: string | null
          unidade_medida_id?: string
          unit?: string | null
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
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
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
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
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
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
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
      reclamacoes: {
        Row: {
          amount_currency: string | null
          amount_value: number | null
          buyer_id: number | null
          buyer_nickname: string | null
          claim_id: string
          codigo_rastreamento: string | null
          created_at: string | null
          data_vencimento_acao: string | null
          date_created: string | null
          impacto_financeiro: string | null
          integration_account_id: string | null
          last_updated: string | null
          mediator_id: number | null
          mensagens_nao_lidas: number | null
          order_date_created: string | null
          order_id: string | null
          order_item_quantity: number | null
          order_item_seller_sku: string | null
          order_item_title: string | null
          order_item_unit_price: number | null
          order_status: string | null
          order_status_code: string | null
          order_status_description: string | null
          order_status_detail: string | null
          order_total: number | null
          organization_id: string | null
          product_info: Json | null
          raw_data: Json | null
          reason_category: string | null
          reason_detail: string | null
          reason_id: string | null
          reason_name: string | null
          resolution_amount: number | null
          resolution_applied_coverage: boolean | null
          resolution_benefited: string | null
          resolution_closed_by: string | null
          resolution_date: string | null
          resolution_reason: string | null
          resolution_subtype: string | null
          resolution_type: string | null
          resource: string | null
          resource_id: string | null
          seller_id: number | null
          seller_nickname: string | null
          site_id: string | null
          stage: string | null
          status: string | null
          tem_evidencias: boolean | null
          tem_mediacao: boolean | null
          tem_mensagens: boolean | null
          tem_trocas: boolean | null
          total_evidencias: number | null
          total_mensagens: number | null
          total_trocas: number | null
          tracking_method: string | null
          tracking_number: string | null
          tracking_status: string | null
          tracking_substatus: string | null
          troca_data_criacao: string | null
          troca_data_estimada_fim: string | null
          troca_data_estimada_inicio: string | null
          troca_items: Json | null
          troca_new_orders: Json | null
          troca_raw_data: Json | null
          troca_return_id: string | null
          troca_status: string | null
          troca_status_detail: string | null
          troca_type: string | null
          type: string | null
          updated_at: string | null
          valor_impacto: number | null
        }
        Insert: {
          amount_currency?: string | null
          amount_value?: number | null
          buyer_id?: number | null
          buyer_nickname?: string | null
          claim_id: string
          codigo_rastreamento?: string | null
          created_at?: string | null
          data_vencimento_acao?: string | null
          date_created?: string | null
          impacto_financeiro?: string | null
          integration_account_id?: string | null
          last_updated?: string | null
          mediator_id?: number | null
          mensagens_nao_lidas?: number | null
          order_date_created?: string | null
          order_id?: string | null
          order_item_quantity?: number | null
          order_item_seller_sku?: string | null
          order_item_title?: string | null
          order_item_unit_price?: number | null
          order_status?: string | null
          order_status_code?: string | null
          order_status_description?: string | null
          order_status_detail?: string | null
          order_total?: number | null
          organization_id?: string | null
          product_info?: Json | null
          raw_data?: Json | null
          reason_category?: string | null
          reason_detail?: string | null
          reason_id?: string | null
          reason_name?: string | null
          resolution_amount?: number | null
          resolution_applied_coverage?: boolean | null
          resolution_benefited?: string | null
          resolution_closed_by?: string | null
          resolution_date?: string | null
          resolution_reason?: string | null
          resolution_subtype?: string | null
          resolution_type?: string | null
          resource?: string | null
          resource_id?: string | null
          seller_id?: number | null
          seller_nickname?: string | null
          site_id?: string | null
          stage?: string | null
          status?: string | null
          tem_evidencias?: boolean | null
          tem_mediacao?: boolean | null
          tem_mensagens?: boolean | null
          tem_trocas?: boolean | null
          total_evidencias?: number | null
          total_mensagens?: number | null
          total_trocas?: number | null
          tracking_method?: string | null
          tracking_number?: string | null
          tracking_status?: string | null
          tracking_substatus?: string | null
          troca_data_criacao?: string | null
          troca_data_estimada_fim?: string | null
          troca_data_estimada_inicio?: string | null
          troca_items?: Json | null
          troca_new_orders?: Json | null
          troca_raw_data?: Json | null
          troca_return_id?: string | null
          troca_status?: string | null
          troca_status_detail?: string | null
          troca_type?: string | null
          type?: string | null
          updated_at?: string | null
          valor_impacto?: number | null
        }
        Update: {
          amount_currency?: string | null
          amount_value?: number | null
          buyer_id?: number | null
          buyer_nickname?: string | null
          claim_id?: string
          codigo_rastreamento?: string | null
          created_at?: string | null
          data_vencimento_acao?: string | null
          date_created?: string | null
          impacto_financeiro?: string | null
          integration_account_id?: string | null
          last_updated?: string | null
          mediator_id?: number | null
          mensagens_nao_lidas?: number | null
          order_date_created?: string | null
          order_id?: string | null
          order_item_quantity?: number | null
          order_item_seller_sku?: string | null
          order_item_title?: string | null
          order_item_unit_price?: number | null
          order_status?: string | null
          order_status_code?: string | null
          order_status_description?: string | null
          order_status_detail?: string | null
          order_total?: number | null
          organization_id?: string | null
          product_info?: Json | null
          raw_data?: Json | null
          reason_category?: string | null
          reason_detail?: string | null
          reason_id?: string | null
          reason_name?: string | null
          resolution_amount?: number | null
          resolution_applied_coverage?: boolean | null
          resolution_benefited?: string | null
          resolution_closed_by?: string | null
          resolution_date?: string | null
          resolution_reason?: string | null
          resolution_subtype?: string | null
          resolution_type?: string | null
          resource?: string | null
          resource_id?: string | null
          seller_id?: number | null
          seller_nickname?: string | null
          site_id?: string | null
          stage?: string | null
          status?: string | null
          tem_evidencias?: boolean | null
          tem_mediacao?: boolean | null
          tem_mensagens?: boolean | null
          tem_trocas?: boolean | null
          total_evidencias?: number | null
          total_mensagens?: number | null
          total_trocas?: number | null
          tracking_method?: string | null
          tracking_number?: string | null
          tracking_status?: string | null
          tracking_substatus?: string | null
          troca_data_criacao?: string | null
          troca_data_estimada_fim?: string | null
          troca_data_estimada_inicio?: string | null
          troca_items?: Json | null
          troca_new_orders?: Json | null
          troca_raw_data?: Json | null
          troca_return_id?: string | null
          troca_status?: string | null
          troca_status_detail?: string | null
          troca_type?: string | null
          type?: string | null
          updated_at?: string | null
          valor_impacto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reclamacoes_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamacoes_evidencias: {
        Row: {
          claim_id: string | null
          created_at: string | null
          date_created: string | null
          description: string | null
          id: string
          status: string | null
          type: string | null
          uploader_id: number | null
          uploader_role: string | null
          url: string | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string | null
          date_created?: string | null
          description?: string | null
          id: string
          status?: string | null
          type?: string | null
          uploader_id?: number | null
          uploader_role?: string | null
          url?: string | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string | null
          date_created?: string | null
          description?: string | null
          id?: string
          status?: string | null
          type?: string | null
          uploader_id?: number | null
          uploader_role?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reclamacoes_evidencias_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "reclamacoes"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      reclamacoes_mensagens: {
        Row: {
          attachments: Json | null
          claim_id: string | null
          created_at: string | null
          date_created: string | null
          date_read: string | null
          id: string
          receiver_id: number | null
          receiver_role: string | null
          sender_id: number | null
          sender_role: string | null
          status: string | null
          text: string | null
        }
        Insert: {
          attachments?: Json | null
          claim_id?: string | null
          created_at?: string | null
          date_created?: string | null
          date_read?: string | null
          id: string
          receiver_id?: number | null
          receiver_role?: string | null
          sender_id?: number | null
          sender_role?: string | null
          status?: string | null
          text?: string | null
        }
        Update: {
          attachments?: Json | null
          claim_id?: string | null
          created_at?: string | null
          date_created?: string | null
          date_read?: string | null
          id?: string
          receiver_id?: number | null
          receiver_role?: string | null
          sender_id?: number | null
          sender_role?: string | null
          status?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reclamacoes_mensagens_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "reclamacoes"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      reclamacoes_trocas: {
        Row: {
          claim_id: string
          created_at: string | null
          date_created: string | null
          estimated_exchange_date_from: string | null
          estimated_exchange_date_to: string | null
          items: Json | null
          last_updated: string | null
          new_orders_ids: Json | null
          new_orders_shipments: Json | null
          resource: string | null
          resource_id: string | null
          return_id: number | null
          status: string | null
          status_detail: string | null
          type: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string | null
          date_created?: string | null
          estimated_exchange_date_from?: string | null
          estimated_exchange_date_to?: string | null
          items?: Json | null
          last_updated?: string | null
          new_orders_ids?: Json | null
          new_orders_shipments?: Json | null
          resource?: string | null
          resource_id?: string | null
          return_id?: number | null
          status?: string | null
          status_detail?: string | null
          type?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string | null
          date_created?: string | null
          estimated_exchange_date_from?: string | null
          estimated_exchange_date_to?: string | null
          items?: Json | null
          last_updated?: string | null
          new_orders_ids?: Json | null
          new_orders_shipments?: Json | null
          resource?: string | null
          resource_id?: string | null
          return_id?: number | null
          status?: string | null
          status_detail?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reclamacoes_trocas_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "reclamacoes"
            referencedColumns: ["claim_id"]
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          integration_account_id: string | null
          last_sync_date: string | null
          organization_id: string | null
          process_name: string
          progress: Json | null
          progress_current: number | null
          progress_total: number | null
          provider: string | null
          started_at: string | null
          status: string
          total_claims: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_account_id?: string | null
          last_sync_date?: string | null
          organization_id?: string | null
          process_name: string
          progress?: Json | null
          progress_current?: number | null
          progress_total?: number | null
          provider?: string | null
          started_at?: string | null
          status?: string
          total_claims?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_account_id?: string | null
          last_sync_date?: string | null
          organization_id?: string | null
          process_name?: string
          progress?: Json | null
          progress_current?: number | null
          progress_total?: number | null
          provider?: string | null
          started_at?: string | null
          status?: string
          total_claims?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_control_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
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
      unified_orders: {
        Row: {
          carrier_name: string | null
          created_at: string
          currency: string
          customer_document: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          date_closed: string | null
          date_created: string
          date_delivered: string | null
          date_shipped: string | null
          discount_amount: number | null
          fulfillment_status: string | null
          has_issues: boolean | null
          id: string
          integration_account_id: string | null
          items: Json
          notes: string | null
          numero: string | null
          order_id: string
          order_status: string
          organization_id: string
          paid_amount: number | null
          parent_order_id: string | null
          payment_status: string | null
          provider: string
          raw_data: Json | null
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          shipping_status: string | null
          tags: string[] | null
          total_amount: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date_closed?: string | null
          date_created: string
          date_delivered?: string | null
          date_shipped?: string | null
          discount_amount?: number | null
          fulfillment_status?: string | null
          has_issues?: boolean | null
          id?: string
          integration_account_id?: string | null
          items?: Json
          notes?: string | null
          numero?: string | null
          order_id: string
          order_status?: string
          organization_id: string
          paid_amount?: number | null
          parent_order_id?: string | null
          payment_status?: string | null
          provider: string
          raw_data?: Json | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_status?: string | null
          tags?: string[] | null
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          carrier_name?: string | null
          created_at?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date_closed?: string | null
          date_created?: string
          date_delivered?: string | null
          date_shipped?: string | null
          discount_amount?: number | null
          fulfillment_status?: string | null
          has_issues?: boolean | null
          id?: string
          integration_account_id?: string | null
          items?: Json
          notes?: string | null
          numero?: string | null
          order_id?: string
          order_status?: string
          organization_id?: string
          paid_amount?: number | null
          parent_order_id?: string | null
          payment_status?: string | null
          provider?: string
          raw_data?: Json | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_status?: string | null
          tags?: string[] | null
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_orders_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          preference_key: string
          preference_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          preference_key: string
          preference_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      vendas_agregadas_produto: {
        Row: {
          created_at: string
          data: string
          id: string
          integration_account_id: string
          organization_id: string
          quantidade_vendida: number
          receita: number
          sku: string | null
          thumbnail: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          integration_account_id: string
          organization_id: string
          quantidade_vendida?: number
          receita?: number
          sku?: string | null
          thumbnail?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          integration_account_id?: string
          organization_id?: string
          quantidade_vendida?: number
          receita?: number
          sku?: string | null
          thumbnail?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vendas_agregadas_totais: {
        Row: {
          created_at: string
          data: string
          id: string
          integration_account_id: string
          organization_id: string
          ticket_medio: number
          total_pedidos: number
          total_receita: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          integration_account_id: string
          organization_id: string
          ticket_medio?: number
          total_pedidos?: number
          total_receita?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          integration_account_id?: string
          organization_id?: string
          ticket_medio?: number
          total_pedidos?: number
          total_receita?: number
          updated_at?: string
        }
        Relationships: []
      }
      vendas_hoje_realtime: {
        Row: {
          account_name: string | null
          buyer_id: string | null
          buyer_nickname: string | null
          created_at: string | null
          currency_id: string | null
          date_closed: string | null
          date_created: string | null
          id: string
          integration_account_id: string
          item_id: string | null
          item_quantity: number | null
          item_sku: string | null
          item_thumbnail: string | null
          item_title: string | null
          item_unit_price: number | null
          order_data: Json | null
          order_id: string
          order_status: string | null
          organization_id: string
          paid_amount: number | null
          shipping_state: string | null
          synced_at: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: string
          integration_account_id: string
          item_id?: string | null
          item_quantity?: number | null
          item_sku?: string | null
          item_thumbnail?: string | null
          item_title?: string | null
          item_unit_price?: number | null
          order_data?: Json | null
          order_id: string
          order_status?: string | null
          organization_id: string
          paid_amount?: number | null
          shipping_state?: string | null
          synced_at?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          buyer_id?: string | null
          buyer_nickname?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: string
          integration_account_id?: string
          item_id?: string | null
          item_quantity?: number | null
          item_sku?: string | null
          item_thumbnail?: string | null
          item_title?: string | null
          item_unit_price?: number | null
          order_data?: Json | null
          order_id?: string
          order_status?: string | null
          organization_id?: string
          paid_amount?: number | null
          shipping_state?: string | null
          synced_at?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_hoje_realtime_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
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
          email: string | null
          id: string | null
          nome: string | null
          organization_id: string | null
          telefone: string | null
        }
        Insert: {
          cpf_cnpj?: never
          created_at?: string | null
          email?: never
          id?: string | null
          nome?: never
          organization_id?: string | null
          telefone?: never
        }
        Update: {
          cpf_cnpj?: never
          created_at?: string | null
          email?: never
          id?: string | null
          nome?: never
          organization_id?: string | null
          telefone?: never
        }
        Relationships: []
      }
      devolucoes_metrics_cache: {
        Row: {
          abertas: number | null
          com_dados_claim: number | null
          com_dados_order: number | null
          com_dados_return: number | null
          date: string | null
          em_mediacao: number | null
          fechadas: number | null
          integration_account_id: string | null
          total_devolucoes: number | null
          updated_at: string | null
          valor_medio: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      devolucoes_sync_stats: {
        Row: {
          account_name: string | null
          duration_ms: number | null
          error_message: string | null
          integration_account_id: string | null
          items_failed: number | null
          items_synced: number | null
          items_total: number | null
          last_sync_at: string | null
          last_sync_status: string | null
          minutes_since_sync: number | null
          organization_id: string | null
          sync_health: string | null
          sync_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devolucoes_sync_status_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_accounts_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_safe: {
        Row: {
          created_at: string | null
          id: string | null
          organizacao_id: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          organizacao_id?: string | null
          telefone?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          organizacao_id?: string | null
          telefone?: never
          updated_at?: string | null
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
    }
    Functions: {
      accept_invitation_secure: { Args: { _token: string }; Returns: Json }
      accept_invite:
        | { Args: { _token: string }; Returns: Json }
        | { Args: { _token: string; _user_email: string }; Returns: Json }
      admin_create_customer: { Args: { p_customer: Json }; Returns: string }
      admin_delete_customer: {
        Args: { p_customer_id: string }
        Returns: boolean
      }
      admin_list_profiles:
        | {
            Args: { _search?: string }
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
              onboarding_completed: boolean | null
              onboarding_completed_at: string | null
              organizacao_id: string | null
              telefone: string | null
              updated_at: string
            }[]
            SetofOptions: {
              from: "*"
              to: "profiles"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: { _limit?: number; _offset?: number; _search?: string }
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
      admin_update_customer: {
        Args: { p_customer: Json; p_customer_id: string }
        Returns: boolean
      }
      admin_update_profile: {
        Args: { p_updates: Json; p_user_id: string }
        Returns: boolean
      }
      aplicar_mapeamento_local_estoque: {
        Args: { p_pedido_id: string }
        Returns: string
      }
      backfill_config_for_current_org: { Args: never; Returns: Json }
      backfill_historico_vendas_orphans: { Args: never; Returns: Json }
      baixar_estoque_direto:
        | { Args: { p_baixas: Json }; Returns: Json }
        | { Args: { p_quantidade: number; p_sku: string }; Returns: Json }
      baixar_insumos_pedido: { Args: { p_insumos: Json }; Returns: Json }
      calcular_dias_restantes_acao: {
        Args: { p_deadline: string }
        Returns: number
      }
      can_view_sensitive_customer_data: { Args: never; Returns: boolean }
      check_access_schedule:
        | { Args: { _user_id: string }; Returns: boolean }
        | { Args: { p_role_id?: string; p_user_id: string }; Returns: boolean }
      check_clientes_secure_access: { Args: never; Returns: boolean }
      cleanup_expired_notifications: { Args: never; Returns: undefined }
      cleanup_expired_sensitive_data: { Args: never; Returns: undefined }
      cleanup_oauth_states: { Args: never; Returns: undefined }
      cleanup_vendas_antigas: { Args: never; Returns: undefined }
      complete_background_job:
        | {
            Args: { p_error_message?: string; p_job_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_error_message?: string
              p_job_id: string
              p_success: boolean
            }
            Returns: undefined
          }
      complete_devolucoes_sync:
        | {
            Args: {
              p_account_id: string
              p_duration_ms: number
              p_items_failed: number
              p_items_synced: number
              p_items_total: number
              p_sync_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_duration_ms: number
              p_sync_id: string
              p_total_created: number
              p_total_processed: number
              p_total_updated: number
            }
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
      converter_quantidade:
        | {
            Args: {
              p_quantidade: number
              p_unidade_destino: string
              p_unidade_origem: string
            }
            Returns: number
          }
        | {
            Args: {
              quantidade_origem: number
              unidade_destino_id: string
              unidade_origem_id: string
            }
            Returns: number
          }
      count_baixados:
        | { Args: never; Returns: number }
        | {
            Args: {
              _account_ids: string[]
              _from?: string
              _search?: string
              _to?: string
            }
            Returns: number
          }
      count_mapeamentos_pendentes:
        | {
            Args: { _account_ids?: string[]; _from?: string; _to?: string }
            Returns: number
          }
        | {
            Args: {
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
        SetofOptions: {
          from: "*"
          to: "invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_logistic_events_from_pedido: {
        Args: { p_pedido_data: Json }
        Returns: string[]
      }
      criar_local_padrao_org: {
        Args: { p_organization_id: string }
        Returns: string
      }
      debug_historico_visibilidade: { Args: never; Returns: Json }
      decrypt_integration_secret: {
        Args: { p_encrypted_data: string; p_encryption_key?: string }
        Returns: Json
      }
      decrypt_simple: { Args: { encrypted_data: string }; Returns: Json }
      detectar_marketplace_pedido:
        | {
            Args: {
              p_integration_account_id: string
              p_organization_id: string
            }
            Returns: string
          }
        | { Args: { p_dados: Json; p_order_id: string }; Returns: string }
      encrypt_integration_secret: {
        Args: { p_encryption_key?: string; p_secret_data: Json }
        Returns: string
      }
      encrypt_simple: { Args: { data: string }; Returns: string }
      enqueue_background_job:
        | {
            Args: {
              p_job_type: string
              p_metadata?: Json
              p_priority?: number
              p_resource_id: string
              p_resource_type: string
            }
            Returns: string
          }
        | {
            Args: {
              p_job_type: string
              p_metadata?: Json
              p_priority?: number
              p_resource_id: string
              p_resource_type: string
            }
            Returns: string
          }
      ensure_current_org: { Args: never; Returns: Json }
      ensure_integrations_manager_for_current_user: {
        Args: never
        Returns: Json
      }
      fail_devolucoes_sync:
        | {
            Args: {
              p_account_id: string
              p_error_details?: Json
              p_error_message: string
              p_sync_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_duration_ms: number
              p_error_message: string
              p_sync_id: string
            }
            Returns: undefined
          }
      fix_historico_integration_accounts: { Args: never; Returns: Json }
      fix_produtos_organization_id: { Args: never; Returns: Json }
      generate_category_hierarchy_from_products: { Args: never; Returns: Json }
      generate_password_reset_token: { Args: { _email: string }; Returns: Json }
      gerar_numero_cotacao: { Args: never; Returns: string }
      gerar_numero_pedido_compra: { Args: never; Returns: string }
      gerar_sku_automatico:
        | { Args: never; Returns: string }
        | { Args: { org_id: string; prefixo?: string }; Returns: string }
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
      get_clientes_secure: {
        Args: never
        Returns: {
          cpf_cnpj: string
          created_at: string
          data_is_masked: boolean
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
      get_current_org_id: { Args: never; Returns: string }
      get_current_sales_rep_id: { Args: never; Returns: string }
      get_customer_secure: {
        Args: { p_customer_id: string }
        Returns: {
          cpf_cnpj: string
          created_at: string
          email: string
          id: string
          nome: string
          organization_id: string
          telefone: string
        }[]
      }
      get_data_quality_metrics: {
        Args: never
        Returns: {
          alertas_criticos: number
          com_boa: number
          com_excelente: number
          com_moderada: number
          com_ruim: number
          pct_acoes: number
          pct_comunicacao: number
          pct_custos: number
          pct_deadlines: number
          pct_fulfillment: number
          pct_review: number
          sync_24h: number
          sync_7d: number
          total: number
        }[]
      }
      get_historico_venda_by_id: {
        Args: { p_id: string }
        Returns: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente_documento: string | null
          cliente_nome: string | null
          codigo_barras: string | null
          codigo_rastreamento: string | null
          conditions: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          custo_envio_seller: number | null
          custo_fixo_meli: number | null
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
          level_id: string | null
          local_estoque: string | null
          local_estoque_id: string | null
          local_estoque_nome: string | null
          logistic_mode_principal: string | null
          logistic_type: string | null
          marketplace: string | null
          marketplace_origem: string | null
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
          power_seller_status: string | null
          qtd_kit: number | null
          quantidade: number
          quantidade_itens: number | null
          quantidade_kit: number | null
          quantidade_total: number | null
          raw: Json | null
          raw_data: Json | null
          receita_flex_bonus: number | null
          rua: string | null
          shipping_method: string | null
          shipping_mode: string | null
          shipping_shipping_status: string | null
          shipping_substatus: string | null
          situacao: string | null
          sku_estoque: string | null
          sku_kit: string | null
          sku_produto: string
          skus_produtos: string | null
          status: string
          status_baixa: string | null
          status_envio: string | null
          status_insumos: string | null
          status_mapeamento: string | null
          status_pagamento: string | null
          status_resumos: string | null
          substatus_detail: string | null
          substatus_estado_atual: string | null
          tags: string[] | null
          taxa_marketplace: number | null
          tipo_entrega: string | null
          tipo_logistico: string | null
          tipo_metodo_envio: string | null
          tipo_pagamento: string | null
          titulo_anuncio: string | null
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
        SetofOptions: {
          from: "*"
          to: "historico_vendas"
          isOneToOne: false
          isSetofReturn: true
        }
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
          cliente_documento: string
          cliente_nome: string
          codigo_barras: string
          codigo_rastreamento: string
          condicao: string
          conditions: string
          cpf_cnpj: string
          created_at: string
          created_by: string
          custo_envio_seller: number
          custo_fixo_meli: number
          data_criacao_ml: string
          data_pedido: string
          data_prevista: string
          date_created: string
          delivery_type: string
          desconto_cupom: number
          descricao: string
          empresa: string
          endereco_bairro: string
          endereco_cep: string
          endereco_cidade: string
          endereco_numero: string
          endereco_rua: string
          endereco_uf: string
          frete_pago_cliente: number
          id: string
          id_unico: string
          integration_account_id: string
          last_updated: string
          level_id: string
          local_estoque: string
          local_estoque_id: string
          local_estoque_nome: string
          logistic_mode_principal: string
          marketplace: string
          medalha: string
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
          power_seller_status: string
          qtd_kit: number
          quantidade: number
          quantidade_itens: number
          quantidade_kit: number
          quantidade_total: number
          receita_flex_bonus: number
          reputacao: string
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
          status_resumos: string
          substatus_detail: string
          substatus_estado_atual: string
          tags: string[]
          tags_pedido: string
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
          conditions: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          custo_envio_seller: number | null
          custo_fixo_meli: number | null
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
          level_id: string | null
          local_estoque: string | null
          local_estoque_id: string | null
          local_estoque_nome: string | null
          logistic_mode_principal: string | null
          logistic_type: string | null
          marketplace: string | null
          marketplace_origem: string | null
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
          power_seller_status: string | null
          qtd_kit: number | null
          quantidade: number
          quantidade_itens: number | null
          quantidade_kit: number | null
          quantidade_total: number | null
          raw: Json | null
          raw_data: Json | null
          receita_flex_bonus: number | null
          rua: string | null
          shipping_method: string | null
          shipping_mode: string | null
          shipping_shipping_status: string | null
          shipping_substatus: string | null
          situacao: string | null
          sku_estoque: string | null
          sku_kit: string | null
          sku_produto: string
          skus_produtos: string | null
          status: string
          status_baixa: string | null
          status_envio: string | null
          status_insumos: string | null
          status_mapeamento: string | null
          status_pagamento: string | null
          status_resumos: string | null
          substatus_detail: string | null
          substatus_estado_atual: string | null
          tags: string[] | null
          taxa_marketplace: number | null
          tipo_entrega: string | null
          tipo_logistico: string | null
          tipo_metodo_envio: string | null
          tipo_pagamento: string | null
          titulo_anuncio: string | null
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
        SetofOptions: {
          from: "*"
          to: "historico_vendas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_historico_vendas_masked:
        | {
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
              cliente_documento: string
              cliente_nome: string
              codigo_barras: string
              codigo_rastreamento: string
              conditions: string
              cpf_cnpj: string
              created_at: string
              created_by: string
              custo_envio_seller: number
              custo_fixo_meli: number
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
              level_id: string
              local_estoque: string
              local_estoque_id: string
              local_estoque_nome: string
              logistic_mode_principal: string
              logistic_type: string
              marketplace_origem: string
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
              origem: string
              pack_id: string
              pack_status: string
              pack_status_detail: string
              pedido_id: string
              pickup_id: string
              power_seller_status: string
              qtd_kit: number
              quantidade: number
              quantidade_itens: number
              quantidade_kit: number
              quantidade_total: number
              raw: Json
              raw_data: Json
              receita_flex_bonus: number
              rua: string
              shipping_method: string
              shipping_mode: string
              shipping_shipping_status: string
              shipping_substatus: string
              situacao: string
              sku_estoque: string
              sku_kit: string
              sku_produto: string
              skus_produtos: string
              status: string
              status_baixa: string
              status_envio: string
              status_insumos: string
              status_mapeamento: string
              status_pagamento: string
              substatus_detail: string
              substatus_estado_atual: string
              tags: string[]
              taxa_marketplace: number
              tipo_entrega: string
              tipo_logistico: string
              tipo_metodo_envio: string
              tipo_pagamento: string
              titulo_anuncio: string
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
        | {
            Args: {
              p_limit?: number
              p_offset?: number
              p_organization_id: string
            }
            Returns: {
              buyer_cpf: string
              buyer_email: string
              buyer_name: string
              buyer_phone: string
              created_at: string
              id: string
              order_id: string
              organization_id: string
              total_amount: number
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
      get_jsonb_index_stats: {
        Args: never
        Returns: {
          efficiency_score: number
          index_name: string
          index_scans: number
          rows_fetched: number
          rows_read: number
          size_mb: number
          table_name: string
        }[]
      }
      get_last_sync_time: {
        Args: { p_account_id: string; p_sync_type?: string }
        Returns: string
      }
      get_low_stock_products: {
        Args: never
        Returns: {
          altura_cm: number | null
          ativo: boolean
          categoria: string | null
          categoria_id: string | null
          categoria_nivel2: string | null
          categoria_principal: string | null
          codigo_barras: string | null
          codigo_cest: string | null
          cofins: number | null
          comprimento_cm: number | null
          cor: string | null
          created_at: string
          cubagem_cm3: number | null
          descricao: string | null
          dias_preparacao: number | null
          eh_produto_pai: boolean
          estoque_maximo: number
          estoque_minimo: number
          icms: number | null
          id: string
          imagem_fornecedor: string | null
          imposto_importacao: number | null
          integration_account_id: string | null
          ipi: number | null
          largura_cm: number | null
          localizacao: string | null
          material: string | null
          ncm: string | null
          nome: string
          numero_volumes: number | null
          observacoes: string | null
          organization_id: string | null
          origem: number | null
          package: string | null
          pcs_ctn: number | null
          peso_bruto_kg: number | null
          peso_cx_master_kg: number | null
          peso_liquido_kg: number | null
          peso_unitario_g: number | null
          pis: number | null
          preco_custo: number | null
          preco_venda: number | null
          produto_origem_id: string | null
          quantidade_atual: number
          sku_gerado_automaticamente: boolean | null
          sku_interno: string
          sku_pai: string | null
          sob_encomenda: boolean | null
          status: string
          subcategoria: string | null
          tipo_embalagem: string | null
          ultima_movimentacao: string | null
          unidade_medida_id: string
          unit: string | null
          updated_at: string
          url_imagem: string | null
          versao: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "produtos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_low_stock_products_count: { Args: never; Returns: number }
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
        Args: never
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
        Args: never
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
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          organizacao_id: string | null
          telefone: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_next_background_job: {
        Args: never
        Returns: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          max_retries: number | null
          metadata: Json | null
          priority: number | null
          resource_id: string
          resource_type: string
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "background_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_notificacoes_nao_lidas_count: { Args: never; Returns: number }
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
        Args: never
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
      get_queue_status: {
        Args: never
        Returns: {
          oldest_pending: string
          total_completed: number
          total_failed: number
          total_pending: number
          total_processing: number
        }[]
      }
      get_sync_control_status: {
        Args: { p_integration_account_id: string; p_provider: string }
        Returns: Json
      }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      get_user_permissions: { Args: never; Returns: string[] }
      get_user_profile_for_chat: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          nome_exibicao: string
          organizacao_id: string
        }[]
      }
      has_permission: { Args: { permission_key: string }; Returns: boolean }
      hv_delete: { Args: { _id: string }; Returns: undefined }
      hv_delete_many: { Args: { _ids: string[] }; Returns: undefined }
      hv_exists: { Args: { p_id_unico: string }; Returns: boolean }
      hv_exists_many: {
        Args: { p_ids_unicos: string[] }
        Returns: {
          id_unico: string
          pedido_exists: boolean
        }[]
      }
      hv_fix_orphans: { Args: { default_account_id?: string }; Returns: number }
      hv_insert: { Args: { p_data: Json }; Returns: Json }
      hv_orphaned_stats: { Args: never; Returns: Json }
      limpar_notificacoes_expiradas: { Args: never; Returns: Json }
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
      log_customer_access:
        | {
            Args: { access_type?: string; customer_id: string; details?: Json }
            Returns: undefined
          }
        | {
            Args: {
              p_action: string
              p_customer_id: string
              p_sensitive_accessed?: boolean
            }
            Returns: undefined
          }
      log_customer_data_access:
        | {
            Args: { p_action?: string; p_customer_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_action: string
              p_customer_id: string
              p_has_permission: boolean
              p_user_id: string
            }
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
      marcar_notificacao_lida: {
        Args: { p_notificacao_id: string }
        Returns: Json
      }
      marcar_todas_notificacoes_lidas: { Args: never; Returns: Json }
      mark_oauth_state_used: {
        Args: { p_state_value: string }
        Returns: boolean
      }
      mask_cpf_cnpj: { Args: { doc: string }; Returns: string }
      mask_customer_address: { Args: { address: string }; Returns: string }
      mask_customer_cep: { Args: { cep: string }; Returns: string }
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
      mask_customer_phone: { Args: { phone: string }; Returns: string }
      mask_document: { Args: { doc: string }; Returns: string }
      mask_email: { Args: { email: string }; Returns: string }
      mask_name: { Args: { full_name: string }; Returns: string }
      mask_phone: { Args: { phone: string }; Returns: string }
      mask_phone_secure: { Args: { phone_input: string }; Returns: string }
      match_knowledge: {
        Args: {
          filter_org_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source: string
          title: string
        }[]
      }
      migrar_estoque_para_locais: { Args: never; Returns: Json }
      migrate_existing_orders_to_unified: { Args: never; Returns: Json }
      processar_recebimento_pedido_compra: {
        Args: { p_itens: Json; p_pedido_id: string }
        Returns: Json
      }
      refresh_devolucoes_metrics: { Args: never; Returns: undefined }
      refresh_ml_token: {
        Args: {
          p_account_id: string
          p_expires_at: string
          p_new_access_token: string
          p_new_refresh_token: string
        }
        Returns: Json
      }
      revoke_invitation: { Args: { _id: string }; Returns: Json }
      search_customers_secure:
        | {
            Args: {
              p_cidade?: string
              p_limit?: number
              p_offset?: number
              p_search?: string
              p_status?: string
              p_uf?: string
            }
            Returns: {
              cpf_cnpj: string
              created_at: string
              data_is_masked: boolean
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
              total_count: number
              total_pedidos: number
              updated_at: string
              valor_total_gasto: number
            }[]
          }
        | {
            Args: { p_organization_id: string; p_search_term: string }
            Returns: {
              cpf_cnpj: string
              created_at: string
              email: string
              id: string
              nome: string
              organization_id: string
              telefone: string
            }[]
          }
        | {
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
      security_summary: { Args: never; Returns: Json }
      seed_admin_role_for_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: undefined
      }
      seed_default_categories: { Args: never; Returns: Json }
      seed_oms_sample_data: { Args: never; Returns: undefined }
      set_integration_secret: {
        Args: { _key: string; _provider: string; _value: string }
        Returns: undefined
      }
      sincronizar_componentes_em_uso: { Args: never; Returns: undefined }
      split_existing_categories: { Args: never; Returns: undefined }
      start_devolucoes_sync:
        | {
            Args: { p_account_id: string; p_sync_type?: string }
            Returns: string
          }
        | { Args: { p_integration_account_id: string }; Returns: string }
      sync_cliente_from_pedido:
        | { Args: never; Returns: Json }
        | {
            Args: {
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
      tiny3_get_credentials:
        | {
            Args: { _client_id: string }
            Returns: {
              client_id: string
              client_secret: string
              redirect_uri: string
            }[]
          }
        | {
            Args: { _org_id: string }
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
      tiny3_set_credentials:
        | {
            Args: {
              _client_id: string
              _client_secret: string
              _redirect_uri?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _client_id: string
              _client_secret: string
              _org_id: string
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
      validate_security_settings: { Args: never; Returns: Json }
      verify_integration_account_ownership: {
        Args: { p_integration_account_id: string; p_user_id: string }
        Returns: boolean
      }
      verify_view_security: {
        Args: never
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
