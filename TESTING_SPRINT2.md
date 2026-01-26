# Testing Sprint 2: IA Mockup Interpretation

## Overview
This document provides a comprehensive testing plan for Sprint 2 (IA-based mockup interpretation using Claude Vision). It includes step-by-step instructions, curl examples, and validation criteria.

## System Architecture Tested
```
User Browser (Angular)
    ↓
    Upload mockup image (PNG/JPG)
    ↓
Backend API: POST /flutter/interpretar-mockup
    ↓
    Multer Middleware: Validates image, converts to base64
    ↓
    FlutterMockupController: Receives request, validates
    ↓
    ClaudeVisionService: Sends to Claude Vision API
    ↓
    Claude Vision: Analyzes image, returns JSON
    ↓
    Response: Structured Flutter components
    ↓
Backend Response to Frontend
    ↓
Frontend: Updates screen with interpreted components
```

## Prerequisites
1. **Backend running**: Node.js server on localhost:3000
2. **API Key**: `ANTHROPIC_API_KEY` set in `.env`
3. **Test images**: PNG/JPG mockup images (under 5MB)
4. **Tools**: curl, Postman, or similar HTTP client

## Test Images

### Simple Test Case (Recommended for first test)
```
┌─────────────────────────┐
│  LoginScreen            │
├─────────────────────────┤
│  [ Username Input ]     │
│  [ Password Input ]     │
│  [ Login Button ]       │
│  [ Forgot Password ]    │
└─────────────────────────┘
```

### Complex Test Case
```
┌─────────────────────────┐
│ ≡  ShoppingCart         │ ← AppBar with menu
├─────────────────────────┤
│  [Product List]         │ ← ListView
│  • Item 1 - $10        │
│  • Item 2 - $20        │
│  • Item 3 - $15        │
│  [Add to Cart]         │
├─────────────────────────┤
│  [Checkout] [Cancel]    │ ← Buttons row
└─────────────────────────┘
```

## Test Cases

### Test 1: Basic Connectivity
**Objective**: Verify backend endpoint is accessible

```bash
# Check health
curl -X GET http://localhost:3000/flutter/health

# Expected Response:
# { "status": "ok", "timestamp": "2024-01-XX..." }
```

### Test 2: Simple Image Upload & Interpretation
**Objective**: Test basic flow with valid image

```bash
# Create test image base64 (or convert PNG to base64)
BASE64_IMAGE="iVBORw0KGgoAAAANSUhEUgAA..."

# Send interpretation request
curl -X POST http://localhost:3000/flutter/interpretar-mockup \
  -H "Content-Type: application/json" \
  -d "{
    \"imagenBase64\": \"$BASE64_IMAGE\",
    \"nombreScreen\": \"LoginScreen\"
  }"

# Expected Response:
# {
#   "success": true,
#   "screens": [
#     {
#       "className": "LoginScreen",
#       "components": [
#         {
#           "type": "TextField",
#           "label": "Username",
#           "position": 1,
#           "size": "medium",
#           "variant": "outlined"
#         },
#         ...
#       ]
#     }
#   ],
#   "interpretationTime": 2345
# }
```

### Test 3: Image Size Validation
**Objective**: Verify 5MB limit enforcement

```bash
# Try uploading 10MB image (should fail)
# Expected Error: { "success": false, "error": "Image exceeds 5MB limit" }
```

### Test 4: Invalid Image Format
**Objective**: Verify only image types accepted

```bash
# Try uploading .txt file as base64
curl -X POST http://localhost:3000/flutter/interpretar-mockup \
  -H "Content-Type: application/json" \
  -d "{
    \"imagenBase64\": \"aGVsbG8gd29ybGQgdGV4dA==\",
    \"mimeType\": \"text/plain\"
  }"

# Expected Error: { "success": false, "error": "Invalid image format" }
```

### Test 5: API Key Validation
**Objective**: Test error handling when API key missing

```bash
# Temporarily remove ANTHROPIC_API_KEY from .env
# Run test
curl -X POST http://localhost:3000/flutter/interpretar-mockup \
  -H "Content-Type: application/json" \
  -d "{
    \"imagenBase64\": \"$BASE64_IMAGE\",
    \"nombreScreen\": \"TestScreen\"
  }"

# Expected Error: 
# {
#   "success": false,
#   "error": "Error de autenticación: ANTHROPIC_API_KEY no configurada correctamente"
# }
```

### Test 6: Claude Vision Response Parsing
**Objective**: Verify JSON parsing handles various response formats

Expected Claude Vision responses (should all parse correctly):

#### Format A: Backticks style
```
```json
{
  "screens": [
    {
      "className": "LoginScreen",
      "components": [...]
    }
  ]
}
```
```

#### Format B: Raw JSON
```
{
  "screens": [...]
}
```

#### Format C: Trailing commas (should be cleaned)
```
{
  "screens": [
    {
      "className": "LoginScreen",
      "components": [
        {
          "type": "TextField",
          "label": "Email",
        }
      ],
    }
  ],
}
```

### Test 7: Component Type Validation
**Objective**: Verify only valid Flutter types accepted

