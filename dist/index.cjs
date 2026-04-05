'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/components/SlotMachine.tsx
function Reel({
  symbols,
  spinning,
  stopPosition = 0,
  renderSymbol,
  rowCount = 3,
  symbolHeight = 60,
  spinDuration = 0.6,
  direction = "down",
  className,
  style
}) {
  const viewHeight = rowCount * symbolHeight;
  const stripLen = symbols.length;
  const oneLoopPx = stripLen * symbolHeight;
  const items = react.useMemo(() => {
    if (stripLen === 0) return [];
    return [...symbols, ...symbols];
  }, [symbols, stripLen]);
  const cls = [
    "reeljs-reel",
    spinning ? "reeljs-reel--spinning" : "",
    className ?? ""
  ].filter(Boolean).join(" ");
  const animId = `rj-scroll-${stripLen}`;
  const stopOffset = -(stopPosition * symbolHeight);
  const trackStyle = spinning ? {
    animation: `${animId} ${spinDuration}s linear infinite`,
    willChange: "transform"
  } : {
    transform: `translateY(${stopOffset}px)`,
    transition: "none"
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cls,
      style: { height: viewHeight, overflow: "hidden", position: "relative", ...style },
      "data-spinning": spinning,
      children: [
        spinning && /* @__PURE__ */ jsxRuntime.jsx("style", { children: `
@keyframes ${animId} {
  from { transform: translateY(${direction === "down" ? -oneLoopPx : 0}px); }
  to   { transform: translateY(${direction === "down" ? 0 : -oneLoopPx}px); }
}
        ` }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: "reeljs-reel__track",
            style: {
              display: "flex",
              flexDirection: "column",
              ...trackStyle
            },
            children: items.map((sym, i) => /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                style: {
                  height: symbolHeight,
                  lineHeight: `${symbolHeight}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "#e0e0e0",
                  boxSizing: "border-box",
                  flexShrink: 0
                },
                children: renderSymbol ? renderSymbol(sym) : /* @__PURE__ */ jsxRuntime.jsx("span", { children: sym })
              },
              i
            ))
          }
        )
      ]
    }
  );
}
function StopButton({
  reelIndex,
  disabled = false,
  onStop,
  className,
  style,
  "aria-label": ariaLabel
}) {
  const handleClick = react.useCallback(() => {
    if (!disabled) {
      const timing = Date.now();
      onStop(reelIndex, timing);
    }
  }, [reelIndex, disabled, onStop]);
  const classNames = [
    "reeljs-stop-button",
    disabled ? "reeljs-stop-button--disabled" : "",
    className ?? ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      className: classNames,
      style,
      disabled,
      onClick: handleClick,
      "aria-label": ariaLabel ?? `Stop reel ${reelIndex + 1}`,
      type: "button",
      children: "Stop"
    }
  );
}

// src/infrastructure/animation-controller.ts
var DEFAULT_ANIMATION_CONFIG = {
  spinSpeed: 0.5,
  easing: "ease-in-out",
  stopDelays: [0, 200, 400],
  accelerationDuration: 300,
  decelerationDuration: 500
};
var AnimationController = class {
  constructor(config, reelCount = 3) {
    this.phase = "idle";
    this.spinCompleteCallbacks = [];
    this.stoppedReels = /* @__PURE__ */ new Set();
    this.config = { ...DEFAULT_ANIMATION_CONFIG, ...config };
    this.reelCount = reelCount;
  }
  /**
   * 現在のアニメーションフェーズを取得する。
   *
   * @returns 現在のAnimationPhase
   */
  getPhase() {
    return this.phase;
  }
  /**
   * 解決済みのアニメーション設定を取得する。
   *
   * @returns デフォルト値が適用された完全なAnimationConfig
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * スピンアニメーションを開始する（加速 → 定速回転）。
   */
  startSpin() {
    this.stoppedReels.clear();
    this.phase = "accelerating";
    setTimeout(() => {
      if (this.phase === "accelerating") {
        this.phase = "spinning";
      }
    }, this.config.accelerationDuration);
  }
  /**
   * 指定リールを減速停止する。全リール停止時にonSpinCompleteコールバックを発火する。
   *
   * @param reelIndex - リールインデックス
   * @param _position - 停止位置
   * @returns 停止完了時に解決するPromise
   */
  async stopReel(reelIndex, _position) {
    const delay = this.config.stopDelays[reelIndex] ?? 0;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.phase = "decelerating";
        setTimeout(() => {
          this.stoppedReels.add(reelIndex);
          if (this.stoppedReels.size >= this.reelCount) {
            this.phase = "idle";
            this.notifySpinComplete();
          }
          resolve();
        }, this.config.decelerationDuration);
      }, delay);
    });
  }
  /**
   * 全リール停止完了時のコールバックを登録する。
   *
   * @param callback - 完了時に呼び出されるコールバック
   */
  onSpinComplete(callback) {
    this.spinCompleteCallbacks.push(callback);
  }
  /**
   * 全リール停止完了時のコールバックを解除する。
   *
   * @param callback - 解除するコールバック
   */
  offSpinComplete(callback) {
    this.spinCompleteCallbacks = this.spinCompleteCallbacks.filter((cb) => cb !== callback);
  }
  notifySpinComplete() {
    for (const cb of this.spinCompleteCallbacks) {
      cb();
    }
  }
};
function SlotMachine({
  reelCount = 3,
  rowCount = 3,
  symbols,
  renderSymbol,
  animationConfig,
  showStopButtons = true,
  children,
  className,
  style
}) {
  const [spinning, setSpinning] = react.useState(
    () => Array(reelCount).fill(false)
  );
  const [stopPositions, setStopPositions] = react.useState(
    () => Array(reelCount).fill(0)
  );
  const controllerRef = react.useRef(
    new AnimationController(animationConfig, reelCount)
  );
  react.useEffect(() => {
    controllerRef.current = new AnimationController(animationConfig, reelCount);
  }, [animationConfig, reelCount]);
  const symbolIds = symbols.map((s) => s.id);
  const handleStop = react.useCallback(
    (reelIndex, _timing) => {
      setSpinning((prev) => {
        const next = [...prev];
        next[reelIndex] = false;
        return next;
      });
      controllerRef.current.stopReel(reelIndex, stopPositions[reelIndex]);
    },
    [stopPositions]
  );
  const allStopped = spinning.every((s) => !s);
  const classNames = [
    "reeljs-slot-machine",
    className ?? ""
  ].filter(Boolean).join(" ");
  if (children) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: classNames, style, children });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: classNames, style, children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "reeljs-slot-machine__reels", children: Array.from({ length: reelCount }, (_, i) => /* @__PURE__ */ jsxRuntime.jsx(
      Reel,
      {
        symbols: symbolIds,
        spinning: spinning[i],
        stopPosition: stopPositions[i],
        renderSymbol,
        rowCount
      },
      i
    )) }),
    showStopButtons && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "reeljs-slot-machine__buttons", children: Array.from({ length: reelCount }, (_, i) => /* @__PURE__ */ jsxRuntime.jsx(
      StopButton,
      {
        reelIndex: i,
        disabled: !spinning[i] || allStopped,
        onStop: handleStop
      },
      i
    )) })
  ] });
}
function Symbol({
  symbolId,
  renderSymbol,
  highlighted = false,
  className
}) {
  const classNames = [
    "reeljs-symbol",
    highlighted ? "reeljs-symbol--highlighted" : "",
    className ?? ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: classNames, "data-symbol-id": symbolId, children: renderSymbol ? renderSymbol(symbolId) : /* @__PURE__ */ jsxRuntime.jsx("span", { children: symbolId }) });
}

// src/core/reel-controller.ts
var ReelController = class {
  constructor(config) {
    this.stopCallbacks = [];
    this.validateConfig(config);
    this.reelStrips = config.reelStrips;
    this.slipRanges = config.slipRanges ?? config.reelStrips.map(() => 4);
    this.autoStop = config.autoStop ?? false;
    this.stopOrder = config.stopOrder ?? config.reelStrips.map((_, i) => i);
    this.carryOverEnabled = config.carryOverEnabled ?? false;
    this.randomFn = config.randomFn ?? Math.random;
  }
  /**
   * 停止位置決定。当選役のパターンに基づいて引き込み（Slip）・蹴飛ばし（Reject）を適用し、
   * 最終停止位置を決定する。
   *
   * @param reelIndex - リールインデックス（0始まり）
   * @param winningRole - 内部当選役
   * @param stopTiming - プレイヤーの停止タイミング
   * @returns 停止結果
   * @throws リールインデックスまたはStopTimingが範囲外の場合
   */
  determineStopPosition(reelIndex, winningRole, stopTiming) {
    const strip = this.reelStrips[reelIndex];
    if (!strip) {
      throw new Error(`Invalid reelIndex: ${reelIndex}`);
    }
    if (stopTiming < 0 || stopTiming >= strip.length) {
      throw new Error(
        `StopTiming ${stopTiming} is out of range for reel ${reelIndex} (0-${strip.length - 1})`
      );
    }
    const slipRange = this.slipRanges[reelIndex] ?? 4;
    const targetSymbols = this.getTargetSymbols(reelIndex, winningRole);
    if (winningRole.type === "MISS" || targetSymbols.length === 0) {
      const result2 = {
        reelIndex,
        targetPosition: stopTiming,
        actualPosition: stopTiming,
        slipCount: 0,
        isMiss: false
      };
      this.notifyStop(result2);
      return result2;
    }
    const slipResult = this.trySlip(reelIndex, stopTiming, targetSymbols, slipRange);
    if (slipResult !== null) {
      const result2 = {
        reelIndex,
        targetPosition: stopTiming,
        actualPosition: slipResult.position,
        slipCount: slipResult.slipCount,
        isMiss: false
      };
      this.notifyStop(result2);
      return result2;
    }
    const rejectPosition = this.applyReject(reelIndex, stopTiming, targetSymbols, slipRange);
    const result = {
      reelIndex,
      targetPosition: stopTiming,
      actualPosition: rejectPosition,
      slipCount: this.circularDistance(stopTiming, rejectPosition, strip.length),
      isMiss: true
    };
    this.notifyStop(result);
    return result;
  }
  /**
   * AutoStop実行。全リールをランダムタイミングで停止する。
   *
   * @param winningRole - 内部当選役
   * @returns 全リールの停止結果
   */
  autoStopAll(winningRole) {
    const results = [];
    for (const reelIndex of this.stopOrder) {
      const strip = this.reelStrips[reelIndex];
      const randomTiming = Math.floor(this.randomFn() * strip.length);
      results.push(this.determineStopPosition(reelIndex, winningRole, randomTiming));
    }
    return results;
  }
  /**
   * 停止コールバック登録。リール停止時にStopResultを受け取るコールバックを登録する。
   *
   * @param callback - 停止結果を受け取るコールバック関数
   */
  onStop(callback) {
    this.stopCallbacks.push(callback);
  }
  /**
   * AutoStopモードかどうかを返す
   */
  get isAutoStop() {
    return this.autoStop;
  }
  /**
   * 持ち越し設定が有効かどうかを返す
   */
  get isCarryOverEnabled() {
    return this.carryOverEnabled;
  }
  /**
   * 停止順序を返す
   */
  getStopOrder() {
    return [...this.stopOrder];
  }
  /**
   * 指定リールのReelStripを返す
   */
  getReelStrip(reelIndex) {
    const strip = this.reelStrips[reelIndex];
    if (!strip) {
      throw new Error(`Invalid reelIndex: ${reelIndex}`);
    }
    return [...strip];
  }
  /**
   * 当選役パターンからリール別のターゲットシンボルを取得
   */
  getTargetSymbols(reelIndex, winningRole) {
    const symbols = [];
    for (const pattern of winningRole.patterns) {
      if (reelIndex < pattern.length) {
        const sym = pattern[reelIndex];
        if (sym !== "ANY" && !symbols.includes(sym)) {
          symbols.push(sym);
        }
      }
    }
    return symbols;
  }
  /**
   * 引き込み（Slip）を試行する
   *
   * stopTimingからSlipRange以内にターゲットシンボルがあれば、
   * その位置と引き込みコマ数を返す。なければnull。
   */
  trySlip(reelIndex, stopTiming, targetSymbols, slipRange) {
    const strip = this.reelStrips[reelIndex];
    const len = strip.length;
    for (let offset = 0; offset <= slipRange; offset++) {
      const pos = (stopTiming + offset) % len;
      if (targetSymbols.includes(strip[pos])) {
        return { position: pos, slipCount: offset };
      }
    }
    return null;
  }
  /**
   * 蹴飛ばし（Reject）を適用する
   *
   * 非当選役のシンボルが表示されないように停止位置をずらす。
   * stopTimingからSlipRange以内で、ターゲットシンボルでない位置を探す。
   */
  applyReject(reelIndex, stopTiming, targetSymbols, slipRange) {
    const strip = this.reelStrips[reelIndex];
    const len = strip.length;
    for (let offset = 0; offset <= slipRange; offset++) {
      const pos = (stopTiming + offset) % len;
      if (!targetSymbols.includes(strip[pos])) {
        return pos;
      }
    }
    return stopTiming;
  }
  /**
   * 循環距離を計算する
   */
  circularDistance(from, to, length) {
    return (to - from + length) % length;
  }
  /**
   * 停止コールバックを通知する
   */
  notifyStop(result) {
    for (const cb of this.stopCallbacks) {
      cb(result);
    }
  }
  /**
   * 設定のバリデーション
   */
  validateConfig(config) {
    if (!config.reelStrips || config.reelStrips.length === 0) {
      throw new Error("ReelStrips must not be empty");
    }
    for (let i = 0; i < config.reelStrips.length; i++) {
      if (!config.reelStrips[i] || config.reelStrips[i].length === 0) {
        throw new Error(`ReelStrip for reel ${i} must not be empty`);
      }
    }
    if (config.slipRanges) {
      for (let i = 0; i < config.slipRanges.length; i++) {
        if (config.slipRanges[i] < 0) {
          throw new Error(`SlipRange for reel ${i} must not be negative: ${config.slipRanges[i]}`);
        }
      }
    }
    if (config.stopOrder) {
      for (const idx of config.stopOrder) {
        if (idx < 0 || idx >= config.reelStrips.length) {
          throw new Error(
            `StopOrder contains invalid reel index: ${idx} (valid: 0-${config.reelStrips.length - 1})`
          );
        }
      }
    }
  }
};

// src/core/spin-engine.ts
var MISS_ROLE = {
  id: "miss",
  name: "\u30CF\u30BA\u30EC",
  type: "MISS",
  payout: 0,
  patterns: [],
  priority: 0
};
var SpinEngine = class {
  constructor(config) {
    /** デフォルトの行数（3行） */
    this.rowCount = 3;
    this.validateReelConfigs(config.reelConfigs);
    this.reelConfigs = config.reelConfigs;
    this.payTable = config.payTable;
    this.paylines = config.paylines;
    this.randomFn = config.randomFn ?? Math.random;
    this.internalLottery = config.internalLottery ?? null;
    if (config.reelController) {
      this.reelController = config.reelController;
    } else {
      this.reelController = new ReelController({
        reelStrips: config.reelConfigs.map((rc) => rc.reelStrip),
        randomFn: this.randomFn
      });
    }
  }
  /**
   * 統合スピン実行。
   * winningRole が渡された場合は ReelController で出目制御を行い、
   * 渡されていない場合は重み付けランダム抽選にフォールバックする。
   *
   * @param winningRole - 内部当選役（省略時はランダムフォールバック）
   * @param stopTimings - 各リールのStopTiming配列（省略時はランダム生成）
   * @returns スピン結果
   */
  spin(winningRole, stopTimings) {
    const role = winningRole ?? MISS_ROLE;
    this.reelConfigs.length;
    let stopResults;
    if (winningRole) {
      stopResults = this.controlReels(winningRole, stopTimings);
    } else {
      stopResults = this.randomStopResults(stopTimings);
    }
    const grid = this.buildGrid(stopResults);
    const winLines = this.evaluatePaylines(grid);
    const totalPayout = winLines.reduce((sum, wl) => sum + wl.payout, 0);
    const isMiss = stopResults.some((sr) => sr.isMiss);
    const isReplay = role.type === "REPLAY";
    const result = {
      grid,
      stopResults,
      winLines,
      totalPayout,
      isReplay,
      isMiss,
      winningRole: role
    };
    if (isMiss && winningRole) {
      result.missedRole = winningRole;
    }
    return result;
  }
  /**
   * InternalLottery のみ実行し、当選役を決定する。
   *
   * @param gameMode - 現在のゲームモード
   * @param difficulty - 設定段階（オプション）
   * @returns 当選役
   * @throws InternalLotteryが未設定の場合
   */
  lottery(gameMode, difficulty) {
    if (!this.internalLottery) {
      throw new Error("InternalLottery is not configured. Provide an InternalLottery instance in SpinEngineConfig.");
    }
    return this.internalLottery.draw(gameMode, difficulty);
  }
  /**
   * ReelController のみ実行し、各リールの停止位置を決定する。
   *
   * @param winningRole - 内部当選役
   * @param stopTimings - 各リールのStopTiming配列（省略時はランダム生成）
   * @returns 各リールの停止結果
   */
  controlReels(winningRole, stopTimings) {
    const reelCount = this.reelConfigs.length;
    const timings = stopTimings ?? this.generateRandomTimings();
    const results = [];
    for (let i = 0; i < reelCount; i++) {
      results.push(
        this.reelController.determineStopPosition(i, winningRole, timings[i] ?? 0)
      );
    }
    return results;
  }
  /**
   * Payline 評価のみ実行。横・斜め・V字等のカスタムパターンに対応。
   * 複数 Payline 同時当選時は全配当を返却する。
   *
   * @param grid - シンボルグリッド（grid[row][reel]）
   * @returns 当選ライン結果の配列
   */
  evaluatePaylines(grid) {
    const results = [];
    for (const payline of this.paylines) {
      const symbols = [];
      let valid = true;
      for (let reelIdx = 0; reelIdx < payline.positions.length; reelIdx++) {
        const rowIdx = payline.positions[reelIdx];
        if (grid[rowIdx] && grid[rowIdx][reelIdx] !== void 0) {
          symbols.push(grid[rowIdx][reelIdx]);
        } else {
          valid = false;
          break;
        }
      }
      if (!valid) continue;
      const matchedEntry = this.findPayTableMatch(symbols);
      if (matchedEntry) {
        results.push({
          lineIndex: payline.index,
          matchedSymbols: symbols,
          payout: matchedEntry.payout,
          payline
        });
      }
    }
    return results;
  }
  /**
   * PayTable からシンボル配列にマッチするエントリを検索
   */
  findPayTableMatch(symbols) {
    for (const entry of this.payTable.entries) {
      if (this.matchesPattern(symbols, entry.pattern)) {
        return { payout: entry.payout };
      }
    }
    return null;
  }
  /**
   * シンボル配列がパターンにマッチするか判定
   * パターン内の 'ANY' はワイルドカードとして扱う
   */
  matchesPattern(symbols, pattern) {
    if (symbols.length !== pattern.length) return false;
    for (let i = 0; i < symbols.length; i++) {
      if (pattern[i] !== "ANY" && symbols[i] !== pattern[i]) {
        return false;
      }
    }
    return true;
  }
  /**
   * ランダムフォールバック: 重み付け抽選で各リールの停止位置を決定
   */
  randomStopResults(stopTimings) {
    const results = [];
    for (let i = 0; i < this.reelConfigs.length; i++) {
      const reelConfig = this.reelConfigs[i];
      const position = this.weightedRandomPosition(reelConfig.symbols, reelConfig.reelStrip);
      const timing = stopTimings?.[i] ?? position;
      results.push({
        reelIndex: i,
        targetPosition: timing,
        actualPosition: position,
        slipCount: 0,
        isMiss: false
      });
    }
    return results;
  }
  /**
   * 重み付けランダムでシンボルを選択し、ReelStrip 上の位置を返す
   */
  weightedRandomPosition(symbols, reelStrip) {
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    const roll = this.randomFn() * totalWeight;
    let cumulative = 0;
    let selectedSymbol = null;
    for (const sym of symbols) {
      cumulative += sym.weight;
      if (roll < cumulative) {
        selectedSymbol = sym.id;
        break;
      }
    }
    if (selectedSymbol === null) {
      selectedSymbol = symbols[symbols.length - 1].id;
    }
    const idx = reelStrip.indexOf(selectedSymbol);
    return idx >= 0 ? idx : 0;
  }
  /**
   * ランダムな StopTiming を生成
   */
  generateRandomTimings() {
    return this.reelConfigs.map(
      (rc) => Math.floor(this.randomFn() * rc.reelStrip.length)
    );
  }
  /**
   * グリッド生成: stopResults から grid[row][reel] を構築
   *
   * 各リールの actualPosition を中心に rowCount 行分のシンボルを取得する。
   */
  buildGrid(stopResults) {
    const grid = [];
    for (let row = 0; row < this.rowCount; row++) {
      grid[row] = [];
      for (let reelIdx = 0; reelIdx < this.reelConfigs.length; reelIdx++) {
        const strip = this.reelConfigs[reelIdx].reelStrip;
        const stopPos = stopResults[reelIdx]?.actualPosition ?? 0;
        const pos = (stopPos + row) % strip.length;
        grid[row][reelIdx] = strip[pos];
      }
    }
    return grid;
  }
  /**
   * ReelConfig のバリデーション
   */
  validateReelConfigs(reelConfigs) {
    if (!reelConfigs || reelConfigs.length === 0) {
      throw new Error("ReelConfigs must not be empty");
    }
    for (let i = 0; i < reelConfigs.length; i++) {
      const rc = reelConfigs[i];
      if (!rc.symbols || rc.symbols.length === 0) {
        throw new Error(`ReelConfig for reel ${i} has an empty symbol list`);
      }
      if (!rc.reelStrip || rc.reelStrip.length === 0) {
        throw new Error(`ReelConfig for reel ${i} has an empty reelStrip`);
      }
      for (const sym of rc.symbols) {
        if (sym.weight < 0) {
          throw new Error(
            `Negative weight for symbol "${sym.id}" in reel ${i}: ${sym.weight}`
          );
        }
      }
    }
  }
};

// src/game/credit-manager.ts
var DEFAULT_HISTORY_SIZE = 100;
var CreditManager = class {
  constructor(config) {
    this._history = [];
    this.validateConfig(config);
    this._balance = config.initialCredit;
    this._currentBet = config.defaultBet;
    this.betOptions = [...config.betOptions];
    this.historySize = config.historySize ?? DEFAULT_HISTORY_SIZE;
    if (!this.betOptions.includes(config.defaultBet)) {
      throw new Error(
        `defaultBet ${config.defaultBet} is not included in betOptions [${config.betOptions.join(", ")}]`
      );
    }
  }
  /** 現在の残高 */
  get balance() {
    return this._balance;
  }
  /** 現在のBET額 */
  get currentBet() {
    return this._currentBet;
  }
  /**
   * BET消費: 現在のBET額をクレジット残高から減算する
   * @returns BET成功時 true、クレジット不足時 false
   */
  bet() {
    if (this._balance < this._currentBet) {
      return false;
    }
    this._balance -= this._currentBet;
    this.addHistory("BET", this._currentBet);
    return true;
  }
  /**
   * Payout加算: 配当額をクレジット残高に加算する
   * @param amount 配当額
   */
  payout(amount) {
    if (amount < 0) {
      throw new Error(`Payout amount must not be negative: ${amount}`);
    }
    this._balance += amount;
    this.addHistory("PAYOUT", amount);
  }
  /**
   * クレジット投入: クレジットを追加する
   * @param amount 投入額
   */
  deposit(amount) {
    if (amount < 0) {
      throw new Error(`Deposit amount must not be negative: ${amount}`);
    }
    this._balance += amount;
    this.addHistory("DEPOSIT", amount);
  }
  /**
   * クレジット引き出し: クレジットを引き出す
   * @param amount 引き出し額
   * @returns 引き出し成功時 true、残高不足時 false
   */
  withdraw(amount) {
    if (amount < 0) {
      throw new Error(`Withdraw amount must not be negative: ${amount}`);
    }
    if (amount > this._balance) {
      return false;
    }
    this._balance -= amount;
    this.addHistory("WITHDRAW", amount);
    return true;
  }
  /**
   * BET額変更
   * @param amount 新しいBET額（betOptionsに含まれている必要がある）
   */
  setBet(amount) {
    if (!this.betOptions.includes(amount)) {
      throw new Error(
        `Invalid bet amount ${amount}. Valid options: [${this.betOptions.join(", ")}]`
      );
    }
    this._currentBet = amount;
  }
  /**
   * 変動履歴取得
   * @param count 取得件数（省略時は全件）
   * @returns 直近の変動履歴（新しい順）
   */
  getHistory(count) {
    if (count === void 0) {
      return [...this._history];
    }
    return this._history.slice(-count);
  }
  /**
   * 現在のクレジット状態を取得
   */
  getState() {
    return {
      balance: this._balance,
      currentBet: this._currentBet,
      history: [...this._history]
    };
  }
  /**
   * 履歴エントリを追加（直近N件を保持）
   */
  addHistory(type, amount) {
    const entry = {
      type,
      amount,
      balanceAfter: this._balance,
      timestamp: Date.now()
    };
    this._history.push(entry);
    if (this._history.length > this.historySize) {
      this._history.splice(0, this._history.length - this.historySize);
    }
  }
  /**
   * BetConfig のバリデーション
   */
  validateConfig(config) {
    if (config.initialCredit < 0) {
      throw new Error(
        `Initial credit must not be negative: ${config.initialCredit}`
      );
    }
    if (!config.betOptions || config.betOptions.length === 0) {
      throw new Error("betOptions must not be empty");
    }
    for (const opt of config.betOptions) {
      if (opt <= 0) {
        throw new Error(
          `All bet options must be greater than 0. Invalid value: ${opt}`
        );
      }
    }
  }
};

// src/game/game-cycle-manager.ts
var PHASE_ORDER = [
  "BET",
  "LEVER_ON",
  "INTERNAL_LOTTERY",
  "NOTIFICATION_CHECK",
  "REEL_SPINNING",
  "STOP_OPERATION",
  "REEL_STOPPED",
  "RESULT_CONFIRMED",
  "WIN_JUDGE",
  "PAYOUT",
  "MODE_TRANSITION",
  "ZONE_UPDATE",
  "COUNTER_UPDATE",
  "WAITING"
];
var GameCycleManager = class {
  constructor(config) {
    this._currentPhase = "WAITING";
    this._phaseChangeCallbacks = [];
    this._isReplay = false;
    // 1ゲーム中の状態
    this._currentWinningRole = null;
    this._currentSpinResult = null;
    this._stopTimings = [];
    this.spinEngine = config.spinEngine;
    this.creditManager = config.creditManager;
    this.gameModeManager = config.gameModeManager;
    this.notificationManager = config.notificationManager;
    this.zoneManager = config.zoneManager;
    this.spinCounter = config.spinCounter;
    this.eventEmitter = config.eventEmitter;
    this.internalLottery = config.internalLottery;
  }
  /** 現在のGamePhase */
  get currentPhase() {
    return this._currentPhase;
  }
  /** 現在のスピンがリプレイかどうか */
  get isReplay() {
    return this._isReplay;
  }
  /**
   * ゲームサイクル開始。リプレイ時はBETをスキップしてLEVER_ONから開始する。
   */
  startCycle() {
    this._stopTimings = [];
    this._currentSpinResult = null;
    if (this._isReplay) {
      this.transitionTo("LEVER_ON");
    } else {
      this.transitionTo("BET");
    }
  }
  /**
   * フェーズ遷移コールバック登録。フェーズ遷移時に遷移元・遷移先を受け取るコールバックを登録する。
   *
   * @param callback - 遷移元フェーズと遷移先フェーズを受け取るコールバック
   */
  onPhaseChange(callback) {
    this._phaseChangeCallbacks.push(callback);
  }
  /**
   * ストップ操作通知。プレイヤーのストップボタン押下を記録する。
   *
   * @param reelIndex - リールインデックス
   * @param timing - 停止タイミング
   */
  notifyStop(reelIndex, timing) {
    this._stopTimings[reelIndex] = timing;
  }
  /**
   * 次のフェーズへ進む
   */
  advancePhase() {
    const currentIndex = PHASE_ORDER.indexOf(this._currentPhase);
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) {
      return;
    }
    const nextPhase = PHASE_ORDER[currentIndex + 1];
    this.transitionTo(nextPhase);
  }
  /**
   * フェーズ遷移を実行し、対応するモジュールを呼び出す
   */
  transitionTo(phase) {
    const from = this._currentPhase;
    this._currentPhase = phase;
    for (const cb of this._phaseChangeCallbacks) {
      cb(from, phase);
    }
    this.eventEmitter?.emit("phaseChange", { from, to: phase });
    this.executePhase(phase);
  }
  /**
   * 各フェーズに対応するモジュール呼び出し
   */
  executePhase(phase) {
    switch (phase) {
      case "BET":
        this.executeBet();
        break;
      case "INTERNAL_LOTTERY":
        this.executeInternalLottery();
        break;
      case "NOTIFICATION_CHECK":
        this.executeNotificationCheck();
        break;
      case "REEL_SPINNING":
        this.executeReelSpinning();
        break;
      case "WIN_JUDGE":
        this.executeWinJudge();
        break;
      case "PAYOUT":
        this.executePayout();
        break;
      case "MODE_TRANSITION":
        this.executeModeTransition();
        break;
      case "ZONE_UPDATE":
        this.executeZoneUpdate();
        break;
      case "COUNTER_UPDATE":
        this.executeCounterUpdate();
        break;
      case "WAITING":
        this.executeWaiting();
        break;
    }
  }
  /** BETフェーズ: CreditManager.bet() */
  executeBet() {
    this.creditManager?.bet();
  }
  /** INTERNAL_LOTTERYフェーズ: InternalLottery.draw() */
  executeInternalLottery() {
    if (this.internalLottery) {
      const gameMode = this.gameModeManager?.currentMode ?? "Normal";
      this._currentWinningRole = this.internalLottery.draw(gameMode);
    }
  }
  /** NOTIFICATION_CHECKフェーズ: NotificationManager.check() */
  executeNotificationCheck() {
    if (this.notificationManager && this._currentWinningRole) {
      this.notificationManager.check("PRE_SPIN", this._currentWinningRole);
    }
  }
  /** REEL_SPINNINGフェーズ: SpinEngine でスピン開始 */
  executeReelSpinning() {
    if (this.spinEngine && this._currentWinningRole) {
      this._currentSpinResult = this.spinEngine.spin(
        this._currentWinningRole,
        this._stopTimings.length > 0 ? this._stopTimings : void 0
      );
    }
    this.eventEmitter?.emit("spinStart");
  }
  /** WIN_JUDGEフェーズ: Payline評価（SpinResult内で既に評価済み） */
  executeWinJudge() {
    if (this._currentSpinResult && this._currentSpinResult.winLines.length > 0) {
      this.eventEmitter?.emit("win", {
        totalPayout: this._currentSpinResult.totalPayout,
        winLines: this._currentSpinResult.winLines
      });
    }
  }
  /** PAYOUTフェーズ: CreditManager.payout() */
  executePayout() {
    if (this.creditManager && this._currentSpinResult) {
      if (this._currentSpinResult.totalPayout > 0) {
        this.creditManager.payout(this._currentSpinResult.totalPayout);
      }
    }
  }
  /** MODE_TRANSITIONフェーズ: GameModeManager.evaluateTransition() */
  executeModeTransition() {
    if (this.gameModeManager && this._currentSpinResult && this._currentWinningRole) {
      this.gameModeManager.evaluateTransition(this._currentSpinResult, this._currentWinningRole);
    }
  }
  /** ZONE_UPDATEフェーズ: ZoneManager.update() */
  executeZoneUpdate() {
    if (this.zoneManager && this._currentSpinResult) {
      this.zoneManager.update(this._currentSpinResult);
    }
  }
  /** COUNTER_UPDATEフェーズ: SpinCounter.increment() */
  executeCounterUpdate() {
    if (this.spinCounter) {
      const gameMode = this.gameModeManager?.currentMode ?? "Normal";
      this.spinCounter.increment(gameMode);
    }
  }
  /** WAITINGフェーズ: リプレイ判定 */
  executeWaiting() {
    if (this._currentSpinResult?.isReplay) {
      this._isReplay = true;
    } else {
      this._isReplay = false;
    }
  }
};

// src/hooks/useSlotMachine.ts
function useSlotMachine(config) {
  const engineRef = react.useRef(new SpinEngine(config.spinEngine));
  const creditRef = react.useRef(
    config.credit ? new CreditManager(config.credit) : null
  );
  const cycleRef = react.useRef(
    config.gameCycle ? new GameCycleManager(config.gameCycle) : null
  );
  const engine = engineRef.current;
  const credit = creditRef.current;
  const cycle = cycleRef.current;
  const [spinState, setSpinState] = react.useState("idle");
  const [currentPhase, setCurrentPhase] = react.useState(
    cycle?.currentPhase ?? "WAITING"
  );
  const [spinResult, setSpinResult] = react.useState(null);
  const registeredRef = react.useRef(false);
  if (!registeredRef.current && cycle) {
    cycle.onPhaseChange((_from, to) => {
      setCurrentPhase(to);
    });
    registeredRef.current = true;
  }
  const spin = react.useCallback(() => {
    if (spinState === "spinning") return;
    if (credit) {
      const success = credit.bet();
      if (!success) return;
    }
    setSpinState("spinning");
    if (cycle) {
      cycle.startCycle();
    }
    const result = engine.spin();
    setSpinResult(result);
    setSpinState("stopped");
    if (credit && result.totalPayout > 0) {
      credit.payout(result.totalPayout);
    }
  }, [spinState, engine, credit, cycle]);
  const reset = react.useCallback(() => {
    setSpinState("idle");
    setSpinResult(null);
    setCurrentPhase(cycle?.currentPhase ?? "WAITING");
  }, [cycle]);
  return {
    spinState,
    currentPhase,
    spinResult,
    spin,
    reset,
    _engine: engine,
    _credit: credit,
    _cycle: cycle
  };
}

// src/game/game-mode-manager.ts
var GameModeManager = class {
  constructor(config) {
    this._currentMode = "Normal";
    this._currentBonusType = null;
    this._modeChangeCallbacks = [];
    this._modeState = {
      remainingSpins: null,
      accumulatedPayout: 0,
      maxPayout: null
    };
    this.validateConfig(config);
    this.transitionConfig = config.transitionConfig;
    this.bonusConfigs = config.bonusConfigs;
    this.btConfig = config.btConfig;
    this.chanceConfig = config.chanceConfig;
    this.randomFn = config.randomFn ?? Math.random;
  }
  /** 現在のGameMode */
  get currentMode() {
    return this._currentMode;
  }
  /** 現在のBonusType（BonusMode時のみ） */
  get currentBonusType() {
    return this._currentBonusType;
  }
  /**
   * 残りスピン数を取得する
   * @returns 残りスピン数。NormalMode時はnull
   */
  getRemainingSpins() {
    return this._modeState.remainingSpins;
  }
  /**
   * 累計獲得配当を取得する
   * @returns 現在モードでの累計配当
   */
  getAccumulatedPayout() {
    return this._modeState.accumulatedPayout;
  }
  /**
   * モード遷移コールバックを登録する
   * @param callback 遷移元モードと遷移先モードを受け取るコールバック
   */
  onModeChange(callback) {
    this._modeChangeCallbacks.push(callback);
  }
  /**
   * スピン結果と当選役に基づいてモード遷移を判定する
   * @param spinResult スピン結果
   * @param winningRole 内部当選役
   * @returns 遷移後のGameMode
   */
  evaluateTransition(spinResult, winningRole) {
    this._currentMode;
    if (this._modeState.remainingSpins !== null) {
      this._modeState.remainingSpins--;
      this._modeState.accumulatedPayout += spinResult.totalPayout;
    }
    switch (this._currentMode) {
      case "Normal":
        return this.evaluateNormalTransition(spinResult, winningRole);
      case "Chance":
        return this.evaluateChanceTransition(spinResult, winningRole);
      case "Bonus":
        return this.evaluateBonusTransition(spinResult, winningRole);
      case "BT":
        return this.evaluateBTTransition(spinResult, winningRole);
      default:
        return this._currentMode;
    }
  }
  /**
   * モードに応じた SpinEngine パラメータ情報を返す
   * @returns 現在のモードに対応するパラメータキー
   */
  getSpinEngineParams() {
    return {
      mode: this._currentMode,
      bonusType: this._currentBonusType
    };
  }
  // --- Normal モードの遷移判定 ---
  evaluateNormalTransition(spinResult, winningRole) {
    if (winningRole.type === "BONUS" && winningRole.bonusType) {
      this.transitionToBonus(winningRole.bonusType);
      return this._currentMode;
    }
    if (this.randomFn() < this.transitionConfig.normalToChance) {
      this.transitionTo("Chance");
      this.initModeState(this.chanceConfig.maxSpins, this.chanceConfig.maxPayout);
      return this._currentMode;
    }
    return this._currentMode;
  }
  // --- Chance モードの遷移判定 ---
  evaluateChanceTransition(spinResult, winningRole) {
    if (this._modeState.maxPayout !== null && this._modeState.accumulatedPayout >= this._modeState.maxPayout) {
      this.transitionTo("Normal");
      this.resetModeState();
      return this._currentMode;
    }
    if (this.matchesWinPattern(spinResult, this.chanceConfig.winPatterns)) {
      this.transitionTo("BT");
      this.initModeState(this.btConfig.maxSpins, this.btConfig.maxPayout);
      return this._currentMode;
    }
    if (this._modeState.remainingSpins !== null && this._modeState.remainingSpins <= 0) {
      this.transitionTo("Normal");
      this.resetModeState();
      return this._currentMode;
    }
    return this._currentMode;
  }
  // --- Bonus モードの遷移判定 ---
  evaluateBonusTransition(_spinResult, _winningRole) {
    if (!this._currentBonusType) {
      return this._currentMode;
    }
    if (this._modeState.maxPayout !== null && this._modeState.accumulatedPayout >= this._modeState.maxPayout) {
      return this.endBonus();
    }
    if (this._modeState.remainingSpins !== null && this._modeState.remainingSpins <= 0) {
      return this.endBonus();
    }
    return this._currentMode;
  }
  // --- BT モードの遷移判定 ---
  evaluateBTTransition(spinResult, _winningRole) {
    if (this._modeState.maxPayout !== null && this._modeState.accumulatedPayout >= this._modeState.maxPayout) {
      this.transitionTo("Normal");
      this.resetModeState();
      return this._currentMode;
    }
    if (this.matchesWinPattern(spinResult, this.btConfig.winPatterns)) {
      this.transitionToBonus("SUPER_BIG_BONUS");
      return this._currentMode;
    }
    if (this._modeState.remainingSpins !== null && this._modeState.remainingSpins <= 0) {
      this.transitionTo("Normal");
      this.resetModeState();
      return this._currentMode;
    }
    return this._currentMode;
  }
  // --- ボーナス終了処理 ---
  endBonus() {
    const bonusType = this._currentBonusType;
    this._currentBonusType = null;
    if (bonusType === "SUPER_BIG_BONUS") {
      this.transitionTo("BT");
      this.initModeState(this.btConfig.maxSpins, this.btConfig.maxPayout);
    } else {
      this.transitionTo("Normal");
      this.resetModeState();
    }
    return this._currentMode;
  }
  // --- ボーナスモードへの遷移 ---
  transitionToBonus(bonusType) {
    const config = this.bonusConfigs[bonusType];
    this._currentBonusType = bonusType;
    this.transitionTo("Bonus");
    this.initModeState(config.maxSpins, config.maxPayout);
  }
  // --- モード遷移の実行 ---
  transitionTo(newMode) {
    const from = this._currentMode;
    this.validateTransition(from, newMode);
    this._currentMode = newMode;
    for (const cb of this._modeChangeCallbacks) {
      cb(from, newMode);
    }
  }
  // --- モード内部状態の初期化 ---
  initModeState(maxSpins, maxPayout) {
    this._modeState = {
      remainingSpins: maxSpins,
      accumulatedPayout: 0,
      maxPayout
    };
  }
  // --- モード内部状態のリセット ---
  resetModeState() {
    this._modeState = {
      remainingSpins: null,
      accumulatedPayout: 0,
      maxPayout: null
    };
  }
  // --- WinPattern マッチング ---
  matchesWinPattern(spinResult, patterns) {
    const grid = spinResult.grid;
    for (const pattern of patterns) {
      if (this.matchesSinglePattern(grid, pattern)) {
        return true;
      }
    }
    return false;
  }
  matchesSinglePattern(grid, pattern) {
    const { symbols, positions } = pattern;
    if (positions && positions.length > 0) {
      for (let col = 0; col < symbols.length; col++) {
        const row = positions[col];
        if (row === void 0 || row >= grid.length || col >= (grid[0]?.length ?? 0)) {
          return false;
        }
        if (grid[row][col] !== symbols[col]) {
          return false;
        }
      }
      return true;
    }
    for (let row = 0; row < grid.length; row++) {
      let match = true;
      for (let col = 0; col < symbols.length; col++) {
        if (col >= (grid[row]?.length ?? 0) || grid[row][col] !== symbols[col]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }
  // --- 遷移バリデーション ---
  validateTransition(from, to) {
    const validTransitions = {
      Normal: ["Chance", "Bonus"],
      Chance: ["BT", "Normal"],
      Bonus: ["Normal", "BT"],
      BT: ["Normal", "Bonus"]
    };
    const allowed = validTransitions[from];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid mode transition: ${from} \u2192 ${to}`);
    }
  }
  // --- 設定バリデーション ---
  validateConfig(config) {
    this.validateProbability("normalToChance", config.transitionConfig.normalToChance);
    this.validateProbability("chanceTobt", config.transitionConfig.chanceTobt);
    this.validateProbability("btToSuperBigBonus", config.transitionConfig.btToSuperBigBonus);
  }
  validateProbability(name, value) {
    if (value < 0 || value > 1) {
      throw new Error(
        `Invalid probability for ${name}: ${value}. Must be between 0 and 1.`
      );
    }
  }
};

// src/hooks/useGameMode.ts
function useGameMode(config) {
  const managerRef = react.useRef(new GameModeManager(config));
  const manager = managerRef.current;
  const [currentMode, setCurrentMode] = react.useState(manager.currentMode);
  const [currentBonusType, setCurrentBonusType] = react.useState(manager.currentBonusType);
  const [remainingSpins, setRemainingSpins] = react.useState(manager.getRemainingSpins());
  const registeredRef = react.useRef(false);
  if (!registeredRef.current) {
    manager.onModeChange(() => {
      setCurrentMode(manager.currentMode);
      setCurrentBonusType(manager.currentBonusType);
      setRemainingSpins(manager.getRemainingSpins());
    });
    registeredRef.current = true;
  }
  const evaluateTransition = react.useCallback(
    (spinResult, winningRole) => {
      manager.evaluateTransition(spinResult, winningRole);
      setCurrentMode(manager.currentMode);
      setCurrentBonusType(manager.currentBonusType);
      setRemainingSpins(manager.getRemainingSpins());
    },
    [manager]
  );
  return {
    currentMode,
    currentBonusType,
    remainingSpins,
    evaluateTransition,
    _manager: manager
  };
}
function useGameCycle(config) {
  const managerRef = react.useRef(new GameCycleManager(config));
  const manager = managerRef.current;
  const [currentPhase, setCurrentPhase] = react.useState(manager.currentPhase);
  const [isReplay, setIsReplay] = react.useState(manager.isReplay);
  const phaseCallbacksRef = react.useRef({});
  const registeredRef = react.useRef(false);
  if (!registeredRef.current) {
    manager.onPhaseChange((_from, to) => {
      setCurrentPhase(to);
      setIsReplay(manager.isReplay);
      const cb = phaseCallbacksRef.current[to];
      if (cb) cb();
    });
    registeredRef.current = true;
  }
  const startCycle = react.useCallback(() => {
    manager.startCycle();
    setCurrentPhase(manager.currentPhase);
    setIsReplay(manager.isReplay);
  }, [manager]);
  const onPhase = react.useCallback((phase, callback) => {
    phaseCallbacksRef.current[phase] = callback;
  }, []);
  return {
    currentPhase,
    isReplay,
    startCycle,
    onPhase,
    _manager: manager
  };
}

// src/game/zone-manager.ts
var ZoneManager = class {
  constructor(config) {
    this._onZoneChangeCallbacks = [];
    this._resetCallbacks = [];
    this.validateConfig(config);
    this.zones = config.zones;
    this._state = {
      currentZone: config.initialZone,
      gamesPlayed: 0,
      netCredits: 0
    };
  }
  /** 現在のZoneState */
  get currentState() {
    return { ...this._state };
  }
  /** ZoneIndicator */
  get indicator() {
    const zoneConfig = this.zones[this._state.currentZone];
    return {
      isSpecialZone: zoneConfig.isSpecial,
      zoneName: zoneConfig.name
    };
  }
  /**
   * ゾーン更新。SpinResult に基づいてゲーム数・差枚数を更新し、ゾーン終了判定を行う。
   *
   * @param spinResult - スピン結果
   */
  update(spinResult) {
    this._state.gamesPlayed += 1;
    this._state.netCredits += spinResult.totalPayout;
    const zoneConfig = this.zones[this._state.currentZone];
    if (this._state.gamesPlayed >= zoneConfig.maxGames || this._state.netCredits >= zoneConfig.maxNetCredits) {
      this.transitionTo(zoneConfig.nextZone, zoneConfig.resetTargets);
    }
  }
  /**
   * ゾーン遷移コールバック登録。ゾーン遷移時に遷移元・遷移先を受け取るコールバックを登録する。
   *
   * @param callback - 遷移元ゾーンと遷移先ゾーンを受け取るコールバック
   */
  onZoneChange(callback) {
    this._onZoneChangeCallbacks.push(callback);
  }
  /**
   * リセットコールバック登録（GameCycleManager等が利用）
   */
  onReset(callback) {
    this._resetCallbacks.push(callback);
  }
  /**
   * ゾーン遷移処理
   */
  transitionTo(nextZone, resetTargets) {
    const fromZone = this._state.currentZone;
    for (const cb of this._resetCallbacks) {
      cb(resetTargets);
    }
    this._state = {
      currentZone: nextZone,
      gamesPlayed: 0,
      netCredits: 0
    };
    for (const cb of this._onZoneChangeCallbacks) {
      cb(fromZone, nextZone);
    }
  }
  /**
   * 設定バリデーション
   */
  validateConfig(config) {
    if (!config.zones || Object.keys(config.zones).length === 0) {
      throw new Error("zones must not be empty");
    }
    if (!config.initialZone || !(config.initialZone in config.zones)) {
      throw new Error(
        `initialZone "${config.initialZone}" is not defined in zones`
      );
    }
    for (const [key, zone] of Object.entries(config.zones)) {
      if (zone.maxGames <= 0) {
        throw new Error(
          `Zone "${key}": maxGames must be greater than 0, got ${zone.maxGames}`
        );
      }
      if (zone.maxNetCredits <= 0) {
        throw new Error(
          `Zone "${key}": maxNetCredits must be greater than 0, got ${zone.maxNetCredits}`
        );
      }
      if (!(zone.nextZone in config.zones)) {
        throw new Error(
          `Zone "${key}": nextZone "${zone.nextZone}" is not defined in zones`
        );
      }
    }
  }
};

// src/hooks/useGameZone.ts
function useGameZone(config) {
  const managerRef = react.useRef(new ZoneManager(config));
  const manager = managerRef.current;
  const [currentZone, setCurrentZone] = react.useState(manager.currentState.currentZone);
  const [gamesPlayed, setGamesPlayed] = react.useState(manager.currentState.gamesPlayed);
  const [netCredits, setNetCredits] = react.useState(manager.currentState.netCredits);
  const [indicator, setIndicator] = react.useState(manager.indicator);
  const zoneConfig = config.zones[currentZone];
  const remainingGames = zoneConfig ? zoneConfig.maxGames - gamesPlayed : 0;
  const remainingCredits = zoneConfig ? zoneConfig.maxNetCredits - netCredits : 0;
  const sync = react.useCallback(() => {
    const state = manager.currentState;
    setCurrentZone(state.currentZone);
    setGamesPlayed(state.gamesPlayed);
    setNetCredits(state.netCredits);
    setIndicator(manager.indicator);
  }, [manager]);
  const registeredRef = react.useRef(false);
  if (!registeredRef.current) {
    manager.onZoneChange(() => {
      sync();
    });
    registeredRef.current = true;
  }
  const update = react.useCallback(
    (spinResult) => {
      manager.update(spinResult);
      sync();
    },
    [manager, sync]
  );
  return {
    currentZone,
    gamesPlayed,
    netCredits,
    indicator,
    remainingGames,
    remainingCredits,
    update,
    _manager: manager
  };
}
function useCredit(config) {
  const managerRef = react.useRef(new CreditManager(config));
  const manager = managerRef.current;
  const [balance, setBalance] = react.useState(manager.balance);
  const [currentBet, setCurrentBet] = react.useState(manager.currentBet);
  const [history, setHistory] = react.useState([]);
  const sync = react.useCallback(() => {
    setBalance(manager.balance);
    setCurrentBet(manager.currentBet);
    setHistory(manager.getHistory());
  }, [manager]);
  const setBet = react.useCallback(
    (amount) => {
      manager.setBet(amount);
      sync();
    },
    [manager, sync]
  );
  const deposit = react.useCallback(
    (amount) => {
      manager.deposit(amount);
      sync();
    },
    [manager, sync]
  );
  const withdraw = react.useCallback(
    (amount) => {
      manager.withdraw(amount);
      sync();
    },
    [manager, sync]
  );
  const canSpin = balance >= currentBet;
  return {
    balance,
    currentBet,
    betOptions: config.betOptions,
    canSpin,
    history,
    setBet,
    deposit,
    withdraw,
    /** Expose manager for integration with other hooks */
    _manager: manager,
    /** Sync state after external manager mutations */
    _sync: sync
  };
}

// src/game/notification-manager.ts
var VALID_NOTIFICATION_TYPES = [
  "PRE_SPIN",
  "POST_SPIN",
  "NEXT_BET",
  "LEVER_ON"
];
var NotificationManager = class {
  constructor(config) {
    this.previousWin = null;
    this.validateConfig(config);
    this.enabledTypes = /* @__PURE__ */ new Map();
    for (const type of VALID_NOTIFICATION_TYPES) {
      this.enabledTypes.set(type, config.enabledTypes[type] ?? false);
    }
    this.targetRoleTypes = new Set(config.targetRoleTypes);
    this.onNotificationCallback = config.onNotification;
  }
  /**
   * 告知判定実行
   *
   * 指定されたタイミングで告知条件を評価し、条件を満たす場合に
   * onNotification コールバックを発火する。
   *
   * @param timing 告知タイミング
   * @param winningRole 当選役（PRE_SPIN, POST_SPIN, LEVER_ON で使用）
   * @param spinResult スピン結果（POST_SPIN で使用）
   */
  check(timing, winningRole, spinResult) {
    if (!VALID_NOTIFICATION_TYPES.includes(timing)) {
      throw new Error(`Invalid NotificationType: ${String(timing)}`);
    }
    if (!this.enabledTypes.get(timing)) {
      return;
    }
    switch (timing) {
      case "PRE_SPIN":
      case "LEVER_ON":
        this.handleCurrentGameNotification(timing, winningRole);
        break;
      case "POST_SPIN":
        this.handlePostSpinNotification(winningRole, spinResult);
        break;
      case "NEXT_BET":
        this.handleNextBetNotification();
        break;
    }
  }
  /**
   * 前ゲーム当選情報を保持する（NEXT_BET 告知用）
   * @param winningRole 前ゲームの当選役
   */
  setPreviousWin(winningRole) {
    this.previousWin = winningRole;
  }
  /**
   * 前ゲーム当選情報をクリアする
   */
  clearPreviousWin() {
    this.previousWin = null;
  }
  /**
   * PRE_SPIN / LEVER_ON 告知処理
   */
  handleCurrentGameNotification(timing, winningRole) {
    if (!winningRole) {
      return;
    }
    if (!this.isTargetRole(winningRole)) {
      return;
    }
    this.fireNotification(timing, winningRole);
  }
  /**
   * POST_SPIN 告知処理
   */
  handlePostSpinNotification(winningRole, spinResult) {
    if (!winningRole) {
      return;
    }
    if (!this.isTargetRole(winningRole)) {
      return;
    }
    this.fireNotification("POST_SPIN", winningRole, spinResult);
  }
  /**
   * NEXT_BET 告知処理: 前ゲーム当選情報に基づき告知し、発火後にクリアする
   */
  handleNextBetNotification() {
    if (!this.previousWin) {
      return;
    }
    if (!this.isTargetRole(this.previousWin)) {
      this.previousWin = null;
      return;
    }
    const win = this.previousWin;
    this.previousWin = null;
    this.fireNotification("NEXT_BET", win);
  }
  /**
   * 当選役が告知対象かどうかを判定する
   */
  isTargetRole(winningRole) {
    return this.targetRoleTypes.has(winningRole.type);
  }
  /**
   * onNotification コールバックを発火する
   */
  fireNotification(type, winningRole, spinResult) {
    if (!this.onNotificationCallback) {
      return;
    }
    const payload = {
      type,
      winningRole,
      timestamp: Date.now(),
      ...spinResult !== void 0 && { spinResult }
    };
    this.onNotificationCallback(payload);
  }
  /**
   * NotificationConfig のバリデーション
   */
  validateConfig(config) {
    if (config.enabledTypes) {
      for (const key of Object.keys(config.enabledTypes)) {
        if (!VALID_NOTIFICATION_TYPES.includes(key)) {
          throw new Error(
            `Invalid NotificationType in enabledTypes: ${key}. Valid types: [${VALID_NOTIFICATION_TYPES.join(", ")}]`
          );
        }
      }
    }
    if (config.onNotification !== void 0 && typeof config.onNotification !== "function") {
      throw new Error("onNotification must be a function");
    }
  }
};

// src/hooks/useNotification.ts
function useNotification(config) {
  const callbacksRef = react.useRef({});
  const queueRef = react.useRef([]);
  const [status, setStatus] = react.useState("idle");
  const [lastPayload, setLastPayload] = react.useState(null);
  const managerRef = react.useRef(null);
  if (!managerRef.current) {
    managerRef.current = new NotificationManager({
      ...config,
      onNotification: (payload) => {
        setStatus((prev) => {
          if (prev === "notified") {
            queueRef.current.push(payload);
            return "notified";
          }
          return "notified";
        });
        setLastPayload(payload);
        const cb = callbacksRef.current[payload.type];
        if (cb) cb(payload);
        config.onNotification?.(payload);
      }
    });
  }
  const manager = managerRef.current;
  const acknowledgeNotification = react.useCallback(() => {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      setLastPayload(next);
      setStatus("notified");
    } else {
      setStatus("idle");
      setLastPayload(null);
    }
  }, []);
  const onPreSpin = react.useCallback((cb) => {
    callbacksRef.current["PRE_SPIN"] = cb;
  }, []);
  const onPostSpin = react.useCallback((cb) => {
    callbacksRef.current["POST_SPIN"] = cb;
  }, []);
  const onNextBet = react.useCallback((cb) => {
    callbacksRef.current["NEXT_BET"] = cb;
  }, []);
  const onLeverOn = react.useCallback((cb) => {
    callbacksRef.current["LEVER_ON"] = cb;
  }, []);
  return {
    status,
    lastPayload,
    acknowledgeNotification,
    onPreSpin,
    onPostSpin,
    onNextBet,
    onLeverOn,
    _manager: manager
  };
}
function useSoundEffect(soundMap, emitter) {
  const [isMuted, setIsMuted] = react.useState(false);
  const [volume, setVolumeState] = react.useState(1);
  const isMutedRef = react.useRef(isMuted);
  const volumeRef = react.useRef(volume);
  isMutedRef.current = isMuted;
  volumeRef.current = volume;
  react.useEffect(() => {
    if (!emitter) return;
    const unsubs = [];
    for (const eventName of Object.keys(soundMap)) {
      const unsub = emitter.on(eventName, () => {
        if (isMutedRef.current) return;
      });
      unsubs.push(unsub);
    }
    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [emitter, soundMap]);
  const toggleMute = react.useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);
  const setVolume = react.useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
  }, []);
  return {
    soundMap,
    isMuted,
    volume,
    toggleMute,
    setVolume
  };
}

