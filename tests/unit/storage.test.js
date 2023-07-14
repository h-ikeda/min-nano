/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["assertSucceeds", "assertFails", "assert"] }] */
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { addDoc, collection, doc } = require("firebase/firestore");
const { ref, uploadBytes } = require('firebase/storage');
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
      const fixture = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);

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
         target: '誤ったファイル名のパス',
         path: 'property_documents/$(propertyId)/$(documentId)/異なるファイル名.pdf',
         result: 'できない',
      })]))('$titleはfirestore$targetにオブジェクトをアップロード$result', async ({ auth, result, path }) => {
         const targetPath = path.replace('$(propertyId)', propertyId).replace('$(documentId)', documentId).replace('$(absentDocumentId', absentDocumentId);
         const assert = assertions[result];
         await assert(uploadBytes(ref(contexts.storage(auth), targetPath), fixture));
      });
   });
});
