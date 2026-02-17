# 3DGS — 3D Gaussian Splatting

This repository hosts a collection of **browser-based 3D Gaussian Splatting (3DGS) visualizations**, rendered live using WebGL and hosted via GitHub Pages. The examples demonstrate how dense point-based reconstructions can be explored interactively without traditional meshing workflows.

3D Gaussian Splatting represents scenes as collections of oriented Gaussian primitives rather than polygonal surfaces. This approach preserves fine geometric and photometric detail, supports real-time rendering, and is particularly well suited to photogrammetry, structure-from-motion, and LiDAR-derived datasets.

---

## Live Examples

These examples span a range of subject matter including vegetation, natural surfaces, small structures, and built objects, illustrating how 3DGS handles both organic and hard-edged geometry. Each link below opens an interactive 3DGS scene directly in the browser. HTML files were generated using Supersplat (https://superspl.at)

### Built Environment
- **Lock**  
  https://fraxinusenviro.github.io/3DGS/LockSH0.html  
  
- **Dumpster**  
  https://fraxinusenviro.github.io/3DGS/DumpsterSH0.html  

- **Structure**  
  https://fraxinusenviro.github.io/3DGS/Structure.html

### Natural and Semi-natural Environment

- **Wigwam & Forest**  
  https://fraxinusenviro.github.io/3DGS/WigwamSH0.html  

- **Rocks**  
  https://fraxinusenviro.github.io/3DGS/RocksSH0.html  

- **Honckenya peploides**  
  https://fraxinusenviro.github.io/3DGS/HonckenyaSH0.html  

- **Birch (Clipped Forest Scene)**  
  https://fraxinusenviro.github.io/3DGS/BirchSH0clip.html

---

## Interaction

All scenes support basic interactive controls:

- **Rotate:** click + drag  
- **Zoom:** scroll or pinch  
- **Pan:** right-click + drag (or two-finger drag)

A modern browser with WebGL2 support is required.

---

## Purpose of This Repository

This repository serves as:

- A **public gallery** of 3D Gaussian Splat examples  
- A **reference implementation** for hosting and viewing splat data on the web  
- A **testbed** for evaluating visual quality, performance, and data preparation workflows  
- A lightweight alternative to desktop viewers for sharing dense 3D reconstructions  

The examples are intentionally minimal and self-contained, making them suitable as starting points for custom visualization pipelines.

---

## Typical Applications

3D Gaussian Splatting is particularly useful where dense point data is available and meshing is undesirable or lossy, including:

- Ecological and vegetation structure documentation  
- Photogrammetric scene reconstruction  
- LiDAR and mobile scanning visualization  
- Cultural heritage and artifact recording  
- Rapid field data review and sharing  

---

## Notes

- The scenes linked here are demonstrations and may be clipped or simplified for performance.  
- File naming reflects internal experiment variants (e.g., SH0 configurations) rather than finalized presentation conventions.  
- No external servers or frameworks are required beyond GitHub Pages.