// src/game/spin-counter.ts
var SpinCounter = class {
  constructor(configs = []) {
    this.counters = /* @__PURE__ */ new Map();
    this.configs = /* @__PURE__ */ new Map();
    for (const config of configs) {
      this.configs.set(config.name, config);
      this.counters.set(config.name, 0);
    }
  }
  /**
   * カウンター値を名前で取得する。未知のカウンターの場合は0を返す。
   *
   * @param name - カウンター名
   * @returns カウンター値
   */
  get(name) {
    return this.counters.get(name) ?? 0;
  }
  /**
   * カウンターをインクリメントする。存在しないカウンターの場合は新規作成する。
   *
   * @param name - カウンター名
   */
  increment(name) {
    const current = this.counters.get(name) ?? 0;
    this.counters.set(name, current + 1);
  }
  /**
   * カウンターを0にリセットする。
   *
   * @param name - カウンター名
   */
  reset(name) {
    this.counters.set(name, 0);
  }
  /**
   * 全カウンターの値をレコードとして取得する。
   *
   * @returns カウンター名と値のレコード
   */
  getAll() {
    const result = {};
    for (const [name, value] of this.counters) {
      result[name] = value;
    }
    return result;
  }
  /**
   * 指定カウンターの設定を取得する。
   *
   * @param name - カウンター名
   * @returns カウンター設定。未定義の場合はundefined
   */
  getConfig(name) {
    return this.configs.get(name);
  }
  /**
   * リセット条件に一致するカウンターをリセットする。
   *
   * @param condition - リセット条件文字列
   * @returns リセットされたカウンター名の配列
   */
  checkResetCondition(condition) {
    const resetCounters = [];
    for (const [name, config] of this.configs) {
      if (config.resetCondition === condition) {
        this.reset(name);
        resetCounters.push(name);
      }
    }
    return resetCounters;
  }
};

