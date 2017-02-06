/** Config */

var local;
try {
  local = require('./local');
} catch (e) {
  local = {};
  console.info("Cannot resolve or find local configuration. System will use env variables.");
}

module.exports = {
    FB_PAGE_TOKEN: local.FB_PAGE_TOKEN || process.env.FB_PAGE_TOKEN,
    FB_PAGE_ID: local.FB_PAGE_ID || process.env.FB_PAGE_ID,
    FB_VERIFY_TOKEN: local.FB_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN,
    WIT_TOKEN: local.WIT_TOKEN || process.env.WIT_TOKEN
};