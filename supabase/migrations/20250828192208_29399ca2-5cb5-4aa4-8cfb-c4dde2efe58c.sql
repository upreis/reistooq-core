-- Seed/Upsert route-based permissions for menu/route protection
insert into public.app_permissions (key, name, description) values
  ('dashboard:view', 'Ver Dashboard', 'Acessar o dashboard principal'),
  ('analytics:view', 'Ver Analytics', 'Acessar relatórios e análises'),
  ('oms:view', 'Ver OMS', 'Acessar o módulo OMS e suas páginas internas'),
  ('ecommerce:view', 'Ver eCommerce', 'Acessar páginas do app eCommerce'),
  ('userprofile:view', 'Ver Perfil de Usuário', 'Acessar páginas de perfil de usuário'),
  ('calendar:view', 'Ver Calendário', 'Acessar o calendário'),
  ('notes:view', 'Ver Notas', 'Acessar o app de notas'),
  ('estoque:view', 'Ver Estoque', 'Acessar gestão de estoque'),
  ('orders:read', 'Ver Pedidos', 'Acessar pedidos e suas listagens'),
  ('scanner:use', 'Usar Scanner', 'Acessar o scanner'),
  ('depara:view', 'Ver De-Para', 'Acessar De-Para'),
  ('alerts:view', 'Ver Alertas', 'Acessar alertas'),
  ('settings:view', 'Ver Configurações', 'Acessar configurações e integrações'),
  ('historico:view', 'Ver Histórico', 'Acessar histórico'),
  ('admin:access', 'Acessar Administração', 'Exibir menu e página de administração'),
  ('demo:access', 'Acessar Páginas Demo', 'Acessar páginas de demonstração')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description;