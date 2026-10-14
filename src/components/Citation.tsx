"use client";

import { useState } from "react";

const BIBTEX = `@misc{wu2026securecodebenchmarkcode,
  title={Last Secure Code Benchmark: Is the Code You Vibe Secure?},
  author={Tianyi Wu and Chao Ge and Peng Chen and Fengji Zhang and Yongxing Wu and Yuchong Xie and Jian Li and Chaoyuan Peng and Kaikai Zhang and Dong Huang and Mingzhe Du and Yukai Huang and Jiaheng Zhang and Terry Yue Zhuo and See-Kiong Ng},
  year={2026},
  eprint={2610.14766},
  archivePrefix={arXiv},
  primaryClass={cs.CR},
  url={https://arxiv.org/abs/2610.14766}
}`;

export default function Citation() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="citation" className="section band">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <p className="section-kicker">cite us</p>
          <h2 className="section-title mt-2">Citation</h2>
          <p className="mt-4 text-sm text-zinc-400">
            If you use this work in your research, please cite the following:
          </p>
          <div className="bibtex-box mt-5">
            <pre>
              <code>{BIBTEX}</code>
            </pre>
            <button className="copy-btn" onClick={copy} title="Copy BibTeX">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
