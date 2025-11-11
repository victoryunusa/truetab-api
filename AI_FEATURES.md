# TrueTab AI Features Documentation

## Overview

TrueTab now includes comprehensive AI capabilities powered by OpenAI to enhance restaurant operations, provide intelligent insights, and improve customer experience.

## Features

### 1. Smart Menu Recommendations
AI-powered personalized menu recommendations based on:
- Customer order history
- Popular items
- Time of day
- Contextual factors (weather, special occasions)

**Endpoints:**
- `GET /api/ai/recommendations` - Get personalized recommendations
- `GET /api/ai/recommendations/similar/:itemId` - Get similar items

### 2. Sales Forecasting
Predict future demand and revenue using historical data:
- Menu item demand forecasting
- Inventory needs prediction
- Seasonal trend analysis

**Endpoints:**
- `GET /api/ai/forecast/demand` - Forecast menu item demand
- `GET /api/ai/forecast/inventory` - Forecast inventory needs

### 3. Natural Language Processing (NLP)
Convert natural language to structured data:
- Voice/text order parsing
- Semantic menu search
- Customer intent extraction

**Endpoints:**
- `POST /api/ai/nlp/parse-order` - Parse natural language orders
- `GET /api/ai/nlp/search` - Search menu with natural language
- `POST /api/ai/nlp/intent` - Extract customer intent

### 4. Intelligent Pricing
Dynamic pricing suggestions based on:
- Demand patterns
- Inventory levels
- Time of day
- Price elasticity analysis

**Endpoints:**
- `GET /api/ai/pricing/suggestions` - Get pricing recommendations
- `GET /api/ai/pricing/elasticity/:itemId` - Analyze price elasticity
- `POST /api/ai/pricing/bundle` - Suggest bundle pricing

### 5. Customer Support Chatbot
AI assistant to help staff with:
- System feature questions
- Troubleshooting issues
- Quick how-to guides

**Endpoints:**
- `POST /api/ai/chat` - Chat with support bot
- `GET /api/ai/chat/quick-answer` - Get quick answers
- `GET /api/ai/chat/help-topics` - Suggest help topics
- `POST /api/ai/chat/troubleshoot` - Generate troubleshooting steps

### 6. Order Analytics & Insights
Comprehensive business intelligence:
- Customer behavior analysis
- Popular item combinations
- Menu performance insights
- Actionable business recommendations

**Endpoints:**
- `GET /api/ai/analytics/insights` - Get business insights
- `GET /api/ai/analytics/customer-behavior` - Analyze customer behavior
- `GET /api/ai/analytics/combinations` - Find popular combinations
- `GET /api/ai/analytics/menu-performance` - Analyze menu performance

## Setup

### 1. Install Dependencies

```bash
npm install openai
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Start the Server

```bash
npm run dev
```

## Usage Examples

### Smart Recommendations

```bash
# Get personalized recommendations
curl -X GET "http://localhost:9000/api/ai/recommendations?customerId=123&limit=5" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Get similar items
curl -X GET "http://localhost:9000/api/ai/recommendations/similar/item-id-123" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sales Forecasting

```bash
# Forecast demand for tomorrow
curl -X GET "http://localhost:9000/api/ai/forecast/demand?date=2025-01-15&daysHistory=90" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Forecast inventory needs for next week
curl -X GET "http://localhost:9000/api/ai/forecast/inventory?daysAhead=7" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Natural Language Order Parsing

```bash
# Parse a natural language order
curl -X POST "http://localhost:9000/api/ai/nlp/parse-order" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "I want 2 large pepperoni pizzas and a coke"
  }'

# Search menu with natural language
curl -X GET "http://localhost:9000/api/ai/nlp/search?query=something spicy with chicken" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Intelligent Pricing

```bash
# Get pricing suggestions
curl -X GET "http://localhost:9000/api/ai/pricing/suggestions" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Analyze price elasticity
curl -X GET "http://localhost:9000/api/ai/pricing/elasticity/item-id-123" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Suggest bundle pricing
curl -X POST "http://localhost:9000/api/ai/pricing/bundle" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "itemIds": ["item-id-1", "item-id-2", "item-id-3"]
  }'
```

### Chatbot Support

```bash
# Chat with support bot
curl -X POST "http://localhost:9000/api/ai/chat" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "How do I close a register session?",
    "history": [],
    "context": "Brand Admin"
  }'

# Get quick answer
curl -X GET "http://localhost:9000/api/ai/chat/quick-answer?question=How to add a menu item" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Analytics & Insights

```bash
# Get comprehensive business insights
curl -X GET "http://localhost:9000/api/ai/analytics/insights?days=30" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Analyze customer behavior
curl -X GET "http://localhost:9000/api/ai/analytics/customer-behavior" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Find popular item combinations
curl -X GET "http://localhost:9000/api/ai/analytics/combinations?minOccurrence=5" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Analyze menu performance
curl -X GET "http://localhost:9000/api/ai/analytics/menu-performance" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Documentation

