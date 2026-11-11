'use strict';
const crypto = require('node:crypto');
const sessions = new Map();
const lifetime = 12 * 60 * 60 * 1000;
function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return 'scrypt$' + salt + '$' + crypto.scryptSync(password, salt, 64).toString('hex');
}
function verify(password, stored) {
  if (!stored.startsWith('scrypt$')) return stored === password;
  const [,salt,digest] = stored.split('$');
  if (!salt || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  return crypto.timingSafeEqual(crypto.scryptSync(password,salt,64),Buffer.from(digest,'hex'));
}
function token(req) { return (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('dafix_sid='))?.slice(10); }
function read(req) {
  const id=token(req), session=sessions.get(id);
  if (!session || session.expires<=Date.now()) { sessions.delete(id); return null; }
  return session;
}
function clear(req,res) {
  sessions.delete(token(req));
  res.setHeader('Set-Cookie','dafix_sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
}
function start(req,res,usuario,perfil) {
  sessions.delete(token(req));
  for(const [key,value] of sessions) if(value.expires<=Date.now())sessions.delete(key);
  const id=crypto.randomBytes(32).toString('hex');
  sessions.set(id,{usuario,perfil,expires:Date.now()+lifetime});
  res.setHeader('Set-Cookie','dafix_sid='+id+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+lifetime/1000+(req.socket.encrypted?'; Secure':''));
}
module.exports={hash,verify,read,start,clear};
