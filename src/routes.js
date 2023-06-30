import InspectionApplication from './views/InspectionApplications/InspectionApplication.vue';
import InspectionApplications from './views/InspectionApplications.vue';
import InspectionApplicationList from './views/InspectionApplications/InspectionApplicationList.vue';
import InspectionApplicationMenu from './views/InspectionApplications/InspectionApplicationMenu.vue';
import InspectionApplicationSubmitted from './views/InspectionApplications/InspectionApplicationSubmitted.vue';
import AuthUi from './views/AuthUi.vue';

export const ListInspectionApplications = 'ListInspectionApplications';
export const CreateInspectionApplication = 'CreateInspectionApplication';
export const EditInspectionApplication = 'EditInspectionApplication';
export const MenuInspectionApplications = 'MenuInspectionApplications';
export const SubmittedInspectionApplication = 'SubmittedInspectionApplication';

export const routes = [{
  path: '/',
  redirect: { name: MenuInspectionApplications },
  children: [{
    path: 'auth',
    component: AuthUi,
  }, {
    path: 'inspection-applications',
    component: InspectionApplications,
    children: [{
      path: '',
      component: InspectionApplicationMenu,
      name: MenuInspectionApplications,
    }, {
      path: 'list',
      component: InspectionApplicationList,
      name: ListInspectionApplications,
    }, {
      path: 'new',
      component: InspectionApplication,
      name: CreateInspectionApplication,
    }, {
      path: 'edit/:applicationId',
      component: InspectionApplication,
      props: true,
      name: EditInspectionApplication,
    }, {
      path: 'submitted/:applicationId',
      component: InspectionApplicationSubmitted,
      props: true,
      name: SubmittedInspectionApplication,
    }],
  }],
}];
