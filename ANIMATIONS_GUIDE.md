# 🎨 Animation & Motion Graphics Guide

## Overview

Professional animations have been added throughout the Agent Herald application using **Framer Motion**. This document outlines all the animations implemented and how to use the reusable components.

---

## 🚀 What's Been Animated

### 1. **Landing Page** (`app/page.tsx`)
- ✅ Hero title fade-in with upward slide
- ✅ Subtitle fade-in (delayed)
- ✅ CTA buttons with hover scale and tap effects
- ✅ Feature cards with staggered animations (0.15s delay between each)
- ✅ Feature cards hover: lift effect (-8px)
- ✅ Stats section with sequential scale animation

**Animations:**
- Hero elements: Fade in + slide up (0.8s duration)
- Buttons: Scale 1.05 on hover, 0.98 on tap
- Feature cards: Stagger children animation (starts at 0.6s)
- Stats: Scale from 0.8 to 1.0 (1.4s+ delay)

---

### 2. **Contests Page** (`app/contests/page.tsx`)
- ✅ Contest cards with staggered grid animation
- ✅ Card hover: lift effect (-5px) with border color change
- ✅ Smooth entrance animations for all cards

**Animations:**
- Grid: Stagger children with 0.08s intervals
- Cards: Fade in + slide up (20px) with spring physics
- Hover: Y-axis lift with border color transition

---

### 3. **Dashboard Page** (`app/dashboard/page.tsx`)
- ✅ Header fade-in from top
- ✅ Health cards with staggered animation (0.1s intervals)
- ✅ Individual card hover effects
- ✅ Resolver status cards with delayed entrance
- ✅ Quick action cards with stagger + hover lift

**Animations:**
- Header: Fade in + slide down (0.5s)
- Health cards: Stagger with scale from 0.95 to 1.0
- Quick actions: Stagger children starting at 0.6s delay
- All cards: Lift on hover with spring physics

---

## 🧩 Reusable Animation Components

### **PageTransition**
Location: `app/components/PageTransition.tsx`

Smooth page transitions when navigating between routes.

```tsx
import PageTransition from "@/app/components/PageTransition";

<PageTransition>
  {children}
</PageTransition>
```

**Animation:** Fade + vertical slide (300ms)

---

### **AnimatedButton**
Location: `app/components/AnimatedButton.tsx`

Buttons with hover/tap effects and loading states.

```tsx
import AnimatedButton from "@/app/components/AnimatedButton";

<AnimatedButton 
  variant="primary" // "primary" | "secondary" | "danger"
  loading={false}
  onClick={handleClick}
>
  Click Me
</AnimatedButton>
```

**Animation:** 
- Hover: Scale 1.05 + lift -2px
- Tap: Scale 0.98
- Loading: Rotating spinner

---

### **LoadingSpinner**
Location: `app/components/LoadingSpinner.tsx`

Animated loading indicators.

```tsx
import LoadingSpinner, { LoadingPulse } from "@/app/components/LoadingSpinner";

<LoadingSpinner size="md" color="white" />
<LoadingPulse />
```

**Animation:** 
- Spinner: Continuous 360° rotation
- Pulse: Bouncing dots with sequential delays

---

### **AnimatedCard**
Location: `app/components/AnimatedCard.tsx`

Cards with entrance animations and hover effects.

```tsx
import AnimatedCard, { AnimatedCardGrid, AnimatedCardItem } from "@/app/components/AnimatedCard";

// Single card
<AnimatedCard delay={0.2}>
  Content here
</AnimatedCard>

// Grid of cards with stagger
<AnimatedCardGrid>
  <AnimatedCardItem>Card 1</AnimatedCardItem>
  <AnimatedCardItem>Card 2</AnimatedCardItem>
  <AnimatedCardItem>Card 3</AnimatedCardItem>
</AnimatedCardGrid>
```

**Animation:** 
- Entrance: Fade in + slide up
- Hover: Lift -8px with border color change

---

### **AnimatedCounter**
Location: `app/components/AnimatedCounter.tsx`

Animated number counting (great for stats).

```tsx
import AnimatedCounter from "@/app/components/AnimatedCounter";

<AnimatedCounter 
  from={0} 
  to={100} 
  duration={1.5}
  className="text-4xl font-bold"
/>
```

**Animation:** Smooth count-up with easeOut

---

## 🎯 Animation Patterns Used

### **Stagger Children**
Used for lists and grids where items animate sequentially.

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map(item => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.div>
```

### **Spring Physics**
Smooth, natural hover effects.

```tsx
whileHover={{ scale: 1.05, y: -5 }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}
```

### **Ease Curves**
- `easeOut`: For entrances (decelerates)
- `easeInOut`: For page transitions
- `linear`: For continuous animations (spinners)

---

## 🎨 Design Principles

1. **Subtlety**: Animations enhance, don't distract (0.3-0.8s durations)
2. **Physics**: Use spring animations for natural feel
3. **Staggering**: Create visual hierarchy with sequential delays
4. **Hover Feedback**: All interactive elements have hover states
5. **Performance**: GPU-accelerated transforms only (x, y, scale, opacity)

---

## 🔧 Customization Guide

### Adjust Animation Speed
Change `duration` or `delay` values:

```tsx
transition={{ duration: 0.5, delay: 0.2 }}
```

### Change Spring Stiffness
Higher = snappier, Lower = bouncier:

```tsx
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

### Modify Hover Effects
Adjust scale and y-offset:

```tsx
whileHover={{ scale: 1.05, y: -8 }}
```

### Add New Animations
Use Framer Motion's `motion` components:

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Your content
</motion.div>
```

---

## 📦 Dependencies

```json
{
  "framer-motion": "^11.x.x"
}
```

Already installed! ✅

---

## 🚀 Next Steps

Consider adding:
- Modal animations (scale + backdrop fade)
- Form field focus animations
- Scroll-triggered animations for long pages
- Drag and drop interactions
- Skeleton loading states

---

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Patterns](https://www.framer.com/motion/examples/)
- [Spring Physics](https://www.framer.com/motion/transition/#spring)

---

**Created with:** Framer Motion + React + Next.js
**Style:** Professional, subtle, performant
**Status:** ✅ Production Ready
