const OpenAI = require('openai');
const { logger } = require('../utils/logger');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured. AI features will be disabled.');
      this.client = null;
      return;
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.embeddingModel =
      process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  isConfigured() {
    return this.client !== null;
  }

  /**
   * Generate a completion using OpenAI
   * @param {Object} options - Completion options
   * @param {string} options.prompt - User prompt
   * @param {string} options.systemPrompt - System prompt
   * @param {number} options.temperature - Temperature (0-2)
   * @param {number} options.maxTokens - Max tokens
   * @param {boolean} options.json - Whether to expect JSON response
   * @returns {Promise<string>}
   */
  async generateCompletion({
    prompt,
    systemPrompt = 'You are a helpful AI assistant for a restaurant management system.',
    temperature = 0.7,
    maxTokens = 2000,
    json = false,
  }) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service is not configured');
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ];

      const options = {
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (json) {
        options.response_format = { type: 'json_object' };
      }

      const completion = await this.client.chat.completions.create(options);
      return completion.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI completion error:', error);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for text
   * @param {string|string[]} text - Text or array of texts to embed
   * @returns {Promise<number[]|number[][]>}
   */
  async generateEmbedding(text) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service is not configured');
    }

    try {
      const input = Array.isArray(text) ? text : [text];
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input,
      });

      const embeddings = response.data.map((item) => item.embedding);
      return Array.isArray(text) ? embeddings : embeddings[0];
    } catch (error) {
      logger.error('OpenAI embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>}
   */
  async analyzeSentiment(text) {
    const prompt = `Analyze the sentiment of the following text and return a JSON object with:
- sentiment: positive, negative, or neutral
- confidence: a score between 0 and 1
- summary: a brief explanation

Text: "${text}"`;

    const response = await this.generateCompletion({
      prompt,
      systemPrompt:
        'You are a sentiment analysis expert. Always respond with valid JSON.',
      temperature: 0.3,
      json: true,
    });

    return JSON.parse(response);
  }

  /**
   * Extract structured data from natural language
   * @param {string} text - Natural language text
   * @param {string} schema - Description of expected output structure
   * @returns {Promise<Object>}
   */
  async extractStructuredData(text, schema) {
    const prompt = `Extract structured data from the following text according to this schema:

Schema: ${schema}

Text: "${text}"

Return the data as valid JSON.`;

    const response = await this.generateCompletion({
      prompt,
      systemPrompt:
        'You are a data extraction expert. Always respond with valid JSON.',
      temperature: 0.3,
      json: true,
    });

    return JSON.parse(response);
  }
}

module.exports = new OpenAIService();
