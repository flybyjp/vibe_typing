// ひらがなからローマ字への変換テーブル
// 各ひらがなに対して許容される入力パターンを定義

type RomajiPatterns = {
  [key: string]: string[];
};

// 基本的なひらがな→ローマ字変換
const basicPatterns: RomajiPatterns = {
  // あ行
  'あ': ['a'],
  'い': ['i', 'yi'],
  'う': ['u', 'wu', 'whu'],
  'え': ['e'],
  'お': ['o'],

  // か行
  'か': ['ka', 'ca'],
  'き': ['ki'],
  'く': ['ku', 'cu', 'qu'],
  'け': ['ke'],
  'こ': ['ko', 'co'],

  // さ行
  'さ': ['sa'],
  'し': ['si', 'shi', 'ci'],
  'す': ['su'],
  'せ': ['se', 'ce'],
  'そ': ['so'],

  // た行
  'た': ['ta'],
  'ち': ['ti', 'chi'],
  'つ': ['tu', 'tsu'],
  'て': ['te'],
  'と': ['to'],

  // な行
  'な': ['na'],
  'に': ['ni'],
  'ぬ': ['nu'],
  'ね': ['ne'],
  'の': ['no'],

  // は行
  'は': ['ha'],
  'ひ': ['hi'],
  'ふ': ['hu', 'fu'],
  'へ': ['he'],
  'ほ': ['ho'],

  // ま行
  'ま': ['ma'],
  'み': ['mi'],
  'む': ['mu'],
  'め': ['me'],
  'も': ['mo'],

  // や行
  'や': ['ya'],
  'ゆ': ['yu'],
  'よ': ['yo'],

  // ら行
  'ら': ['ra', 'la'],
  'り': ['ri', 'li'],
  'る': ['ru', 'lu'],
  'れ': ['re', 'le'],
  'ろ': ['ro', 'lo'],

  // わ行
  'わ': ['wa'],
  'を': ['wo'],
  'ん': ['nn', 'n\'', 'xn'],

  // 濁音
  'が': ['ga'],
  'ぎ': ['gi'],
  'ぐ': ['gu'],
  'げ': ['ge'],
  'ご': ['go'],

  'ざ': ['za'],
  'じ': ['zi', 'ji'],
  'ず': ['zu'],
  'ぜ': ['ze'],
  'ぞ': ['zo'],

  'だ': ['da'],
  'ぢ': ['di'],
  'づ': ['du', 'dzu'],
  'で': ['de'],
  'ど': ['do'],

  'ば': ['ba'],
  'び': ['bi'],
  'ぶ': ['bu'],
  'べ': ['be'],
  'ぼ': ['bo'],

  'ぱ': ['pa'],
  'ぴ': ['pi'],
  'ぷ': ['pu'],
  'ぺ': ['pe'],
  'ぽ': ['po'],

  // 小文字
  'ぁ': ['xa', 'la'],
  'ぃ': ['xi', 'li', 'xyi', 'lyi'],
  'ぅ': ['xu', 'lu'],
  'ぇ': ['xe', 'le', 'xye', 'lye'],
  'ぉ': ['xo', 'lo'],
  'ゃ': ['xya', 'lya'],
  'ゅ': ['xyu', 'lyu'],
  'ょ': ['xyo', 'lyo'],
  'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
  'ゎ': ['xwa', 'lwa'],

  // 拗音
  'きゃ': ['kya'],
  'きゅ': ['kyu'],
  'きょ': ['kyo'],
  'しゃ': ['sya', 'sha'],
  'しゅ': ['syu', 'shu'],
  'しょ': ['syo', 'sho'],
  'ちゃ': ['tya', 'cha', 'cya'],
  'ちゅ': ['tyu', 'chu', 'cyu'],
  'ちょ': ['tyo', 'cho', 'cyo'],
  'にゃ': ['nya'],
  'にゅ': ['nyu'],
  'にょ': ['nyo'],
  'ひゃ': ['hya'],
  'ひゅ': ['hyu'],
  'ひょ': ['hyo'],
  'みゃ': ['mya'],
  'みゅ': ['myu'],
  'みょ': ['myo'],
  'りゃ': ['rya', 'lya'],
  'りゅ': ['ryu', 'lyu'],
  'りょ': ['ryo', 'lyo'],
  'ぎゃ': ['gya'],
  'ぎゅ': ['gyu'],
  'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja', 'jya'],
  'じゅ': ['zyu', 'ju', 'jyu'],
  'じょ': ['zyo', 'jo', 'jyo'],
  'ぢゃ': ['dya'],
  'ぢゅ': ['dyu'],
  'ぢょ': ['dyo'],
  'びゃ': ['bya'],
  'びゅ': ['byu'],
  'びょ': ['byo'],
  'ぴゃ': ['pya'],
  'ぴゅ': ['pyu'],
  'ぴょ': ['pyo'],

  // 特殊な組み合わせ
  'ふぁ': ['fa', 'hwa'],
  'ふぃ': ['fi', 'fyi', 'hwi'],
  'ふぇ': ['fe', 'fye', 'hwe'],
  'ふぉ': ['fo', 'hwo'],
  'てぃ': ['thi'],
  'でぃ': ['dhi'],
  'でゅ': ['dhu'],
  'うぃ': ['wi', 'whi'],
  'うぇ': ['we', 'whe'],
  'ゔぁ': ['va'],
  'ゔぃ': ['vi', 'vyi'],
  'ゔ': ['vu'],
  'ゔぇ': ['ve', 'vye'],
  'ゔぉ': ['vo'],

  // 記号・長音
  'ー': ['-'],
  '、': [','],
  '。': ['.'],
  '　': [' '],
  ' ': [' '],
};

