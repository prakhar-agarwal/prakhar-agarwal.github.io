# Prakhar Agarwal — Personal Site

A minimal personal website with blog, built with Jekyll and hosted on GitHub Pages.

Design inspired by modern minimalistic websites.

## Features

- **ASCII molecule viewer** on the homepage (Three.js + AsciiEffect)
- **Interactive gears animation** on the About page
- **Thesis chooser** with choose-your-own-adventure style cards
- **Photo gallery** with hover captions on the Projects page
- **Blog** powered by Jekyll (write posts in Markdown)
- **Hidden "Vision" page** with particle effect easter egg
- **Responsive** — stacks on mobile

## Quick Start

### Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `yourusername.github.io` for a user site, or any name for a project site)
2. Push this directory to the repo
3. Go to **Settings → Pages → Source** and select the branch (usually `main`)
4. Your site will be live at `https://yourusername.github.io/`

If using a **project site** (not `username.github.io`), update `baseurl` in `_config.yml`:
```yaml
baseurl: "/your-repo-name"
```

### Run Locally

```bash
# Install dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve --livereload
```

Then open [http://localhost:4000](http://localhost:4000).

## Structure

```
├── _config.yml          # Jekyll configuration
├── _layouts/
│   ├── default.html     # Shared page shell (nav, footer, etc.)
│   ├── home.html        # Homepage with molecule viewer
│   └── post.html        # Blog post template
├── _includes/
│   └── nav.html         # Navigation partial
├── _posts/              # Blog posts (Markdown)
│   └── 2026-07-02-hello-world.md
├── static/
│   ├── style.css        # All styles
│   ├── molecule.js      # Three.js ASCII molecule viewer
│   ├── gears.js         # Gears animation (About page)
│   ├── rastrigin.js     # Rastrigin visualization (Thesis page)
│   ├── particles.js     # Hidden nav particle effect
│   └── favicon.svg      # Favicon (your initials)
├── index.html           # Homepage
├── about/index.md       # About page
├── now/index.md         # Now page
├── thesis/index.html    # Theses page
├── projects/index.md    # Projects page
├── writing/index.md     # Writing page
├── cv/index.md          # CV page
├── vision/index.md      # Vision page (hidden)
└── blog/index.html      # Blog listing page
```

## Writing Blog Posts

Create a new file in `_posts/` with the naming convention:

```
YYYY-MM-DD-your-post-title.md
```

Add front matter at the top:

```yaml
---
layout: post
title: "Your Post Title"
date: 2026-07-02
description: "A short description shown on the listing page."
nav: blog
---
```

Write your content below in Markdown. Push to GitHub and it builds automatically.

## Customization

- **Name/title**: Edit `title` in `_config.yml`
- **Content**: Edit the `index.md` files in each page directory (look for `<!-- TODO -->` comments)
- **Favicon**: Edit `static/favicon.svg` (change the initials)
- **Colors**: Edit `static/style.css`
- **Molecule quotes**: Edit the `quotes` array in `static/molecule.js`
- **Add/remove nav items**: Edit `_includes/nav.html`
