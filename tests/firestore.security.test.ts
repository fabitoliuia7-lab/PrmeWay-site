import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Timestamp } from 'firebase/firestore';

const projectId = 'demo-primeway-security';
const emulatorHost = '127.0.0.1';
const emulatorPort = 8080;
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const rulesPath = path.resolve(testDirectory, '..', 'firestore.rules');

let testEnv: RulesTestEnvironment;

const pautaItem = {
  codigo: '8422.40.00',
  shCapitulo: '84',
  shPosicao: '8422',
  descricao: 'Máquinas e aparelhos para empacotar mercadorias',
  categoria: 'Máquinas & Equipamentos Industriais',
  tipoBem: 'capital',
  direitosPerc: 5,
  icePerc: 0,
  ivaPerc: 16,
  unidadeFisica: 'u',
  notas: 'Item de teste do emulador',
  palavrasChave: ['embaladora', '8422'],
};

function pautaRef(context: ReturnType<RulesTestEnvironment['authenticatedContext']>, itemId: string) {
  return context.firestore().collection('pauta_itens').doc(itemId);
}

before(async () => {
  const rules = await readFile(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

test('leitura pública de pauta_itens continua permitida', async () => {
  const admin = testEnv.authenticatedContext('verified-admin', {
    email: 'fabitoliuia7@gmail.com',
    email_verified: true,
  });
  await assertSucceeds(pautaRef(admin, 'public-read').set(pautaItem));

  const anonymous = testEnv.unauthenticatedContext();
  await assertSucceeds(pautaRef(anonymous, 'public-read').get());
});

test('anónimo e cliente não podem criar, atualizar ou apagar pauta_itens', async () => {
  const anonymous = testEnv.unauthenticatedContext();
  await assertFails(pautaRef(anonymous, 'anonymous-write').set(pautaItem));

  const client = testEnv.authenticatedContext('client-write', {
    email: 'client@example.com',
    email_verified: true,
  });
  await assertFails(pautaRef(client, 'client-write').set(pautaItem));
  await assertFails(pautaRef(client, 'public-read').delete());
});

test('admin allowlisted verificado pode fazer bootstrap sem documento users', async () => {
  const admin = testEnv.authenticatedContext('verified-bootstrap', {
    email: 'comercial@primewayinvest.com',
    email_verified: true,
  });
  await assertSucceeds(pautaRef(admin, 'verified-admin').set(pautaItem));
});

test('email allowlisted não verificado não é admin', async () => {
  const unverified = testEnv.authenticatedContext('unverified-allowlisted', {
    email: 'fabitoliuia7@gmail.com',
    email_verified: false,
  });
  await assertFails(pautaRef(unverified, 'unverified-email').set(pautaItem));
});

test('custom claim admin permite escrita mesmo sem users e sem email verificado', async () => {
  const admin = testEnv.authenticatedContext('claim-bootstrap', {
    email: 'claim@example.com',
    email_verified: false,
    admin: true,
  });
  await assertSucceeds(pautaRef(admin, 'custom-claim-admin').set(pautaItem));
});

test('schema, SH, código, taxas e comprimentos inválidos são rejeitados', async () => {
  const admin = testEnv.authenticatedContext('validation-admin', {
    email: 'fabitoliuia7@gmail.com',
    email_verified: true,
  });

  await assertFails(pautaRef(admin, 'bad-type').set({
    ...pautaItem,
    direitosPerc: '5',
  }));
  await assertFails(pautaRef(admin, 'bad-rate').set({
    ...pautaItem,
    ivaPerc: 101,
  }));
  await assertFails(pautaRef(admin, 'bad-sh').set({
    ...pautaItem,
    shPosicao: '842',
  }));
  await assertFails(pautaRef(admin, 'bad-length').set({
    ...pautaItem,
    descricao: 'x'.repeat(1001),
  }));
  await assertFails(pautaRef(admin, 'unknown-field').set({
    ...pautaItem,
    extra: true,
  }));
});

test('cliente comum não pode auto-promover role para admin', async () => {
  const client = testEnv.authenticatedContext('ordinary-client', {
    email: 'ordinary@example.com',
    email_verified: true,
  });
  const userRef = client.firestore().collection('users').doc('ordinary-client');
  await assertSucceeds(userRef.set({
    uid: 'ordinary-client',
    email: 'ordinary@example.com',
    role: 'client',
    createdAt: Timestamp.now(),
  }));
  await assertFails(userRef.update({ role: 'admin' }));
  await assertFails(pautaRef(client, 'ordinary-client-write').set(pautaItem));
});

test('admin pode apagar pauta_itens', async () => {
  const admin = testEnv.authenticatedContext('delete-admin', {
    email: 'fabitoliuia7@gmail.com',
    email_verified: true,
  });
  await assertSucceeds(pautaRef(admin, 'delete-only-admin').set(pautaItem));
  await assertSucceeds(pautaRef(admin, 'delete-only-admin').delete());
});