// src/game/threshold-trigger.ts
function isThresholdRange(threshold) {
  return typeof threshold === "object" && "min" in threshold && "max" in threshold;
}
function resolveThreshold(threshold, randomFn = Math.random) {
  if (isThresholdRange(threshold)) {
    const { min, max } = threshold;
    return Math.floor(randomFn() * (max - min + 1)) + min;
  }
  return threshold;
}
function validateConfig(config) {
  const { threshold, counterName } = config;
  if (isThresholdRange(threshold)) {
    if (threshold.min <= 0 || threshold.max <= 0) {
      throw new Error(`Invalid threshold range for "${counterName}": min and max must be greater than 0`);
    }
    if (threshold.min > threshold.max) {
      throw new Error(`Invalid threshold range for "${counterName}": min (${threshold.min}) must not exceed max (${threshold.max})`);
    }
  } else {
    if (threshold <= 0) {
      throw new Error(`Invalid threshold for "${counterName}": threshold must be greater than 0`);
    }
  }
}
var ThresholdTrigger = class {
  constructor(configs = [], randomFn) {
    this.configs = /* @__PURE__ */ new Map();
    this.resolvedThresholds = /* @__PURE__ */ new Map();
    this.callbacks = [];
    this.randomFn = randomFn ?? Math.random;
    for (const config of configs) {
      validateConfig(config);
      this.configs.set(config.counterName, config);
      this.resolvedThresholds.set(
        config.counterName,
        resolveThreshold(config.threshold, this.randomFn)
      );
    }
  }
  /**
   * カウンター値が閾値に到達したかチェックする。到達時はコールバックを発火しtrueを返す。
   *
   * @param counterName - カウンター名
   * @param value - 現在のカウンター値
   * @returns 閾値に到達した場合true
   */
  check(counterName, value) {
    const threshold = this.resolvedThresholds.get(counterName);
    if (threshold === void 0) {
      return false;
    }
    if (value >= threshold) {
      const config = this.configs.get(counterName);
      for (const cb of this.callbacks) {
        cb(counterName, value, config.action);
      }
      return true;
    }
    return false;
  }
  /**
   * 閾値到達時のコールバックを登録する。
   *
   * @param callback - カウンター名、到達値、アクション名を受け取るコールバック
   */
  onThresholdReached(callback) {
    this.callbacks.push(callback);
  }
  /**
   * 閾値を再抽選する（ThresholdRange設定時）。固定閾値の場合は変更なし。
   *
   * @param counterName - カウンター名
   */
  reroll(counterName) {
    const config = this.configs.get(counterName);
    if (!config) {
      return;
    }
    this.resolvedThresholds.set(
      counterName,
      resolveThreshold(config.threshold, this.randomFn)
    );
  }
  /**
   * 指定カウンターの現在の解決済み閾値を取得する。
   *
   * @param counterName - カウンター名
   * @returns 解決済み閾値。未定義の場合はundefined
   */
  getThreshold(counterName) {
    return this.resolvedThresholds.get(counterName);
  }
  /**
   * 全カウンターの解決済み閾値をレコードとして取得する。
   *
   * @returns カウンター名と閾値のレコード
   */
  getAllThresholds() {
    const result = {};
    for (const [name, value] of this.resolvedThresholds) {
      result[name] = value;
    }
    return result;
  }
};

