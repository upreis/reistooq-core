-- Add the customers:read_full permission for complete customer data access
INSERT INTO public.app_permissions (key, name, description) 
VALUES (
  'customers:read_full', 
  'Read Full Customer Data', 
  'Permission to view complete customer information including sensitive personal data like full names, documents, emails, and phone numbers'
) ON CONFLICT (key) DO NOTHING;