/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["assertSucceeds", "assertFails", "assert"] }] */
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { addDoc, collection, doc } = require("firebase/firestore");
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const crypto = require('crypto');

let testEnv;
const contexts = {
   _: Object.create(null),
   authenticated(auth) {
      if (!(auth.uid in this._)) {
         const context = testEnv.authenticatedContext(auth.uid);
         this._[auth.uid] = {
            firestore: context.firestore(),
            storage: context.storage(),
         };
      }
      return this._[auth.uid];
   },
   firestore(auth) {
      if (!auth) return this.unauthenticated.firestore;
      return this.authenticated(auth).firestore;
   },
   storage(auth) {
      if (!auth) return this.unauthenticated.storage;
      return this.authenticated(auth).storage;
   },
};

beforeAll(async () => {
   testEnv = await initializeTestEnvironment({});
   const context = testEnv.unauthenticatedContext();
   contexts.unauthenticated = {
      firestore: context.firestore(),
      storage: context.storage(),
   };
});

afterAll(async () => {
   await testEnv.cleanup();
});

const assertions = {
   'できる': assertSucceeds,
   'できない': assertFails,
};

describe('property_documents', () => {
   const user = { uid: crypto.randomUUID().replace(/-/g, '') };
   const readableUser = { uid: crypto.randomUUID().replace(/-/g, '') };
   const updatableUser = { uid: crypto.randomUUID().replace(/-/g, '') };
   const anotherUser = { uid: crypto.randomUUID().replace(/-/g, '') };

   const fixture = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);

   let propertyId, documentId, absentDocumentId;

   beforeAll(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
         const property = await addDoc(collection(context.firestore(), 'properties'), {
            name: '物件情報',
            permissions: {
               read: [user.uid, anotherUser.uid],
               update: [user.uid, anotherUser.uid],
            },
         });
         const document = await addDoc(collection(property, 'documents'), {
            name: 'ファイル名.pdf',
            tags: ['building_registration'],
            permissions: {
               read: [user.uid, readableUser.uid],
               update: [user.uid, updatableUser.uid],
            },
         });
         propertyId = property.id;
         documentId = document.id;
         absentDocumentId = doc(collection(property, 'documents')).id;
      });
   });

   describe('オブジェクトをアップロード', () => {

      beforeEach(async () => {
         await testEnv.clearStorage();
      });

      test.each([{
         title: '非認証ユーザー',
         auth: null,
         result: 'できない',
      }, {
         title: '読み込み・更新権限のあるユーザー',
         auth: user,
         result: 'できる',
      }, {
         title: '更新権限のあるユーザー',
         auth: updatableUser,
         result: 'できる',
      }, {
         title: '読み込み権限のあるユーザー',
         auth: readableUser,
         result: 'できない',
      }, {
         title: '他の認証ユーザー',
         auth: anotherUser,
         result: 'できない',
      }].flatMap((base) => [Object.assign(base, {
         target: 'ドキュメント作成済みのパス',
         path: 'property_documents/$(propertyId)/$(documentId)/ファイル名.pdf',
      }), Object.assign(base, {
         target: 'ドキュメント未作成のパス',
         path: 'property_documents/$(propertyId)/$(absentDocumentId)/ファイル名.pdf',
         result: 'できない',
      }), Object.assign(base, {
         target: 'に書き込まれたファイル名と異なるファイル名のパス',
         path: 'property_documents/$(propertyId)/$(documentId)/異なるファイル名.pdf',
         result: 'できない',
      })]))('$titleはfirestore$targetにオブジェクトをアップロード$result', async ({ auth, result, path }) => {
         const targetPath = path.replace('$(propertyId)', propertyId).replace('$(documentId)', documentId).replace('$(absentDocumentId', absentDocumentId);
         const assert = assertions[result];
         await assert(uploadBytes(ref(contexts.storage(auth), targetPath), fixture));
      });
   });

   describe('オブジェクトを更新', () => {
      beforeAll(async () => {
         await testEnv.withSecurityRulesDisabled(async (context) => {
            await uploadBytes(ref(context.storage(), `property_documents/${propertyId}/${documentId}/更新ファイル名.pdf`), fixture);
         });
      });

      test.each([{
         title: '非認証ユーザー',
         auth: null,
      }, {
         title: '読み込み・更新権限のあるユーザー',
         auth: user,
      }, {
         title: '更新権限のあるユーザー',
         auth: updatableUser,
      }, {
         title: '読み込み権限のあるユーザー',
         auth: readableUser,
      }, {
         title: '他の認証ユーザー',
         auth: anotherUser,
      }])('$titleはオブジェクトを上書きできない', async ({ auth }) => {
         await assertFails(uploadBytes(ref(contexts.storage(auth), `property_documents/${propertyId}/${documentId}/更新ファイル名.pdf`), fixture));
      });
   });

   describe('オブジェクトを取得', () => {
      beforeAll(async () => {
         await testEnv.withSecurityRulesDisabled(async (context) => {
            await uploadBytes(ref(context.storage(), `property_documents/${propertyId}/${documentId}/取得ファイル名.pdf`), fixture);
         });
      });

      test.each([{
         title: '非認証ユーザー',
         auth: null,
         result: 'できない',
      }, {
         title: '読み込み・更新権限のあるユーザー',
         auth: user,
         result: 'できる',
      }, {
         title: '更新権限のあるユーザー',
         auth: updatableUser,
         result: 'できない',
      }, {
         title: '読み込み権限のあるユーザー',
         auth: readableUser,
         result: 'できる',
      }, {
         title: '他の認証ユーザー',
         auth: anotherUser,
         result: 'できない',
      }])('$titleはオブジェクトを取得$result', async ({ auth, result }) => {
         const assert = assertions[result];
         await assert(getDownloadURL(ref(contexts.storage(auth), `property_documents/${propertyId}/${documentId}/取得ファイル名.pdf`)));
      });
   });
});
