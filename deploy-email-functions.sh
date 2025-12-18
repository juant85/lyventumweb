#!/bin/bash

# Deploy Email Edge Functions with CORS support
# Run this to deploy the updated functions to Supabase

echo "🚀 Deploying Email Edge Functions..."
echo ""

# Deploy send-session-reminders
echo "📧 Deploying send-session-reminders..."
supabase functions deploy send-session-reminders --project-ref rnltgsfzkgpbfgzqskex --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ send-session-reminders deployed successfully!"
else
    echo "❌ Failed to deploy send-session-reminders"
    exit 1
fi

echo ""

# Deploy send-daily-agenda
echo "📧 Deploying send-daily-agenda..."
supabase functions deploy send-daily-agenda --project-ref rnltgsfzkgpbfgzqskex --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ send-daily-agenda deployed successfully!"
else
    echo "❌ Failed to deploy send-daily-agenda"
    exit 1
fi

echo ""
echo "🎉 All functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173/admin/email-settings"
echo "2. Test each email type"
echo "3. Verify no CORS errors in browser console"
