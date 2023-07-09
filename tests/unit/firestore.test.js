/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["assertSucceeds", "assertFails", "assert"] }] */
const {
   initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const {
   doc, getDoc, addDoc, setDoc, collection, updateDoc, deleteDoc, setLogLevel, deleteField, arrayUnion, Timestamp,
} = require('firebase/firestore');

const crypto = require('crypto');

class TestFirebase {
   constructor(env) {
      this.env = env;
      this.authenticatedFirestores = Object.create(null);
      this.unauthenticatedFirestore = env.unauthenticatedContext().firestore();
   }
   firestore(user) {
      if (!user) return this.unauthenticatedFirestore;
      if (!(user.uid in this.authenticatedFirestores)) {
         this.authenticatedFirestores[user.uid] = this.env.authenticatedContext(user.uid).firestore();
      }
      return this.authenticatedFirestores[user.uid];
   }
   async withSecurityRulesDisabled(fn) {
      await this.env.withSecurityRulesDisabled((context) => fn(context.firestore()));
   }
   async cleanup() {
      await this.env.cleanup();
   }
   async clearFirestore() {
      await this.env.clearFirestore();
   }
}

const should = {
   allow: {
      title: 'できる',
      assert: assertSucceeds,
   },
   deny: {
      title: 'できない',
      assert: assertFails,
   },
};

let firebase;

beforeAll(async () => {
   firebase = new TestFirebase(await initializeTestEnvironment({
      projectId: 'test-unit-firestore',
   }));

   setLogLevel('error');
});

afterAll(async () => {
   await firebase.cleanup();
});


describe('usersコレクション', () => {
   const collectionId = 'users';
   const user = { uid: crypto.randomUUID().replace(/-/g, '') };
   const anotherUser = { uid: crypto.randomUUID().replace(/-/g, '') };

   beforeAll(async () => {
      await firebase.withSecurityRulesDisabled(async (db) => {
         await setDoc(doc(db, collectionId, user.uid), {
            email: 'user@example.com',
         });
         await setDoc(doc(db, collectionId, anotherUser.uid), {
            email: 'anotheruser@example.com',
         });
      });
   });

   describe.each([{
      title: 'ドキュメントを作成',
      operation: (db) => addDoc(collection(db, collectionId), { email: 'new@example.com' }),
   }, {
      title: 'ドキュメントを削除',
      operation: (db) => deleteDoc(doc(db, collectionId, user.uid)),
   }, {
      title: 'ドキュメントを取得',
      operation: (db) => getDoc(doc(db, collectionId, user.uid)),
   }, {
      title: 'emailフィールドを更新',
      operation: (db) => updateDoc(doc(db, collectionId, user.uid), { email: 'updated@example.com' }),
   }, {
      title: 'emailフィールドを削除',
      operation: (db) => updateDoc(doc(db, collectionId, user.uid), { email: deleteField() }),
   }, {
      title: 'カスタムフィールドを作成',
      operation: (db) => updateDoc(doc(db, collectionId, user.uid), { custom_ield: 'custom_data' }),
   }])('$title', ({ title, operation }) => {
      test.each([{
         title: '非認証ユーザー',
         auth: null,
      }, {
         title: '認証ユーザー',
         auth: user,
      }, {
         title: '他の認証ユーザー',
         auth: anotherUser,
      }])(`$titleは${title}できない`, async ({ auth }) => {
         await assertFails(operation(firebase.firestore(auth)));
      });
   });
});


describe('inspectorsコレクション', () => {
   const collectionId = 'inspectors';
   const simpleInspector = { uid: crypto.randomUUID().replace(/-/g, '') };
   const flat35Inspector = { uid: crypto.randomUUID().replace(/-/g, '') };
   const user = { uid: crypto.randomUUID().replace(/-/g, '') };

   beforeAll(async () => {
      await firebase.withSecurityRulesDisabled(async (db) => {
         await setDoc(doc(db, collectionId, simpleInspector.uid), {
            acceptables: ['inspection_simple'],
         });
         await setDoc(doc(db, collectionId, flat35Inspector.uid), {
            acceptables: ['flat35_used', 'inspection_simple'],
         });
      });
   });

   describe('ドキュメントを取得', () => {
      test.each([{
         title: '非認証ユーザー',
         auth: null,
         allowance: should.deny,
      }, {
         title: '認証ユーザー',
         auth: user,
         allowance: should.allow,
      }, {
         title: '既存住宅状況調査技術者',
         auth: simpleInspector,
         allowance: should.allow,
      }, {
         title: '中古住宅適合証明技術者',
         auth: flat35Inspector,
         allowance: should.allow,
      }])('$titleはドキュメントを取得$allowance.title', async ({ auth, allowance: { assert } }) => {
         await assert(getDoc(doc(firebase.firestore(auth), collectionId, simpleInspector.uid)));
      });
   });

   describe.each([{
      title: 'ドキュメントを作成',
      operation: (db) => addDoc(collection(db, collectionId), { acceptables: ['inspection_simple'] }),
   }, {
      title: 'ドキュメントを削除',
      operation: (db) => deleteDoc(doc(db, collectionId, simpleInspector.uid)),
   }, {
      title: 'acceptablesフィールドを更新',
      operation: (db) => updateDoc(doc(db, collectionId, simpleInspector.uid), { acceptables: arrayUnion('flat35_used') }),
   }, {
      title: 'acceptablesフィールドを削除',
      operation: (db) => updateDoc(doc(db, collectionId, simpleInspector.uid), { acceptables: deleteField() }),
   }, {
      title: 'カスタムフィールドを作成',
      operation: (db) => updateDoc(doc(db, collectionId, simpleInspector.uid), { custom_field: 'custom_data' }),
   }])('$title', ({ title, operation }) => {
      test.each([{
         title: '非認証ユーザー',
         auth: null,
      }, {
         title: '認証ユーザー',
         auth: user,
      }, {
         title: '既存住宅状況調査技術者',
         auth: simpleInspector,
      }, {
         title: '中古住宅適合証明技術者',
         auth: flat35Inspector,
      }])(`$titleは${title}できない`, async ({ auth }) => {
         await assertFails(operation(firebase.firestore(auth)));
      });
   });
});

describe('propertiesコレクション', () => {
   const collectionId = 'properties';
   const user = { uid: crypto.randomUUID().replace(/-/g, '') };
   const anotherUser = { uid: crypto.randomUUID().replace(/-/g, '') };
   const readableUser = { uid: crypto.randomUUID().replace(/-/g, '') };
   const updatableUser = { uid: crypto.randomUUID().replace(/-/g, '') };

   const fixture = (user) => ({
      name: '新規物件',
      permissions: {
         read: user ? [user.uid] : [],
         update: user ? [user.uid] : [],
      },
   });

   let id;

   beforeAll(async () => {
      await firebase.withSecurityRulesDisabled(async (db) => {
         ({ id } = await addDoc(collection(db, collectionId), {
            name: '既存物件',
            permissions: {
               read: [user.uid, readableUser.uid],
               update: [user.uid, updatableUser.uid],
            },
         }));
      });
   });

   describe('ドキュメントを取得', () => {
      test.each([{
         title: '非認証ユーザー',
         auth: null,
         allowance: should.deny,
      }, {
         title: '読み取り許可のあるユーザー',
         auth: readableUser,
         allowance: should.allow,
      }, {
         title: '読み取り・更新許可のあるユーザー',
         auth: user,
         allowance: should.allow,
      }, {
         title: '読み取り・更新許可のない認証ユーザー',
         auth: anotherUser,
         allowance: should.deny,
      }, {
         title: '更新許可のあるユーザー',
         auth: updatableUser,
         allowance: should.deny,
      }])('$titleはドキュメントを取得$allowance.title', async ({ auth, allowance: { assert } }) => {
         await assert(getDoc(doc(firebase.firestore(auth), collectionId, id)));
      });
   });

   describe('ドキュメントを作成', () => {
      test.each([{
         title: '非認証ユーザー',
         auth: null,
         allowance: should.deny,
      }, {
         title: '認証ユーザー',
         auth: user,
         allowance: should.allow,
      }])('$titleはドキュメントを作成$allowance.title', async ({ auth, allowance: { assert } }) => {
         await assert(addDoc(collection(firebase.firestore(auth), collectionId), fixture(auth)));
      });
   });

   describe('ドキュメントを更新', () => {
      test.each([{
         title: '非認証ユーザー',
         auth: null,
         allowance: should.deny,
      }, {
         title: '更新・読み取り許可のないユーザー',
         auth: anotherUser,
         allowance: should.deny,
      }, {
         title: '読み取り許可のあるユーザー',
         auth: readableUser,
         allowance: should.deny,
      }, {
         title: '更新許可のあるユーザー',
         auth: updatableUser,
         allowance: should.allow,
      }, {
         title: '更新・読み取り許可のあるユーザー',
         auth: user,
         allowance: should.allow,
      }])('$titleはドキュメントを更新$allowance.title', async ({ auth, allowance: { assert } }) => {
         await assert(updateDoc(doc(firebase.firestore(auth), collectionId, id), {
            name: `更新された物件-${crypto.randomUUID()}`,
            'permissions.read': arrayUnion(crypto.randomUUID().replace(/-/g, '')),
            'permissions.update': arrayUnion(crypto.randomUUID().replace(/-/g, '')),
         }));
      });
   });

   const types = {
      '文字列': () => 'abcdefgh',
      '空文字列': () => '',
      '数値': () => 1,
      '配列': () => ['rstuvwxyz'],
      '空の配列': () => [],
      '真偽値': () => true,
      '連想配列': () => ({}),
      '日時': () => new Timestamp(),
      'null': () => null,
   };
  
   describe.each([{
      field: 'name',
      undef: should.deny,
      type: '文字列',
   }, {
      field: 'permissions',
      undef: should.deny,
      type: '連想配列',
   }, {
      field: 'permissions.read',
      undef: should.deny,
      type: ['配列', '空の配列'],
   }, {
      field: 'permissions.update',
      undef: should.deny,
      type: ['配列', '空の配列'],
   }])('$fieldフィールド値の検証', ({ field, undef, type }) => {

      const users = [{
         title: '更新・読み取り許可のあるユーザー',
         auth: user,
         allowance: undef,
      }, {
         title: '更新許可のあるユーザー',
         auth: updatableUser,
         allowance: undef,
      }, {
         title: '読み取り許可のあるユーザー',
         auth: readableUser,
         allowance: should.deny,
      }, {
         title: '更新・読み取り許可のないユーザー',
         auth: anotherUser,
         allowance: should.deny,
      }, {
         title: '非認証ユーザー',
         auth: null,
         allowance: should.deny,
      }];
     
      const invalidFieldValueGenerators = Object.entries(types).filter(([t]) => Array.isArray(type) ? !type.includes(t) : t !== type);

      const [lastKey, ...otherKeys] = field.split('.').reverse();

      test(`${field}フィールドが存在しないドキュメントを作成${undef.title}`, async () => {
         const data = fixture(user);
         delete otherKeys.reverse().reduce((acc, key) => acc[key], data)[lastKey];
         const { assert } = undef;
         await assert(addDoc(collection(firebase.firestore(user), collectionId), data));
      });

      test.each(users)(`$titleは${field}フィールドを削除$allowance.title`, async ({ auth, allowance: { assert } }) => {
         await assert(updateDoc(doc(firebase.firestore(auth), collectionId, id), { [field]: deleteField() }));
      });

      test.each(invalidFieldValueGenerators)(`${field}フィールドが%sのドキュメントは作成できない`, async (_, gen) => {
         const data = fixture(user);
         otherKeys.reverse().reduce((acc, key) => acc[key], data)[lastKey] = gen();
         await assertFails(addDoc(collection(firebase.firestore(user), collectionId), data));
      });

      test.each(invalidFieldValueGenerators.flatMap(([testType, gen]) => users.map((user) => ({ user, testType, gen }))))(`$user.titleは${field}フィールドを$testTypeで更新できない`, async ({ user: { auth }, gen }) => {
         await assertFails(updateDoc(doc(firebase.firestore(auth), collectionId, id), { [field]: gen() }));
      });
   });

   describe('カスタムフィールドを作成', () => {
      const customFields = [
         'custom_field',
         'permissions.custom_field',
      ];

      test.each(customFields)('%sフィールドを含むドキュメントは作成できない', async (field) => {
         const [lastKey, ...keys] = field.split('.').reverse();
         const data = fixture(user);
         keys.reverse().reduce((acc, key) => acc[key], data)[lastKey] = 'custom_data';
         await assertFails(addDoc(collection(firebase.firestore(user), collectionId), data));
      });

      test.each([{
         title: '更新・読み取り許可のあるユーザー',
         auth: user,
      }, {
         title: '更新許可のあるユーザー',
         auth: updatableUser,
      }, {
         title: '読み取り許可のあるユーザー',
         auth: readableUser,
      }, {
         title: '更新・読み取り許可のないユーザー',
         auth: anotherUser,
      }, {
         title: '非認証ユーザー',
         auth: null,
      }].flatMap((user) => customFields.map((field) => ({ field, ...user }))))('$titleは$fieldフィールドを作成できない', async ({ auth, field }) => {
         await assertFails(updateDoc(doc(firebase.firestore(auth), collectionId, id), { [field]: 'custom_data' }));
      });
   });
});
