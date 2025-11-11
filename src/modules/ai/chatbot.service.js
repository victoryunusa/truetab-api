const openai = require('../../services/openai.service');
const { logger } = require('../../utils/logger');

class ChatbotService {
  constructor() {
    // Knowledge base for the chatbot
    this.knowledgeBase = {
      features: {
        orders: 'Manage dine-in, takeaway, and delivery orders. Track order status from draft to paid.',
        inventory: 'Track products, manage stock levels, create purchase orders, and handle stock transfers.',
        menu: 'Create menu items with variants, modifiers, and categories. Set different prices per branch.',
        tables: 'Manage restaurant floor layout with zones and tables. Track table status.',
        payments: 'Accept multiple payment methods: cash, card, UPI, Stripe, Paystack, Flutterwave.',
        reports: 'View sales reports, inventory reports, and staff performance metrics.',
        staff: 'Manage staff accounts, tips, and settlements.',
      },
      commonIssues: {
        'login problems': 'Ensure you have the correct credentials. Contact your brand admin to reset your password.',
        'order not saving': 'Check your internet connection. Ensure all required fields are filled.',
        'payment failed': 'Verify payment gateway settings in admin panel. Check if session is active.',
        'printer not working': 'Verify printer is configured in settings. Check printer connection and status.',
        'inventory mismatch': 'Run a stock count and adjust discrepancies using stock adjustment feature.',
      },
      howTo: {
        'create order': '1. Go to Orders. 2. Select table/customer. 3. Add items. 4. Send to kitchen. 5. Process payment.',
        'add menu item': '1. Go to Menu. 2. Click Add Item. 3. Fill details. 4. Create variants. 5. Save.',
        'manage inventory': '1. Go to Inventory. 2. View products. 3. Create purchase orders. 4. Receive stock. 5. Track levels.',
        'close register': '1. Go to Registers. 2. Select session. 3. Count cash. 4. Enter amounts. 5. Close session.',
        'add table': '1. Go to Floor Management. 2. Create zone if needed. 3. Add table. 4. Set capacity.',
      },
    };
  }

  /**
   * Chat with the support bot
   * @param {Object} params
   * @param {string} params.message - User message
   * @param {Array} [params.history] - Chat history
   * @param {string} [params.context] - Additional context (user role, brand, etc.)
   * @returns {Promise<Object>}
   */
  async chat({ message, history = [], context }) {
    try {
      // Build conversation history
      const messages = this.buildConversationHistory(history);
      
      // Add system context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Add user message
      messages.push({
        role: 'user',
        content: message,
      });

      // Get AI response
      const response = await openai.client.chat.completions.create({
        model: openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const botResponse = response.choices[0].message.content;

      // Determine if escalation is needed
      const needsEscalation = this.checkEscalation(message, botResponse);

      return {
        response: botResponse,
        needsEscalation,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Chatbot error:', error);
      return {
        response: "I'm having trouble processing your request right now. Please contact support directly.",
        error: true,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get quick answers for common questions
   * @param {string} question - User question
   * @returns {Promise<Object>}
   */
  async getQuickAnswer(question) {
    try {
      const lowerQuestion = question.toLowerCase();

      // Check knowledge base for direct matches
      for (const [key, value] of Object.entries(this.knowledgeBase.commonIssues)) {
        if (lowerQuestion.includes(key)) {
          return {
            answer: value,
            source: 'knowledge_base',
            confidence: 'high',
          };
        }
      }

      for (const [key, value] of Object.entries(this.knowledgeBase.howTo)) {
        if (lowerQuestion.includes(key)) {
          return {
            answer: value,
            source: 'knowledge_base',
            confidence: 'high',
          };
        }
      }

      // Use AI for more complex questions
      const prompt = `Answer this question about the TrueTab restaurant management system:

Question: "${question}"

System Features:
${Object.entries(this.knowledgeBase.features).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Provide a clear, concise answer in 2-3 sentences.`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: 'You are a helpful support assistant for a restaurant POS system. Be concise and actionable.',
        temperature: 0.5,
        maxTokens: 200,
      });

      return {
        answer: aiResponse,
        source: 'ai',
        confidence: 'medium',
      };
    } catch (error) {
      logger.error('Quick answer error:', error);
      throw error;
    }
  }

  /**
   * Suggest help topics based on user query
   * @param {string} query - User query
   * @returns {Promise<Array>}
   */
  async suggestHelpTopics(query) {
    try {
      const prompt = `Given this user query: "${query}"

Available help topics:
${Object.keys(this.knowledgeBase.features).join(', ')}
${Object.keys(this.knowledgeBase.howTo).join(', ')}

Suggest the top 3 most relevant help topics that would answer the user's question.
Return as JSON array: ["topic1", "topic2", "topic3"]`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: 'You are a help topic suggestion expert. Always respond with valid JSON.',
        temperature: 0.3,
        json: true,
      });

      const topics = JSON.parse(aiResponse);
      return Array.isArray(topics) ? topics : [];
    } catch (error) {
      logger.error('Suggest topics error:', error);
      return [];
    }
  }

  /**
   * Generate troubleshooting steps
   * @param {string} issue - Description of the issue
   * @returns {Promise<Object>}
   */
  async generateTroubleshootingSteps(issue) {
    try {
      const prompt = `User is experiencing this issue with the restaurant POS system:

Issue: "${issue}"

Generate a step-by-step troubleshooting guide. Return as JSON:
{
  "steps": [
    {"step": 1, "action": "what to do", "expected": "what should happen"},
    {"step": 2, "action": "what to do", "expected": "what should happen"}
  ],
  "additionalHelp": "what to do if steps don't work"
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: 'You are a technical support expert. Provide clear, actionable troubleshooting steps. Always respond with valid JSON.',
        temperature: 0.5,
        json: true,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      logger.error('Troubleshooting error:', error);
      throw error;
    }
  }

  /**
   * Build conversation history for context
   */
  buildConversationHistory(history) {
    return history.slice(-5).map((msg) => ({
      role: msg.role || 'user',
      content: msg.content || msg.message,
    }));
  }

  /**
   * Build system prompt with context
   */
  buildSystemPrompt(context) {
    let prompt = `You are a helpful AI assistant for TrueTab, a restaurant management and POS system.

Your role is to help staff members with:
- Understanding system features
- Troubleshooting issues
- Learning how to perform tasks
- Answering questions about the platform

System Features:
${Object.entries(this.knowledgeBase.features).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Guidelines:
- Be concise and helpful
- Provide step-by-step instructions when appropriate
- If you're unsure, suggest contacting technical support
- Be friendly and professional`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    return prompt;
  }

  /**
   * Check if conversation needs escalation to human support
   */
  checkEscalation(message, response) {
    const escalationKeywords = [
      'not working',
      'broken',
      'urgent',
      'critical',
      'money',
      'payment issue',
      'lost',
      'delete',
      'refund',
    ];

    const messageLower = message.toLowerCase();
    const responseLower = response.toLowerCase();

    // Check if user message contains escalation keywords
    const hasEscalationKeyword = escalationKeywords.some((keyword) =>
      messageLower.includes(keyword)
    );

    // Check if bot is uncertain (common uncertainty phrases)
    const uncertainPhrases = [
      "i'm not sure",
      'i don\'t know',
      'contact support',
      'reach out to',
    ];
    const isUncertain = uncertainPhrases.some((phrase) =>
      responseLower.includes(phrase)
    );

    return hasEscalationKeyword || isUncertain;
  }
}

module.exports = new ChatbotService();