// src/hooks/useThresholdTrigger.ts
function useThresholdTrigger(configs) {
  const counterRef = react.useRef(
    new SpinCounter(
      configs.map((c) => ({
        name: c.counterName,
        targetGameMode: c.targetGameMode,
        resetCondition: c.resetCondition
      }))
    )
  );
  const triggerRef = react.useRef(new ThresholdTrigger(configs));
  const counter = counterRef.current;
  const trigger = triggerRef.current;
  const [counters, setCounters] = react.useState(counter.getAll());
  const [thresholds, setThresholds] = react.useState(trigger.getAllThresholds());
  const resetCounter = react.useCallback(
    (name) => {
      counter.reset(name);
      trigger.reroll(name);
      setCounters(counter.getAll());
      setThresholds(trigger.getAllThresholds());
    },
    [counter, trigger]
  );
  return {
    counters,
    thresholds,
    resetCounter,
    _counter: counter,
    _trigger: trigger,
    /** Sync state after external mutations */
    _sync: () => {
      setCounters(counter.getAll());
      setThresholds(trigger.getAllThresholds());
    }
  };
}

// src/game/difficulty-preset.ts
var DifficultyPreset = class {
  constructor(config) {
    this.validateConfig(config);
    this.levels = config.levels;
    this._currentLevel = config.initialLevel;
  }
  /** 現在の設定段階 */
  get currentLevel() {
    return this._currentLevel;
  }
  /** 現在のDifficultyConfig */
  get currentConfig() {
    return this.levels[this._currentLevel];
  }
  /**
   * 設定段階変更。指定した段階のDifficultyConfigに切り替える。
   *
   * @param level - 設定段階番号
   * @throws 未定義の設定段階が指定された場合
   */
  setDifficulty(level) {
    if (!(level in this.levels)) {
      throw new Error(`Invalid difficulty level: ${level}. Available levels: ${Object.keys(this.levels).join(", ")}`);
    }
    this._currentLevel = level;
  }
  /**
   * 利用可能な設定段階一覧を取得する。
   *
   * @returns 設定段階番号の配列
   */
  getAvailableLevels() {
    return Object.keys(this.levels).map(Number);
  }
  validateConfig(config) {
    if (!config.levels || Object.keys(config.levels).length === 0) {
      throw new Error("DifficultyPresetConfig must have at least one level defined");
    }
    if (!(config.initialLevel in config.levels)) {
      throw new Error(`Initial level ${config.initialLevel} is not defined in levels`);
    }
    for (const [levelKey, diffConfig] of Object.entries(config.levels)) {
      this.validateDifficultyConfig(Number(levelKey), diffConfig);
    }
  }
  validateDifficultyConfig(level, config) {
    for (const [key, value] of Object.entries(config.lotteryProbabilities)) {
      if (value < 0 || value > 1) {
        throw new Error(`Invalid lottery probability for "${key}" at level ${level}: ${value}. Must be between 0 and 1`);
      }
    }
    if (config.transitionProbabilities) {
      for (const [key, value] of Object.entries(config.transitionProbabilities)) {
        if (value !== void 0 && (value < 0 || value > 1)) {
          throw new Error(`Invalid transition probability for "${key}" at level ${level}: ${value}. Must be between 0 and 1`);
        }
      }
    }
    if (config.replayProbability < 0 || config.replayProbability > 1) {
      throw new Error(`Invalid replay probability at level ${level}: ${config.replayProbability}. Must be between 0 and 1`);
    }
  }
};

