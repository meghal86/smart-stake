#!/bin/bash

# Active Navigation State System E2E Test Runner
# 
# This script runs the Playwright E2E tests specifically for the 
# Active Navigation State System (Task 9) implementation.
#
# Requirements tested:
# - R9.NAV.ACTIVE_VISUAL: Visual indicators (2px border, bold text, opacity)
# - R9.NAV.BROWSER_SYNC: Browser navigation synchronization
# - R9.NAV.SMOOTH_TRANSITIONS: 150ms ease-out transitions
#
# Usage:
#   ./scripts/test-active-navigation.sh
#   ./scripts/test-active-navigation.sh --headed    # Run with browser UI
#   ./scripts/test-active-navigation.sh --debug     # Run with debug mode

set -e

echo "🧪 Running Active Navigation State System E2E Tests"
echo "=================================================="

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    echo "❌ Playwright not found. Installing..."
    npm install @playwright/test
    npx playwright install
fi

# Parse command line arguments
HEADED=""
DEBUG=""
BROWSER="chromium"

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED="--headed"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--headed] [--debug] [--browser chromium|firefox|webkit]"
            exit 1
            ;;
    esac
done

echo "🔧 Configuration:"
echo "   Browser: $BROWSER"
echo "   Headed: ${HEADED:-"false"}"
echo "   Debug: ${DEBUG:-"false"}"
echo ""

# Start the development server if not running
echo "🚀 Checking development server..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   Starting development server..."
    npm run dev &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    echo "   Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "   ✅ Development server is ready!"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo "   ❌ Development server failed to start"
            exit 1
        fi
    done
else
    echo "   ✅ Development server is already running"
fi

# Run the specific test file
echo ""
echo "🧪 Running Active Navigation State System tests..."
echo ""

# Build the command
CMD="npx playwright test tests/e2e/active-navigation-states.spec.ts --project=$BROWSER"

if [ -n "$HEADED" ]; then
    CMD="$CMD $HEADED"
fi

if [ -n "$DEBUG" ]; then
    CMD="$CMD $DEBUG"
fi

# Execute the tests
if eval $CMD; then
    echo ""
    echo "✅ All Active Navigation State System tests passed!"
    echo ""
    echo "📊 Test Coverage Summary:"
    echo "   ✅ Visual Indicators (2px border, bold text, opacity)"
    echo "   ✅ Browser Navigation Sync (back/forward, refresh)"
    echo "   ✅ Smooth Transitions (150ms ease-out)"
    echo "   ✅ Route-Specific Active States"
    echo "   ✅ Accessibility (ARIA, keyboard navigation)"
    echo "   ✅ Performance and Responsiveness"
    echo "   ✅ Error Handling and Edge Cases"
    echo ""
    echo "🎉 Task 9: Active Navigation State System is working correctly!"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    echo ""
    echo "🔍 Common issues to check:"
    echo "   - Is the development server running on http://localhost:3000?"
    echo "   - Are all navigation routes properly configured?"
    echo "   - Is the FooterNav component properly imported and used?"
    echo "   - Are the CSS classes for transitions and styling applied?"
    echo ""
    exit 1
fi

# Clean up development server if we started it
if [ -n "$DEV_SERVER_PID" ]; then
    echo "🧹 Cleaning up development server..."
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo "🏁 Test run complete!"