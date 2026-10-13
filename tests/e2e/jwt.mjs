import crypto from 'node:crypto';
const [,, role, sub = '', email = ''] = process.argv;
const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const head = b({ alg: 'HS256', typ: 'JWT' });
const pay = b({ role, ...(sub ? { sub, email } : {}), aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 * 6 });
const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${head}.${pay}`).digest('base64url');
console.log(`${head}.${pay}.${sig}`);