// src/hooks/useDifficulty.ts
function useDifficulty(config) {
  const presetRef = react.useRef(new DifficultyPreset(config));
  const preset = presetRef.current;
  const [currentLevel, setCurrentLevel] = react.useState(preset.currentLevel);
  const [currentConfig, setCurrentConfig] = react.useState(preset.currentConfig);
  const setDifficulty = react.useCallback(
    (level) => {
      preset.setDifficulty(level);
      setCurrentLevel(preset.currentLevel);
      setCurrentConfig(preset.currentConfig);
    },
    [preset]
  );
  return {
    currentLevel,
    currentConfig,
    setDifficulty,
    _preset: preset
  };
}
function useEvent(emitter) {
  const unsubscribesRef = react.useRef([]);
  const emit = react.useCallback(
    (event, payload) => {
      emitter.emit(event, payload);
    },
    [emitter]
  );
  const on = react.useCallback(
    (event, listener) => {
      const unsub = emitter.on(event, listener);
      unsubscribesRef.current.push(unsub);
    },
    [emitter]
  );
  react.useEffect(() => {
    return () => {
      for (const unsub of unsubscribesRef.current) {
        unsub();
      }
      unsubscribesRef.current = [];
    };
  }, [emitter]);
  return { emit, on };
}

// src/core/internal-lottery.ts
var DEFAULT_ROLE_DEFINITIONS = [
  {
    id: "cherry",
    name: "\u30C1\u30A7\u30EA\u30FC",
    type: "SMALL_WIN",
    payout: 2,
    patterns: [["cherry", "ANY", "ANY"]],
    priority: 10
  },
  {
    id: "watermelon",
    name: "\u30B9\u30A4\u30AB",
    type: "SMALL_WIN",
    payout: 6,
    patterns: [["watermelon", "watermelon", "watermelon"]],
    priority: 20
  },
  {
    id: "bell",
    name: "\u30D9\u30EB",
    type: "SMALL_WIN",
    payout: 8,
    patterns: [["bell", "bell", "bell"]],
    priority: 30
  },
  {
    id: "replay",
    name: "\u30EA\u30D7\u30EC\u30A4",
    type: "REPLAY",
    payout: 0,
    patterns: [["replay", "replay", "replay"]],
    priority: 5
  },
  {
    id: "super_big_bonus",
    name: "SUPER BIG BONUS",
    type: "BONUS",
    payout: 0,
    patterns: [["seven", "seven", "seven"]],
    priority: 100
  },
  {
    id: "big_bonus",
    name: "BIG BONUS",
    type: "BONUS",
    payout: 0,
    patterns: [["bar", "bar", "bar"]],
    priority: 90
  },
  {
    id: "reg_bonus",
    name: "REG BONUS",
    type: "BONUS",
    payout: 0,
    patterns: [["seven", "seven", "bar"]],
    priority: 80
  }
];
var BONUS_ID_TO_TYPE = {
  super_big_bonus: "SUPER_BIG_BONUS",
  big_bonus: "BIG_BONUS",
  reg_bonus: "REG_BONUS"
};
function definitionToRole(def, bonusType) {
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    bonusType,
    payout: def.payout,
    patterns: def.patterns,
    priority: def.priority
  };
}
var MISS_ROLE2 = {
  id: "miss",
  name: "\u30CF\u30BA\u30EC",
  type: "MISS",
  payout: 0,
  patterns: [],
  priority: 0
};
var InternalLottery = class {
  constructor(config) {
    this.carryOver = null;
    const definitions = config.winningRoleDefinitions.length > 0 ? config.winningRoleDefinitions : DEFAULT_ROLE_DEFINITIONS;
    this.validateDefinitions(definitions);
    this.validateProbabilities(config.probabilities);
    this.probabilities = config.probabilities;
    this.roleDefinitions = definitions;
    this.randomFn = config.randomFn ?? Math.random;
    this.roleMap = /* @__PURE__ */ new Map();
    for (const def of this.roleDefinitions) {
      this.roleMap.set(def.id, def);
    }
  }
  /**
   * 内部抽選を実行し、WinningRole を返却する
   *
   * @param gameMode - 現在のゲームモード
   * @param difficultyLevel - 設定段階（オプション、将来の DifficultyPreset 連携用）
   * @returns 当選役
   */
  draw(gameMode, _difficultyLevel) {
    if (this.carryOver !== null) {
      const carried = this.carryOver.winningRole;
      this.carryOver = { ...this.carryOver, gameCount: this.carryOver.gameCount + 1 };
      return carried;
    }
    const modeProbabilities = this.probabilities[gameMode];
    if (!modeProbabilities) {
      return MISS_ROLE2;
    }
    const roll = this.randomFn();
    let cumulative = 0;
    for (const [roleId, probability] of Object.entries(modeProbabilities)) {
      cumulative += probability;
      if (roll < cumulative) {
        const def = this.roleMap.get(roleId);
        if (def) {
          const bonusType = def.type === "BONUS" ? this.resolveBonusType(roleId) : void 0;
          return definitionToRole(def, bonusType);
        }
        return this.resolveByType(roleId);
      }
    }
    return MISS_ROLE2;
  }
  /**
   * CarryOverFlag を設定する。取りこぼし時にボーナス当選状態を持ち越す。
   *
   * @param winningRole - 持ち越す当選役
   */
  setCarryOver(winningRole) {
    this.carryOver = {
      winningRole,
      gameCount: 0
    };
  }
  /**
   * 現在の CarryOverFlag を取得する。
   *
   * @returns 持ち越しフラグ。持ち越し中でない場合はnull
   */
  getCarryOverFlag() {
    return this.carryOver;
  }
  /**
   * CarryOverFlag をクリアする
   */
  clearCarryOver() {
    this.carryOver = null;
  }
  /**
   * BONUS 種別を解決する
   */
  resolveBonusType(roleId) {
    return BONUS_ID_TO_TYPE[roleId];
  }
  /**
   * roleId を WinningRoleType として解釈し、WinningRole を生成する
   */
  resolveByType(roleId) {
    const typeMap = {
      BONUS: "BONUS",
      SMALL_WIN: "SMALL_WIN",
      REPLAY: "REPLAY",
      MISS: "MISS"
    };
    const type = typeMap[roleId];
    if (type) {
      const def = this.roleDefinitions.find((d) => d.type === type);
      if (def) {
        const bonusType = type === "BONUS" ? this.resolveBonusType(def.id) : void 0;
        return definitionToRole(def, bonusType);
      }
      return { ...MISS_ROLE2, id: roleId, type };
    }
    return MISS_ROLE2;
  }
  /**
   * 小役定義のバリデーション
   */
  validateDefinitions(definitions) {
    const ids = /* @__PURE__ */ new Set();
    for (const def of definitions) {
      if (ids.has(def.id)) {
        throw new Error(`Duplicate WinningRoleDefinition ID: "${def.id}"`);
      }
      ids.add(def.id);
      if (def.payout < 0) {
        throw new Error(
          `Negative payout for WinningRoleDefinition "${def.id}": ${def.payout}`
        );
      }
      if (!def.patterns || def.patterns.length === 0) {
        throw new Error(
          `Empty patterns for WinningRoleDefinition "${def.id}"`
        );
      }
    }
  }
  /**
   * 確率設定のバリデーション
   */
  validateProbabilities(probabilities) {
    for (const [mode, probs] of Object.entries(probabilities)) {
      const sum = Object.values(probs).reduce((acc, p) => acc + p, 0);
      if (sum > 1 + 1e-10) {
        throw new Error(
          `Probability sum exceeds 1 for GameMode "${mode}": ${sum}`
        );
      }
      for (const [roleId, prob] of Object.entries(probs)) {
        if (prob < 0) {
          throw new Error(
            `Negative probability for "${roleId}" in GameMode "${mode}": ${prob}`
          );
        }
      }
    }
  }
};

