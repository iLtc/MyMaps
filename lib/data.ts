import type { MapKey } from './i18n'

/* Visit records. Values are a year ('2015') or a sentinel ('Childhood' |
   'Home') translated by the UI. Single source of truth — counts derive
   from these objects. */
export const DATA = {
  world: {
    China: '1994',
    'United States': '2015',
    France: '2013',
    Italy: '2013',
    Switzerland: '2013',
    Canada: '2024'
  },
  china: {
    Anhui: 'Home',
    Heilongjiang: '2019',
    Jilin: '2019',
    Zhejiang: '2015',
    Beijing: '2015',
    Shanghai: '2015',
    Guangdong: '2012',
    'Hong Kong': '2012',
    Macau: '2012',
    Liaoning: '2012',
    Sichuan: '2010',
    Jiangsu: '2010',
    Shanxi: 'Childhood',
    Yunnan: 'Childhood',
    Jiangxi: 'Childhood',
    Hunan: 'Childhood',
    Hubei: 'Childhood',
    Chongqing: 'Childhood'
  },
  us: {
    Iowa: '2015',
    California: '2015',
    Illinois: '2016',
    Connecticut: '2017',
    Delaware: '2017',
    Massachusetts: '2017',
    'New Jersey': '2017',
    'New York': '2017',
    Pennsylvania: '2017',
    'Rhode Island': '2017',
    Nevada: '2017',
    Arizona: '2023',
    Oregon: '2023',
    Washington: '2023',
    Alaska: '2025',
    Hawaii: '2026',
    Utah: '2026',
    Montana: '2026',
    Wyoming: '2026'
  }
} as const satisfies Record<MapKey, Record<string, string>>

/* Chinese place-name labels. The mapped type locks each map's keys to
   DATA's keys, so a typo or a missing label fails tsc. For the china map
   these double as the atlas lookup keys (the atlas names features in
   Chinese). */
export const ZH_LABELS: { [K in MapKey]: Record<keyof (typeof DATA)[K], string> } = {
  world: {
    China: '中国',
    'United States': '美国',
    France: '法国',
    Italy: '意大利',
    Switzerland: '瑞士',
    Canada: '加拿大'
  },
  china: {
    Anhui: '安徽',
    Heilongjiang: '黑龙江',
    Jilin: '吉林',
    Zhejiang: '浙江',
    Beijing: '北京',
    Shanghai: '上海',
    Guangdong: '广东',
    'Hong Kong': '香港',
    Macau: '澳门',
    Liaoning: '辽宁',
    Sichuan: '四川',
    Jiangsu: '江苏',
    Shanxi: '山西',
    Yunnan: '云南',
    Jiangxi: '江西',
    Hunan: '湖南',
    Hubei: '湖北',
    Chongqing: '重庆'
  },
  us: {
    Iowa: '艾奥瓦',
    California: '加利福尼亚',
    Illinois: '伊利诺伊',
    Connecticut: '康涅狄格',
    Delaware: '特拉华',
    Massachusetts: '马萨诸塞',
    'New Jersey': '新泽西',
    'New York': '纽约',
    Pennsylvania: '宾夕法尼亚',
    'Rhode Island': '罗得岛',
    Nevada: '内华达',
    Arizona: '亚利桑那',
    Oregon: '俄勒冈',
    Washington: '华盛顿',
    Alaska: '阿拉斯加',
    Hawaii: '夏威夷',
    Utah: '犹他',
    Montana: '蒙大拿',
    Wyoming: '怀俄明'
  }
}

export function countFor(key: MapKey): number {
  return Object.keys(DATA[key]).length
}