```
Valid types: TextField, Button, ElevatedButton, TextButton, OutlinedButton, 
            ListView, GridView, AppBar, Icon, Container, Row, Column, Text

Invalid types should be rejected or converted to Container
```

### Test 8: Multiple Screens
**Objective**: Test detection of multi-screen mockups

```bash
# Image showing multiple screens (e.g., Login and Dashboard)
# Expected: "screens" array with 2+ items
```

### Test 9: Performance Timing
**Objective**: Verify response time is acceptable

```bash
# Monitor "interpretationTime" in response
# Expected: < 5000ms for simple images, < 10000ms for complex
```

### Test 10: Frontend Integration
**Objective**: Test complete frontend-backend integration

1. Open Angular app
2. Navigate to Flutter Preview component
3. Click "📸 Mockup" button
4. Select valid mockup image
5. Observe:
   - Image preview displays
   - "Interpretar" button becomes enabled
   - Click button and wait
   - Loading state shows
   - Components appear on screen
   - Component list updates

## Debugging & Logging

### Backend Logging Checklist
When running a test, verify these logs appear in server console:

```
✅ Interpretación iniciada
📋 Imagen recibida: XXXX bytes
⏱️  Llamando Claude Vision API
📝 Respuesta recibida, parseando JSON...
✅ Interpretación completada: N screen(s), M componente(s) total
```

### Frontend Logging Checklist
Open browser DevTools Console, verify:

```javascript
// Image selected
console.log("Imagen seleccionada:", filename, size)

// Validation passed
console.log("✅ Imagen validada")

// API call made
console.log("Enviando a /flutter/interpretar-mockup")

// Response received
console.log("Respuesta:", response)

// Components updated
console.log("Screen actualizado con componentes")
```

## Troubleshooting

### Issue: "Image exceeds 5MB limit"
- Check source image size: `ls -lh your-image.jpg`
- Compress image: `convert input.jpg -quality 85 output.jpg`
- Alternative: Reduce dimensions

### Issue: "Invalid image format"
- Verify file is actually PNG/JPG: `file your-image.jpg`
- Re-export from image editor
- Try converting: `convert input.jpg -type TrueColor output.jpg`

### Issue: "API key not configured"
- Verify `.env` file exists in `backend-p1sw1/`
- Check: `ANTHROPIC_API_KEY=sk-ant-...`
- Restart backend server after changing `.env`
- Check value: `echo $ANTHROPIC_API_KEY` (terminal)

### Issue: "Timeout - request took too long"
- Reduce image complexity
- Try simpler mockup (fewer components)
- Increase timeout in service (if needed)
- Check Anthropic API status

### Issue: "Parse error - invalid JSON from Claude"
- Check Claude response format in logs
- Verify fallback JSON parsing is working
- Try different prompt or image clarity

### Issue: "No components detected"
- Ensure mockup has clear shapes/rectangles
- Use darker pen/pencil for visibility
- Reduce image noise/background
- Add clear labels to components

## Success Criteria

### Code Quality
- ✅ All error scenarios handled gracefully
- ✅ Console logging shows clear flow
- ✅ Response times < 10s for typical images
- ✅ No console errors in browser DevTools

### Functionality
- ✅ Basic image upload works
- ✅ Claude interprets components correctly
- ✅ Frontend displays components
- ✅ Multiple screens detected
- ✅ Component types validated
- ✅ Errors display helpful messages

### Reliability
- ✅ Tests pass consistently
- ✅ No race conditions in async flow
- ✅ Graceful degradation on errors
- ✅ Recovery without server restart

## Running Full Test Suite

```bash
#!/bin/bash
# test-sprint2.sh

echo "🧪 Starting Sprint 2 Tests"

# Check backend
echo "Test 1: Backend connectivity..."
curl -s http://localhost:3000/flutter/health | jq .

# Check API key
echo "Test 2: API key validation..."
# ... run your test image

# Check component validation
echo "Test 3: Component validation..."
# ... verify component types

echo "✅ All tests completed"
```

## Next Steps

1. **Run Test 1-3** first (basic connectivity, simple upload, size validation)
2. **Run Test 9** to verify performance
3. **Run Test 10** for end-to-end frontend integration
4. **Document findings** in SPRINT2_RESULTS.md
5. **Optimize prompt** based on results (if needed)
6. **Prepare for Sprint 4** (full project export)

## Test Report Template

After completing tests, create a summary:

```markdown
# Sprint 2 Test Report - YYYY-MM-DD

## Tests Passed
- [x] Test 1: Basic Connectivity
- [x] Test 2: Simple Upload
- ...

## Tests Failed
- [ ] None expected

## Performance Metrics
- Average interpretation time: XXX ms
- Slowest image: XXX ms
- Fastest image: XXX ms

## Issues Found
1. Issue X: Description
   - Root cause: ...
   - Fix: ...

## Recommendations
- ...

## Sign-off
- Date: YYYY-MM-DD
- Tester: Your Name
- Status: ✅ READY FOR SPRINT 3
```

---

**Last Updated**: 2024
**Sprint**: Sprint 2 - IA Mockup Interpretation
**Status**: Testing & Refinement Phase
