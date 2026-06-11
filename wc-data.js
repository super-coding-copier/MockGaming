// 2026 World Cup — real group-stage matchday 1 + 48 teams + demo accounts → window.WC
(function () {
  // 48 teams: code, 中文名, disc color c, text color fg
  const T = {
    MEX: { code: 'MEX', name: '墨西哥', c: '#006847', fg: '#fff' },
    RSA: { code: 'RSA', name: '南非',   c: '#007749', fg: '#FFD200' },
    KOR: { code: 'KOR', name: '韩国',   c: '#C8102E', fg: '#fff' },
    CZE: { code: 'CZE', name: '捷克',   c: '#11457E', fg: '#fff' },
    CAN: { code: 'CAN', name: '加拿大', c: '#D52B1E', fg: '#fff' },
    BIH: { code: 'BIH', name: '波黑',   c: '#002F6C', fg: '#FFD100' },
    QAT: { code: 'QAT', name: '卡塔尔', c: '#8A1538', fg: '#fff' },
    SUI: { code: 'SUI', name: '瑞士',   c: '#DA291C', fg: '#fff' },
    BRA: { code: 'BRA', name: '巴西',   c: '#F7D417', fg: '#0B6B3A' },
    MAR: { code: 'MAR', name: '摩洛哥', c: '#C1272D', fg: '#006233' },
    HAI: { code: 'HAI', name: '海地',   c: '#00209F', fg: '#D21034' },
    SCO: { code: 'SCO', name: '苏格兰', c: '#0065BF', fg: '#fff' },
    USA: { code: 'USA', name: '美国',   c: '#0A3161', fg: '#fff' },
    PAR: { code: 'PAR', name: '巴拉圭', c: '#DA121A', fg: '#fff' },
    AUS: { code: 'AUS', name: '澳大利亚', c: '#00843D', fg: '#FFCD00' },
    TUR: { code: 'TUR', name: '土耳其', c: '#E30A17', fg: '#fff' },
    GER: { code: 'GER', name: '德国',   c: '#1A1A1A', fg: '#F7D417' },
    CUW: { code: 'CUW', name: '库拉索', c: '#00247D', fg: '#FFD100' },
    CIV: { code: 'CIV', name: '科特迪瓦', c: '#FF8200', fg: '#fff' },
    ECU: { code: 'ECU', name: '厄瓜多尔', c: '#FFD100', fg: '#0072CE' },
    NED: { code: 'NED', name: '荷兰',   c: '#FF6B1A', fg: '#fff' },
    JPN: { code: 'JPN', name: '日本',   c: '#0A2868', fg: '#fff' },
    SWE: { code: 'SWE', name: '瑞典',   c: '#006AA7', fg: '#FFCD00' },
    TUN: { code: 'TUN', name: '突尼斯', c: '#E70013', fg: '#fff' },
    BEL: { code: 'BEL', name: '比利时', c: '#111', fg: '#FDDA24' },
    EGY: { code: 'EGY', name: '埃及',   c: '#CE1126', fg: '#fff' },
    IRN: { code: 'IRN', name: '伊朗',   c: '#239F40', fg: '#fff' },
    NZL: { code: 'NZL', name: '新西兰', c: '#1A1A1A', fg: '#fff' },
    ESP: { code: 'ESP', name: '西班牙', c: '#C60B1E', fg: '#FFD34D' },
    CPV: { code: 'CPV', name: '佛得角', c: '#003893', fg: '#fff' },
    KSA: { code: 'KSA', name: '沙特',   c: '#006C35', fg: '#fff' },
    URU: { code: 'URU', name: '乌拉圭', c: '#5CBFEB', fg: '#0A2868' },
    FRA: { code: 'FRA', name: '法国',   c: '#1E3A8A', fg: '#fff' },
    SEN: { code: 'SEN', name: '塞内加尔', c: '#00853F', fg: '#FDEF42' },
    IRQ: { code: 'IRQ', name: '伊拉克', c: '#007A3D', fg: '#fff' },
    NOR: { code: 'NOR', name: '挪威',   c: '#BA0C2F', fg: '#fff' },
    ARG: { code: 'ARG', name: '阿根廷', c: '#6CACE4', fg: '#0A2868' },
    ALG: { code: 'ALG', name: '阿尔及利亚', c: '#006233', fg: '#fff' },
    AUT: { code: 'AUT', name: '奥地利', c: '#ED2939', fg: '#fff' },
    JOR: { code: 'JOR', name: '约旦',   c: '#1A1A1A', fg: '#CE1126' },
    POR: { code: 'POR', name: '葡萄牙', c: '#046A38', fg: '#fff' },
    COD: { code: 'COD', name: '刚果(金)', c: '#007FFF', fg: '#F7D618' },
    UZB: { code: 'UZB', name: '乌兹别克', c: '#0099B5', fg: '#fff' },
    COL: { code: 'COL', name: '哥伦比亚', c: '#FCD116', fg: '#0033A0' },
    ENG: { code: 'ENG', name: '英格兰', c: '#EDEFF2', fg: '#CF142B' },
    CRO: { code: 'CRO', name: '克罗地亚', c: '#C8102E', fg: '#fff' },
    GHA: { code: 'GHA', name: '加纳',   c: '#006B3F', fg: '#FCD116' },
    PAN: { code: 'PAN', name: '巴拿马', c: '#DA121A', fg: '#005293' },
  };

  // Matchday 1 — all 12 groups, 24 matches. time = 北京时间 (ET+12). odds: 主胜/平/客胜
  const M = (id, grp, date, time, venue, h, a, oH, oD, oA, hot) =>
    ({ id, grp, date, time, venue, home: T[h], away: T[a], odds: { H: oH, D: oD, A: oA }, hot: !!hot });

  const MATCHES = [
    M('m01', 'A', '6月12日', '03:00', '墨西哥城', 'MEX', 'RSA', 1.72, 3.50, 4.60, true),
    M('m02', 'A', '6月12日', '10:00', '瓜达拉哈拉', 'KOR', 'CZE', 2.62, 3.20, 2.66),
    M('m03', 'B', '6月13日', '03:00', '多伦多', 'CAN', 'BIH', 2.26, 3.20, 3.15),
    M('m04', 'D', '6月13日', '09:00', '英格尔伍德', 'USA', 'PAR', 2.10, 3.25, 3.50, true),
    M('m05', 'B', '6月14日', '03:00', '圣克拉拉', 'QAT', 'SUI', 4.80, 3.70, 1.70),
    M('m06', 'C', '6月14日', '06:00', '东卢瑟福', 'BRA', 'MAR', 1.55, 3.90, 5.80, true),
    M('m07', 'C', '6月14日', '09:00', '福克斯堡', 'HAI', 'SCO', 5.20, 3.60, 1.62),
    M('m08', 'D', '6月14日', '12:00', '温哥华', 'AUS', 'TUR', 3.95, 3.40, 1.88),
    M('m09', 'E', '6月15日', '01:00', '休斯顿', 'GER', 'CUW', 1.16, 6.80, 14.0, true),
    M('m10', 'F', '6月15日', '04:00', '阿灵顿', 'NED', 'JPN', 1.70, 3.70, 4.70),
    M('m11', 'E', '6月15日', '07:00', '费城', 'CIV', 'ECU', 2.78, 3.10, 2.58),
    M('m12', 'F', '6月15日', '10:00', '瓜达卢佩', 'SWE', 'TUN', 2.30, 3.10, 3.20),
    M('m13', 'H', '6月16日', '01:00', '亚特兰大', 'ESP', 'CPV', 1.20, 6.20, 12.0, true),
    M('m14', 'G', '6月16日', '06:00', '西雅图', 'BEL', 'EGY', 1.58, 3.85, 5.60),
    M('m15', 'H', '6月16日', '06:00', '迈阿密', 'KSA', 'URU', 5.00, 3.55, 1.68),
    M('m16', 'G', '6月16日', '12:00', '英格尔伍德', 'IRN', 'NZL', 1.92, 3.25, 4.10),
    M('m17', 'I', '6月17日', '03:00', '东卢瑟福', 'FRA', 'SEN', 1.80, 3.55, 4.50, true),
    M('m18', 'I', '6月17日', '06:00', '福克斯堡', 'IRQ', 'NOR', 4.70, 3.55, 1.72),
    M('m19', 'J', '6月17日', '09:00', '堪萨斯城', 'ARG', 'ALG', 1.33, 4.90, 8.80, true),
    M('m20', 'J', '6月17日', '12:00', '圣克拉拉', 'AUT', 'JOR', 1.64, 3.60, 5.40),
    M('m21', 'K', '6月18日', '01:00', '休斯顿', 'POR', 'COD', 1.50, 4.10, 6.60, true),
    M('m22', 'L', '6月18日', '04:00', '阿灵顿', 'ENG', 'CRO', 2.00, 3.40, 3.85, true),
    M('m23', 'L', '6月18日', '07:00', '多伦多', 'GHA', 'PAN', 2.32, 3.10, 3.25),
    M('m24', 'K', '6月18日', '10:00', '墨西哥城', 'UZB', 'COL', 4.50, 3.45, 1.80),
  ];

  const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Demo accounts (login). pwd 全部 123456. pts = 初始积分, hit = 状态文案
  const SEED_USERS = [
    { u: 'laoqiang',  name: '老枪K',   pts: 15240, hit: '12连红', c: '#0EA5A0' },
    { u: 'qiuwang',   name: '球王32',  pts: 14180, hit: '本周 9 中 7', c: '#F59E0B' },
    { u: 'beikantai', name: '北看台',  pts: 13760, hit: '8连红', c: '#7C3AED' },
    { u: 'laozhang',  name: '老张说球', pts: 12030, hit: '本周 11 中 6', c: '#2563EB' },
    { u: 'juesha',    name: '绝杀时刻', pts: 11470, hit: '本周 7 中 3', c: '#DB2777' },
    { u: 'zhongchang', name: '中场休息', pts: 9890,  hit: '5连红', c: '#16A34A' },
    { u: 'demo',      name: '我',      pts: 8620,  hit: '6连红 · 状态火热', c: '#FF6A1A' },
    { u: 'yuewei',    name: '越位陷阱', pts: 7350,  hit: '本周 8 中 4', c: '#0891B2' },
    { u: 'renyiqiu',  name: '任意球',  pts: 6420,  hit: '3连红', c: '#65A30D' },
    { u: 'menxian',   name: '门线技术', pts: 5210,  hit: '本周 6 中 3', c: '#9333EA' },
    { u: 'bushi',     name: '补时狂人', pts: 4080,  hit: '本周 9 中 2', c: '#E11D48' },
    { u: 'tibu',      name: '替补奇兵', pts: 3640,  hit: '2连红', c: '#0D9488' },
  ];

  window.WC = {
    TEAMS: T, MATCHES, GROUPS, SEED_USERS,
    SOURCE: '赔率来源 · 中国体育彩票「竞彩足球 · 模拟试玩」胜平负',
    PWD: '123456',
  };
})();
