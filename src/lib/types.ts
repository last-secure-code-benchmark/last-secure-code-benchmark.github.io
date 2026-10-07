export interface Metrics {
  cost?: number | null;
  out_tokens?: number | null;
  time_min?: number | null;
  llm_calls?: number | null;
}

/** 轨迹查看器的 turn：user/system=消息，assistant=推理+工具调用，tool=工具返回 */
export interface TrajToolCall {
  id: string;
  name: string;
  args: string;
}

export interface TrajTurn {
  n: number;
  role: "system" | "user" | "assistant" | "tool";
  content?: string;            // user / system
  reasoning?: string;          // assistant
  tool_calls?: TrajToolCall[]; // assistant
  tool_call_id?: string;       // tool
  name?: string;               // tool: 工具名
  output?: string;             // tool
}

export interface TaskTrajectory {
  task: string;
  turns: TrajTurn[];
  /** verifier/reward.json 的最终判定 */
  verdict?: { functional?: number; secure?: number; reward?: number } | null;
  /** verifier/test-stdout.txt（留头掐尾） */
  stdout?: string;
  /** agent 最终 workspace 产物：相对路径 -> 内容（null = 二进制/超大只列名） */
  files?: Record<string, string | null>;
}

/** VSB 三档：同一个漏洞在三种上下文量下切出来的任务 */
export type Tier = "function" | "file" | "repo";

export interface TaskResult {
  id: string;
  name: string;
  tier?: Tier;
  /** reward == 1（functional AND secure） */
  solved: boolean;
  /** 项目测试是否仍通过 */
  functional?: boolean;
  /** 漏洞是否真的被补上 */
  secure?: boolean;
  /** 非正常退出原因（限流/超时等），正常结束则无 */
  exit_reason?: string;
  time_min?: number;
  llm_calls?: number;
  /** 轨迹在 /trajectories/<traj_key>/<id>.json 里，展开时懒加载 */
  has_traj?: boolean;
}

export interface TierSplit {
  function?: number;
  file?: number;
  repo?: number;
}

export interface ResultRow extends TierSplit {
  model?: string;
  agent?: string;
  source?: string;
  source_url?: string;
  date?: string;
  eval_note?: string;
  /** reward=1 的总数（= function+file+repo 三档之和） */
  on_target?: number | null;
  /** 第二根柱：functional=1 的分档计数（"测试还过"的面） */
  functional_split?: TierSplit | null;
  /** 有 verifier 分数的题数（非正常退出的题不计入） */
  n_scored?: number;
  n_total?: number;
  /** 轨迹文件名：/trajectories/<traj_key>.json */
  traj_key?: string;
  metrics?: Metrics;
  metrics_success?: Metrics;
  version?: string;
  focus?: "model" | "agent";
  hidden?: boolean;
  subRows?: ResultRow[];
  tasks?: TaskResult[];
  _sub?: boolean;
}

export interface LeaderboardData {
  instances: {
    total: number;
    function: number;
    file: number;
    repo: number;
  };
  results: ResultRow[];
}

/** /traces 浏览页的目录条目（public/trajectories/catalog.json） */
export interface CatalogEntry {
  traj_key: string;
  model?: string;
  agent?: string;
  task: string;
  tier?: Tier;
  functional?: boolean;
  secure?: boolean;
  reward?: number;
  exit_reason?: string;
  time_min?: number;
  llm_calls?: number;
  n_turns?: number;
  n_files?: number;
  has_verdict?: boolean;
}