Full API documentation with request/response schemas is available at:
- Swagger UI: `http://localhost:9000/api-docs`

Look for the following tags in the Swagger docs:
- AI - Recommendations
- AI - Forecasting
- AI - NLP
- AI - Pricing
- AI - Chatbot
- AI - Analytics

## Architecture

### Services

1. **OpenAI Service** (`src/services/openai.service.js`)
   - Base service for OpenAI API interactions
   - Handles completions, embeddings, and error handling

2. **Recommendation Service** (`src/modules/ai/recommendation.service.js`)
   - Menu recommendations
   - Similar item suggestions

3. **Forecasting Service** (`src/modules/ai/forecasting.service.js`)
   - Demand forecasting
   - Inventory predictions

4. **NLP Service** (`src/modules/ai/nlp.service.js`)
   - Natural language processing
   - Order parsing and intent extraction

5. **Pricing Service** (`src/modules/ai/pricing.service.js`)
   - Dynamic pricing suggestions
   - Price elasticity analysis

6. **Chatbot Service** (`src/modules/ai/chatbot.service.js`)
   - Support chatbot
   - Knowledge base management

7. **Analytics Service** (`src/modules/ai/analytics.service.js`)
   - Business insights
   - Customer behavior analysis

### Data Flow

```
Client Request
    ↓
API Endpoint (Controller)
    ↓
AI Service Layer
    ↓
[Database Query] → [AI Processing (OpenAI)] → [Result Enrichment]
    ↓
Response to Client
```

## Best Practices

### 1. Rate Limiting
- AI endpoints can be resource-intensive
- Consider implementing rate limiting for AI routes
- Monitor OpenAI API usage and costs

### 2. Caching
- Cache frequently requested insights (e.g., daily forecasts)
- Use Redis to store AI responses with TTL
- Example:
  ```javascript
  const cacheKey = `ai:recommendations:${brandId}:${branchId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Generate new recommendations
  const recommendations = await aiService.getRecommendations();
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(recommendations));
  ```

### 3. Error Handling
- All AI services have graceful fallbacks
- Log errors for monitoring
- Provide fallback responses when AI is unavailable

### 4. Data Privacy
- Customer data used for AI should comply with privacy laws
- Anonymize data where possible
- Provide opt-out mechanisms for customers

### 5. Cost Management
- Monitor OpenAI API usage
- Set up billing alerts
- Use appropriate models (GPT-4 vs GPT-3.5) based on need
- Implement request throttling

## Performance Considerations

- **Response Times**: AI requests typically take 1-5 seconds
- **Async Processing**: Consider background jobs for heavy operations
- **Data Volume**: Limit historical data to relevant time periods
- **Model Selection**: Balance cost vs. accuracy

## Troubleshooting

### AI Features Not Working

1. **Check OpenAI API Key**
   ```bash
   # Verify key is set
   echo $OPENAI_API_KEY
   ```

2. **Check Service Logs**
   ```bash
   # Look for OpenAI errors
   tail -f logs/combined.log | grep OpenAI
   ```

3. **Test OpenAI Connection**
   ```javascript
   const openai = require('./src/services/openai.service');
   console.log(openai.isConfigured()); // Should return true
   ```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "OpenAI service is not configured" | Missing API key | Add OPENAI_API_KEY to .env |
| "Rate limit exceeded" | Too many requests | Implement request throttling |
| "Context length exceeded" | Too much data in prompt | Reduce historical data range |
| "Timeout" | Slow AI response | Increase request timeout |

## Future Enhancements

Potential additions to the AI system:
- [ ] Image recognition for menu items
- [ ] Voice ordering integration
- [ ] Predictive maintenance alerts
- [ ] Automated marketing campaigns
- [ ] Customer sentiment analysis from reviews
- [ ] Real-time demand adjustments
- [ ] Multi-language support

## Cost Estimation

Approximate OpenAI API costs (as of 2025):

| Feature | Model | Est. Cost per Request |
|---------|-------|----------------------|
| Recommendations | GPT-4o | $0.01 - $0.03 |
| Forecasting | GPT-4o | $0.02 - $0.05 |
| NLP Parsing | GPT-4o | $0.01 - $0.02 |
| Pricing Analysis | GPT-4o | $0.02 - $0.04 |
| Chatbot | GPT-4o | $0.005 - $0.01 |
| Analytics | GPT-4o | $0.03 - $0.06 |

*Actual costs vary based on data volume and prompt complexity*

## Support

For issues or questions:
- Check Swagger docs: `/api-docs`
- Review logs: `logs/combined.log`
- OpenAI docs: https://platform.openai.com/docs

## License

Same as TrueTab API - MIT License
