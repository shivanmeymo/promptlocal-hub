-- Fix security definer view issue by setting security_invoker = true
ALTER VIEW public.public_events SET (security_invoker = true);