// 「ん」の特別処理：次の文字によって 'n' 単独でも可
const N_FOLLOWED_BY_VOWEL = ['a', 'i', 'u', 'e', 'o', 'y', 'n'];

// っ（促音）の後に来る子音
const DOUBLE_CONSONANTS: { [key: string]: string[] } = {
  'か': ['kk', 'cc'],
  'き': ['kk'],
  'く': ['kk', 'cc', 'qq'],
  'け': ['kk'],
  'こ': ['kk', 'cc'],
  'さ': ['ss'],
  'し': ['ss', 'ssh'],
  'す': ['ss'],
  'せ': ['ss', 'cc'],
  'そ': ['ss'],
  'た': ['tt'],
  'ち': ['tt', 'cch', 'tch'],
  'つ': ['tt', 'tts'],
  'て': ['tt'],
  'と': ['tt'],
  'は': ['hh'],
  'ひ': ['hh'],
  'ふ': ['hh', 'ff'],
  'へ': ['hh'],
  'ほ': ['hh'],
  'ま': ['mm'],
  'み': ['mm'],
  'む': ['mm'],
  'め': ['mm'],
  'も': ['mm'],
  'や': ['yy'],
  'ゆ': ['yy'],
  'よ': ['yy'],
  'ら': ['rr', 'll'],
  'り': ['rr', 'll'],
  'る': ['rr', 'll'],
  'れ': ['rr', 'll'],
  'ろ': ['rr', 'll'],
  'わ': ['ww'],
  'が': ['gg'],
  'ぎ': ['gg'],
  'ぐ': ['gg'],
  'げ': ['gg'],
  'ご': ['gg'],
  'ざ': ['zz'],
  'じ': ['zz', 'jj'],
  'ず': ['zz'],
  'ぜ': ['zz'],
  'ぞ': ['zz'],
  'だ': ['dd'],
  'ぢ': ['dd'],
  'づ': ['dd'],
  'で': ['dd'],
  'ど': ['dd'],
  'ば': ['bb'],
  'び': ['bb'],
  'ぶ': ['bb'],
  'べ': ['bb'],
  'ぼ': ['bb'],
  'ぱ': ['pp'],
  'ぴ': ['pp'],
  'ぷ': ['pp'],
  'ぺ': ['pp'],
  'ぽ': ['pp'],
};

