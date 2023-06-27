export const specific = [{
  id: 'customerName',
  label: '申請者の氏名',
  type: 'text',
}, {
  id: 'customerAddress',
  label: '申請者の住所',
  type: 'text',
}, {
  id: 'customerPhone',
  label: '申請者の電話番号',
  type: 'tel',
  validator: (value) => /^[\+\(\)0-9\-]+$/.test(value),
}, {
  id: 'sellerOrBroker',
  label: '売主または仲介事業者の名称',
  type: 'text',
}, {
  id: 'invoiceTo',
  label: '手数料の請求先',
  type: 'radio',
  options: [{
    label: '申請者',
    value: 'customer',
  }, {
    label: '代理者',
    value: 'agent',
  }],
  acceptOther: true,
  validator: () => {},
}];

export const communication = [{
  id: 'contactTo',
  label: 'ご連絡先',
  type: 'contact',
  required: true,
}, {
  id: 'reportingAddress',
  label: '書類の郵送先',
  type: 'textarea',
}, {
  id: 'rmks',
  label: 'その他 (調査日時の希望、鍵の受渡し方法等)',
  type: 'textarea',
}];

export const requiredDocuments = [{
  id: 'landRegistration',
  label: '土地の登記事項証明書',
  targets: ['detouched'],
}, {
  id: 'buildingRegistration',
  label: '建物の登記事項証明書',
  targets: ['detouched', 'apartment'],
}, {
  id: 'structureConfirmation',
  label: '中古住宅構造確認書',
  targets: [],
}];

export const scopeOptions = [{
  label: '中古住宅適合証明のみ',
  value: ['flat35'],
}, {
  label: '既存住宅状況調査のみ',
  value: ['inspection'],
}, {
  label: '中古住宅適合証明および既存住宅状況調査',
  value: ['flat35', 'inspection'],
}];

export const buildingTypeOptions = [{
  label: '一戸建て等',
  value: 'detouched',
}, {
  label: 'マンション',
  value: 'apartment',
}];

export const defaults = {};