// src/infrastructure/event-emitter.ts
var EventEmitter = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * イベントを発火し、登録済みの全リスナーにペイロードを配信する。
   * 購読者がいない場合は何もしない。
   *
   * @typeParam T - ペイロードの型
   * @param event - イベント名
   * @param payload - イベントペイロード（省略可）
   */
  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      listener(payload);
    }
  }
  /**
   * イベントを購読する。
   *
   * @typeParam T - ペイロードの型
   * @param event - イベント名
   * @param listener - イベントリスナー関数
   * @returns 購読解除関数
   */
  on(event, listener) {
    let set = this.listeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.listeners.set(event, set);
    }
    const wrapped = listener;
    set.add(wrapped);
    return () => {
      this.off(event, wrapped);
    };
  }
  /**
   * イベントの購読を解除する。
   *
   * @param event - イベント名
   * @param listener - 解除するリスナー関数
   */
  off(event, listener) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }
};

// src/utils/config-serializer.ts
var REQUIRED_FIELDS = [
  "reelConfigs",
  "payTable",
  "paylines",
  "modeTransitionConfig",
  "bonusConfigs",
  "btConfig",
  "chanceConfig",
  "notificationConfig",
  "zoneConfigs",
  "betConfig",
  "thresholdConfigs",
  "difficultyConfigs",
  "winningRoleDefinitions"
];
var ConfigSerializer = {
  /**
   * GameConfig を JSON 文字列にシリアライズする。
   *
   * @param config - シリアライズ対象のGameConfig
   * @returns JSON文字列
   */
  serialize(config) {
    return JSON.stringify(config);
  },
  /**
   * JSON 文字列を GameConfig にデシリアライズする。
   *
   * @param json - デシリアライズ対象のJSON文字列
   * @returns パースされたGameConfig
   * @throws 不正な JSON の場合はパースエラー
   * @throws 必須フィールド欠落の場合はバリデーションエラー
   */
  deserialize(json) {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse JSON: ${message}`);
    }
    if (!ConfigSerializer.validate(parsed)) {
      const missing = getMissingFields(parsed);
      throw new Error(
        `Invalid GameConfig: missing required fields: ${missing.join(", ")}`
      );
    }
    return parsed;
  },
  /**
   * 値が有効な GameConfig かどうかを検証する型ガード。
   *
   * @param config - 検証対象の値
   * @returns GameConfigとして有効な場合true
   */
  validate(config) {
    if (config === null || typeof config !== "object") {
      return false;
    }
    const obj = config;
    return REQUIRED_FIELDS.every(
      (field) => field in obj && obj[field] !== void 0
    );
  }
};
function getMissingFields(value) {
  if (value === null || typeof value !== "object") {
    return [...REQUIRED_FIELDS];
  }
  const obj = value;
  return REQUIRED_FIELDS.filter(
    (field) => !(field in obj) || obj[field] === void 0
  );
}

exports.AnimationController = AnimationController;
exports.ConfigSerializer = ConfigSerializer;
exports.CreditManager = CreditManager;
exports.DifficultyPreset = DifficultyPreset;
exports.EventEmitter = EventEmitter;
exports.GameCycleManager = GameCycleManager;
exports.GameModeManager = GameModeManager;
exports.InternalLottery = InternalLottery;
exports.NotificationManager = NotificationManager;
exports.Reel = Reel;
exports.ReelController = ReelController;
exports.SlotMachine = SlotMachine;
exports.SpinCounter = SpinCounter;
exports.SpinEngine = SpinEngine;
exports.StopButton = StopButton;
exports.Symbol = Symbol;
exports.ThresholdTrigger = ThresholdTrigger;
exports.ZoneManager = ZoneManager;
exports.useCredit = useCredit;
exports.useDifficulty = useDifficulty;
exports.useEvent = useEvent;
exports.useGameCycle = useGameCycle;
exports.useGameMode = useGameMode;
exports.useGameZone = useGameZone;
exports.useNotification = useNotification;
exports.useSlotMachine = useSlotMachine;
exports.useSoundEffect = useSoundEffect;
exports.useThresholdTrigger = useThresholdTrigger;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map