const {onDocumentDeleted} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getStorage} = require("firebase-admin/storage");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

initializeApp();

exports.cleanInspectionApplicationStorage = onDocumentDeleted(
    "inspectionApplications/{applicationId}",
    async (event) => {
      const {applicationId} = event.params;
      getStorage()
          .bucket()
          .file(`inspectionApplications/${applicationId}`)
          .delete();
    },
);
