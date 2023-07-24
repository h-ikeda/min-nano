/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["assertSucceeds", "assertFails", "assert"] }] */
const {
   initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const {
   doc, getDoc, addDoc, setDoc, collection, updateDoc, deleteDoc, setLogLevel, deleteField, arrayUnion, Timestamp, query, getDocs, where,
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

const types = {
   '文字列': () => 'abcdefgh',
   '空文字列': () => '',
   '空白のみの文字列': () => ' 　   ',
   '数値': () => 1,
   '配列': () => ['rstuvwxyz'],
   '空の配列': () => [],
   '真偽値': () => true,
   '連想配列': () => ({}),
   '日時': () => new Timestamp(),
   'null': () => null,
};

let firebase;

beforeAll(async () => {
   firebase = new TestFirebase(await initializeTestEnvironment({}));
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
   }, {
      title: 'ドキュメントを検索',
      operation: (db) => getDocs(collection(db, collectionId)),
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
      }])('$titleはドキュメントを取得できない', async ({ auth, allowance: { assert } }) => {
         await assert(getDoc(doc(firebase.firestore(auth), collectionId, simpleInspector.uid)));
      });
   });

   describe('ドキュメントを検索', () => {
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
      }])('$titleはドキュメントを検索$allowance.title', async ({ auth, allowance: { assert } }) => {
         await assert(getDocs(collection(firebase.firestore(auth), collectionId)));
         await assert(getDocs(query(collection(firebase.firestore(auth), collectionId), where('acceptables', 'array-contains-any', ['flat35_used', 'inspection_simple']))));
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

   describe('ドキュメントを検索', () => {
      test('非認証ユーザーはドキュメントを条件指定なしで検索できない', async () => {
         await assertFails(getDocs(collection(firebase.firestore(null), collectionId)));
      });
      test('非認証ユーザーはドキュメントをnullが読み取り許可リストに含まれる条件で検索できない', async () => {
         await assertFails(getDocs(query(collection(firebase.firestore(null), collectionId), where('permissions.read', 'array-contains', null))));
      });
      test('非認証ユーザーはドキュメントを空文字列が読み取り許可リストに含まれる条件で検索できない', async () => {
         await assertFails(getDocs(query(collection(firebase.firestore(null), collectionId), where('permissions.read', 'array-contains', ''))));
      });

      test.each([{
         title: '読み取り許可のあるユーザー',
         auth: readableUser,
      }, {
         title: '読み取り・更新許可のあるユーザー',
         auth: user,
      }, {
         title: '読み取り・更新許可のない認証ユーザー',
         auth: anotherUser,
      }, {
         title: '更新許可のあるユーザー',
         auth: updatableUser,
      }].flatMap((base) => [{
         ...base,
         conditionTitle: '条件指定なし',
         allowance: should.deny,
      }, {
         ...base,
         conditionTitle: 'ユーザー識別子が読み取り許可リストに含まれる条件',
         condition: where('permissions.read', 'array-contains', base.auth.uid),
         allowance: should.allow,
      }, {
         ...base,
         conditionTitle: '他のユーザー識別子が読み取り許可リストに含まれる条件',
         condition: where('permissions.read', 'array-contains', crypto.randomUUID().replace(/-/g, '')),
         allowance: should.deny,
      }, {
         ...base,
         conditionTitle: 'nullが読み取り許可リストに含まれる条件',
         condition: where('permissions.read', 'array-contains', null),
         allowance: should.deny,
      }, {
         ...base,
         conditionTitle: '空文字列が読み取り許可リストに含まれる条件',
         condition: where('permissions.read', 'array-contains', ''),
         allowance: should.deny,
      }]))('$titleはドキュメントを$conditionTitleで検索$allowance.title', async ({ auth, allowance: { assert }, condition }) => {
         await assert(getDocs(query(collection(firebase.firestore(auth), collectionId), condition)));
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

   describe('documentsサブコレクション', () => {
      const subCollectionId = 'documents';
      const subReadableUser = { uid: crypto.randomUUID().replace(/-/g, '') };
      const subUpdatableUser = { uid: crypto.randomUUID().replace(/-/g, '') };
      
      const subFixture = (auth) => ({
         name: '新しい資料.pdf',
         tags: ['customer_address'],
         permissions: {
            read: auth ? [auth.uid] : [],
            update: auth ? [auth.uid] : [],
         },
      });
   
      let subId;
   
      beforeAll(async () => {
         await firebase.withSecurityRulesDisabled(async (db) => {
            ({ id: subId } = (await addDoc(collection(db, collectionId, id, subCollectionId), {
               name: '既存資料.pdf',
               tags: ['land_registration'],
               permissions: {
                  read: [user.uid, subReadableUser.uid],
                  update: [user.uid, subUpdatableUser.uid],
               },
            })));
         });
      });

      describe('ドキュメントの取得', () => {
         test.each([{
            title: '非認証ユーザー',
            auth: null,
            allowance: should.deny,
         }, {
            title: '読み取り権限のあるユーザー',
            auth: subReadableUser,
            allowance: should.allow,
         }, {
            title: '読み取り・更新権限のあるユーザー',
            auth: user,
            allowance: should.allow,
         }, {
            title: '更新権限のあるユーザー',
            auth: subUpdatableUser,
            allowance: should.deny,
         }, {
            title: '読み取り・更新権限のない認証ユーザー',
            auth: anotherUser,
            allowance: should.deny,
         }])('$titleはドキュメントを取得$allowance.title', async ({ auth, allowance: { assert } }) => {
            await assert(getDoc(doc(firebase.firestore(auth), collectionId, id, subCollectionId, subId)));
         });
      });

      describe('ドキュメントの検索', () => {
         test('非認証ユーザーはドキュメントを条件指定なしで検索できない', async () => {
            await assertFails(getDocs(collection(firebase.firestore(null), collectionId, id, subCollectionId)));
         });
         test('非認証ユーザーはドキュメントをnullが読み取り許可リストに含まれる条件で検索できない', async () => {
            await assertFails(getDocs(query(collection(firebase.firestore(null), collectionId, id, subCollectionId), where('permissions.read', 'array-contains', null))));
         });
         test('非認証ユーザーはドキュメントを空文字列が読み取り許可リストに含まれる条件で検索できない', async () => {
            await assertFails(getDocs(query(collection(firebase.firestore(null), collectionId, id, subCollectionId), where('permissions.read', 'array-contains', ''))));
         });

         test.each([{
            title: '読み取り許可のあるユーザー',
            auth: subReadableUser,
         }, {
            title: '読み取り・更新許可のあるユーザー',
            auth: user,
         }, {
            title: '読み取り・更新許可のない認証ユーザー',
            auth: anotherUser,
         }, {
            title: '更新許可のあるユーザー',
            auth: subUpdatableUser,
         }].flatMap((base) => [{
            ...base,
            conditionTitle: '条件指定なし',
            allowance: should.deny,
         }, {
            ...base,
            conditionTitle: 'ユーザー識別子が読み取り許可リストに含まれる条件',
            condition: where('permissions.read', 'array-contains', base.auth.uid),
            allowance: should.allow,
         }, {
            ...base,
            conditionTitle: '他のユーザー識別子が読み取り許可リストに含まれる条件',
            condition: where('permissions.read', 'array-contains', crypto.randomUUID().replace(/-/g, '')),
            allowance: should.deny,
         }, {
            ...base,
            conditionTitle: 'nullが読み取り許可リストに含まれる条件',
            condition: where('permissions.read', 'array-contains', null),
            allowance: should.deny,
         }, {
            ...base,
            conditionTitle: '空文字列が読み取り許可リストに含まれる条件',
            condition: where('permissions.read', 'array-contains', ''),
            allowance: should.deny,
         }]))('$titleはドキュメントを$conditionTitleで検索$allowance.title', async ({ auth, allowance: { assert }, condition }) => {
            await assert(getDocs(query(collection(firebase.firestore(auth), collectionId, id, subCollectionId), condition)));
         });
      });

      describe('ドキュメントを作成', () => {
         test.each([{
            title: '非認証ユーザー',
            auth: null,
            allowance: should.deny,
         }, {
            title: '親ドキュメントの読み取り権限のあるユーザー',
            auth: readableUser,
            allowance: should.deny,
         }, {
            title: '親ドキュメントの読み取り・更新権限のあるユーザー',
            auth: user,
            allowance: should.allow,
         }, {
            title: '親ドキュメントの更新権限のあるユーザー',
            auth: updatableUser,
            allowance: should.allow,
         }, {
            title: '親ドキュメントの読み取り・更新権限のない認証ユーザー',
            auth: anotherUser,
            allowance: should.deny,
         }])('$titleはドキュメントを作成$allowance.title', async ({ auth, allowance: { assert }}) => {
            await assert(addDoc(collection(firebase.firestore(auth), collectionId, id, subCollectionId), subFixture(auth)));
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
            auth: subReadableUser,
            allowance: should.deny,
         }, {
            title: '更新許可のあるユーザー',
            auth: subUpdatableUser,
            allowance: should.allow,
         }, {
            title: '更新・読み取り許可のあるユーザー',
            auth: user,
            allowance: should.allow,
         }])('$titleはドキュメントを更新$allowance.title', async ({ auth, allowance: { assert } }) => {
            await assert(updateDoc(doc(firebase.firestore(auth), collectionId, id, subCollectionId, subId), {
               tags: arrayUnion('customer_name'),
               'permissions.read': arrayUnion(crypto.randomUUID().replace(/-/g, '')),
               'permissions.update': arrayUnion(crypto.randomUUID().replace(/-/g, '')),
            }));
         });
      });

      describe.each([{
         field: 'name',
         undef: should.deny,
         fixed: true,
         fieldFixture: () => '新しい資料.jpeg',
         type: '文字列',
      }, {
         field: 'permissions',
         undef: should.deny,
         fieldFixture: () => ({
            read: [user.uid, subReadableUser.uid, crypto.randomUUID().replace(/-/g, '')],
            update: [user.uid, subUpdatableUser.uid, crypto.randomUUID().replace(/-/g, '')],
         }),
         type: '連想配列',
      }, {
         field: 'permissions.read',
         undef: should.deny,
         fieldFixture: () => arrayUnion(crypto.randomUUID().replace(/-/g, '')),
         type: ['配列', '空の配列'],
      }, {
         field: 'permissions.update',
         undef: should.deny,
         fieldFixture: () => arrayUnion(crypto.randomUUID().replace(/-/g, '')),
         type: ['配列', '空の配列'],
      }, {
         field: 'tags',
         undef: should.deny,
         fieldFixture: () => arrayUnion('customer_tel'),
         type: ['配列', '空の配列'],
      }])('$fieldフィールド値の検証', ({ field, undef, type, fixed, fieldFixture }) => {

         const users = [{
            title: '更新・読み取り許可のあるユーザー',
            auth: user,
            allowance: should[fixed ? 'deny' : 'allow'],
         }, {
            title: '更新許可のあるユーザー',
            auth: subUpdatableUser,
            allowance: should[fixed ? 'deny' : 'allow'],
         }, {
            title: '読み取り許可のあるユーザー',
            auth: subReadableUser,
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
            const data = subFixture(user);
            delete otherKeys.reverse().reduce((acc, key) => acc[key], data)[lastKey];
            const { assert } = undef;
            await assert(addDoc(collection(firebase.firestore(user), collectionId, id, subCollectionId), data));
         });

         test.each(users)(`$titleは${field}フィールドを削除${undef.title}`, async ({ auth }) => {
            const { assert } = undef;
            await assert(updateDoc(doc(firebase.firestore(auth), collectionId, id, subCollectionId, subId), { [field]: deleteField() }));
         });

         test.each(invalidFieldValueGenerators)(`${field}フィールドが%sのドキュメントは作成できない`, async (_, gen) => {
            const data = subFixture(user);
            otherKeys.reverse().reduce((acc, key) => acc[key], data)[lastKey] = gen();
            await assertFails(addDoc(collection(firebase.firestore(user), collectionId, id, subCollectionId), data));
         });

         test.each(invalidFieldValueGenerators.flatMap(([testType, gen]) => users.map((user) => ({ user, testType, gen }))))(`$user.titleは${field}フィールドを$testTypeで更新できない`, async ({ user: { auth }, gen }) => {
            await assertFails(updateDoc(doc(firebase.firestore(auth), collectionId, id, subCollectionId, subId), { [field]: gen() }));
         });

         test.each(users)(`$titleは${field}フィールドを更新${fixed ? 'できない' : 'できる'}`, async ({ auth, allowance: { assert } }) => {
            await assert(updateDoc(doc(firebase.firestore(auth), collectionId, id, subCollectionId, subId), { [field]: fieldFixture() }));
         });
      });

      describe('カスタムフィールドを作成', () => {
         const customFields = [
            'custom_field',
            'permissions.custom_field',
         ];

         test.each(customFields)('%sフィールドを含むドキュメントは作成できない', async (field) => {
            const [lastKey, ...keys] = field.split('.').reverse();
            const data = subFixture(user);
            keys.reverse().reduce((acc, key) => acc[key], data)[lastKey] = 'custom_data';
            await assertFails(addDoc(collection(firebase.firestore(user), collectionId, id, subCollectionId), data));
         });

         test.each([{
            title: '更新・読み取り許可のあるユーザー',
            auth: user,
         }, {
            title: '更新許可のあるユーザー',
            auth: subUpdatableUser,
         }, {
            title: '読み取り許可のあるユーザー',
            auth: subReadableUser,
         }, {
            title: '更新・読み取り許可のないユーザー',
            auth: anotherUser,
         }, {
            title: '非認証ユーザー',
            auth: null,
         }].flatMap((user) => customFields.map((field) => ({ field, ...user }))))('$titleは$fieldフィールドを作成できない', async ({ auth, field }) => {
            await assertFails(updateDoc(doc(firebase.firestore(auth), collectionId, id, subCollectionId, subId), { [field]: 'custom_data' }));
         });
      });
   });
});