export interface TypingResult {
  isCorrect: boolean;
  consumed: number; // 消費したひらがな文字数
  typedLength: number; // 入力されたローマ字の長さ
  possibleNextInputs: string[]; // 次に入力可能な文字列
}

export class RomajiConverter {
  private reading: string;
  private currentPosition: number;
  private currentInput: string; // 現在入力中のローマ字バッファ

  constructor(reading: string) {
    this.reading = reading;
    this.currentPosition = 0;
    this.currentInput = '';
  }

  reset(reading?: string) {
    if (reading !== undefined) {
      this.reading = reading;
    }
    this.currentPosition = 0;
    this.currentInput = '';
  }

  isComplete(): boolean {
    return this.currentPosition >= this.reading.length;
  }

  getProgress(): number {
    return this.currentPosition;
  }

  getCurrentInput(): string {
    return this.currentInput;
  }

  // 次に入力可能なパターンを取得
  getPossibleInputs(): string[] {
    if (this.isComplete()) return [];

    const remaining = this.reading.slice(this.currentPosition);
    const patterns = this.getPatternsForPosition(remaining);

    // 現在の入力バッファにマッチするパターンのみフィルタ
    if (this.currentInput.length > 0) {
      return patterns
        .filter(p => p.startsWith(this.currentInput))
        .map(p => p.slice(this.currentInput.length));
    }

    return patterns;
  }

  // 特定位置からのパターンを取得
  private getPatternsForPosition(remaining: string): string[] {
    const results: string[] = [];

    // っ（促音）の処理
    if (remaining[0] === 'っ' && remaining.length > 1) {
      const nextChar = remaining[1];
      // 次の文字と合わせた拗音チェック
      const nextTwo = remaining.slice(1, 3);

      // 拗音の場合（例：っしゃ）
      if (nextTwo.length === 2 && basicPatterns[nextTwo]) {
        for (const pattern of basicPatterns[nextTwo]) {
          results.push(pattern[0] + pattern); // 子音を重ねる
        }
      }

      // 通常の場合（例：っか）
      if (basicPatterns[nextChar]) {
        const doubleConsonants = DOUBLE_CONSONANTS[nextChar];
        if (doubleConsonants) {
          for (const dc of doubleConsonants) {
            for (const pattern of basicPatterns[nextChar]) {
              // 子音が一致する場合のみ追加
              if (pattern.startsWith(dc[0])) {
                results.push(dc[0] + pattern);
              }
            }
          }
        }
      }

      // っの単独入力パターン
      for (const pattern of basicPatterns['っ']) {
        results.push(pattern);
      }
    }
    // 「ん」の処理
    else if (remaining[0] === 'ん') {
      const nextChar = remaining[1];

      // 次の文字が母音やy、nで始まる場合は 'nn' 必須
      if (nextChar && basicPatterns[nextChar]) {
        const nextPatterns = basicPatterns[nextChar];
        const firstChars = nextPatterns.map(p => p[0]);

        if (firstChars.some(c => N_FOLLOWED_BY_VOWEL.includes(c))) {
          results.push('nn', 'n\'', 'xn');
        } else {
          results.push('n', 'nn', 'n\'', 'xn');
        }
      } else if (!nextChar) {
        // 文末の「ん」
        results.push('n', 'nn', 'n\'', 'xn');
      } else {
        results.push('n', 'nn', 'n\'', 'xn');
      }
    }
    // 拗音（2文字）の処理
    else if (remaining.length >= 2) {
      const twoChars = remaining.slice(0, 2);
      if (basicPatterns[twoChars]) {
        results.push(...basicPatterns[twoChars]);
      }
      // 1文字目の通常パターンも追加
      if (basicPatterns[remaining[0]]) {
        results.push(...basicPatterns[remaining[0]]);
      }
    }
    // 通常の1文字処理
    else if (basicPatterns[remaining[0]]) {
      results.push(...basicPatterns[remaining[0]]);
    }

    return [...new Set(results)]; // 重複を除去
  }

