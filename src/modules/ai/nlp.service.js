const prisma = require('../../lib/prisma');
const openai = require('../../services/openai.service');
const logger = require('../../utils/logger');

class NLPService {
  /**
   * Parse natural language order into structured data
   * @param {Object} params
   * @param {string} params.text - Natural language order text
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @returns {Promise<Object>}
   */
  async parseOrder({ text, brandId, branchId }) {
    try {
      // Get available menu items for context
      const menuItems = await this.getMenuContext(brandId);

      // Build parsing prompt
      const prompt = this.buildOrderParsingPrompt(text, menuItems);

      // Get AI response
      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: `You are a restaurant order processing assistant. Parse natural language orders into structured format. Match items to the menu accurately. Always respond with valid JSON.`,
        temperature: 0.3,
        json: true,
      });

      const parsed = JSON.parse(aiResponse);

      // Validate and enrich the parsed order
      const enrichedOrder = await this.enrichParsedOrder(parsed, brandId);

      return {
        success: true,
        originalText: text,
        parsedOrder: enrichedOrder,
        confidence: parsed.confidence || 'medium',
        warnings: parsed.warnings || [],
      };
    } catch (error) {
      logger.error('Error parsing order:', error);
      return {
        success: false,
        originalText: text,
        error: error.message,
      };
    }
  }

  /**
   * Process voice/text search query for menu items
   * @param {Object} params
   * @param {string} params.query - Search query
   * @param {string} params.brandId
   * @returns {Promise<Array>}
   */
  async searchMenuByNaturalLanguage({ query, brandId }) {
    try {
      const menuItems = await prisma.menuItem.findMany({
        where: {
          brandId,
          isActive: true,
        },
        include: {
          variants: { where: { isActive: true } },
          categories: { include: { category: true } },
        },
        take: 50,
      });

      const prompt = `Given this search query: "${query}"

Available menu items:
${menuItems.map((item, idx) => `${idx + 1}. ${item.defaultName}${item.description ? ` - ${item.description}` : ''}`).join('\n')}

Return the most relevant menu items as a JSON array:
[
  {
    "name": "exact menu item name",
    "relevance": "high|medium|low",
    "reason": "why it matches"
  }
]

Return top 5 matches.`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt:
          'You are a semantic search expert. Match user queries to menu items based on meaning and intent. Always respond with valid JSON.',
        temperature: 0.3,
        json: true,
      });

      const matches = JSON.parse(aiResponse);

      // Enrich with full item details
      const results = matches
        .map((match) => {
          const item = menuItems.find(
            (i) => i.defaultName.toLowerCase() === match.name.toLowerCase()
          );
          if (!item) return null;
          return {
            item,
            relevance: match.relevance,
            reason: match.reason,
          };
        })
        .filter(Boolean);

      return results;
    } catch (error) {
      logger.error('Error in NLP search:', error);
      throw error;
    }
  }

  /**
   * Extract customer intent from text
   * @param {string} text - Customer text/message
   * @returns {Promise<Object>}
   */
  async extractIntent(text) {
    try {
      const prompt = `Analyze the following customer text and determine their intent.

Text: "${text}"

Return a JSON object with:
{
  "intent": "order|inquiry|complaint|reservation|feedback|other",
  "confidence": number between 0 and 1,
  "entities": {
    "items": ["mentioned menu items"],
    "time": "mentioned time if any",
    "party_size": number if mentioned,
    "sentiment": "positive|negative|neutral"
  },
  "suggested_action": "what should be done"
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt:
          'You are a customer intent analysis expert for restaurants. Always respond with valid JSON.',
        temperature: 0.3,
        json: true,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      logger.error('Error extracting intent:', error);
      throw error;
    }
  }

  /**
   * Get menu context for AI
   */
  async getMenuContext(brandId, limit = 100) {
    const items = await prisma.menuItem.findMany({
      where: {
        brandId,
        isActive: true,
      },
      include: {
        variants: {
          where: { isActive: true },
          select: { name: true, price: true },
        },
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
      take: limit,
    });

    return items.map((item) => ({
      name: item.defaultName,
      description: item.description,
      variants: item.variants.map((v) => v.name),
      categories: item.categories.map((c) => c.category.name),
    }));
  }

  /**
   * Build order parsing prompt
   */
  buildOrderParsingPrompt(text, menuItems) {
    const itemsList = menuItems
      .slice(0, 50)
      .map((item) => {
        let str = `- ${item.name}`;
        if (item.variants.length > 0) {
          str += ` (variants: ${item.variants.join(', ')})`;
        }
        return str;
      })
      .join('\n');

    const prompt = `Parse this customer order into structured format:

Order: "${text}"

Available Menu Items:
${itemsList}

Return a JSON object with:
{
  "items": [
    {
      "name": "menu item name (exact match from menu)",
      "variant": "variant name if specified",
      "quantity": number,
      "modifiers": ["any special requests or modifications"],
      "notes": "any special instructions"
    }
  ],
  "confidence": "high|medium|low",
  "warnings": ["any ambiguities or issues"],
  "customer_notes": "overall order notes if any"
}

Be flexible with variations in how items are named. Match to the closest menu item.`;

    return prompt;
  }

  /**
   * Enrich parsed order with database IDs
   */
  async enrichParsedOrder(parsed, brandId) {
    const enrichedItems = [];

    for (const item of parsed.items || []) {
      // Find menu item
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          brandId,
          defaultName: { contains: item.name, mode: 'insensitive' },
          isActive: true,
        },
        include: {
          variants: { where: { isActive: true } },
        },
      });

      if (menuItem) {
        const enrichedItem = {
          itemId: menuItem.id,
          itemName: menuItem.defaultName,
          quantity: item.quantity || 1,
          notes: item.notes,
          modifiers: item.modifiers || [],
        };

        // Match variant if specified
        if (item.variant && menuItem.variants.length > 0) {
          const variant = menuItem.variants.find(
            (v) =>
              v.name.toLowerCase().includes(item.variant.toLowerCase()) ||
              item.variant.toLowerCase().includes(v.name.toLowerCase())
          );
          if (variant) {
            enrichedItem.variantId = variant.id;
            enrichedItem.variantName = variant.name;
            enrichedItem.price = variant.price;
          }
        } else if (menuItem.variants.length > 0) {
          // Use default/first variant
          enrichedItem.variantId = menuItem.variants[0].id;
          enrichedItem.variantName = menuItem.variants[0].name;
          enrichedItem.price = menuItem.variants[0].price;
        }

        enrichedItems.push(enrichedItem);
      } else {
        // Item not found in menu
        enrichedItems.push({
          itemName: item.name,
          quantity: item.quantity || 1,
          notes: item.notes,
          warning: 'Item not found in menu',
        });
      }
    }

    return {
      items: enrichedItems,
      customerNotes: parsed.customer_notes,
      confidence: parsed.confidence,
      warnings: parsed.warnings || [],
    };
  }
}

module.exports = new NLPService();
