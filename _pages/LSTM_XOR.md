---
layout: blog
permalink: /LSTM_XOR/
title: ""
date: 2014-06-02T15:05:16-04:00
modified: 2016-01-04T16:38:17-05:00
excerpt: ""
ads: false
fullwidth: true
tiles: true
feature:
  visible: false
  headline: "Featured Work"
  category: blog_LSTM_XOR
---
<hr>
{{ page.excerpt | markdownify }}
<br>
This article talks about training an LSTM to solve the XOR problem: that is, given a sequence of bits, 
determine its parity. This problem is one of the starter problem as part of OpenAI Research 2.0. The LSTM should consume the sequence, one bit at a time, and then output the 
correct answer at the sequence’s end. Test the two approaches below:
* Generate a dataset of random 100,000 binary strings of length 50. Train the LSTM; what performance do you get?
* Generate a dataset of random 100,000 binary strings, where the length of each string is independently and randomly chosen between 1 and 50. Train the LSTM. 
Does it succeed? What explains the difference?
