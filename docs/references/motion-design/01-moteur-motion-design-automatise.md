# How to Build an Automated Motion Design System that Generates $$$

*By eigen (@e1genqq)*

![Banner](https://pbs.twimg.com/media/HUhIM58X0AEEsSi?format=webp&name=medium)

****[advanced model] + A Render Engine + A Repeatable Workflow**** (+ my custom plugins and scripts for motion design generation).  
  
**This article was written by an Visual Effects Supervisor from a motion studio with 200+ regular clients.**

People are making insane motion graphics with [advanced model].

Product launches. Animated dashboards. UI transformations. Entire videos rendered from code.

But here's what interests me more.

What if you could turn this into a system that creates videos for different products, brands, and clients without rebuilding everything from scratch?

One brief. One production engine. Multiple finished videos.

And potentially, a business around it.

This is a full course on how I'd build that system.

Not just prompts. The actual rendering engine, animation logic, reusable templates, quality control, automation, and monetization.

## 01. First, Understand What's Actually Happening

On September 22, 2026, Anthropic released [advanced model].

Soon after, people started sharing surprisingly sophisticated motion-design videos made with coding agents.

Some were generated from short instructions. Others involved much more elaborate workflows.

One of the most interesting examples came from [@twoclipping](https://x.com/@twoclipping).

[Publication sur X](https://x.com/i/web/status/2103273003555402193)

The animation moves through different interface states: buttons, loaders, players, sliders, charts, and menus.

But the interesting part isn't the visual result.

It's the underlying mechanism.

The model didn't generate an ordinary AI video. It wrote code to draw every frame.

A function called seek(t) controls what appears at any given moment.

The browser renders the frames. FFmpeg turns them into an MP4.

And because the animation is defined mathematically, you can edit its timing, colors, text, and movement without regenerating the entire video with a generative video model.

That's a completely different production model.

The output isn't just a video.

****It's a programmable animation.****

We're going to use that same technical foundation, then build a production and commercial system on top.

## 02. The System We're Building

Here's the goal.

Imagine a SaaS founder sends you a website, logo, brand colors, screenshots, and a short explanation of their product.

Your system produces:

- A 25-second animated product video.
- Three different opening hooks.
- Three aspect ratios: 9:16, 1:1, and 16:9.
- Two different calls to action.
- Matching brand colors, typography, and UI.
- Final MP4 files ready for distribution.

That's 18 exports from one campaign.

Not 18 completely different films, but 18 usable combinations of creative, format, and CTA.

And the next client goes through the same pipeline.

The architecture

****Brief → Structured Data → Animation Engine → Frame Review → Video Render → Campaign Variants****

![Image](https://pbs.twimg.com/media/HUhDN_MWsAAu20Q.jpg)

There are six important parts.

****The Brief Compiler:**** Converts client information into structured project data.

****The Scene Engine:**** Turns that data into animation instructions.

****The Renderer:**** Produces frames at specific timestamps.

****The Quality Controller:**** Finds problems before delivery.

****The Variant Generator:**** Creates different hooks, formats, and CTAs.

****The Delivery System:**** Packages everything for the client.

[advanced model] can help write and maintain these components.

The important distinction is that the resulting code should do the repeatable production work without requiring a new long AI conversation for every export.

## 03. The Tools I'd Actually Use

You don't need twenty GitHub repositories.

You need a small stack with clearly defined responsibilities.

[advanced model]

The coding agent.

It writes animation components, builds the renderer, understands brand references, fixes layout problems, and helps automate repetitive production tasks.

Use Claude Code or another coding environment that can actually execute commands and inspect files.

Remotion

[github.com/remotion-dev/remotion](https://github.com/remotion-dev/remotion)

https://github.com/remotion-dev/remotion

This is where the system becomes scalable.

Remotion renders videos using React components.

Instead of treating every scene as an isolated animation, you can create reusable components such as:

- Animated titles.
- Product screenshots.
- Data visualizations.
- Feature reveals.
- Logo transitions.
- CTA animations.

Its parameterized rendering system allows you to pass different data into the same composition.

That is exactly what a repeatable video production system needs.

Remotion Agent Skills

[github.com/remotion-dev/skills](https://github.com/remotion-dev/skills)

https://github.com/remotion-dev/skills

Install the official skills:

npx skills add remotion-dev/skills

They provide agent-specific guidance for creating compositions, animations, captions, rendering, and more.

Playwright + FFmpeg

Playwright controls the browser.

FFmpeg handles video encoding, audio processing, and various export operations.

These are especially useful for a custom seek(t) renderer built with Canvas, SVG, or HTML.

Optional: HyperFrames

[github.com/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)

https://github.com/heygen-com/hyperframes

An alternative framework for creating deterministic video from HTML, CSS, media, and seekable animations.

It's worth exploring if you prefer thinking in web interfaces rather than React video compositions.

****My choice:**** Build the reusable commercial templates in Remotion, while understanding and experimenting with seek(t) directly.

You don't need to run both renderers for every project.

![Image](https://pbs.twimg.com/media/HUhEOOZW4AADQRJ.jpg)

## 04. Turn Client Information Into Structured Dat

This is the first underappreciated part.

Most people give Claude a paragraph describing a video and immediately ask it to animate something.

That works for experiments.

It becomes unreliable when you're making content for different clients.

I would separate the creative input from the animation code.

For example, a fictional product called Nova might use this campaign file:

```
{
  "project": "nova-launch",
  "duration": 25,
  "brand": {
    "name": "Nova",
    "primary": "#2563EB",
    "background": "#F7F8FA",
    "font": "Inter"
  },
  "assets": {
    "logo": "assets/logo.svg",
    "dashboard": "assets/dashboard.png"
  },
  "scenes": [
    {
      "id": "hook",
      "start": 0,
      "end": 3,
      "type": "kinetic-title"
    },
    {
      "id": "product",
      "start": 3,
      "end": 9,
      "type": "interface-reveal"
    },
    {
      "id": "features",
      "start": 9,
      "end": 18,
      "type": "feature-sequence"
    },
    {
      "id": "cta",
      "start": 18,
      "end": 25,
      "type": "cta"
    }
  ],
  "variants": {
    "hooks": 3,
    "formats": ["9:16", "1:1", "16:9"],
    "ctas": 2
  }
}
```

This file describes what the video contains.

The animation system decides how those things appear.

That's an important separation.

Change the text, asset, brand, or CTA, and you shouldn't have to rewrite the animation engine.

The Real Edge: Validate Before Rendering

Every campaign should pass a few checks before any expensive render begins.

Are all referenced assets present? Do the fonts load? Is the CTA too long for its component? Are the claims approved by the client?

If a product claims to increase conversion by 240%, the system should not invent that statistic.

It must come from approved client information.

Build these checks into the input pipeline.

A production system should reject bad input instead of generating a beautiful video containing incorrect information.

## 05. Build the Actual seek(t) Animation Engine

Now the interesting technical part.

The basic idea is simple.

****The animation must be a function of time, not a sequence of events that happened previously.****

At 30 FPS, a 25-second video contains 750 frames.

For frame number f:

t = f / 30

The renderer tells the animation to draw its state at that exact time.

Your code should be able to produce frame 600 without rendering frames 0 through 599 first.

That means:

- No dependence on previous frames.
- No uncontrolled randomness.
- No timer-driven CSS transitions during rendering.
- No animation state that only exists because something happened earlier.

Instead, every visible property is calculated from the requested timestamp.

Here's a tiny Canvas example.

```
<canvas id="stage" width="1080" height="1920"></canvas>

<script>
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const clamp = x => Math.max(0, Math.min(1, x));

const ease = x => 1 - Math.pow(1 - clamp(x), 3);

window.seek = function(t) {
  ctx.fillStyle = "#F7F8FA";
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 86px sans-serif";
  ctx.fillText("BUILD FASTER", 96, 340);

  const progress = ease((t - 3) / 2);

  ctx.fillStyle = "#E5E7EB";
  ctx.fillRect(96, 510, 888, 26);

  ctx.fillStyle = "#2563EB";
  ctx.fillRect(96, 510, 888 * progress, 26);
};

window.seek(0);
</script>
```

This is only one simple animation element, not the complete film.

But it proves the mechanism.

At seek(3), the progress bar is empty.

At seek(4), it is partially filled.

At seek(5), it has completed the animation.

Call the same timestamp again, and the same state is drawn.  
  
and this is what that looks like in practice:

[Publication sur X](https://x.com/i/web/status/2105031774904766641)

How to Render It

Install Playwright and Chromium, then make sure FFmpeg is installed.

npm init -y  
npm install playwright  
npx playwright install chromium

Create a Node renderer that:

1. Opens the animation in Chromium.
2. Waits for fonts and assets to load.
3. Calls window.seek(frame / fps).
4. Captures the Canvas.
5. Sends the resulting image sequence to FFmpeg.

The encoding stage can use an FFmpeg pipeline such as:

```
ffmpeg -framerate 30 \
  -i frames/%05d.png \
  -c:v libx264 \
  -crf 18 \
  -pix_fmt yuv420p \
  output.mp4
```

This example expects numbered PNG frames in the frames directory.

For a production pipeline, I would usually avoid saving thousands of intermediate PNGs unless they're needed for debugging. Streaming frames or using Remotion's rendering APIs can be more efficient.

![Image](https://pbs.twimg.com/media/HUhEVXGWAAA5yg0.jpg)

Why This Matters Commercially

If a client wants their CTA changed from “Start Free” to “Book a Demo,” you change data and re-render.

If they want their blue accent changed to green, you update the brand configuration.

If they want a vertical version, you change the composition and layout rules.

You are no longer creating every video as an entirely separate manual project.

## 06. Make the Motion Look Expensive

A working renderer doesn't automatically give you good motion design.

Most disappointing AI animations fail because of timing and composition, not a lack of visual effects.

Here are four techniques I would build into the animation library.

A. Closed-Form Springs

Regular easing moves an element from one value to another over a predefined duration.

Springs model movement with acceleration and settling.

But a normal frame-by-frame spring simulation can depend on previous frames.

That's a problem for a renderer that needs to jump directly to any timestamp.

Use a closed-form spring response instead.

For a property that changes target several times, a useful pattern is:

value(t) = initial + Σ(targetChange × springResponse(t - changeTime))

Each target change contributes its own response.

That allows the animation to be evaluated at an arbitrary timestamp.

It also avoids having to simulate the entire video from the beginning.

B. Animate Different Edges Separately

Here's a surprisingly useful trick for UI motion.

Don't always animate a component as one rigid rectangle.

For a moving tab indicator, animate the leading edge and trailing edge with slightly different spring settings.

The leading edge moves first.

The trailing edge follows.

The indicator stretches briefly and settles into its final position.

The result feels much more intentional than moving the whole rectangle at a fixed speed.

C. Separate Container Motion From Text Motion

Imagine a button expanding into a dashboard card.

The container can begin expanding immediately.

But the new text shouldn't necessarily appear at the same moment.

Let the container start moving.

Then introduce the next label once there is enough space.

Remove the previous label before the next transition begins.

This small timing difference prevents the overlapping typography that often makes AI-generated UI animations look unfinished.

D. Treat Sound as Part of the Timeline

Don't just add music after rendering.

Analyze the supplied soundtrack to obtain beat positions and important audio peaks.

Then attach specific visual events to those timestamps.

Button clicks, chart completions, camera transitions, and logo reveals can be synchronized with the soundtrack.

If you don't have a track, use licensed audio or generate original sound effects where appropriate.  
  
[advanced model] can even help create the soundtrack itself.

[Publication sur X](https://x.com/i/web/status/2103340253570285823)

The sound must be reviewed as carefully as the visuals.

## 07. The Quality-Control Loop Most People Skip

This might be the most important component of the entire system.

Claude can generate code.

It can also inspect rendered images.

Use both capabilities.

Don't let the workflow jump directly from generated code to final delivery.

Instead, use a staged review process.

****First pass: Storyboard.****

Generate a few representative frames from every scene.

Check whether the sequence tells a coherent story.

****Second pass: Timing.****

Generate frames immediately before, during, and after important transitions.

Check for overlapping text, abrupt movement, disappearing elements, and unwanted jumps.

****Third pass: Phone-size review.****

Scale preview frames down to the size at which people actually watch social media videos.

A design that looks great at 1080 pixels can become unreadable at a much smaller display size.

****Fourth pass: Brand and factual accuracy.****

Compare the output against the approved logo, font, colors, screenshots, and product claims.

****Fifth pass: Full video and audio.****

Inspect the encoded file, check audio synchronization, and confirm the correct duration and aspect ratio.

![Image](https://pbs.twimg.com/media/HUhEkQrXQAE1X0h.jpg)

Build a Contact Sheet

FFmpeg can extract frames at regular intervals and arrange them into a single review image.

For example:

```
ffmpeg -i output.mp4 \
  -vf "fps=1,scale=270:-1,tile=5x5" \
  -frames:v 1 contact.png
```

For a 25-second video, this creates a useful overview of the timeline.

But regular intervals are not enough.

Also sample frames just before and after each transition. A broken transition can happen between the frames shown on a contact sheet.

The Production Rule

Never trust a statement such as “the animation looks great” from an agent that has not inspected the rendered output.

Require a review report containing:

- The timestamps inspected.
- Issues found.
- Fixes applied.
- Any remaining concerns.
- A human approval step before delivery.

You can automate much of the inspection.

You should not automatically assume that a model's visual assessment is perfect.

One real counterexample to the one-prompt narrative is the [watercolor film shared by @mablesjoseph](https://x.com/i/status/2103465246014746943), whose creator reported 163 model calls and several hours of work.

[Publication sur X](https://x.com/i/web/status/2103465246014746943)

The polished result is not always the first result.

## 08. One Timeline, Multiple Video Campaigns

Here's where the system becomes much more interesting than a single video generator.

Most creators finish one video and move on.

But a brand usually needs multiple versions of the same creative.

Different platforms.

Different openings.

Different audiences.

Different calls to action.

So instead of creating a single output, create a ****campaign matrix****.

****For example:****

3 hooks × 3 formats × 2 CTAs = 18 exports.

![Image](https://pbs.twimg.com/media/HUhEt-aWQAAklvU.jpg)

The hooks might be:

****Version A:**** Introduce the problem.

****Version B:**** Start with the product result.

****Version C:**** Open with a surprising feature.

The formats:

****9:16:**** TikTok, Reels, Shorts.

****1:1:**** Square social placements.

****16:9:**** YouTube and website embeds.

The CTAs:

****A:**** Try Now.

****B:**** Book a Demo.

Don't Just Crop the Video

This is where the technical implementation matters.

A vertical video and a widescreen video should not share identical pixel coordinates.

The vertical version may stack interface components.

The widescreen version may place those same components side by side.

The system should calculate layouts from the target composition.

Think responsive web design, but for rendered video.

Use shared motion timings and scene data, with separate layout constraints for each format.

The important part is that the narrative stays consistent while the composition changes.

Cache What Doesn't Change

You don't need to reprocess every asset for every variant.

Keep approved logos, fonts, audio, and reusable backgrounds cached.

Re-render only what needs to change when practical.

Store a manifest identifying the source assets, campaign data, template version, and rendering settings.

That makes revisions easier and helps prevent accidentally delivering a video made with outdated client assets.

## 09. Turn the Workflow Into a Claude Skill

Now we have an engine.

But I don't want to explain this entire workflow to Claude every time I start a new project.

I'd package the process as an agent skill.

Call it motion-campaign.

The skill should tell the agent what information to collect, which scripts to use, how to validate the input, and when to request approval.

A simplified skill might look like this:

```
---
name: motion-campaign
description: Create reusable product motion campaigns.
---

# Motion Campaign

## Inputs
- Product URL and description
- Approved screenshots and logo
- Brand colors and fonts
- Audience and offer
- Video duration
- Output formats
- Approved claims and CTA

## Workflow
1. Collect and validate assets.
2. Generate campaign.json.
3. Create a shot list.
4. Request storyboard approval.
5. Build or reuse animation components.
6. Render preview frames.
7. Run visual and brand checks.
8. Render selected campaign variants.
9. Package MP4s and source data.

## Rules
- Never invent product claims.
- Use approved visual assets.
- Prefer deterministic animation.
- Keep all outputs editable.
- Never skip final visual review.
```

Now the interaction becomes much simpler.

Instead of writing a giant production brief each time, you can ask the agent:

“Create a 25-second launch campaign for this product. Use the approved brand assets. Generate three hooks and three formats. Show the storyboard before rendering.”

Claude still needs project context.

But the repeated production instructions already live inside your workflow.

The skill doesn't magically create better design.

It makes the production process more consistent.  
  
And some creators are already turning these workflows into actual apps:

[Publication sur X](https://x.com/i/web/status/2103923805098070477)

## 10. Turn It Into Something People Pay For

Here's the business side.

I wouldn't start by selling an AI tool.

I'd start by selling a finished result.

Something a founder, product team, or agency already understands.

For example:

****Product Launch Motion Package****

One product. One approved narrative. Three opening hooks. Three aspect ratios. Two CTAs.

Includes finished MP4 files, a poster frame, and an agreed number of revision rounds.

That is a concrete deliverable.

A client doesn't need to know what seek(t) means.

They need a professional launch campaign delivered on time.

![Image](https://pbs.twimg.com/media/HUhE4R5WYAE-jM-.jpg)

Real Examples

Tony Dinh shared motion work featuring TypingMind.

[Publication sur X](https://x.com/i/web/status/2103703135902740699)

His posts are interesting because they connect this technology to an actual product rather than an abstract showreel.

Another creator, [@achxvi](https://x.com/@achxvi), shared a product film and discussed offering similar work as a paid service.

[Publication sur X](https://x.com/i/web/status/2104014659615392078)

These examples don't prove that everyone can instantly build a profitable motion-design business.

They show that the output is becoming useful beyond technical demos.

How I'd Price the Offer

Don't charge according to the number of prompts.

Charge for the agreed deliverables and the work needed to produce them.

As a hypothetical starting offer, imagine a $750 launch package.

The client receives one campaign with a fixed scope, approved formats, and revision limits.

Two such packages would generate $1,500 in gross revenue, before taxes, software, computing, audio licensing, sales time, and revisions.

Those are illustrative numbers, not verified market rates or guaranteed earnings.

The useful metric isn't how many MP4 files your machine can export.

It's how much work is required to produce a campaign the client actually approves.

Track:

- Time spent on the first design.
- Time spent per additional variant.
- Rendering and API costs.
- Revision requests.
- Delivery errors.
- Repeat customers.

The business only becomes attractive when the system reduces repeat production work without sacrificing quality.

One Important Licensing Detail

Remotion offers commercial use under its Free License for eligible individuals and teams of up to three people.

Larger teams and certain automation setups have different licensing requirements.

Check the current terms before commercializing a rendering service.

Also verify your rights to client logos, footage, fonts, sound effects, and music.

Automation doesn't remove copyright obligations.

## 11. The Prompt I'd Give [advanced model]

This is the starting brief I'd actually use.

Not a one-line request for a pretty video.

A request to build the production system.

****Copy this into Claude Code:****

Build a reusable automated motion design system.  
  
Use [advanced model] as the coding agent.  
  
The system must accept a structured brand brief and  
produce high-quality product motion videos.  
  
Use React and Remotion for reusable compositions.  
  
Also create a small Canvas-based seek(t) demo to show  
how deterministic frame rendering works.  
  
Requirements:  
  
1. Separate brand data from animation code.  
2. Validate assets, text lengths and approved claims.  
3. Build reusable components for titles, product UI,  
feature reveals, charts and CTAs.  
4. Make all animations frame-driven and deterministic.  
5. Use restrained springs and precise typography.  
6. Support 9:16, 1:1 and 16:9 layouts.  
7. Allow multiple hook and CTA variants.  
8. Render preview frames before full exports.  
9. Inspect frames for visual problems and overflow.  
10. Produce final MP4 files and a delivery manifest.  
  
Design direction:  
  
Premium product motion design.  
Clean typography.  
Restrained colors.  
Smooth transitions.  
No generic AI gradients or excessive glow.  
No fake product screenshots.  
  
Workflow:  
  
First inspect the project and tools.  
  
Then propose the architecture and campaign schema.  
  
Build the smallest complete working demo.  
  
Show a storyboard and preview.  
  
Only then expand into batch rendering.  
  
Do not claim the video is complete until you have  
inspected the actual rendered output.

One thing I'd change for a serious commercial system: don't let the agent freely redesign established brand components for each campaign.

Build a collection of reviewed, reusable templates.

Let the model choose and configure them.

That gives you more predictable output than asking it to invent every visual from scratch.

## 12. What I'd Build First

You don't need a massive SaaS before testing this.

I'd start with one specific type of video.

For example, a 25-second animated product dashboard.

One fictional or fully authorized product.

One real logo.

One set of screenshots.

One style guide.

Build four reusable scenes:

****Scene 1:**** Strong opening title.

****Scene 2:**** UI interaction with a cursor.

****Scene 3:**** Animated data or feature visualization.

****Scene 4:**** Product identity and CTA.

Get that single video looking genuinely good.

Then turn the text, images, colors, and timings into configurable data.

Add the second format.

Then the third.

Then alternate hooks.

Only after the quality is consistent would I add automatic batch jobs and client-facing controls.

This order matters.

Automating a mediocre animation only gives you more mediocre animations.

What I'd Ship

The first production-ready version should produce:

- One polished reference video.
- A reusable scene library.
- Validated campaign JSON.
- An automated rendering command.
- A contact-sheet review.
- Three output formats.
- A clear delivery structure.

The next version can handle campaign variants, job queues, previews, and more sophisticated customer workflows.

## 13. The Part I Find Most Interesting

The real opportunity isn't replacing motion designers with a prompt.

It's turning their repetitive production work into software.

A good motion designer still understands composition, pacing, storytelling, brand identity, and visual hierarchy.

Those decisions matter more than the render engine.

But once a visual system is designed well, a surprising amount of the production work becomes programmable.

Text can change.

Colors can change.

Layouts can change.

Sequences can be reused.

Campaign variants can be generated.

And the same technical system can serve very different products.

That's the difference between making one impressive AI video and owning a production workflow.

The first gets attention.

The second might become a business.

****One good video is a portfolio piece.****

****A reusable motion engine is an asset.****

---

> Source: https://x.com/e1genqq/status/2110016031917855006
> Date: 2026-10-13T14:33:18.868Z