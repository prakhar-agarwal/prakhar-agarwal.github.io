---
layout: default
title: "The Intuition Gap Explainer"
nav: explainer
---

# The Intuition Gap Explainer

There is often a massive gap between a catchy machine learning buzzword—like *"use RLHF"* or *"add a KL penalty"*—and the messy, treacherous reality of actually implementing it. I call this the **Intuition Gap**. 

As researchers and engineers, we frequently gloss over the brittle hyperparameters, hidden assumptions, and scaling bottlenecks that make or break these systems in production. 

To help bridge this gap, I built a small **local AI assistant** directly into this page. 

<div class="explainer-container">
  <div class="explainer-input-group">
    <input type="text" id="explainer-input" placeholder="e.g. RLHF, KL Penalty, KV Cache..." autocomplete="off">
    <button id="explainer-submit">Explain</button>
  </div>
  <div id="explainer-status" class="explainer-status">WebLLM is sleeping. Focus the input box to wake it up.</div>
  <div id="explainer-output" class="explainer-output"></div>
</div>

### How it works
This tool doesn't send your data to any server. It uses [WebLLM](https://webllm.mlc.ai/) and WebGPU to download the model weights (Gemma 2B) and run inference **100% locally on your device's GPU**. 

*Note: Because it runs entirely in your browser, it may take a minute to download the ~1.5GB model cache on your very first run.*

<script type="module" src="{{ site.baseurl }}/static/intuition-explainer.js"></script>
