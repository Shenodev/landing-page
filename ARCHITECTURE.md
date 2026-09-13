# ShenoDev System Architecture

## 1. System Overview
A unified platform consisting of a unified Backend and a Next.js Web Landing Page.

## 2. Tech Stack
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript.
- **3D Integration:** Tripo3d.
- **Backend:** Node.js, Express, MongoDB.

## 3. Directory Structure
/shenodev-platform
  ├── /web          (Next.js App)
  └── /backend      (Node.js API)

## 4. Design System (Strict)
- **Primary Accent:** Electric Cyan (#06B6D4)
- **Background:** Deep Slate (#0F172A)
- **Text:** Off-White (#F8FAFC)
- **Styling:** Rounded corners (`rounded-xl`), glassmorphism, no harsh borders.

## 5. Component Logic (Web)
- All interactive components (forms and any dynamic components) MUST use `"use client"`.
- Static sections must remain Server Components for performance.