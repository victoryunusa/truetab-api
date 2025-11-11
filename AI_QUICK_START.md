# AI Features Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy the key (starts with `sk-`)

### Step 2: Add to Environment
Open your `.env` file and add:
```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Test It Works
Visit: http://localhost:9000/api-docs

Look for the "AI" tags - you should see 6 AI feature sections.

## 🎯 Most Useful Endpoints

### 1. Get Smart Recommendations
```bash
GET /api/ai/recommendations?limit=5
```
**Use case:** Show customers personalized menu suggestions

### 2. Chat with Support Bot
```bash
POST /api/ai/chat
Body: { "message": "How do I close a register?" }
```
**Use case:** Help staff quickly find answers

### 3. Parse Natural Language Orders
```bash
POST /api/ai/nlp/parse-order
Body: { "text": "2 large pizzas and a coke" }
```
**Use case:** Convert voice/text orders to structured data

### 4. Get Business Insights
```bash
GET /api/ai/analytics/insights?days=30
```
**Use case:** Understand business performance and opportunities

### 5. Forecast Inventory
```bash
GET /api/ai/forecast/inventory?daysAhead=7
```
**Use case:** Plan inventory purchases for the week

## 📊 What Each Feature Does

| Feature | What it does | Best for |
|---------|-------------|----------|
| **Recommendations** | Suggests menu items | Increasing average order value |
| **Forecasting** | Predicts demand | Inventory planning |
| **NLP** | Understands natural language | Voice ordering, search |
| **Pricing** | Optimizes prices | Revenue optimization |
| **Chatbot** | Answers questions | Staff support |
| **Analytics** | Provides insights | Business decisions |

## 💰 Cost Management

### Free Tier
OpenAI offers $5 free credit for new accounts.

### Typical Costs
- Small restaurant: ~$10-20/month
- Medium restaurant: ~$40-80/month
- Large chain: ~$200-400/month

### Tips to Reduce Costs
1. ✅ Cache AI responses (use Redis)
2. ✅ Only call AI when needed
3. ✅ Use GPT-3.5 for simple tasks (cheaper)
4. ✅ Limit historical data ranges

## 🔧 Troubleshooting

### "OpenAI service is not configured"
❌ Missing or wrong API key
✅ Add correct key to `.env` file

### "Rate limit exceeded"
❌ Too many requests
✅ Implement rate limiting or upgrade plan

### "Slow responses"
❌ Large data sets or complex queries
✅ Use caching and optimize queries

## 📚 Learn More

- **Full Documentation**: [AI_FEATURES.md](AI_FEATURES.md)
- **Implementation Details**: [AI_IMPLEMENTATION_SUMMARY.md](AI_IMPLEMENTATION_SUMMARY.md)
- **API Reference**: http://localhost:9000/api-docs

## 🎓 Example Use Cases

### Restaurant Owner
```
"Show me insights on my best-selling items and slow movers"
→ Use: /api/ai/analytics/menu-performance
```

### Manager
```
"What should I order for next week's inventory?"
→ Use: /api/ai/forecast/inventory
```

### Waiter
```
Customer says: "I want something healthy and vegetarian"
→ Use: /api/ai/nlp/search
```

### Admin
```
"Should I increase the price of my burgers?"
→ Use: /api/ai/pricing/elasticity/:itemId
```

## ✅ Next Steps

1. Test each feature in Swagger UI
2. Integrate with your frontend
3. Monitor usage and costs
4. Optimize based on results

## 🆘 Need Help?

1. Check Swagger docs: http://localhost:9000/api-docs
2. Read full docs: [AI_FEATURES.md](AI_FEATURES.md)
3. Check logs: `logs/combined.log`

---

**Ready to use AI in production?** Just add your OpenAI API key and start testing! 🚀
