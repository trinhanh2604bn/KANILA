require('dotenv').config();
const fs = require('fs');
const uri = process.env.MONGO_URI;
const result = 'URI=' + (uri || 'UNDEFINED') + '\nPORT=' + process.env.PORT;
fs.writeFileSync('d:\\KANILA\\env-check.txt', result);