  // キー入力を処理
  processKey(key: string): TypingResult {
    if (this.isComplete()) {
      return {
        isCorrect: false,
        consumed: 0,
        typedLength: 0,
        possibleNextInputs: []
      };
    }

    const testInput = this.currentInput + key;
    const remaining = this.reading.slice(this.currentPosition);

    // 可能なパターンを取得
    const patterns = this.getPatternsForPosition(remaining);

    // 完全一致するパターンがあるかチェック
    for (const pattern of patterns) {
      if (pattern === testInput) {
        // 消費する文字数を計算
        const consumed = this.getConsumedChars(pattern, remaining);
        this.currentPosition += consumed;
        this.currentInput = '';

        return {
          isCorrect: true,
          consumed,
          typedLength: testInput.length,
          possibleNextInputs: this.getPossibleInputs()
        };
      }
    }

    // 部分一致するパターンがあるかチェック
    const partialMatches = patterns.filter(p => p.startsWith(testInput));
    if (partialMatches.length > 0) {
      this.currentInput = testInput;
      return {
        isCorrect: true,
        consumed: 0,
        typedLength: 1,
        possibleNextInputs: partialMatches.map(p => p.slice(testInput.length))
      };
    }

    // 間違った入力
    return {
      isCorrect: false,
      consumed: 0,
      typedLength: 0,
      possibleNextInputs: this.getPossibleInputs()
    };
  }

  // パターンで消費するひらがな文字数を計算
  private getConsumedChars(pattern: string, remaining: string): number {
    // っ + 次の文字の場合
    if (remaining[0] === 'っ' && remaining.length > 1) {
      // 拗音チェック
      const nextTwo = remaining.slice(1, 3);
      if (nextTwo.length === 2 && basicPatterns[nextTwo]) {
        for (const p of basicPatterns[nextTwo]) {
          if (pattern === p[0] + p) {
            return 3; // っ + 拗音2文字
          }
        }
      }

      // 通常の促音
      const nextChar = remaining[1];
      if (basicPatterns[nextChar]) {
        for (const p of basicPatterns[nextChar]) {
          if (pattern === p[0] + p) {
            return 2; // っ + 1文字
          }
        }
      }

      // っ単独
      if (basicPatterns['っ'].includes(pattern)) {
        return 1;
      }
    }

    // 拗音（2文字）チェック
    if (remaining.length >= 2) {
      const twoChars = remaining.slice(0, 2);
      if (basicPatterns[twoChars] && basicPatterns[twoChars].includes(pattern)) {
        return 2;
      }
    }

    // 通常の1文字
    return 1;
  }

  // デバッグ用：現在の状態を取得
  getState() {
    return {
      reading: this.reading,
      currentPosition: this.currentPosition,
      currentInput: this.currentInput,
      remaining: this.reading.slice(this.currentPosition),
      isComplete: this.isComplete()
    };
  }
}

// ひらがなを標準的なローマ字に変換（表示用）
export function hiraganaToRomaji(hiragana: string): string {
  let result = '';
  let i = 0;

  while (i < hiragana.length) {
    // 2文字の拗音をチェック
    if (i + 1 < hiragana.length) {
      const twoChars = hiragana.slice(i, i + 2);
      if (basicPatterns[twoChars]) {
        result += basicPatterns[twoChars][0];
        i += 2;
        continue;
      }
    }

    // 促音の処理
    if (hiragana[i] === 'っ' && i + 1 < hiragana.length) {
      const nextChar = hiragana[i + 1];
      if (basicPatterns[nextChar]) {
        const nextPattern = basicPatterns[nextChar][0];
        result += nextPattern[0]; // 子音を重ねる
        i++;
        continue;
      }
    }

    // 1文字の処理
    if (basicPatterns[hiragana[i]]) {
      result += basicPatterns[hiragana[i]][0];
    } else {
      result += hiragana[i];
    }
    i++;
  }

  return result;
}
