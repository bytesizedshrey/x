---
name: liquid-glass-ui
description: Build authentic liquid glass UI components that truly refract light, rather than just faking it with a flat blur. Uses a computed SVG displacement map and a filtered copy of the backdrop to work across all modern browsers (Safari, Firefox, Chrome). Trigger this skill when the user asks for authentic glassmorphism, liquid glass, refractive panels, or outpace-style glass UI.
---

# Liquid Glass UI

Use this skill to design and implement authentic liquid glass components that physically bend light and work across all major browsers, based on the Outpace Studios technique.

## Non-Negotiable Foundations
- **Blur isn't glass.** Do not use a simple `backdrop-filter: blur()` gradient. That is frosted glass.
- Real glass refracts. It bends the light passing through it, especially at the curved edges.
- You must use an SVG `feDisplacementMap` filter to drive the refraction.
- You must filter a *copy* of the backdrop, not the live backdrop itself. Safari and Firefox do not support SVG filters inside `backdrop-filter`.

## Typography
Typography should be crisp, modern, and highly legible, acting as a structured anchor against the fluid nature of the glass.
- **Primary Font**: Use Inter (or a similar neo-grotesque sans-serif) for all UI text and body copy.
- **Monospace Font**: Use Geist Mono (or similar) for code snippets, technical data, or monospaced numbers.
- **Headings**: Keep letter-spacing tight (`-0.4px` to `-0.1px`) and use medium font weights (`450` to `550`). Avoid ultra-bold weights; precision is key.

## Density & Layout (Compact Default)
- **Content Constraints**: Keep reading columns narrow and focused (e.g., `max-width: 640px`). Use generous vertical margins between sections (`80px` to `104px`).
- **Control Density**: UI controls should be compact. Use padding like `10px 14px` and smaller font sizes (`14px` to `15px`).

## Color and Glow Rules
The interface relies on extreme contrast between the dark environmental background and the crisp foreground elements.
- **Environment/Backdrop**: Very dark, deep tones (`#0b0e13`). This allows the glass refraction to pick up rich, dark colors and bright specular highlights.
- **Foreground Content Panels**: Pure white (`#ffffff`) or highly opaque light panels that contrast sharply with the dark environment.
- **Glass Fill**: The glass itself should have a very subtle, translucent dark fill (e.g., `rgba(0,0,0,0.22)`) or light fill depending on the mode, but always rely on the refraction map for the edge highlights.
- **Specular Glow**: The light passing through the glass curves should create a bright, distinct rim light. Never use generic diffuse box-shadow glows.

## Reusable Tailwind Tokens
When styling the physical elements around the glass, use these Tailwind classes to maintain the illusion of depth:
- **Glass Container Base**: `bg-black/20 backdrop-blur-md border border-white/10 rounded-full` (for the fallback or structural base housing the `GlassLens`).
- **Inset Shadow**: `shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]` (for the well/trench the glass sits in).
- **Popping Drop Shadow**: `shadow-[0_4px_12px_rgba(0,0,0,0.2)]` (to lift the refractive button out of its trench).
- **Text High Contrast**: `text-white/95` (on dark glass).
- **Text Muted**: `text-white/60` (for secondary labels).

## Core Material Recipes

### 1) Raised Shell (main component body)
Use this for the primary structural housing of a control panel.
- **Base**: Instead of refraction, the parent shell might be a solid or semi-solid panel (`bg-white` or `bg-[#0b0e13]`) acting as the stage.
- **Refractive Overlay**: If the shell itself is glass, it must use the `GlassScene` and `GlassLens` architecture to refract the true background of the page.

### 2) Inset Surface (trenches, tracks, wells, recessed buttons)
Use for slider tracks or toggle wells where a glass object will sit.
- **Visuals**: Darken the base and apply a strong inner shadow (`shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]`).
- **Rule**: The well itself is **not** refractive glass. It is the physical trench that houses the glass object, providing the dark contrast that makes the glass refraction pop.

### 3) Popping / Raised Objects (dial caps, knobs, protruding controls)
Use for the interactive moving parts (slider thumbs, active toggle pills).
- **Visuals**: This is the actual `GlassLens` component. It sits *inside* the inset well but appears raised due to the heavy refraction at its steep curved rim.
- **Rule**: Add a subtle drop shadow (`shadow-[0_4px_12px_rgba(0,0,0,0.2)]`) to lift it off the inset track. As it moves, it physically bends the dark inset shadow beneath it.

## Dial Guidance
If applying liquid glass to rotary controls or dials:
- **The Outer Track**: Use the *Inset Surface* recipe for the circular track.
- **The Dial Cap**: Use the *Popping Object* recipe for the knob itself. The refraction must rotate with the knob if there are internal elements, or remain static (refracting the background) while the indicator moves.
- **The Indicator**: An etched mark or glowing dot inside the dial cap should be placed *above* the `GlassLens` so it doesn't get distorted by its own lens.

## Component Architecture Pattern
When building tactile controls, use this specific layering order:
1. **The Shared Backdrop (`GlassScene`)**: Renders the environment once.
2. **The Inset Wells**: The static, recessed tracks built with HTML/CSS.
3. **The Glass Objects (`GlassLens`)**: The dynamic lenses dropped into the wells, bending the scene below.
4. **The UI Layer**: Text, icons, or indicators sitting *on top* of the glass.

## Interaction Rules
- **Interactive Base**: The UI beneath the glass must remain fully interactive. The glass is just a visual overlay bending a copy.
- **Shared Lens Animation**: If multiple items trigger the glass (like a nav menu), use a *single* glass lens that travels and morphs between items. The motion should be spring-driven but interruptible.
- **Motion**: Respect `prefers-reduced-motion` by cutting to new positions instead of springing.
- **Transparency**: Respect `prefers-reduced-transparency` by dropping the refraction entirely and falling back to an opaque panel.

## Quality Checklist (must pass)
- [ ] Does the glass actually *bend* the image behind it using `feDisplacementMap`, or is it just a CSS `backdrop-filter: blur()`?
- [ ] Does the refraction work in Safari and Firefox by filtering a *copy* of the backdrop instead of using Chromium-only features?
- [ ] Is the displacement map generated using a physical optics curve (concentrated at the edges) rather than a simple radial gradient?
- [ ] Are the inset tracks dark and non-refractive to contrast with the popping glass lens?
- [ ] Does the component respect system accessibility settings for reduced motion and transparency?

## Anti-Patterns
- ❌ **The "Chrome-Only" Blur**: Using `backdrop-filter` with SVG filters on the live backdrop. It will fail silently in Safari/Firefox.
- ❌ **Flat Frosted Glass**: Calling a simple white semi-transparent blur "liquid glass".
- ❌ **Muddy Drop Shadows**: Using huge, diffuse colored drop shadows behind the glass. Real glass transmits light; shadows should be crisp and structural to provide lift.
- ❌ **Text Under the Lens**: Placing UI labels or active icons *under* the glass lens where they get distorted. Readouts must sit on top of the lens.