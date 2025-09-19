-- Manual trigger to send email for existing invitation
DO $$
DECLARE
  invitation_id uuid := 'a541d0af-4b18-4a4d-81f1-ac20f4dfa8f8';
BEGIN
  -- Call the edge function to send the invitation email
  PERFORM net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/send-invitation-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
    body := jsonb_build_object('invitation_id', invitation_id)
  );
END $$;