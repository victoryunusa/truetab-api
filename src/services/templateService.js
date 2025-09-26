const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

class TemplateService {
  constructor() {
    this.templates = {};
  }

  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      this.templates[templateName] = handlebars.compile(templateContent);
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw error;
    }
  }

  async renderTemplate(templateName, data) {
    if (!this.templates[templateName]) {
      await this.loadTemplate(templateName); // lazy load if not already loaded
    }
    return this.templates[templateName](data);
  }
}

module.exports = new TemplateService();
