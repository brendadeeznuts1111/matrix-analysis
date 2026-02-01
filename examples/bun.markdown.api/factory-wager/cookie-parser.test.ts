// cookie-parser.test.ts - Your Tests Automated
class CookieParser {
  static parse(header: string): Map<string, string> {
    const pairs = decodeURIComponent(header).split(";").map(p => p.trim().split("="));
    const map = new Map();
    for (const pair of pairs) {
      if (pair.length >= 2) {
        const key = pair[0].trim();
        const val = decodeURIComponent(pair.slice(1).join("=").trim().replace(/^"|"$/g, ""));
        map.set(key, val);
      }
    }
    return map;
  }
}

const tests = [
  { input: 'a=1;b%3D2', expected: [['a', '1'], ['b', '2']] },
  { input: 'a=;b=1;;', expected: [['a', ''], ['b', '1']] },
  { input: 'user="nolarose"', expected: [['user', 'nolarose']] },
  { input: 'path=%2Fhome;val=%22quoted%22', expected: [['path', '/home'], ['val', 'quoted']] }
];

tests.forEach(({ input, expected }) => {
  const actual = Array.from(CookieParser.parse(input));
  console.assert(JSON.stringify(actual) === JSON.stringify(expected), 
    `FAIL: ${input}\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(actual)}`);
});
console.log('✅ ALL TESTS PASS');
