export const DEFAULT_COMMERCIAL_RATE = 3.45; // Default Commercial LPR approx
export const DEFAULT_PROVIDENT_RATE = 2.85;  // Default Provident Rate approx

export const TERM_OPTIONS = [
  { label: '5年 (60期)', value: 5 },
  { label: '10年 (120期)', value: 10 },
  { label: '15年 (180期)', value: 15 },
  { label: '20年 (240期)', value: 20 },
  { label: '25年 (300期)', value: 25 },
  { label: '30年 (360期)', value: 30 },
];

export const DOWN_PAYMENT_OPTIONS = [
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '30%', value: 30 },
  { label: '40%', value: 40 },
  { label: '50%', value: 50 },
  { label: '60%', value: 60 },
  { label: '70%', value: 70 },
];

export const COMMERCIAL_RATE_OPTIONS = [
  { value: 3.05, label: '首套房利率' },
  { value: 3.45, label: '二套房利率(外环内)' },
  { value: 3.25, label: '二套房利率(外环外)' },
  { value: 3.50, label: '最新LPR报价利率' },
  { value: 3.30, label: '存量房贷利率' },
];

export const PROVIDENT_RATE_OPTIONS = [
  { value: 2.60, label: '首套公积金贷款利率' },
  { value: 3.075, label: '二套公积金贷款利率' },
];