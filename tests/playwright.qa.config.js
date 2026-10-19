const base = require('./playwright.config.js');

module.exports = {
  ...base,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.QA_JSON || 'qa-results.json' }],
  ],
};
