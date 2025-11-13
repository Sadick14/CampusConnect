#!/bin/bash

# Quick one-liner to activate trial for your organization
# This creates the subscription record in Firestore

echo "==================================================="
echo "ACTIVATE TRIAL FOR YOUR ORGANIZATION"
echo "==================================================="
echo ""
echo "Two options to activate your 30-day trial:"
echo ""
echo "OPTION 1: Via Super Admin Dashboard (Recommended)"
echo "---------------------------------------------------"
echo "1. Make sure you're logged in as super admin"
echo "2. Go to: http://localhost:3000/super-admin/organizations"
echo "   (or replace localhost:3000 with your actual URL)"
echo "3. Find your organization in the list"
echo "4. Click the 3-dot menu (⋮)"
echo "5. Click 'Activate Trial'"
echo "6. Done! ✅"
echo ""
echo "OPTION 2: Via Browser Console (Quick)"
echo "---------------------------------------------------"
echo "1. Open your app in the browser"
echo "2. Press F12 to open Developer Console"
echo "3. Go to the Console tab"
echo "4. Paste this code and press Enter:"
echo ""
echo "------- COPY BELOW THIS LINE -------"
cat << 'EOF'
// Initialize trial subscription
const orgId = '6uxRp8N6NWAgrRWPYUHU';
const orgName = 'Your School';

fetch('/api/subscription/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ organizationId: orgId, schoolName: orgName })
}).then(r => r.json()).then(d => console.log('Trial activated!', d));
EOF
echo "------- COPY ABOVE THIS LINE -------"
echo ""
echo "OR use Option 1 (Super Admin Dashboard) - it's easier!"
echo ""
