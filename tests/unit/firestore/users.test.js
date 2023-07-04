const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, addDoc, collection, updateDoc, deleteDoc } = require('firebase/firestore');

let testEnv;
let unauthenticatedDb;
let userDb;
let adminDb;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-unit-firestore-users',
  });
  unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
  userDb = testEnv.authenticatedContext('user2345').firestore();
  adminDb = testEnv.authenticatedContext('admin7890', { admin: true }).firestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('usersコレクション', () => {
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('に対して非認証クライアント', () => {

    let id;
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        ({ id } = await addDoc(collection(context.firestore(), 'users'), { email: 'test@example.com' }));
      });
    });

    test('は読み込み不可', async () => {
      await assertFails(getDoc(doc(unauthenticatedDb, 'users', id)));
    });
    test('は作成不可', async () => {
      await assertFails(addDoc(collection(unauthenticatedDb, 'users'), { email: 'created@example.com' }));
    });
    test('は更新不可', async () => {
      await assertFails(updateDoc(doc(unauthenticatedDb, 'users', id), { email: 'updated@example.com' }));
    });
    test('は削除不可', async () => {
      await assertFails(deleteDoc(doc(unauthenticatedDb, 'users', id)));
    });
  });
});
