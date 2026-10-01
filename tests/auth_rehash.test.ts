import http from 'http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { BCRYPT_COST } from '../src/utils/password.js';

/** Sign-in speed: new hashes use BCRYPT_COST; older, slower hashes are upgraded after a successful sign-in */
async function run() {
  console.log('🔑 AUTH REHASH SUITE');
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 5000}/api`;
  const post = (p: string, body: unknown) =>
    fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const ok = (c: unknown, m: string) => {
    if (!c) throw new Error('Assertion failed: ' + m);
  };
  const rounds = async (email: string) => bcrypt.getRounds((await User.findOne({ email }).select('+passwordHash').lean())!.passwordHash);
  try {
    ok((await post('/auth/patient/register', { name: 'Meera Rao', email: 'meera@example.com', password: 'Password123!' })).status === 201, 'register');
    ok((await rounds('meera@example.com')) === BCRYPT_COST, `new accounts use cost ${BCRYPT_COST}`);

    // An account created before the change (cost 12)
    await User.updateOne({ email: 'meera@example.com' }, { passwordHash: await bcrypt.hash('Password123!', 12) });
    ok((await post('/auth/login', { email: 'meera@example.com', password: 'Password123!' })).status === 200, 'old hash still signs in');
    await new Promise((r) => setTimeout(r, 800));
    ok((await rounds('meera@example.com')) === BCRYPT_COST, 'old hash upgraded in the background');
    ok((await post('/auth/login', { email: 'meera@example.com', password: 'Password123!' })).status === 200, 'upgraded hash signs in');
    ok((await post('/auth/login', { email: 'meera@example.com', password: 'wrong-password' })).status === 401, 'wrong password still rejected');
    console.log('🎉 AUTH REHASH SUITE PASSED');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

run().catch((err) => {
  console.error('❌ Auth Rehash Suite Failed:', err);
  process.exit(1);
});
