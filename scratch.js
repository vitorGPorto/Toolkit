const https = require('https');
const fs = require('fs');
https.get('https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/totvs.svg', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => fs.writeFileSync('c:\\projets\\Toolkit\\src\\assets\\totvs-icon.svg', data));
});
